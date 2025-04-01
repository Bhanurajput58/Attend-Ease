const express = require('express');
const {
  importStudents,
  getStudentsByCourse,
  getStudent
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

// Get student by ID or roll number
router.route('/:identifier')
  .get(getStudent);

module.exports = router; 