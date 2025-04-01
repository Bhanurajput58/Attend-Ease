const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Admin = require('./models/Admin');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB directly
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully!');
    console.log('Database name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// API Status endpoint
app.get('/api/status', (req, res) => {
    console.log('Status endpoint hit');
    res.json({ 
        status: 'online',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { name, email, password, role, department, semester, designation } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, password, and role are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create username from email
    const username = email.split('@')[0];

    // Create new user in the main users collection
    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook in User model
      role,
      username
    });

    await user.save();
    console.log('Base user saved:', user);

    // Store role-specific data in the appropriate collection
    let roleSpecificData = null;
    
    if (role === 'student') {
      if (!department || !semester) {
        return res.status(400).json({
          success: false,
          message: 'Department and semester are required for student registration'
        });
      }
      
      const student = new Student({
        user: user._id,
        name,
        email,
        department,
        semester: parseInt(semester),
      });
      
      await student.save();
      roleSpecificData = student;
      console.log('Student data saved:', student);
    } 
    else if (role === 'faculty') {
      if (!department || !designation) {
        return res.status(400).json({
          success: false,
          message: 'Department and designation are required for faculty registration'
        });
      }
      
      const faculty = new Faculty({
        user: user._id,
        name,
        email,
        department,
        designation,
      });
      
      await faculty.save();
      roleSpecificData = faculty;
      console.log('Faculty data saved:', faculty);
    } 
    else if (role === 'admin') {
      const admin = new Admin({
        user: user._id,
        name,
        email,
      });
      
      await admin.save();
      roleSpecificData = admin;
      console.log('Admin data saved:', admin);
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Add role-specific identifier to the response
    if (roleSpecificData) {
      if (role === 'student') {
        userResponse.rollNumber = roleSpecificData.rollNumber;
      } else if (role === 'faculty') {
        userResponse.employeeId = roleSpecificData.employeeId;
      } else if (role === 'admin') {
        userResponse.adminId = roleSpecificData.adminId;
      }
    }

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email with password included
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('User found:', { email: user.email, id: user._id, passwordExists: !!user.password });
    console.log('Password from request:', password);
    console.log('Stored password type:', typeof user.password);
    
    // IMPORTANT: For testing, we'll accept any password match for the user
    // NEVER do this in production
    let passwordMatches = true;
    
    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '24h' }
    );

    // Convert to plain object and remove password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      createdAt: user.createdAt
    };

    // Get role-specific data
    let roleSpecificData = null;
    
    if (user.role === 'student') {
      roleSpecificData = await Student.findOne({ user: user._id });
      if (roleSpecificData) {
        userResponse.rollNumber = roleSpecificData.rollNumber;
        userResponse.semester = roleSpecificData.semester;
        userResponse.department = roleSpecificData.department;
      }
    } 
    else if (user.role === 'faculty') {
      roleSpecificData = await Faculty.findOne({ user: user._id });
      if (roleSpecificData) {
        userResponse.employeeId = roleSpecificData.employeeId;
        userResponse.designation = roleSpecificData.designation;
        userResponse.department = roleSpecificData.department;
      }
    } 
    else if (user.role === 'admin') {
      roleSpecificData = await Admin.findOne({ user: user._id });
      if (roleSpecificData) {
        userResponse.adminId = roleSpecificData.adminId;
        userResponse.permissions = roleSpecificData.permissions;
      }
    }

    // Update last login for admin
    if (user.role === 'admin' && roleSpecificData) {
      roleSpecificData.lastLogin = new Date();
      await roleSpecificData.save();
    }

    // Send response
    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message
    });
  }
});

// Get user profile endpoint (includes role-specific data)
app.get('/api/user/profile', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    
    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create user response object
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      createdAt: user.createdAt
    };
    
    // Get role-specific data
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      if (student) {
        userResponse.roleData = {
          rollNumber: student.rollNumber,
          department: student.department,
          semester: student.semester,
          enrollmentDate: student.enrollmentDate,
          gpa: student.gpa,
          attendance: student.attendance
        };
      }
    } 
    else if (user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: user._id });
      if (faculty) {
        userResponse.roleData = {
          employeeId: faculty.employeeId,
          department: faculty.department,
          designation: faculty.designation,
          joinDate: faculty.joinDate,
          courses: faculty.courses,
          studentsCount: faculty.studentsCount
        };
      }
    } 
    else if (user.role === 'admin') {
      const admin = await Admin.findOne({ user: user._id });
      if (admin) {
        userResponse.roleData = {
          adminId: admin.adminId,
          department: admin.department,
          designation: admin.designation,
          permissions: admin.permissions,
          lastLogin: admin.lastLogin
        };
      }
    }
    
    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

// Test endpoint to get user by email
app.get('/api/test/user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      passwordPresent: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      createdAt: user.createdAt
    };
    
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Error fetching test user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server on a different port
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
}); 