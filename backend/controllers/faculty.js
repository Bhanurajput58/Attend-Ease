const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const ImportedStudent = require('../models/ImportedStudent');
const User = require('../models/User');
const emailService = require('../services/emailService');


exports.getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({})
      .populate('user', 'name email username')
      .select('fullName name email department designation user');
    
    const formattedFaculty = faculty.map(f => ({
      _id: f._id,
      fullName: f.fullName || f.name || 'Unknown Name',
      name: f.fullName || f.name || 'Unknown Name',
      email: f.email,
      department: f.department,
      designation: f.designation,
      user: f.user?._id
    }));
    
    res.status(200).json({
      success: true,
      count: formattedFaculty.length,
      data: formattedFaculty
    });
  } catch (error) {
    console.error('Error fetching all faculty:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Calculate low attendance statistics for a course
const calculateLowAttendanceStats = async (courseId, threshold = 75) => {
  try {
    // Get all attendance records for the course
    const attendanceRecords = await Attendance.find({ course: courseId });
    
    if (attendanceRecords.length === 0) {
      return {
        lowAttendanceCount: 0,
        totalStudents: 0,
        averageAttendance: 0,
        threshold: threshold
      };
    }

    // Get all enrolled students for the course
    const enrolledStudents = await ImportedStudent.find({ courses: courseId });
    
    if (enrolledStudents.length === 0) {
      return {
        lowAttendanceCount: 0,
        totalStudents: 0,
        averageAttendance: 0,
        threshold: threshold
      };
    }

    // Get User IDs for students who have email addresses
    const User = require('../models/User');
    const studentEmails = enrolledStudents
      .filter(student => student.email)
      .map(student => student.email);
    
    const users = await User.find({ email: { $in: studentEmails } }, '_id email');
    const emailToUserIdMap = {};
    users.forEach(user => {
      emailToUserIdMap[user.email] = user._id.toString();
    });

    // Create User accounts for imported students who don't have them
    const studentsWithoutUsers = enrolledStudents.filter(student => 
      student.email && !emailToUserIdMap[student.email]
    );

    for (const student of studentsWithoutUsers) {
      try {
        // Generate a unique username from email
        const baseUsername = student.email.split('@')[0];
        let username = baseUsername;
        let counter = 1;
        
        // Ensure username is unique
        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Create User account for the imported student
        const newUser = await User.create({
          name: student.name,
          email: student.email,
          username: username,
          password: 'defaultPassword123', // Default password that student can change later
          role: 'student',
          approved: true // Auto-approve imported students
        });

        emailToUserIdMap[student.email] = newUser._id.toString();
        console.log(`Created User account for imported student: ${student.name} (${student.email})`);
      } catch (error) {
        console.error(`Failed to create User account for ${student.name} (${student.email}):`, error.message);
        // Continue with other students even if one fails
      }
    }

    // Calculate attendance for each student
    const studentAttendanceStats = [];
    
    for (const student of enrolledStudents) {
      let totalSessions = 0;
      let presentSessions = 0;
      
      // Calculate attendance for this student across all sessions
      for (const record of attendanceRecords) {
        const studentEntry = record.students.find(s => 
          s.student && s.student.toString() === student._id.toString()
        );
        
        if (studentEntry) {
          totalSessions++;
          if (studentEntry.status.toLowerCase() === 'present') {
            presentSessions++;
          }
        }
      }
      
      const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
      
      studentAttendanceStats.push({
        studentId: student._id,
        userId: student.email ? emailToUserIdMap[student.email] : null, // Add User ID if available
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        totalSessions,
        presentSessions,
        attendancePercentage
      });
    }

    // Calculate overall statistics
    const totalStudents = enrolledStudents.length;
    const lowAttendanceStudents = studentAttendanceStats.filter(s => s.attendancePercentage < threshold);
    const lowAttendanceCount = lowAttendanceStudents.length;
    
    // Calculate average attendance
    const totalAttendancePercentage = studentAttendanceStats.reduce((sum, s) => sum + s.attendancePercentage, 0);
    const averageAttendance = totalStudents > 0 ? Math.round(totalAttendancePercentage / totalStudents) : 0;

    return {
      lowAttendanceCount,
      totalStudents,
      averageAttendance,
      threshold,
      studentStats: studentAttendanceStats
    };
  } catch (error) {
    console.error('Error calculating low attendance stats:', error);
    return {
      lowAttendanceCount: 0,
      totalStudents: 0,
      averageAttendance: 0,
      threshold: threshold
    };
  }
};

// Get faculty dashboard data
exports.getFacultyDashboard = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const courseQuery = { instructor: facultyId }; // Only check instructor field for consistency
    const activeCourses = await Course.countDocuments(courseQuery);
    const courses = await Course.find(courseQuery).select('_id courseName courseCode students department semester schedule');
    const courseIds = courses.map(course => course._id);
    
    // Fetch attendance data for each course
    const coursesList = await Promise.all(courses.map(async (course) => {
      // Get attendance records for this course
      const attendanceRecords = await Attendance.find({ course: course._id });
      
      // Calculate attendance statistics
      let totalSessions = attendanceRecords.length;
      let totalPresent = 0;
      let totalAbsent = 0;
      let attendanceRate = 0;
      
      if (totalSessions > 0) {
        attendanceRecords.forEach(record => {
          record.students.forEach(student => {
            if (student.status.toLowerCase() === 'present') {
              totalPresent++;
            } else {
              totalAbsent++;
            }
          });
        });
        
        const totalAttendance = totalPresent + totalAbsent;
        attendanceRate = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0;
      }

      // Calculate low attendance statistics
      const lowAttendanceStats = await calculateLowAttendanceStats(course._id, 75);
      
      return {
        id: course._id,
        name: course.courseName || course.courseCode,
        code: course.courseCode,
        students: course.students || [],
        department: course.department,
        semester: course.semester,
        schedule: course.schedule,
        // Attendance statistics
        totalSessions,
        attendanceRate,
        totalPresent,
        totalAbsent,
        lastAttendanceDate: totalSessions > 0 ? attendanceRecords[attendanceRecords.length - 1].date : null,
        // Low attendance statistics
        lowAttendanceCount: lowAttendanceStats.lowAttendanceCount,
        totalStudents: lowAttendanceStats.totalStudents,
        averageAttendance: lowAttendanceStats.averageAttendance,
        threshold: lowAttendanceStats.threshold
      };
    }));
    
    let dashboardData = { 
      activeCourses, 
      totalStudents: 0, 
      averageAttendance: 0, 
      recentActivity: [], 
      coursesList, 
      message: activeCourses === 0 ? 'No courses assigned yet. Please contact your administrator.' : null 
    };
    
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
        
        // Calculate overall average attendance from course-level data
        const coursesWithAttendance = coursesList.filter(course => course.totalSessions > 0);
        if (coursesWithAttendance.length > 0) {
          const totalAttendanceRate = coursesWithAttendance.reduce((sum, course) => sum + course.attendanceRate, 0);
          dashboardData.averageAttendance = Math.round(totalAttendanceRate / coursesWithAttendance.length);
        } else {
          dashboardData.averageAttendance = 0;
        }
      } catch { 
        dashboardData.averageAttendance = 0; 
        dashboardData.recentActivity = []; 
      }
    }
    
    res.status(200).json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Error in getFacultyDashboard:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get students with low attendance for a course
