const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const ImportedStudent = require('../models/ImportedStudent');
const Student = require('../models/Student');
const User = require('../models/User');

exports.getStudentDashboardData = async (studentId, userName) => {
  const attendanceRecords = await Attendance.find({
    'students.student': studentId
  })
  .populate('course', 'courseName courseCode')
  .populate('faculty', 'name')
  .populate('students.student', 'name rollNumber email user')
  .sort({ date: -1 });

  if (attendanceRecords.length === 0) {
    return {
      studentId,
      name: userName || 'Student',
      overallAttendance: 0,
      courses: []
    };
  }

  const courseStats = new Map();
  let totalPresent = 0;
  let totalClasses = 0;

  attendanceRecords.forEach(record => {
    const studentEntry = record.students.find(s => s.student.toString() === studentId);
    if (studentEntry) {
      const courseId = record.course._id.toString();
      
      if (!courseStats.has(courseId)) {
        courseStats.set(courseId, {
          id: courseId,
          name: record.course.courseName || record.course.courseCode,
          faculty: record.faculty?.name || 'Unknown Faculty',
          attendanceRate: 0,
          present: 0,
          absent: 0,
          total: 0,
          sessions: []
        });
      }

      const stats = courseStats.get(courseId);
      stats.total++;
      totalClasses++;

      if (studentEntry.status.toLowerCase() === 'present') {
        stats.present++;
        totalPresent++;
      } else {
        stats.absent++;
      }

      stats.sessions.push({
        date: record.date.toISOString().split('T')[0],
        status: studentEntry.status.toLowerCase(),
        topic: record.topic || 'No topic specified'
      });
    }
  });

  courseStats.forEach(stats => {
    stats.attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  });

  const overallAttendance = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

  return {
    studentId,
    name: userName || 'Student',
    overallAttendance,
    courses: Array.from(courseStats.values())
  };
};

exports.getCourseDashboardData = async (courseId, userId, userRole, userName) => {
  const attendanceRecords = await Attendance.find({ course: courseId })
    .populate('course', 'courseName courseCode')
    .populate('faculty', 'name')
    .populate('students.student', 'name rollNumber email user')
    .sort({ date: -1 });

  if (userRole === 'faculty' || userRole === 'admin') {
    const processedRecords = attendanceRecords.map(record => {
      const present = record.students.filter(s => 
        s.status.toLowerCase() === 'present'
      ).length;
      const absent = record.students.filter(s => 
        s.status.toLowerCase() === 'absent'
      ).length;
      const total = record.students.length;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        id: record._id,
        course: {
          id: record.course._id,
          name: record.course.courseName || record.course.courseCode
        },
        date: record.date.toISOString().split('T')[0],
        time: `${record.date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })} - ${new Date(record.date.getTime() + 90 * 60000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })}`,
        present,
        absent,
        total,
        attendanceRate,
        topic: record.topic || 'No topic specified'
      };
    });

    return { attendanceRecords: processedRecords };
  } else {
    let studentId = userId;
    
    // Try to find the student record
    let student = await Student.findOne({ user: userId });
    if (!student) {
      student = await ImportedStudent.findById(userId);
    }
    if (!student) {
      const user = await User.findById(userId);
      if (user && user.email) {
        student = await ImportedStudent.findOne({ email: user.email });
      }
    }
    
    if (student) {
      studentId = student._id.toString();
    }
    
    console.log('Looking for student attendance with studentId:', studentId);

    // Use the same logic as getStudentDashboardData for consistency
    const courseAttendance = attendanceRecords.map(record => {
      // Try to find the student record by multiple methods
      let studentRecord = null;
      
      // Method 1: Direct student ID match
      studentRecord = record.students.find(s => s.student._id.toString() === studentId);
      
      // Method 2: If we have a student object, try matching by its ID
      if (!studentRecord && student) {
        studentRecord = record.students.find(s => s.student._id.toString() === student._id.toString());
      }
      
      // Method 3: If student has a user field, try matching by user ID
      if (!studentRecord && student && student.user) {
        studentRecord = record.students.find(s => s.student.user && s.student.user.toString() === student.user.toString());
      }
      
      // Method 4: Try to find by email if available
      if (!studentRecord && student && student.email) {
        studentRecord = record.students.find(s => s.student.email === student.email);
      }
      
      // Method 5: Try to find by roll number if available
      if (!studentRecord && student && student.rollNumber) {
        studentRecord = record.students.find(s => s.student.rollNumber === student.rollNumber);
      }
      
      console.log(`Attendance record for ${record.date.toISOString().split('T')[0]}:`, {
        recordId: record._id,
        studentId: studentId,
        studentRecordFound: !!studentRecord,
        studentRecordStatus: studentRecord?.status,
        totalStudentsInRecord: record.students.length,
        studentInfo: student ? {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          user: student.user
        } : 'No student object'
      });
      
      return {
        date: record.date.toISOString().split('T')[0],
        status: studentRecord?.status.toLowerCase() || 'absent',
        topic: record.topic || 'No topic specified'
      };
    });

    const present = courseAttendance.filter(s => s.status === 'present').length;
    const absent = courseAttendance.filter(s => s.status === 'absent').length;
    const total = courseAttendance.length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    console.log('Course attendance calculation:', {
      courseId,
      studentId,
      totalRecords: attendanceRecords.length,
      present,
      absent,
      total,
      attendanceRate
    });

    const studentAttendance = {
      studentId: studentId,
      name: student ? student.name : (userName || 'Student'),
      overallAttendance: attendanceRate,
      courses: [{
        id: courseId,
        name: attendanceRecords.length > 0 ? (attendanceRecords[0].course.courseName || attendanceRecords[0].course.courseCode) : 'Unknown Course',
        faculty: attendanceRecords.length > 0 ? (attendanceRecords[0].faculty?.name || 'Unknown Faculty') : 'Unknown Faculty',
        attendanceRate,
        present,
        absent,
        total,
        sessions: courseAttendance
      }]
    };

    return { studentAttendance };
  }
};

