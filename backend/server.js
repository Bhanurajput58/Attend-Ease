const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Admin = require('./models/Admin');
const logger = require('./middleware/logger');
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();

connectDB()
  .then(() => {
    console.log('MongoDB Connected:', mongoose.connection.host);
    // Setup demo courses if needed
    (async () => {
      try {
        const Course = require('./models/Course');
        const User = require('./models/User');
        const facultyUser = await User.findOne({ role: 'faculty' });
        if (!facultyUser) return;
        const demoCourses = [
          { id: "65f12abd0f70dab6a2876304", name: "Operating systems", code: "CS2006", semester: "4", department: "CSE" },
          { id: "65f12abd0f70dab6a2876305", name: "Design & Analysis of Algorithms", code: "CS2007", semester: "4", department: "CSE" },
          { id: "65f12abd0f70dab6a2876306", name: "Computer Network", code: "CS2008", semester: "4", department: "CSE" },
          { id: "65f12abd0f70dab6a2876307", name: "IoT and Embedded systems", code: "CS2009", semester: "4", department: "CSE" }
        ];
        for (const course of demoCourses) {
          const existingCourse = await Course.findById(course.id);
          if (!existingCourse) {
            await Course.create({ 
              _id: course.id, 
              courseCode: course.code, 
              courseName: course.name, 
              faculty: facultyUser._id, 
              instructor: facultyUser._id, // Also set instructor field
              assigned: true, // Set assigned to true when instructor is assigned
              semester: course.semester, 
              department: course.department, 
              students: [] 
            });
          }
        }
      } catch {}
    })();
  })
  .catch(err => { console.error('Database connection error:', err.message); process.exit(1); });

