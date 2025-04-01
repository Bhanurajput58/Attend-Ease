const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addStudentToCourse,
  getCourseStudents,
  deleteAllStudentsFromCourse
} = require('../controllers/courses');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below this point are protected and require authentication
router.use(protect);

// Base routes
router.route('/')
  .get(getCourses)
  .post(authorize('admin', 'faculty'), createCourse);

router.route('/:id')
  .get(getCourse)
  .put(authorize('admin', 'faculty'), updateCourse)
  .delete(authorize('admin', 'faculty'), deleteCourse);

// Student enrollment route
router.route('/:id/students')
  .post(authorize('admin', 'faculty'), addStudentToCourse)
  .get(getCourseStudents)
  .delete(authorize('admin', 'faculty'), deleteAllStudentsFromCourse);

module.exports = router; 