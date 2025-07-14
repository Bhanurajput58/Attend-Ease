const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
require('dotenv').config();
const User = require('./models/User');
const logger = require('./middleware/logger');
const cookieParser = require('cookie-parser');

// Load env vars
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB()
  .then(() => {
    console.log('MongoDB Connected:', mongoose.connection.host);
    
    // Create demo courses if they don't exist
    const setupDemoCourses = async () => {
      try {
        const Course = require('./models/Course');
        const User = require('./models/User');
        
        // Find a faculty user
        const facultyUser = await User.findOne({ role: 'faculty' });
        
        if (!facultyUser) {
          console.log('No faculty user found to set up demo courses');
          return;
        }
        
        // Demo course data
        const demoCourses = [
          { id: "65f12abd0f70dab6a2876304", name: "Operating systems", code: "CS2006", semester: "4", department: "CSE" },
          { id: "65f12abd0f70dab6a2876305", name: "Design & Analysis of Algorithms", code: "CS2007", semester: "4", department: "CSE" },
          { id: "65f12abd0f70dab6a2876306", name: "Computer Network", code: "CS2008", semester: "4", department: "CSE" },
          { id: "65f12abd0f70dab6a2876307", name: "IoT and Embedded systems", code: "CS2009", semester: "4", department: "CSE" }
        ];
        
        // Create each demo course if it doesn't exist
        for (const course of demoCourses) {
          try {
            const existingCourse = await Course.findById(course.id);
            
            if (!existingCourse) {
              await Course.create({
                _id: course.id,
                courseCode: course.code,
                courseName: course.name,
                faculty: facultyUser._id,
                semester: course.semester,
                department: course.department,
                students: []
              });
              console.log(`Created demo course: ${course.name}`);
            }
          } catch (err) {
            console.error(`Error creating demo course ${course.name}:`, err.message);
          }
        }
        
        console.log('Demo course setup completed');
      } catch (err) {
        console.error('Error setting up demo courses:', err);
      }
    };
    
    // Call the setup function
    setupDemoCourses();
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-production-domain.com'],
  credentials: true, // Allow cookies to be sent across domains
  exposedHeaders: ['Content-Disposition'], // Important for file downloads
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware
app.use(morgan('dev'));
app.use(logger);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

// API Status endpoint - Place this before other routes
app.get('/api/status', (req, res) => {
    console.log('Status endpoint hit');
    res.json({ 
        status: 'online',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Simple ping endpoint for testing
app.get('/api/ping', (req, res) => {
    console.log('Ping endpoint hit');
    res.json({ 
        message: 'pong',
        timestamp: new Date().toISOString()
    });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { name, email, password, role, department, semester, designation } = req.body;

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

    // Create new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role,
      username
    });

    await user.save();
    console.log('User saved:', user);

    // Create role-specific user in appropriate collection
    if (role === 'student' && department && semester) {
      // We'd normally create a Student record here
      console.log('Creating student record with department:', department, 'semester:', semester);
      
      // In a real implementation, you would create a document in the Students collection
      // const Student = require('./models/Student');
      // await Student.create({
      //   user: user._id,
      //   department,
      //   semester,
      //   rollNumber: generateStudentId(department)
      // });
    } 
    else if (role === 'faculty' && department) {
      // We'd normally create a Faculty record here
      console.log('Creating faculty record with department:', department, 'designation:', designation || 'Assistant Professor');
      
      // In a real implementation, you would create a document in the Faculty collection
      // const Faculty = require('./models/Faculty');  
      // await Faculty.create({
      //   user: user._id,
      //   department,
      //   designation: designation || 'Assistant Professor',
      //   employeeId: generateFacultyId(department)
      // });
    }
    else if (role === 'admin') {
      // We'd normally create an Admin record here
      console.log('Creating admin record');
      
      // In a real implementation, you would create a document in the Admin collection
      // const Admin = require('./models/Admin');
      // await Admin.create({
      //   user: user._id,
      //   adminId: generateAdminId()
      // });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'attend_ease_secret_key_2609',
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Add role-specific data to the response
    userResponse.roleSpecificData = {
      department,
      semester,
      designation
    };

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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role: selectedRole } = req.body;

    console.log('Login attempt for email:', email, 'with role:', selectedRole);

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or role'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or role'
      });
    }

    // Check if selected role matches user's actual role
    if (!selectedRole || user.role !== selectedRole) {
      console.log(`Role mismatch: user role is ${user.role}, selected role is ${selectedRole}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or role'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'attend_ease_secret_key_2609',
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('Login successful for user:', email);

    // Set JWT as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    });

    res.json({
      success: true,
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

// Get user profile
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'attend_ease_secret_key_2609');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Logout endpoint to clear the cookie
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/students', require('./routes/students'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/admin', require('./routes/admin'));

// API Routes with both with and without /api prefix for backwards compatibility
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const studentsRoutes = require('./routes/students');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');

// Mount routes both with and without /api prefix
['/api', ''].forEach(prefix => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/attendance`, attendanceRoutes);
  app.use(`${prefix}/students`, studentsRoutes);
  app.use(`${prefix}/faculty`, facultyRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Attend-Ease API' });
});

// API health check endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({
      success: true,
      message: 'Database connected',
      userCount: count
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});