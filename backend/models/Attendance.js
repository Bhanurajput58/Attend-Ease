const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'students.studentModel',
      required: true
    },
    studentModel: {
      type: String,
      enum: ['ImportedStudent', 'User'],
      default: 'ImportedStudent'
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'Present', 'Absent', 'PRESENT', 'ABSENT'],
      required: true
    },
    remarks: {
      type: String,
      default: ''
    }
  }],
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Add index for efficient querying
attendanceSchema.index({ course: 1, date: 1 }, { unique: true });

// Method to check if student exists in a record
attendanceSchema.methods.hasStudent = function(studentId) {
  return this.students.some(record => record.student.toString() === studentId.toString());
};

module.exports = mongoose.model('Attendance', attendanceSchema);