exports.getFacultyDashboardData = async (facultyId) => {
  const courses = await Course.find({
    instructor: facultyId // Only check instructor field for consistency
  }).select('_id courseName courseCode');

  if (courses.length === 0) {
    return { attendanceRecords: [] };
  }

  const courseIds = courses.map(course => course._id);

  const attendanceRecords = await Attendance.find({
    course: { $in: courseIds }
  })
  .populate('course', 'courseName courseCode')
  .sort({ date: -1 });

  const processedRecords = attendanceRecords.map(record => {
    const present = record.students.filter(s => 
      s.status.toLowerCase() === 'present'
    ).length;
    const absent = record.students.filter(s => 
      s.status.toLowerCase() === 'absent'
    ).length;
    const total = record.students.length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      id: record._id,
      course: {
        id: record.course._id,
        name: record.course.courseName || record.course.courseCode
      },
      date: record.date.toISOString().split('T')[0],
      time: `${record.date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })} - ${new Date(record.date.getTime() + 90 * 60000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`,
      present,
      absent,
      total,
      attendanceRate,
      topic: record.topic || 'No topic specified'
    };
  });

  return { attendanceRecords: processedRecords };
};

exports.createCourseComparison = (courseStats) => {
  return courseStats.map(stats => ({
    id: stats.id,
    name: stats.name,
    code: stats.code,
    faculty: stats.faculty,
    attendance: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
  }));
};

exports.createAttendanceDistribution = (totalPresent, totalClasses) => {
  return [
    { name: 'Present', value: totalPresent },
    { name: 'Absent', value: totalClasses - totalPresent }
  ];
};

exports.createAttendanceHistory = (attendanceRecords, studentId) => {
  return attendanceRecords.map(record => {
    const studentEntry = record.students.find(s => s.student.toString() === studentId);
    return {
      date: record.date.toLocaleDateString(),
      course: record.course.courseName || record.course.courseCode,
      faculty: record.faculty?.name || 'N/A',
      status: studentEntry?.status || 'absent',
      remarks: studentEntry?.remarks || ''
    };
  });
}; 