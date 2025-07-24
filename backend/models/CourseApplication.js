const mongoose = require('mongoose');

const courseApplicationSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  facultyName: String,
  facultyEmail: String,
  facultyDepartment: String,
  courseName: String,
});

courseApplicationSchema.index({ course: 1, faculty: 1 }, { unique: true });

module.exports = mongoose.model('CourseApplication', courseApplicationSchema); 