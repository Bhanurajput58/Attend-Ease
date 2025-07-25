const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addStudentToCourse,
  getCourseStudents,
  deleteAllStudentsFromCourse,
  getAvailableCourses
} = require('../controllers/courses');
const { protect, authorize } = require('../middleware/auth');
const courseApplicationsRoutes = require('./courseApplications');

const router = express.Router();
router.use(protect);

// Base routes
router.route('/')
  .get(getCourses)
  .post(authorize('admin', 'faculty'), createCourse);

router.use('/:id/applications', courseApplicationsRoutes);

router.route('/:id')
  .get(getCourse)
  .put(authorize('admin', 'faculty'), updateCourse)
  .delete(authorize('admin', 'faculty'), deleteCourse);

// Student enrollment route
router.route('/:id/students')
  .post(authorize('admin', 'faculty'), addStudentToCourse)
  .get(getCourseStudents)
  .delete(authorize('admin', 'faculty'), deleteAllStudentsFromCourse);

// Route to get all available (unassigned) courses
router.get('/available', authorize('faculty', 'admin'), getAvailableCourses);

module.exports = router; 