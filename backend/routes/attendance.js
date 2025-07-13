const express = require('express');
const {
  createAttendance,
  getCourseAttendance,
  getStudentAttendance,
  updateAttendance,
  getAttendance,
  deleteAttendance,
  getAttendanceById,
  getStudentAttendanceData
} = require('../controllers/attendance');
const { protect, authorize } = require('../middleware/auth');
const fs = require('fs-extra');
const { generatePDF, generateExcel, cleanupReport } = require('../utils/reportGenerator');

const router = express.Router();

// All routes below this point are protected
router.use(protect);

// Get all attendance records with optional filtering by course, date
router.route('/')
  .get(getAttendance)
  .post(authorize('admin', 'faculty'), createAttendance);

// Export attendance reports
router.get('/export', authorize('faculty', 'admin'), async (req, res) => {
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
        const course = await require('../models/Course').findById(courseId);
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
    const Attendance = require('../models/Attendance');
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
});

// Get attendance by course
router.route('/course/:courseId')
  .get(getCourseAttendance);

// Get attendance by student
router.route('/student/:studentId')
  .get(getStudentAttendance);

// Add this new route for student dashboard data
router.route('/student/:id')
  .get(getStudentAttendanceData);

// Get/update attendance record - must be placed after all specific routes
router.route('/:id')
  .get(getAttendanceById)
  .put(authorize('admin', 'faculty'), updateAttendance)
  .delete(authorize('faculty', 'admin'), deleteAttendance);

module.exports = router;