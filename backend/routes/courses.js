const express = require('express');
const {
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addStudentToCourse,
  getCourseStudents,
  deleteAllStudentsFromCourse,
  getAvailableCourses,
  getAllCourses
} = require('../controllers/courses');
const { protect, authorize } = require('../middleware/auth');
const courseApplicationsRoutes = require('./courseApplications');

const router = express.Router();
router.use(protect);

// Base routes - use getAllCourses for better data formatting
router.route('/')
  .get(authorize('admin', 'faculty'), getAllCourses)
  .post(authorize('admin', 'faculty'), createCourse);

// Route to get all available (unassigned) courses - MUST come before /:id routes
router.get('/available', authorize('faculty', 'admin'), getAvailableCourses);

// Course applications routes
router.use('/:id/applications', courseApplicationsRoutes);

// Student enrollment route
router.route('/:id/students')
  .post(authorize('admin', 'faculty'), addStudentToCourse)
  .get(authorize('admin', 'faculty'), getCourseStudents)
  .delete(authorize('admin', 'faculty'), deleteAllStudentsFromCourse);

// Individual course routes - MUST come after specific routes
router.route('/:id')
  .get(authorize('admin', 'faculty'), getCourse)
  .put(authorize('admin', 'faculty'), updateCourse)
  .delete(authorize('admin', 'faculty'), deleteCourse);

module.exports = router; 