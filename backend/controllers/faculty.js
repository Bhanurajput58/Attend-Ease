const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const ImportedStudent = require('../models/ImportedStudent');
const User = require('../models/User');

// @desc    Get faculty dashboard data
// @route   GET /api/faculty/dashboard
// @access  Private/Faculty
exports.getFacultyDashboard = async (req, res) => {
  try {
    console.log('Getting dashboard data for faculty:', req.user.id);
    const facultyId = req.user.id;
    
    // Get faculty's courses count (removing status field since it doesn't exist in schema)
    const courseQuery = { instructor: facultyId };
    // Alternative query if faculty field should be used instead of instructor
    // const courseQuery = { faculty: facultyId };
    
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
      coursesList // Add courses list to response
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
        
        // Get today's scheduled courses (checking if any course doesn't have attendance yet for today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const courseAttendanceMap = new Map();
        recentAttendance.forEach(record => {
          if (record.date >= today) {
            courseAttendanceMap.set(record.course._id.toString(), true);
          }
        });
        
        // Find courses without attendance for today
        const coursesWithoutAttendanceToday = courses.filter(course => 
          !courseAttendanceMap.has(course._id.toString())
        );
        
        dashboardData.coursesNeedingAttendance = coursesWithoutAttendanceToday.map(course => ({
          id: course._id,
          name: course.courseName || course.courseCode
        }));
        
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
        
        // Get attendance stats by course
        dashboardData.courseAttendanceStats = [];
        for (const courseId of courseIds) {
          const courseAttendance = await Attendance.find({
            course: courseId
          });
          
          if (courseAttendance.length > 0) {
            let totalRate = 0;
            let recordCount = 0;
            
            courseAttendance.forEach(record => {
              const total = record.students.length;
              const present = record.students.filter(s => 
                s.status === 'present' || s.status === 'Present').length;
              
              if (total > 0) {
                totalRate += (present / total) * 100;
                recordCount++;
              }
            });
            
            const courseName = courses.find(c => c._id.toString() === courseId.toString())?.courseName || 'Unknown Course';
            
            dashboardData.courseAttendanceStats.push({
              courseId: courseId,
              courseName: courseName,
              attendanceRate: recordCount > 0 ? Math.round(totalRate / recordCount) : 0,
              sessionCount: courseAttendance.length
            });
          }
        }
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