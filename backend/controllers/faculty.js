const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const ImportedStudent = require('../models/ImportedStudent');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

// Get faculty dashboard data
exports.getFacultyDashboard = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const courseQuery = { $or: [ { instructor: facultyId }, { faculty: facultyId } ] };
    const activeCourses = await Course.countDocuments(courseQuery);
    const courses = await Course.find(courseQuery).select('_id courseName courseCode');
    const courseIds = courses.map(course => course._id);
    const coursesList = courses.map(course => ({ id: course._id, name: course.courseName || course.courseCode, code: course.courseCode }));
    let dashboardData = { activeCourses, totalStudents: 0, averageAttendance: 0, recentActivity: [], coursesList, message: activeCourses === 0 ? 'No courses assigned yet. Please contact your administrator.' : null };
    if (courseIds.length > 0) {
      try {
        const uniqueStudents = await ImportedStudent.distinct('_id', { courses: { $in: courseIds } });
        dashboardData.totalStudents = uniqueStudents.length;
      } catch { dashboardData.totalStudents = 0; }
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentAttendance = await Attendance.find({ course: { $in: courseIds }, date: { $gte: oneWeekAgo } })
          .populate('course', 'courseName courseCode')
          .sort({ date: -1 })
          .limit(5);
        dashboardData.recentActivity = recentAttendance.map(record => {
          const totalStudents = record.students.length;
          const presentStudents = record.students.filter(s => s.status === 'present' || s.status === 'Present').length;
          const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;
          const courseName = record.course ? (record.course.courseName || record.course.courseCode || 'Course') : 'Course';
          return { id: record._id, date: record.date.toISOString().split('T')[0], course: courseName, courseId: record.course?._id, studentsPresent: `${presentStudents}/${totalStudents}`, attendanceRate, presentCount: presentStudents, totalCount: totalStudents };
        });
        let totalAttendanceRate = 0, attendanceCount = 0;
        for (const record of recentAttendance) {
          const totalStudents = record.students.length;
          const presentStudents = record.students.filter(s => s.status === 'present' || s.status === 'Present').length;
          if (totalStudents > 0) { totalAttendanceRate += (presentStudents / totalStudents) * 100; attendanceCount++; }
        }
        dashboardData.averageAttendance = attendanceCount > 0 ? Math.round(totalAttendanceRate / attendanceCount) : 0;
      } catch { dashboardData.averageAttendance = 0; dashboardData.recentActivity = []; }
    }
    res.status(200).json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get students with low attendance for a course
exports.getLowAttendanceStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { threshold = 75 } = req.query;
    const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found or you do not have permission to access it' });
    const attendanceRecords = await Attendance.find({ course: courseId });
    if (attendanceRecords.length === 0) return res.status(200).json({ success: true, data: { students: [], course } });
    const enrolledStudents = await ImportedStudent.find({ courses: courseId }).populate('user', 'name email');
    return res.status(200).json({ success: true, data: { students: enrolledStudents, course } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get faculty by user ID
exports.getFacultyById = async (req, res) => {
  try {
    const User = require('../models/User');
    const faculty = await User.findOne({ _id: req.params.id, role: 'faculty' });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Update faculty by _id
exports.updateFaculty = async (req, res) => {
  try {
    const allowedFields = [ 'name', 'email', 'department', 'designation', 'employeeId', 'joinDate', 'specialization', 'qualifications', 'courses', 'studentsCount', 'profileImage', 'approved' ];
    const updates = {};
    allowedFields.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get faculty by user ID
exports.getFacultyByUserId = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.params.userId });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}; 