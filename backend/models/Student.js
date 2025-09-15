const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: 'CSE'
  },
  semester: {
    type: Number,
    default: 4
  },
  rollNumber: {
    type: String,
    required: true
  },
  attendance: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      present: {
        type: Number,
        default: 0
      },
      absent: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    }
  ],
  attendanceGoal: {
    type: Number,
    default: 90,
    min: 0,
    max: 100
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hashing');
    next();
    return;
  }
  console.log('Hashing password for student:', this.email);
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Match password
studentSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('Comparing passwords for student');
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Create a compound index for rollNumber to ensure uniqueness but allow for nulls
studentSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Student', studentSchema);