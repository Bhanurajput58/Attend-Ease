const express = require('express');
const {
  importStudents,
  getStudentsByCourse,
  getStudent,
  getStudentTimetable,
  getStudentByUserId
} = require('../controllers/studentsImport');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below are protected
router.use(protect);

// Import students route
router.route('/import')
  .post(authorize('faculty', 'admin'), importStudents);

// Get students by course
router.route('/course/:courseId')
  .get(authorize('faculty', 'admin'), getStudentsByCourse);

// Get student's timetable - must come before generic :identifier route
router.route('/:studentId/timetable')
  .get(getStudentTimetable);

// Add update student profile endpoint
router.route('/:id')
  .put(authorize('student', 'admin'), require('../controllers/studentsImport').updateStudent);

// Get student by ID or roll number - must be last as it has a generic parameter
router.route('/:identifier')
  .get(getStudent);

router.get('/by-user/:userId', getStudentByUserId);

module.exports = router;