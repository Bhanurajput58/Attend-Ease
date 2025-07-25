const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const CourseApplication = require('../models/CourseApplication');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const mongoose = require('mongoose');

// Faculty applies for a course
router.post('/apply', protect, authorize('faculty'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const facultyId = req.user.id;
    const existing = await CourseApplication.findOne({ course: courseId, faculty: facultyId });
    if (existing) return res.status(400).json({ success: false, message: 'Already applied for this course.' });
    const facultyUser = await require('../models/User').findById(facultyId);
    const facultyDoc = await Faculty.findOne({ user: facultyId });
    const courseObj = await Course.findById(courseId);
    const application = await CourseApplication.create({
      course: courseId,
      faculty: facultyId,
      facultyName: facultyUser?.name || '',
      facultyEmail: facultyUser?.email || '',
      facultyDepartment: facultyDoc?.department || facultyUser?.department || facultyUser?.roleData?.department || '',
      courseName: courseObj?.courseName || courseObj?.name || ''
    });
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Admin views applications for a course
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const applications = await CourseApplication.find({ course: courseId, status: 'pending' })
      .populate('faculty', 'name email department designation');
    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Admin assigns course to a faculty (and approves application)
router.post('/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { facultyId } = req.body;
    const application = await CourseApplication.findOne({ course: courseId, faculty: facultyId, status: 'pending' });
    if (!application) return res.status(400).json({ success: false, message: 'No pending application from this faculty.' });
    const course = await Course.findByIdAndUpdate(courseId, { instructor: facultyId, assigned: true }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    application.status = 'approved';
    await application.save();
    await CourseApplication.updateMany(
      { course: courseId, status: 'pending', _id: { $ne: application._id } },
      { $set: { status: 'rejected' } }
    );
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Admin unassigns a course from a faculty
router.post('/unassign', protect, authorize('admin'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findByIdAndUpdate(courseId, { instructor: null, assigned: false }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    await CourseApplication.updateMany(
      { course: courseId, status: 'pending' },
      { $set: { status: 'rejected' } }
    );
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router; 