app.use(cors({
  origin: ['http://localhost:3000', 'https://your-production-domain.com'],
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(logger);

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString(), database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Auth Register
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration request received:', {
      body: req.body,
      headers: req.headers
    });
    
    const { name, email, password, role, department, semester, designation } = req.body;
    
    // Enhanced validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user exists across all collections
    const userExists = await User.findOne({ email });
    const studentExists = await Student.findOne({ email });
    const facultyExists = await Faculty.findOne({ email });
    const adminExists = await Admin.findOne({ email });
    
    if (userExists || studentExists || facultyExists || adminExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Generate unique username
    let username = email.split('@')[0];
    let counter = 1;
    let originalUsername = username;
    
    // Ensure username is unique
    while (await User.findOne({ username })) {
      username = `${originalUsername}${counter}`;
      counter++;
    }

    console.log(`Creating user with username: ${username}`);

    // Create User document
    const user = new User({ 
      name, 
      email, 
      password, 
      role, 
      username,
      approved: role === 'student' ? true : false // Auto-approve students
    });

    console.log('Saving user to database...');
    await user.save();
    console.log(`User saved successfully with ID: ${user._id}`);
    
    let roleDoc = null;
    
    // Handle Student Registration
    if (role === 'student') {
      const Student = require('./models/Student');
      
      // Generate roll number
      const year = new Date().getFullYear().toString().substr(-2);
      const deptCode = (department || 'CS').substring(0, 2).toUpperCase();
      const highestStudent = await Student.findOne(
        { rollNumber: new RegExp('^' + year + deptCode) }, 
        {}, 
        { sort: { rollNumber: -1 } }
      );
      
      let nextNumber = 1;
      if (highestStudent && highestStudent.rollNumber) {
        const numericPart = parseInt(highestStudent.rollNumber.substring(4));
        nextNumber = numericPart + 1;
      }
      
      const rollNumber = `${year}${deptCode}${nextNumber.toString().padStart(3, '0')}`;
      
      console.log(`Creating student document with roll number: ${rollNumber}`);
      
      // Create Student document with proper defaults
      roleDoc = await Student.create({ 
        user: user._id, 
        name, 
        email, 
        password,
        department: department || 'CSE',
        semester: semester || 4,
        rollNumber,
        attendanceGoal: 90,
        attendance: [], // Initialize empty attendance array
        courses: [] // Initialize empty courses array
      });

      console.log(`Student document created successfully with ID: ${roleDoc._id}`);
      console.log(`New student registered: ${name} (${email}) with roll number: ${rollNumber}`);
    } 
    // Handle Faculty Registration
    else if (role === 'faculty' && department) {
      const Faculty = require('./models/Faculty');
      try {
        roleDoc = await Faculty.create({ 
          user: user._id, 
          name, 
          email, 
          department, 
          designation: designation || 'Assistant Professor',
          approved: false // Faculty needs admin approval
        });
        console.log(`New faculty registered: ${name} (${email}) - pending approval`);
      } catch (facultyError) {
        // Cleanup user if faculty creation fails
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ 
          success: false, 
          message: 'Faculty registration failed: ' + facultyError.message 
        });
      }
    } 
    // Handle Admin Registration
    else if (role === 'admin') {
      const Admin = require('./models/Admin');
      roleDoc = await Admin.create({ 
        user: user._id, 
        name, 
        email, 
        designation: designation || 'Administrator',
        approved: true // Auto-approve admins
      });
      console.log(`New admin registered: ${name} (${email})`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'attend_ease_secret_key_2609', 
      { expiresIn: '24h' }
    );
    
    const userResponse = user.toObject();
    delete userResponse.password;
    userResponse.roleSpecificData = roleDoc;
    
    console.log('Registration completed successfully');
    
    res.status(201).json({ 
      success: true, 
      token, 
      user: userResponse,
      message: `Registration successful! ${role === 'student' ? 'You can now log in.' : 'Please wait for admin approval.'}`
    });
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.', 
      error: error.message 
    });
  }
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role: selectedRole } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials or role' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials or role' });
    if (!selectedRole || user.role !== selectedRole) return res.status(401).json({ success: false, message: 'Invalid credentials or role' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'attend_ease_secret_key_2609', { expiresIn: '24h' });
    const userResponse = user.toObject();
    delete userResponse.password;
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000, sameSite: 'strict' });
    res.json({ success: true, user: userResponse, token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed. Please try again.', error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'attend_ease_secret_key_2609');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get role-specific data
    let roleSpecificData = null;
    if (user.role === 'student') {
      const Student = require('./models/Student');
      roleSpecificData = await Student.findOne({ user: user._id });
    } else if (user.role === 'faculty') {
      const Faculty = require('./models/Faculty');
      roleSpecificData = await Faculty.findOne({ user: user._id });
    } else if (user.role === 'admin') {
      const Admin = require('./models/Admin');
      roleSpecificData = await Admin.findOne({ user: user._id });
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    userResponse.roleSpecificData = roleSpecificData;

    res.json({ 
      success: true, 
      user: userResponse 
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// API routes
console.log('Loading API routes...');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
console.log('Courses route loaded');
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/students', require('./routes/students'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/faculties', require('./routes/faculties'));
app.use('/api/admins', require('./routes/admins'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));
console.log('All API routes loaded');

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Attend-Ease API' });
});

app.get('/api', (req, res) => {
  res.json({ status: 'online', message: 'API is running', timestamp: new Date().toISOString() });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, message: 'Database connected', userCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection error', error: error.message });
  }
});

// Test registration endpoint
app.get('/api/test-registration', async (req, res) => {
  try {
    // Test if all models are working
    const userCount = await User.countDocuments();
    const studentCount = await Student.countDocuments();
    const facultyCount = await Faculty.countDocuments();
    const adminCount = await Admin.countDocuments();
    
    res.json({ 
      success: true, 
      message: 'All models are accessible',
      counts: {
        users: userCount,
        students: studentCount,
        faculty: facultyCount,
        admins: adminCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Model test failed', 
      error: error.message 
    });
  }
});

// Test route to verify server is working
app.get('/api/test-routes', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server routes are working',
    timestamp: new Date().toISOString(),
    routes: ['/api/courses', '/api/courses/:id/applications']
  });
});

// Test attendance route
app.get('/api/test-attendance', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Attendance routes are accessible',
    timestamp: new Date().toISOString(),
    availableRoutes: ['/api/attendance/faculty', '/api/attendance/student']
  });
});

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });