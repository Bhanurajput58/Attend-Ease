const fs = require('fs');
const mongoose = require('mongoose');

const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const ImportedStudent = require('../models/ImportedStudent');
const Student = require('../models/Student');
const User = require('../models/User');

const attendanceHooks = require('../utils/attendanceHooks');
const dashboardHooks = require('../utils/dashboardHooks');
const exportHooks = require('../utils/exportHooks');
const { generatePDF, generateExcel, cleanupReport } = require('../utils/reportGenerator');

exports.createAttendance = async (req, res) => {
  try {
    const { course, date, students } = req.body;
    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID format' });
    }

    let courseExists;
    try {
      courseExists = await attendanceHooks.validateCourseAccess(course, req.user.id, req.user.role);
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }

    const userId = req.user.id || req.user._id;
    const isInstructor = [courseExists.faculty, courseExists.instructor].some(f => f?.toString() === userId.toString());
    if (req.user.role !== 'admin' && !isInstructor) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const existingAttendance = await attendanceHooks.checkExistingAttendance(course, date);
    const { studentRecords, studentResponses } = await attendanceHooks.processStudentData(students, course);

    let attendanceRecord = existingAttendance
      ? Object.assign(existingAttendance, { students: studentRecords, lastUpdated: Date.now() }) && await existingAttendance.save()
      : await Attendance.create({ course, date: new Date(date), faculty: userId, students: studentRecords });

    const populatedRecord = await Attendance.findById(attendanceRecord._id)
      .populate('course', 'courseName courseCode')
      .populate({ path: 'students.student', select: 'name rollNumber discipline program semester' });

    res.status(existingAttendance ? 200 : 201).json({
      success: true,
      message: existingAttendance ? 'Attendance updated successfully' : 'Attendance recorded successfully',
      data: {
        id: populatedRecord._id,
        course: {
          id: populatedRecord.course._id,
          name: populatedRecord.course.courseName,
          code: populatedRecord.course.courseCode
        },
        date: populatedRecord.date,
        students: studentResponses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getCourseAttendance = async (req, res) => {
  try {
    try {
      await attendanceHooks.validateCourseAccess(req.params.courseId, req.user.id, req.user.role);
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }

    const attendanceRecords = await Attendance.find({ course: req.params.courseId })
      .populate({ path: 'students.student', select: 'name rollNumber discipline department semester email courses' })
      .populate('faculty', 'name')
      .sort({ date: -1 });

    const processedRecords = await attendanceHooks.populateAttendanceRecords(attendanceRecords);
    res.json({ success: true, count: attendanceRecords.length, data: processedRecords });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const { student, foundInUser } = await attendanceHooks.getStudentById(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    let courses = [];
    if (!foundInUser && student.courses?.length) {
      courses = await Course.find({ _id: { $in: student.courses } }).select('_id courseName courseCode faculty instructor');
    }

    const studentMongoId = student._id.toString();
    let attendanceRecords = await Attendance.find({ 'students.student': studentMongoId })
      .populate('course', 'courseName courseCode')
      .populate('faculty', 'name')
      .sort({ date: -1 });

    if (!attendanceRecords.length && student.email) {
      const altStudent = await ImportedStudent.findOne({ email: student.email }) || await ImportedStudent.findOne({ name: student.name });
      if (altStudent) {
        attendanceRecords = await Attendance.find({ 'students.student': altStudent._id.toString() })
          .populate('course', 'courseName courseCode')
          .populate('faculty', 'name')
          .sort({ date: -1 });
      }
    }

    const stats = attendanceHooks.calculateAttendanceStats(attendanceRecords, studentMongoId);
    const courseStatsMap = new Map(stats.courseStats.map(stat => [stat.id, stat]));

    const mergedCourses = courses.map(course => {
      const stat = courseStatsMap.get(course._id.toString());
      return {
        _id: course._id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        attendanceRate: stat?.total ? Math.round((stat.present / stat.total) * 100) : 0,
        present: stat?.present || 0,
        absent: stat?.absent || 0,
        total: stat?.total || 0,
        faculty: stat?.faculty || course.faculty?.name || course.instructor?.name || 'N/A'
      };
    });

    res.json({
      success: true,
      data: {
        overall: stats.overallRate,
        courses: mergedCourses,
        analytics: {
          monthly: attendanceHooks.createMonthlyAnalytics(attendanceRecords, studentMongoId),
          courseComparison: mergedCourses.map(c => ({ id: c._id, name: c.courseName, code: c.courseCode, attendance: c.attendanceRate })),
          distribution: dashboardHooks.createAttendanceDistribution(stats.totalPresent, stats.totalClasses)
        },
        history: dashboardHooks.createAttendanceHistory(attendanceRecords, studentMongoId),
        attendanceGoal: student.attendanceGoal || 90
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve attendance records', error: error.message });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { students } = req.body;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    
    // Update students array
    attendance.students = students;
    attendance.lastUpdated = Date.now();
    
    await attendance.save();
    
    res.json({ success: true, message: 'Attendance updated successfully', data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { courseId, date, startDate, endDate } = req.query;
    let query = {};
    
    if (courseId) query.course = courseId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const attendance = await Attendance.find(query)
      .populate('course', 'courseName courseCode')
      .populate('faculty', 'name')
      .populate('students.student', 'name rollNumber')
      .sort({ date: -1 });
    
    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    
    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findById(id)
      .populate('course', 'courseName courseCode')
      .populate('faculty', 'name')
      .populate('students.student', 'name rollNumber');
    
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getFacultyAttendance = async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    const attendance = await Attendance.find({ faculty: facultyId })
      .populate('course', 'courseName courseCode')
      .populate('students.student', 'name rollNumber')
      .sort({ date: -1 });
    
    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getStudentAttendanceDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Find student by user ID
    const student = await Student.findOne({ user: studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const attendance = await Attendance.find({ 'students.student': student._id })
      .populate('course', 'courseName courseCode')
      .populate('faculty', 'name')
      .sort({ date: -1 });
    
    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getCourseAttendanceDashboard = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const attendance = await Attendance.find({ course: courseId })
      .populate('course', 'courseName courseCode')
      .populate('faculty', 'name')
      .populate('students.student', 'name rollNumber')
      .sort({ date: -1 });
    
    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.exportAttendanceReport = async (req, res) => {
  try {
    console.log('Export request received with query:', req.query);
    const { format, startDate, endDate, courseId } = req.query;
    const facultyId = req.user.id;
    
    // Validate required parameters but make dates optional
    if (!format) {
      console.error('Missing required parameter: format');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameter: format' 
      });
    }
    
    // Validate format
    if (format !== 'pdf' && format !== 'excel') {
      console.error('Invalid format:', format);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid format. Must be either "pdf" or "excel".' 
      });
    }
    
    // Parse dates or use current date if not provided
    let parsedStartDate, parsedEndDate;
    
    if (startDate && endDate) {
      parsedStartDate = new Date(startDate);
      parsedEndDate = new Date(endDate);
      
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        console.error('Invalid date format:', { startDate, endDate });
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format' 
        });
      }
    } else {
      // If no dates provided, use current date (whole day)
      parsedEndDate = new Date();
      parsedStartDate = new Date(parsedEndDate);
      
      // Set times to cover the whole day
      parsedStartDate.setHours(0, 0, 0, 0);
      parsedEndDate.setHours(23, 59, 59, 999);
    }
    
    console.log('Parsed date range:', { 
      start: parsedStartDate.toISOString(), 
      end: parsedEndDate.toISOString() 
    });
    
    // Get course name and build query
    let courseName = 'All Courses';
    const query = {
      date: { $gte: parsedStartDate, $lte: parsedEndDate },
      faculty: facultyId
    };
    
    if (courseId && courseId !== 'all') {
      query.course = courseId;
      
      // Get actual course name from database
      try {
        const course = await Course.findById(courseId);
        if (course) {
          courseName = course.courseName || course.courseCode || 'Unknown Course';
          console.log('Found course name:', courseName);
        }
      } catch (err) {
        console.error('Error getting course name:', err);
      }
    }
    
    // Determine period name based on date range
    let periodName = 'Custom';
    const daysDiff = Math.ceil((parsedEndDate - parsedStartDate) / (1000 * 60 * 60 * 24));
    console.log('Days difference:', daysDiff);
    
    if (daysDiff <= 1) {
      periodName = 'Daily';
    } else if (daysDiff <= 7) {
      periodName = 'Weekly';
    } else if (daysDiff <= 31) {
      periodName = 'Monthly';
    } else {
      periodName = 'Semester';
    }
    
    console.log('Period determined:', periodName);
    
    // Get real attendance data from database
    const attendanceRecords = await Attendance.find(query)
      .populate('course', 'courseName courseCode')
      .populate({
        path: 'students.student',
        select: 'name rollNumber discipline'
      })
      .sort({ date: 1 });
    
    console.log(`Found ${attendanceRecords.length} real attendance records for export`);
    
    // Process attendance records to the format needed for reports
    // Even if there are no records, we'll generate an empty report
    const processedRecords = attendanceRecords.length > 0 
      ? attendanceRecords.map(record => {
          const totalStudents = record.students.length;
          const presentStudents = record.students.filter(s => 
            s.status === 'present' || s.status === 'Present'
          ).length;
          const percentage = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;
          
          return {
            date: new Date(record.date).toLocaleDateString(),
            present: presentStudents,
            absent: totalStudents - presentStudents,
            total: totalStudents,
            percentage: percentage
          };
        })
      : []; // Empty array for no records
    
    // Format data for report generation
    const reportData = {
      courseName,
      period: `${periodName} (${parsedStartDate.toLocaleDateString()} - ${parsedEndDate.toLocaleDateString()})`,
      attendanceRecords: processedRecords
    };
    
    console.log('Preparing to generate report in format:', format);
    
    // Generate report based on format
    let filePath;
    try {
      if (format === 'pdf') {
        console.log('Generating PDF report');
        filePath = await generatePDF(reportData);
        console.log('PDF generated at:', filePath);
        res.setHeader('Content-Type', 'application/pdf');
      } else {
        console.log('Generating Excel report');
        filePath = await generateExcel(reportData);
        console.log('Excel generated at:', filePath);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    } catch (genError) {
      console.error('Error generating report:', genError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report file',
        error: genError.message
      });
    }
    
    // Set headers for file download
    const filename = `Attendance_${courseName.replace(/\s+/g, '_')}_${periodName}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    console.log('Response headers set, filename:', filename);
    
    // Verify the file exists before streaming
    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);
      console.log('File exists and is ready for streaming. Size:', stats.size, 'bytes');
    } catch (fileError) {
      console.error('File access error:', fileError);
      return res.status(500).json({
        success: false,
        message: 'Generated file not accessible',
        error: fileError.message
      });
    }
    
    // Send the file
    try {
      console.log('Creating read stream for file:', filePath);
      const fileStream = fs.createReadStream(filePath);
      
      // Handle errors on the stream
      fileStream.on('error', (streamError) => {
        console.error('Error streaming file:', streamError);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file',
            error: streamError.message
          });
        } else {
          console.error('Headers already sent, cannot send error response');
          res.end();
        }
      });
      
      // Handle end of stream - cleanup
      fileStream.on('end', () => {
        console.log('File stream completed');
        cleanupReport(filePath);
      });
      
      console.log('Piping file to response');
      fileStream.pipe(res);
    } catch (streamError) {
      console.error('Error setting up file stream:', streamError);
      return res.status(500).json({
        success: false,
        message: 'Error streaming file',
        error: streamError.message
      });
    }
  } catch (error) {
    console.error('Unhandled error in export route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate report', 
      error: error.message 
    });
  }
};
