const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const facultySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    required: true
  },
  designation: {
    type: String,
    required: true,
    enum: ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD']
  },
  employeeId: {
    type: String,
    unique: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  specialization: {
    type: String
  },
  qualifications: [String],
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  // Number of students in all assigned courses
  studentsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
facultySchema.pre('save', async function(next) {
  // Always generate employeeId for new faculty
  if (this.isNew) {
    const year = new Date().getFullYear().toString().substr(-2);
    const deptCode = this.department ? this.department.substring(0, 2).toUpperCase() : 'XX';
    // Find highest existing employee ID
    const highestFaculty = await this.constructor.findOne(
      { employeeId: new RegExp('^F' + year + deptCode) },
      {},
      { sort: { employeeId: -1 } }
    );
    let nextNumber = 1;
    if (highestFaculty && highestFaculty.employeeId) {
      const numericPart = parseInt(highestFaculty.employeeId.substring(5));
      nextNumber = numericPart + 1;
    }
    // Create employee ID in format FYYDCNNN (F=faculty, YY=year, DC=dept code, NNN=sequential number)
    this.employeeId = `F${year}${deptCode}${nextNumber.toString().padStart(3, '0')}`;
  }

  // Only hash password if it is being set/modified
  if (this.isModified('password')) {
    console.log('Hashing password for faculty:', this.email);
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      console.log('Password hashed successfully');
    } catch (error) {
      console.error('Error hashing password:', error);
      return next(error);
    }
  } else {
    console.log('Password not modified, skipping hashing');
  }
  next();
});

// Match password
facultySchema.methods.matchPassword = async function(enteredPassword) {
  console.log('Comparing passwords for faculty');
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

module.exports = mongoose.model('Faculty', facultySchema); 