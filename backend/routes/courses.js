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

// Student course access route - allows students to get basic course info for enrolled courses
router.get('/:id/student-info', authorize('student'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;
    
    // Find the student to check if they're enrolled
    const Student = require('../models/Student');
    const student = await Student.findOne({ user: studentId });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Check if student is enrolled in this course
    if (!student.courses || !student.courses.includes(courseId)) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }
    
    // Get course information
    const Course = require('../models/Course');
    const course = await Course.findById(courseId).select('courseName courseCode');
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    res.json({
      success: true,
      data: {
        courseName: course.courseName,
        courseCode: course.courseCode
      }
    });
  } catch (error) {
    console.error('Error in student course info route:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Individual course routes - MUST come after specific routes
router.route('/:id')
  .get(authorize('admin', 'faculty'), getCourse)
  .put(authorize('admin', 'faculty'), updateCourse)
  .delete(authorize('admin', 'faculty'), deleteCourse);

module.exports = router; 