exports.getLowAttendanceStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { threshold = 75 } = req.query;
    
    // Verify course exists and faculty has access
    
    // First find the course by ID only
    let course = await Course.findOne({ _id: courseId });
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }
    
    // Then check if the faculty has access to this course
    if (course.instructor && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this course' 
      });
    }

    // Get low attendance statistics
    const lowAttendanceStats = await calculateLowAttendanceStats(courseId, threshold);
    
    // Filter students with low attendance
    const lowAttendanceStudents = lowAttendanceStats.studentStats
      .filter(student => student.attendancePercentage < threshold)
      .map(student => ({
        id: student.studentId,
        userId: student.userId, // Include User ID for notifications
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email, // Include email for reference
        attendance: student.attendancePercentage,
        totalClasses: student.totalSessions,
        classesAttended: student.presentSessions,
        lastAttended: null // This will need to be calculated separately if needed
      }))
      .sort((a, b) => a.attendance - b.attendance); // Sort by lowest attendance first

    return res.status(200).json({ 
      success: true, 
      data: { 
        students: lowAttendanceStudents, 
        course: {
          id: course._id,
          name: course.courseName || course.courseCode,
          code: course.courseCode,
          department: course.department,
          semester: course.semester
        },
        statistics: {
          totalStudents: lowAttendanceStats.totalStudents,
          lowAttendanceCount: lowAttendanceStats.lowAttendanceCount,
          averageAttendance: lowAttendanceStats.averageAttendance,
          threshold: lowAttendanceStats.threshold
        }
      } 
    });
  } catch (error) {
    console.error('Error in getLowAttendanceStudents:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get faculty courses with low attendance statistics
exports.getFacultyCourses = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const courseQuery = { instructor: facultyId }; // Only check instructor field for consistency
    
    const courses = await Course.find(courseQuery).select('_id courseName courseCode students department semester schedule');
    
    if (courses.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'No courses assigned to this faculty'
      });
    }

    // Calculate low attendance statistics for each course
    const coursesWithStats = await Promise.all(courses.map(async (course) => {
      const lowAttendanceStats = await calculateLowAttendanceStats(course._id, 75);
      
      return {
        id: course._id,
        name: course.courseName || course.courseCode,
        code: course.courseCode,
        department: course.department,
        semester: course.semester,
        schedule: course.schedule,
        // Low attendance statistics
        lowAttendanceCount: lowAttendanceStats.lowAttendanceCount,
        totalStudents: lowAttendanceStats.totalStudents,
        averageAttendance: lowAttendanceStats.averageAttendance,
        threshold: lowAttendanceStats.threshold
      };
    }));

    res.status(200).json({ 
      success: true, 
      data: coursesWithStats 
    });
  } catch (error) {
    console.error('Error in getFacultyCourses:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get faculty by user ID
exports.getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const faculty = await Faculty.findById(id).populate('user', 'name email');
    
    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: faculty 
    });
  } catch (error) {
    console.error('Error in getFacultyById:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Send low attendance emails to students
exports.sendLowAttendanceEmails = async (req, res) => {
  try {
    const { courseId, studentIds, customMessage, threshold } = req.body;
    const facultyId = req.user.id;

    // Validate input
    if (!courseId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and student IDs array are required'
      });
    }

    // Get faculty information
    const faculty = await Faculty.findOne({ user: facultyId });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Get course information
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get students from importedstudents collection
    const students = await ImportedStudent.find({
      _id: { $in: studentIds },
      courses: courseId
    });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found with the provided IDs'
      });
    }

    // Send emails to each student
    const emailResults = [];
    let successfulEmails = 0;
    let failedEmails = 0;

    // Get attendance records for the course to calculate attendance data
    const attendanceRecords = await Attendance.find({ course: courseId });

    for (const student of students) {
      try {
        // Check if student has email
        if (!student.email) {
          emailResults.push({
            studentId: student._id,
            studentName: student.name,
            email: null,
            success: false,
            error: 'No email address available'
          });
          failedEmails++;
          continue;
        }

        // Calculate attendance data for this student
        let totalSessions = 0;
        let presentSessions = 0;
        
        // Calculate attendance for this student across all sessions
        for (const record of attendanceRecords) {
          const studentEntry = record.students.find(s => 
            s.student && s.student.toString() === student._id.toString()
          );
          
          if (studentEntry) {
            totalSessions++;
            if (studentEntry.status.toLowerCase() === 'present') {
              presentSessions++;
            }
          }
        }
        
        const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

        // Create student object with attendance data for email template
        const studentWithAttendance = {
          ...student.toObject(),
          attendance: attendancePercentage,
          classesAttended: presentSessions,
          totalClasses: totalSessions
        };

        // Send email using the existing email service
        const emailResult = await emailService.sendLowAttendanceNotification(
          studentWithAttendance,
          course,
          faculty,
          customMessage
        );

        emailResults.push({
          studentId: student._id,
          studentName: student.name,
          email: student.email,
          success: emailResult.success,
          error: emailResult.error || null,
          messageId: emailResult.messageId || null,
          attendanceData: {
            percentage: attendancePercentage,
            classesAttended: presentSessions,
            totalClasses: totalSessions
          }
        });

        if (emailResult.success) {
          successfulEmails++;
        } else {
          failedEmails++;
        }

      } catch (error) {
        console.error(`Error sending email to ${student.name}:`, error);
        emailResults.push({
          studentId: student._id,
          studentName: student.name,
          email: student.email,
          success: false,
          error: error.message
        });
        failedEmails++;
      }
    }

    // Return results
    res.status(200).json({
      success: true,
      message: `Emails sent successfully. ${successfulEmails} successful, ${failedEmails} failed.`,
      data: {
        totalStudents: students.length,
        successfulEmails,
        failedEmails,
        emailResults
      }
    });

  } catch (error) {
    console.error('Error in sendLowAttendanceEmails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emails',
      error: error.message
    });
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