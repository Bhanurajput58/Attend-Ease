const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const ImportedStudent = require('../models/ImportedStudent');
const User = require('../models/User');
const Faculty = require('../models/Faculty'); // Added Faculty model import

// @desc    Get faculty dashboard data
// @route   GET /api/faculty/dashboard
// @access  Private/Faculty
exports.getFacultyDashboard = async (req, res) => {
  try {
    console.log('Getting dashboard data for faculty:', req.user.id);
    const facultyId = req.user.id;
    
    // Get faculty's courses count (checking both instructor and faculty fields)
    const courseQuery = {
      $or: [
        { instructor: facultyId },
        { faculty: facultyId }
      ]
    };
    
    console.log('Querying courses with:', courseQuery);
    const activeCourses = await Course.countDocuments(courseQuery);
    console.log('Active courses count:', activeCourses);
    
    // Get all courses for this faculty to use in further queries and to display in dashboard
    const courses = await Course.find(courseQuery)
      .select('_id courseName courseCode');
    console.log('Found courses:', courses.length);
    const courseIds = courses.map(course => course._id);
    
    // Format courses for frontend
    const coursesList = courses.map(course => ({
      id: course._id,
      name: course.courseName || course.courseCode,
      code: course.courseCode
    }));
    
    // Initialize response data
    let dashboardData = {
      activeCourses,
      totalStudents: 0,
      averageAttendance: 0,
      recentActivity: [],
      coursesList,
      message: activeCourses === 0 ? 'No courses assigned yet. Please contact your administrator.' : null
    };
    
    // If faculty has courses, get student count and attendance data
    if (courseIds.length > 0) {
      try {
        // Get total students enrolled in faculty's courses (count unique students)
        console.log('Finding students for courses:', courseIds);
        const uniqueStudents = await ImportedStudent.distinct('_id', { courses: { $in: courseIds } });
        console.log('Unique students count:', uniqueStudents.length);
        dashboardData.totalStudents = uniqueStudents.length;
      } catch (err) {
        console.error('Error counting students:', err);
        dashboardData.totalStudents = 0;
      }
      
      try {
        // Get recent attendance records
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        console.log('Finding attendance records for courses:', courseIds);
        const recentAttendance = await Attendance.find({
          course: { $in: courseIds },
          date: { $gte: oneWeekAgo }
        })
        .populate('course', 'courseName courseCode')
        .sort({ date: -1 })
        .limit(5);
        
        console.log('Found attendance records:', recentAttendance.length);
        
        // Format recent attendance for the dashboard
        dashboardData.recentActivity = recentAttendance.map(record => {
          // Calculate attendance rate
          const totalStudents = record.students.length;
          const presentStudents = record.students.filter(s => 
            s.status === 'present' || s.status === 'Present').length;
          const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;
          
          const courseName = record.course ? 
            (record.course.courseName || record.course.courseCode || 'Course') : 'Course';
          
          return {
            id: record._id,
            date: record.date.toISOString().split('T')[0],
            course: courseName,
            courseId: record.course?._id,
            studentsPresent: `${presentStudents}/${totalStudents}`,
            attendanceRate,
            presentCount: presentStudents,
            totalCount: totalStudents
          };
        });
        
        // Calculate average attendance rate across all courses
        let totalAttendanceRate = 0;
        let attendanceCount = 0;
        
        for (const record of recentAttendance) {
          const totalStudents = record.students.length;
          const presentStudents = record.students.filter(s => 
            s.status === 'present' || s.status === 'Present').length;
          
          if (totalStudents > 0) {
            totalAttendanceRate += (presentStudents / totalStudents) * 100;
            attendanceCount++;
          }
        }
        
        dashboardData.averageAttendance = attendanceCount > 0 
          ? Math.round(totalAttendanceRate / attendanceCount) 
          : 0;
          
        console.log('Calculated average attendance rate:', dashboardData.averageAttendance);
      } catch (err) {
        console.error('Error processing attendance data:', err);
        dashboardData.averageAttendance = 0;
        dashboardData.recentActivity = [];
      }
    }
    
    console.log('Sending dashboard data:', dashboardData);
    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching faculty dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get students with low attendance for a course
// @route   GET /api/faculty/low-attendance/:courseId
// @access  Private/Faculty
exports.getLowAttendanceStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { threshold = 75 } = req.query; // Default threshold is 75%
    
    // Validate that the course exists and belongs to the faculty
    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user.id
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you do not have permission to access it'
      });
    }
    
    // Get all attendance records for this course
    const attendanceRecords = await Attendance.find({ course: courseId });
    
    if (attendanceRecords.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          students: [],
          course
        }
      });
    }
    
    // Get all students enrolled in this course
    const enrolledStudents = await ImportedStudent.find({ courses: courseId })
      .populate('user', 'name email');
      
    return res.status(200).json({
      success: true,
      data: {
        students: enrolledStudents,
        course
      }
    });
  } catch (error) {
    console.error('Error getting low attendance students:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}; 

exports.getFacultyById = async (req, res) => {
  try {
    const User = require('../models/User');
    const faculty = await User.findOne({ _id: req.params.id, role: 'faculty' });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}; 

// @desc    Update faculty by _id
// @route   PUT /api/faculties/:id
// @access  Private/Admin,Faculty
exports.updateFaculty = async (req, res) => {
  try {
    // Only allow certain fields to be updated
    const allowedFields = [
      'name', 'email', 'department', 'designation', 'employeeId', 'joinDate', 'specialization', 'qualifications', 'courses', 'studentsCount', 'profileImage'
    ];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}; 

// @desc    Get faculty by user ID
// @route   GET /api/faculties/by-user/:userId
// @access  Private/Faculty,Admin
exports.getFacultyByUserId = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.params.userId });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}; 