const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const ImportedStudent = require('../models/ImportedStudent');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function resetDatabase() {
  try {
    console.log('Starting database reset...');

    // Delete all users and related data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      Admin.deleteMany({}),
      Course.deleteMany({}),
      Attendance.deleteMany({}),
      ImportedStudent.deleteMany({})
    ]);

    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    mongoose.disconnect();
  }
}

resetDatabase(); 