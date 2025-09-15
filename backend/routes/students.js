const express = require('express');
const {
  importStudents,
  getStudentsByCourse,
  getStudent,
  getStudentTimetable,
  getStudentByUserId,
  getAllStudents,
  getAttendanceGoal,
  updateAttendanceGoal,
  exportAttendanceReport
} = require('../controllers/studentsImport');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below are protected
router.use(protect);

// Get all students (for notifications)
router.route('/')
  .get(authorize('admin', 'faculty'), getAllStudents);

// Import students route
router.route('/import')
  .post(authorize('faculty', 'admin'), importStudents);

// Get students by course
router.route('/course/:courseId')
  .get(authorize('faculty', 'admin'), getStudentsByCourse);

// Get student by user ID - must come before generic :identifier route
router.get('/by-user/:userId', getStudentByUserId);

// Get student's timetable - must come before generic :identifier route
router.route('/:studentId/timetable')
  .get(getStudentTimetable);

// Export student attendance report - must come before generic :identifier route
router.route('/:studentId/export-attendance-report')
  .get(authorize('student', 'faculty', 'admin'), exportAttendanceReport);

// Attendance goal routes - must come before generic :identifier route
router.route('/:studentId/attendance-goal')
  .get(getAttendanceGoal)
  .put(updateAttendanceGoal);

// Add update student profile endpoint - must come before generic :identifier route
router.route('/:id')
  .put(authorize('student', 'admin'), require('../controllers/studentsImport').updateStudent);

// Get student by ID or roll number - must be last as it has a generic parameter
router.route('/:identifier')
  .get(getStudent);

module.exports = router;