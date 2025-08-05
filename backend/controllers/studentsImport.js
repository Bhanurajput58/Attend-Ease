const ImportedStudent = require('../models/ImportedStudent');
const Student = require('../models/Student');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// Import students from Excel
exports.importStudents = async (req, res) => {
  try {
    const { courseId, students, fileName } = req.body;
    
    if (!courseId || !students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid input. Please provide courseId and an array of students.' });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    const result = await ImportedStudent.importFromExcel(students, courseId, req.user.id, fileName || 'Manual Import');
    
    res.status(200).json({
      success: true,
      message: 'Students imported successfully',
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        upsertedIds: result.upsertedIds
      }
    });
  } catch (error) {
    console.error('Error importing students:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get students for a course
exports.getStudentsByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    const students = await ImportedStudent.find({ courses: courseId }).select('name rollNumber discipline attendanceStats');
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get student by ID or roll number
exports.getStudent = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    let student = null;
    
    if (isObjectId) {
      student = await Student.findById(identifier);
      if (!student) student = await ImportedStudent.findById(identifier);
      if (!student) {
        try {
          const userObjectId = mongoose.Types.ObjectId(identifier);
          student = await Student.findOne({ user: userObjectId });
        } catch (e) {}
      }
    } else {
      student = await Student.findOne({ rollNumber: identifier });
      if (!student) student = await ImportedStudent.findOne({ rollNumber: identifier });
    }
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Update student profile
exports.updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const allowedFields = ['name', 'email', 'rollNumber', 'program', 'major', 'semester', 'currentSemester', 'gpa', 'department', 'profileImage'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    
    const student = await Student.findByIdAndUpdate(studentId, updates, { new: true, runValidators: true });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get student's timetable
exports.getStudentTimetable = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    const student = await ImportedStudent.findById(studentId)
      .populate({
        path: 'courses',
        select: 'courseName courseCode schedule faculty',
        populate: { path: 'faculty', select: 'name' }
      });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const timetable = [
      { day: 'Monday', courses: [] },
      { day: 'Tuesday', courses: [] },
      { day: 'Wednesday', courses: [] },
      { day: 'Thursday', courses: [] },
      { day: 'Friday', courses: [] }
    ];

    student.courses.forEach(course => {
      const courseInfo = {
        id: course._id,
        name: course.courseName,
        code: course.courseCode,
        faculty: course.faculty?.name || 'TBD',
        time: course.schedule?.time || '09:00 AM - 10:30 AM',
        room: course.schedule?.room || 'TBD'
      };

      if (course.schedule?.days && Array.isArray(course.schedule.days)) {
        course.schedule.days.forEach(day => {
          const dayEntry = timetable.find(d => d.day === day);
          if (dayEntry) dayEntry.courses.push(courseInfo);
        });
      } else {
        timetable[0].courses.push(courseInfo);
      }
    });

    timetable.forEach(day => {
      day.courses.sort((a, b) => {
        const timeA = a.time.split(' - ')[0];
        const timeB = b.time.split(' - ')[0];
        return timeA.localeCompare(timeB);
      });
    });

    res.status(200).json({ success: true, data: timetable });
  } catch (error) {
    console.error('Error getting student timetable:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get all students (for notifications)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({})
      .populate('user', 'name email username')
      .select('fullName name studentId rollNumber user courses');
    
    const formattedStudents = students.map(student => ({
      _id: student._id,
      fullName: student.fullName || student.name || 'Unknown Name',
      name: student.fullName || student.name || 'Unknown Name',
      studentId: student.studentId || student.rollNumber || 'Unknown ID',
      rollNumber: student.studentId || student.rollNumber || 'Unknown ID',
      user: student.user?._id,
      courses: student.courses || []
    }));
    
    res.status(200).json({
      success: true,
      count: formattedStudents.length,
      data: formattedStudents
    });
  } catch (error) {
    console.error('Error fetching all students:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getStudentByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get student attendance goal
exports.getAttendanceGoal = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    let student = await Student.findById(studentId);
    if (!student) student = await Student.findOne({ user: studentId });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({
      success: true,
      data: { attendanceGoal: student.attendanceGoal || 90 }
    });
  } catch (error) {
    console.error('Error getting attendance goal:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Update student attendance goal
exports.updateAttendanceGoal = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const { attendanceGoal } = req.body;
    
    console.log('🔧 Backend: Updating attendance goal request:', { studentId, attendanceGoal, body: req.body, user: req.user?.id });
    
    if (attendanceGoal === undefined || attendanceGoal === null) {
      console.log('❌ Backend: Attendance goal is missing');
      return res.status(400).json({ success: false, message: 'Attendance goal is required' });
    }
    
    if (attendanceGoal < 0 || attendanceGoal > 100) {
      console.log('❌ Backend: Attendance goal out of range:', attendanceGoal);
      return res.status(400).json({ success: false, message: 'Attendance goal must be between 0 and 100' });
    }
    
    let student = await Student.findById(studentId);
    console.log('🔍 Backend: Found student by ID:', student ? 'Yes' : 'No');
    
    if (!student) {
      student = await Student.findOne({ user: studentId });
      console.log('🔍 Backend: Found student by user ID:', student ? 'Yes' : 'No');
    }
    
    if (!student) {
      console.log('❌ Backend: Student not found for ID:', studentId);
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    console.log('✅ Backend: Found student:', { id: student._id, name: student.name, currentGoal: student.attendanceGoal, newGoal: attendanceGoal });
    
    student.attendanceGoal = attendanceGoal;
    await student.save();
    
    console.log('✅ Backend: Attendance goal saved successfully');
    
    res.status(200).json({
      success: true,
      data: { attendanceGoal: student.attendanceGoal },
      message: 'Attendance goal updated successfully'
    });
  } catch (error) {
    console.error('❌ Backend: Error updating attendance goal:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Export student attendance report
exports.exportAttendanceReport = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const userId = req.user.id;
    
    console.log('Export attendance report request for student:', studentId, 'by user:', userId);
    
    let student = null;
    let foundInUser = false;
    
    student = await Student.findById(studentId);
    if (student) foundInUser = true;
    
    if (!student) student = await ImportedStudent.findById(studentId);
    
    if (!student) {
      student = await Student.findOne({ user: studentId });
      if (student) foundInUser = true;
    }
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (foundInUser && student.user && student.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this student\'s data' });
    }
    
    const Attendance = require('../models/Attendance');
    const attendanceRecords = await Attendance.find({ 'students.student': student._id })
      .populate('course', 'courseName courseCode')
      .populate('faculty', 'name')
      .sort({ date: -1 });
    
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ success: false, message: 'No attendance records found for this student' });
    }
    
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const doc = new PDFDocument();
    const tempDir = os.tmpdir();
    const fileName = `attendance_report_${student.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Add content to PDF
    doc.fontSize(20).text('Student Attendance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Student: ${student.name}`);
    doc.fontSize(12).text(`Roll Number: ${student.rollNumber || 'N/A'}`);
    doc.fontSize(12).text(`Department: ${student.discipline || student.department || 'N/A'}`);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    
    // Calculate statistics
    let totalClasses = 0, presentClasses = 0, absentClasses = 0;
    
    attendanceRecords.forEach(record => {
      const studentEntry = record.students.find(s => s.student.toString() === student._id.toString());
      if (studentEntry) {
        totalClasses++;
        if (studentEntry.status.toLowerCase() === 'present') presentClasses++;
        else absentClasses++;
      }
    });
    
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    
    // Add statistics
    doc.fontSize(14).text('Attendance Summary', { underline: true });
    doc.fontSize(12).text(`Total Classes: ${totalClasses}`);
    doc.fontSize(12).text(`Present: ${presentClasses}`);
    doc.fontSize(12).text(`Absent: ${absentClasses}`);
    doc.fontSize(12).text(`Attendance Rate: ${attendanceRate}%`);
    doc.moveDown();
    
    // Add attendance details table
    doc.fontSize(14).text('Attendance Details', { underline: true });
    doc.moveDown();
    
    let yPosition = doc.y;
    const tableTop = yPosition;
    const tableLeft = 50;
    const colWidths = [80, 150, 100, 80];
    const headers = ['Date', 'Subject', 'Teacher', 'Status'];
    
    // Draw headers
    headers.forEach((header, i) => {
      doc.fontSize(10).text(header, tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0), yPosition);
    });
    
    yPosition += 20;
    
    // Draw attendance records
    attendanceRecords.forEach(record => {
      const studentEntry = record.students.find(s => s.student.toString() === student._id.toString());
      if (studentEntry) {
        const date = new Date(record.date).toLocaleDateString();
        const subject = record.course?.courseName || record.course?.courseCode || 'N/A';
        const teacher = record.faculty?.name || 'N/A';
        const status = studentEntry.status;
        
        doc.fontSize(10).text(date, tableLeft, yPosition);
        doc.fontSize(10).text(subject, tableLeft + colWidths[0], yPosition);
        doc.fontSize(10).text(teacher, tableLeft + colWidths[0] + colWidths[1], yPosition);
        doc.fontSize(10).text(status, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], yPosition);
        
        yPosition += 15;
        
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      }
    });
    
    doc.end();
    
    stream.on('finish', () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error downloading file', error: err.message });
          }
        }
        
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temporary file:', unlinkErr);
        });
      });
    });
    
    stream.on('error', (err) => {
      console.error('Error creating PDF:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error generating PDF', error: err.message });
      }
    });
    
  } catch (error) {
    console.error('Error exporting student attendance report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report', error: error.message });
  }
};