const express = require('express');
const {
  createAttendance,
  getCourseAttendance,
  getStudentAttendance,
  updateAttendance,
  getAttendance,
  deleteAttendance,
  getAttendanceById,
  getFacultyAttendance,
  getStudentAttendanceDashboard,
  getCourseAttendanceDashboard,
  exportAttendanceReport
} = require('../controllers/attendance');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below this point are protected
router.use(protect);

// Get all attendance records with optional filtering by course, date
router.route('/')
  .get(getAttendance)
  .post(authorize('admin', 'faculty'), createAttendance);

// Dashboard routes
router.get('/faculty', authorize('faculty', 'admin'), getFacultyAttendance);
router.get('/student', authorize('student'), getStudentAttendanceDashboard);

// Export attendance reports
router.get('/export', authorize('faculty', 'admin'), exportAttendanceReport);

// Get attendance by course
router.route('/course/:courseId')
  .get(getCourseAttendanceDashboard);

// Get attendance by student ID (for specific student lookup)
router.route('/student/:studentId')
  .get(getStudentAttendance);

// Get/update attendance record - must be placed after all specific routes
router.route('/:id')
  .get(getAttendanceById)
  .put(authorize('admin', 'faculty'), updateAttendance)
  .delete(authorize('faculty', 'admin'), deleteAttendance);

module.exports = router;