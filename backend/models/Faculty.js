const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const facultySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true, enum: ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD'] },
  employeeId: { type: String, unique: true },
  joinDate: { type: Date, default: Date.now },
  specialization: { type: String },
  qualifications: [String],
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  studentsCount: { type: Number, default: 0 },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Hash password if modified
facultySchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Compare password
facultySchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch {
    return false;
  }
};

module.exports = mongoose.model('Faculty', facultySchema); 