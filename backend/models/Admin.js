const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
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
  adminId: {
    type: String,
    unique: true
  },
  department: {
    type: String,
    default: 'Administration'
  },
  designation: {
    type: String,
    default: 'Administrator'
  },
  permissions: {
    manageUsers: {
      type: Boolean,
      default: true
    },
    manageFaculty: {
      type: Boolean,
      default: true
    },
    manageStudents: {
      type: Boolean,
      default: true
    },
    manageCourses: {
      type: Boolean,
      default: true
    },
    viewReports: {
      type: Boolean,
      default: true
    },
    manageSettings: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate a unique admin ID before saving
adminSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear().toString().substr(-2);
    
    // Find highest existing admin ID
    const highestAdmin = await this.constructor.findOne(
      { adminId: new RegExp('^A' + year) }, 
      {}, 
      { sort: { adminId: -1 } }
    );
    
    let nextNumber = 1;
    if (highestAdmin && highestAdmin.adminId) {
      // Extract the numeric part and increment
      const numericPart = parseInt(highestAdmin.adminId.substring(3));
      nextNumber = numericPart + 1;
    }
    
    // Create admin ID in format AYYNNN (A=admin, YY=year, NNN=sequential number)
    this.adminId = `A${year}${nextNumber.toString().padStart(3, '0')}`;
  }
  next();
});

// Encrypt password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hashing');
    next();
    return;
  }
  console.log('Hashing password for admin:', this.email);
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    
    // Generate an admin ID if not provided
    if (!this.adminId) {
      const prefix = 'ADM';
      const randomId = Math.floor(100 + Math.random() * 900);
      this.adminId = `${prefix}${randomId}`;
    }
    
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Match password
adminSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('Comparing passwords for admin');
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

module.exports = mongoose.model('Admin', adminSchema); 