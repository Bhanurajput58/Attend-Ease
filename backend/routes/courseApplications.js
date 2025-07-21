const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const CourseApplication = require('../models/CourseApplication');
const Course = require('../models/Course');

// Faculty applies for a course
// POST /api/courses/:id/apply
router.post('/courses/:id/apply', protect, authorize('faculty'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const facultyId = req.user.id;
    // Prevent duplicate applications
    const existing = await CourseApplication.findOne({ course: courseId, faculty: facultyId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already applied for this course.' });
    }
    // Optionally, check if course exists and faculty is valid
    const application = await CourseApplication.create({
      course: courseId,
      faculty: facultyId
    });
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Admin views applications for a course
// GET /api/courses/:id/applications
router.get('/courses/:id/applications', protect, authorize('admin'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const applications = await CourseApplication.find({ course: courseId, status: 'pending' })
      .populate('faculty', 'name email department designation');
    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Admin assigns course to a faculty (and approves application)
// POST /api/courses/:id/assign
router.post('/courses/:id/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { facultyId } = req.body;
    // Check if application exists and is pending
    const application = await CourseApplication.findOne({ course: courseId, faculty: facultyId, status: 'pending' });
    if (!application) {
      return res.status(400).json({ success: false, message: 'No pending application from this faculty.' });
    }
    // Assign the course
    const course = await Course.findByIdAndUpdate(courseId, { instructor: facultyId }, { new: true });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    // Approve the application
    application.status = 'approved';
    await application.save();
    // Optionally, reject all other pending applications for this course
    await CourseApplication.updateMany(
      { course: courseId, status: 'pending', _id: { $ne: application._id } },
      { $set: { status: 'rejected' } }
    );
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router; 