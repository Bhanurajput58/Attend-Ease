const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');

    const adminData = {
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'admin123', // You should change this password after first login
      role: 'admin'
    };

    // First create the auth user
    const authUser = await User.create({
      name: adminData.name,
      email: adminData.email,
      password: adminData.password,
      role: 'admin'
    });
    console.log('Auth user created successfully:', authUser._id);

    // Then create the admin profile with reference to the auth user
    const admin = await Admin.create({
      user: authUser._id,
      permissions: {
        manageUsers: true,
        manageCourses: true,
        manageAttendance: true,
        generateReports: true,
        systemSettings: true
      }
    });
    console.log('Admin profile created successfully:', admin._id);

    console.log('Admin setup completed successfully');
  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    mongoose.disconnect();
  }
}

setupAdmin(); 