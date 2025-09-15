const express = require('express');
const { 
  getFacultyDashboard, 
  getFacultyCourses, 
  getLowAttendanceStudents, 
  getFacultyById,
  updateFaculty,
  sendLowAttendanceEmails
} = require('../controllers/faculty');
const { protect, authorize } = require('../middleware/auth');
const CourseApplication = require('../models/CourseApplication');

const router = express.Router();

// All routes below are protected and require faculty role
router.use(protect);
router.use(authorize('faculty', 'admin'));

// Add specific logging for dashboard route
router.use('/dashboard', (req, res, next) => {
  console.log('Faculty dashboard route accessed');
  console.log('User:', req.user ? `ID: ${req.user.id}, Role: ${req.user.role}` : 'No user in request');
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Bearer [FILTERED]' : 'Not provided',
    'content-type': req.headers['content-type']
  });
  next();
});

// Dashboard route
router.route('/dashboard')
  .get(getFacultyDashboard);

// Get faculty courses with low attendance statistics
router.route('/courses')
  .get(getFacultyCourses);

// Get students with low attendance for a specific course
router.route('/low-attendance/:courseId')
  .get(getLowAttendanceStudents);

// Send low attendance emails to students
router.post('/send-low-attendance-emails', sendLowAttendanceEmails);

// Get applied courses for the current faculty
router.get('/applied-courses', async (req, res) => {
  try {
    const facultyId = req.user.id;
    const applications = await CourseApplication.find({ faculty: facultyId })
      .populate('course', 'courseName name courseCode code department semester');
    
    const appliedCourseIds = applications.map(app => app.course._id || app.course.id);
    
    res.json({ 
      success: true, 
      data: appliedCourseIds,
      applications: applications 
    });
  } catch (error) {
    console.error('Error fetching applied courses:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router; 