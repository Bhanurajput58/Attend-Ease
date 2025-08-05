const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const ImportedStudent = require('../models/ImportedStudent');
const User = require('../models/User');
const Student = require('../models/Student'); // Added Student model import

exports.validateCourseAccess = async (courseId, userId, userRole) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  if (userRole === 'faculty') {
    const isInstructor = (course.faculty && course.faculty.toString() === userId.toString()) || 
                        (course.instructor && course.instructor.toString() === userId.toString());
    
    if (!isInstructor) {
      throw new Error('You are not authorized to access this course. Only assigned faculty can view attendance.');
    }
  } else if (userRole === 'student') {
    const student = await ImportedStudent.findById(userId);
    if (!student || !student.courses.includes(courseId)) {
      throw new Error('Not enrolled in this course');
    }
  }

  return course;
};

exports.processStudentData = async (students, courseId) => {
  const studentRecords = [];
  const studentResponses = [];
  
  for (const studentData of students) {
    try {
      let studentId;
      let studentModel = 'ImportedStudent';
      let studentObject = null;
      
      const rollNumber = studentData.rollNumber || studentData.studentData?.rollNumber || `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const name = studentData.name || studentData.studentData?.name || 'Unknown';
      const discipline = studentData.discipline || studentData.studentData?.discipline || 'Not Specified';
      const program = studentData.program || studentData.studentData?.program || 'B.tech';
      const semester = studentData.semester || studentData.studentData?.semester || 4;
      
      let existingStudent = null;
      
      if (studentData.student && typeof studentData.student === 'string' && !studentData.student.startsWith('TEMP_')) {
        try {
          existingStudent = await ImportedStudent.findById(studentData.student);
        } catch (e) {
          console.error(`Error finding student by ID:`, e);
        }
      }
      
      if (!existingStudent) {
        existingStudent = await ImportedStudent.findOne({ rollNumber });
      }
      
      if (existingStudent) {
        studentId = existingStudent._id;
        
        let needsUpdate = false;
        
        if (name && name !== 'Unknown' && 
            (existingStudent.name === 'Unknown' || existingStudent.name === 'Student')) {
          existingStudent.name = name;
          needsUpdate = true;
        }
        
        if (discipline && discipline !== 'Not Specified' && 
            existingStudent.discipline === 'Not Specified') {
          existingStudent.discipline = discipline;
          needsUpdate = true;
        }
        
        if (program && program !== 'B.tech' && 
            existingStudent.program === 'B.tech') {
          existingStudent.program = program;
          needsUpdate = true;
        }
        
        if (semester && semester !== 4 && 
            existingStudent.semester === 4) {
          existingStudent.semester = semester;
          needsUpdate = true;
        }
        
        if (existingStudent.rollNumber.startsWith('AUTO-') && 
            rollNumber && !rollNumber.startsWith('AUTO-')) {
          existingStudent.rollNumber = rollNumber;
          needsUpdate = true;
        }
        
        if (!existingStudent.courses.includes(courseId)) {
          existingStudent.courses.push(courseId);
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await existingStudent.save();
        }
        
        studentObject = existingStudent;
      } else {
        const newStudent = await ImportedStudent.create({
          name,
          rollNumber,
          discipline,
          program,
          semester,
          courses: [courseId]
        });
        
        studentId = newStudent._id;
        studentObject = newStudent;
      }
      
      const studentRecord = {
        student: studentId,
        studentModel,
        status: (studentData.status || '').toLowerCase() === 'present' ? 'present' : 'absent',
        remarks: studentData.remarks || ''
      };
      
      studentRecords.push(studentRecord);
      
      studentResponses.push({
        student: studentId,
        studentModel,
        name: studentObject.name,
        rollNumber: studentObject.rollNumber,
        discipline: studentObject.discipline,
        program: studentObject.program,
        semester: studentObject.semester,
        status: studentRecord.status,
        remarks: studentRecord.remarks || ''
      });
      
      await ImportedStudent.updateAttendanceStats(
        studentId,
        courseId,
        studentRecord.status
      );
    } catch (error) {
      console.error('Error processing student:', error);
    }
  }
  
  return { studentRecords, studentResponses };
};

exports.checkExistingAttendance = async (courseId, date) => {
  const formattedDate = new Date(date);
  const startOfDay = new Date(formattedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(formattedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAttendance = await Attendance.findOne({
    course: courseId,
    date: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  });

  return existingAttendance;
};

exports.populateAttendanceRecords = async (attendanceRecords) => {
  const populatedRecords = await Attendance.populate(attendanceRecords, [
    {
      path: 'students.student',
      select: 'name rollNumber discipline department semester email courses'
    },
    {
      path: 'faculty',
      select: 'name email'
    },
    {
      path: 'course',
      select: 'courseName courseCode'
    }
  ]);

  return populatedRecords.map(record => {
    const plainRecord = record.toObject();
    
    plainRecord.students = plainRecord.students.map(studentEntry => {
      if (studentEntry.student && typeof studentEntry.student === 'object') {
        return {
          ...studentEntry,
          name: studentEntry.student.name || 'Unknown',
          rollNumber: studentEntry.student.rollNumber || 'Unknown',
          discipline: studentEntry.student.discipline || 'Not Specified'
        };
      }
      return {
        ...studentEntry,
        name: 'Unknown',
        rollNumber: 'Unknown',
        discipline: 'Not Specified'
      };
    });
    
    return plainRecord;
  });
};

exports.calculateAttendanceStats = (attendanceRecords, studentId = null) => {
  console.log('calculateAttendanceStats called with:', {
    attendanceRecordsCount: attendanceRecords.length,
    studentId: studentId,
    studentIdType: typeof studentId
  });

  const courseStats = new Map();
  let totalPresent = 0;
  let totalClasses = 0;

  attendanceRecords.forEach((record, index) => {
    console.log(`Processing attendance record ${index + 1}:`, {
      recordId: record._id,
      courseId: record.course._id.toString(),
      courseName: record.course.courseName,
      date: record.date,
      studentsCount: record.students.length
    });

    const studentEntry = studentId 
      ? record.students.find(s => s.student.toString() === studentId)
      : null;

    console.log(`Student entry found:`, {
      studentId: studentId,
      studentEntryFound: !!studentEntry,
      studentEntryStatus: studentEntry?.status,
      studentEntryStudentId: studentEntry?.student?.toString()
    });

    if (studentId && !studentEntry) {
      console.log(`No student entry found for student ID: ${studentId}`);
      return;
    }

    const courseId = record.course._id.toString();
    
    if (!courseStats.has(courseId)) {
      courseStats.set(courseId, {
        id: courseId,
        name: record.course.courseName || record.course.courseCode,
        code: record.course.courseCode,
        present: 0,
        absent: 0,
        total: 0,
        faculty: record.faculty?.name || 'N/A'
      });
    }
    
    const stats = courseStats.get(courseId);
    stats.total++;
    
    if (studentId) {
      if (studentEntry.status.toLowerCase() === 'present') {
        stats.present++;
        totalPresent++;
        console.log(`Marked as present for course: ${record.course.courseName}`);
      } else {
        stats.absent++;
        console.log(`Marked as absent for course: ${record.course.courseName}`);
      }
      totalClasses++;
    } else {
      const presentCount = record.students.filter(s => 
        s.status.toLowerCase() === 'present'
      ).length;
      const absentCount = record.students.filter(s => 
        s.status.toLowerCase() === 'absent'
      ).length;
      
      stats.present += presentCount;
      stats.absent += absentCount;
    }
  });

  console.log('Final calculation results:', {
    courseStatsCount: courseStats.size,
    totalPresent,
    totalClasses,
    overallRate: totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0,
    courseStats: Array.from(courseStats.values()).map(stat => ({
      id: stat.id,
      name: stat.name,
      present: stat.present,
      absent: stat.absent,
      total: stat.total,
      percentage: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0
    }))
  });

  return {
    courseStats: Array.from(courseStats.values()),
    totalPresent,
    totalClasses,
    overallRate: totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0
  };
};

exports.buildAttendanceFilters = async (query, user) => {
  const { course, date, startDate, endDate } = query;
  const filter = {};
  
  if (course) {
    if (user.role === 'faculty') {
      await exports.validateCourseAccess(course, user.id, user.role);
    }
    filter.course = course;
  } else if (user.role === 'faculty') {
    const userId = user.id || user._id;
    const assignedCourses = await Course.find({
      $or: [
        { faculty: userId },
        { instructor: userId }
      ]
    }).select('_id');
    
    const assignedCourseIds = assignedCourses.map(c => c._id);
    if (assignedCourseIds.length === 0) {
      return { filter: { _id: null }, isEmpty: true };
    }
    
    filter.course = { $in: assignedCourseIds };
  }
  
  if (date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    filter.date = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  } else if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return { filter, isEmpty: false };
};

exports.updateStudentInfo = async (studentRecord) => {
  const studentId = studentRecord.student;
  
  try {
    const student = await ImportedStudent.findById(studentId);
    
    if (student) {
      let needsUpdate = false;
      
      if (studentRecord.name && studentRecord.name !== 'Unknown' && 
          (student.name === 'Unknown' || student.name === 'Student')) {
        student.name = studentRecord.name;
        needsUpdate = true;
      }
      
      if (studentRecord.rollNumber && !studentRecord.rollNumber.startsWith('AUTO-') && 
          student.rollNumber.startsWith('AUTO-')) {
        student.rollNumber = studentRecord.rollNumber;
        needsUpdate = true;
      }
      
      if (studentRecord.discipline && studentRecord.discipline !== 'Not Specified' && 
          student.discipline === 'Not Specified') {
        student.discipline = studentRecord.discipline;
        needsUpdate = true;
      }
      
      if (studentRecord.program && studentRecord.program !== 'B.tech' && 
          student.program === 'B.tech') {
        student.program = studentRecord.program;
        needsUpdate = true;
      }
      
      if (studentRecord.semester && studentRecord.semester !== 4 && 
          student.semester === 4) {
        student.semester = studentRecord.semester;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await student.save();
      }
    }
  } catch (error) {
    console.error(`Error updating student ${studentId}:`, error);
  }
};

exports.getStudentById = async (studentId) => {
  let student = await ImportedStudent.findById(studentId);
  let foundInUser = false;
  let modelSource = 'none';
  
  if (student) {
    modelSource = 'ImportedStudent';
    console.log('Found student in ImportedStudent model');
  }
  
  if (!student) {
    // Try to find in User model first
    const user = await User.findById(studentId);
    if (user) {
      foundInUser = true;
      modelSource = 'User';
      console.log('Found student in User model:', user.name, user.email);
      
      // Try to find corresponding ImportedStudent by name or email
      let importedStudent = null;
      
      // Try to find by email first
      if (user.email) {
        importedStudent = await ImportedStudent.findOne({ email: user.email });
        if (importedStudent) {
          console.log('Found ImportedStudent by email:', importedStudent.name, importedStudent.email);
        }
      }
      
      // Try to find by name if no email match
      if (!importedStudent && user.name) {
        importedStudent = await ImportedStudent.findOne({ name: user.name });
        if (importedStudent) {
          console.log('Found ImportedStudent by name:', importedStudent.name, importedStudent.email);
        }
      }
      
      if (importedStudent) {
        // Use the ImportedStudent record since attendance records contain ImportedStudent IDs
        student = importedStudent;
        foundInUser = false; // Now it's from ImportedStudent model
        modelSource = 'ImportedStudent (mapped from User)';
        console.log('Using ImportedStudent for attendance lookup:', importedStudent._id);
      } else {
        console.log('No matching ImportedStudent found for User:', user.name, user.email);
        // Keep the user record but note that attendance lookup might fail
        student = user;
      }
    }
  }
  
  if (!student) {
    // Try to find in Student model (which has attendanceGoal field)
    const studentRecord = await Student.findById(studentId);
    if (studentRecord) {
      foundInUser = false; // This is from Student model, not User model
      modelSource = 'Student';
      console.log('Found student in Student model, attendanceGoal:', studentRecord.attendanceGoal);
      
      // Try to find corresponding ImportedStudent for this Student record
      if (studentRecord.user) {
        const user = await User.findById(studentRecord.user);
        if (user) {
          // Try to find ImportedStudent by name or email
          let importedStudent = null;
          
          if (user.email) {
            importedStudent = await ImportedStudent.findOne({ email: user.email });
          }
          
          if (!importedStudent && user.name) {
            importedStudent = await ImportedStudent.findOne({ name: user.name });
          }
          
          if (importedStudent) {
            // Use the ImportedStudent record for attendance lookup
            student = importedStudent;
            modelSource = 'ImportedStudent (mapped from Student)';
            console.log('Using ImportedStudent for attendance lookup:', importedStudent._id);
          } else {
            // Keep the student record but note that attendance lookup might fail
            student = studentRecord;
            console.log('No matching ImportedStudent found for Student record');
          }
        } else {
          student = studentRecord;
        }
      } else {
        student = studentRecord;
      }
    }
  }
  
  // If still not found, try to find by user ID in Student model
  if (!student) {
    try {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        const studentRecord = await Student.findOne({ user: studentId });
        if (studentRecord) {
          foundInUser = false;
          modelSource = 'Student (by user ID)';
          console.log('Found student in Student model by user ID, attendanceGoal:', studentRecord.attendanceGoal);
          
          // Try to find corresponding ImportedStudent
          const user = await User.findById(studentId);
          if (user) {
            let importedStudent = null;
            
            if (user.email) {
              importedStudent = await ImportedStudent.findOne({ email: user.email });
            }
            
            if (!importedStudent && user.name) {
              importedStudent = await ImportedStudent.findOne({ name: user.name });
            }
            
            if (importedStudent) {
              // Use the ImportedStudent record for attendance lookup
              student = importedStudent;
              modelSource = 'ImportedStudent (mapped from Student by user ID)';
              console.log('Using ImportedStudent for attendance lookup:', importedStudent._id);
            } else {
              student = studentRecord;
              console.log('No matching ImportedStudent found for Student by user ID');
            }
          } else {
            student = studentRecord;
          }
        }
      }
    } catch (error) {
      console.error('Error checking Student model by user ID:', error);
    }
  }
  
  console.log('Final student lookup result:', {
    studentId,
    found: !!student,
    modelSource,
    finalStudentId: student?._id,
    finalStudentName: student?.name,
    hasAttendanceGoal: student?.attendanceGoal !== undefined,
    attendanceGoal: student?.attendanceGoal,
    hasCourses: !!student?.courses,
    coursesLength: student?.courses?.length || 0
  });
  
  return { student, foundInUser };
};

exports.createMonthlyAnalytics = (attendanceRecords, studentId) => {
  const monthlyData = new Map();
  
  attendanceRecords.forEach(record => {
    const studentEntry = record.students.find(s => s.student.toString() === studentId);
    if (studentEntry) {
      const month = new Date(record.date).toLocaleString('default', { month: 'short' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { present: 0, total: 0 });
      }
      const data = monthlyData.get(month);
      data.total++;
      if (studentEntry.status.toLowerCase() === 'present') {
        data.present++;
      }
    }
  });

  return Array.from(monthlyData.entries()).map(([month, data]) => ({
    month,
    attendance: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
  }));
}; 