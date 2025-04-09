const express = require('express');
const { 
  getFacultyDashboard,
  getLowAttendanceStudents
} = require('../controllers/faculty');
const { protect, authorize } = require('../middleware/auth');

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

// Get students with low attendance for a specific course
router.route('/low-attendance/:courseId')
  .get(getLowAttendanceStudents);

module.exports = router; 