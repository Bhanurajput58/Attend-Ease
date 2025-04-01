const express = require('express');
const {
  createAttendance,
  getCourseAttendance,
  getStudentAttendance,
  updateAttendance,
  getAttendance,
  deleteAttendance,
  exportAttendance
} = require('../controllers/attendance');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below this point are protected
router.use(protect);

// Get all attendance records with optional filtering by course, date
router.route('/')
  .get(getAttendance)
  .post(authorize('admin', 'faculty'), createAttendance);

// Export route must come before the /:id route
router.route('/export')
  .get(authorize('faculty', 'admin'), exportAttendance);

// Get attendance by course
router.route('/course/:courseId')
  .get(getCourseAttendance);

// Get attendance by student
router.route('/student/:studentId')
  .get(getStudentAttendance);

// Get/update attendance record - must be placed after all specific routes
router.route('/:id')
  .put(authorize('admin', 'faculty'), updateAttendance)
  .delete(authorize('faculty', 'admin'), deleteAttendance);

module.exports = router; 