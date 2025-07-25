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
const courseApplicationsRoutes = require('./routes/courseApplications');

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
            await Course.create({ _id: course.id, courseCode: course.code, courseName: course.name, faculty: facultyUser._id, semester: course.semester, department: course.department, students: [] });
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
    const { name, email, password, role, department, semester, designation } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });
    const username = email.split('@')[0];
    const user = new User({ name, email, password, role, username });
    await user.save();
    let roleDoc = null;
    if (role === 'student' && department && semester) {
      const Student = require('./models/Student');
      const year = new Date().getFullYear().toString().substr(-2);
      const deptCode = department.substring(0, 2).toUpperCase();
      const highestStudent = await Student.findOne({ rollNumber: new RegExp('^' + year + deptCode) }, {}, { sort: { rollNumber: -1 } });
      let nextNumber = 1;
      if (highestStudent && highestStudent.rollNumber) {
        const numericPart = parseInt(highestStudent.rollNumber.substring(4));
        nextNumber = numericPart + 1;
      }
      const rollNumber = `${year}${deptCode}${nextNumber.toString().padStart(3, '0')}`;
      roleDoc = await Student.create({ user: user._id, name, email, password, department, semester, rollNumber });
    } else if (role === 'faculty' && department) {
      const Faculty = require('./models/Faculty');
      try {
        roleDoc = await Faculty.create({ user: user._id, name, email, department, designation: designation || 'Assistant Professor', employeeId: 'EMP' + Date.now() });
      } catch (facultyError) {
        return res.status(400).json({ success: false, message: 'Faculty registration failed: ' + facultyError.message });
      }
    } else if (role === 'admin') {
      const Admin = require('./models/Admin');
      roleDoc = await Admin.create({ user: user._id, name, email, designation: designation || 'Administrator' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'attend_ease_secret_key_2609', { expiresIn: '24h' });
    const userResponse = user.toObject();
    delete userResponse.password;
    userResponse.roleSpecificData = roleDoc;
    res.status(201).json({ success: true, token, user: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.', error: error.message });
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

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/students', require('./routes/students'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/faculties', require('./routes/faculties'));
app.use('/api/admins', require('./routes/admins'));

// Also mount routes without /api prefix
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const studentsRoutes = require('./routes/students');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');
const facultiesRoutes = require('./routes/faculties');
const adminsRoutes = require('./routes/admins');
['/api', ''].forEach(prefix => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/attendance`, attendanceRoutes);
  app.use(`${prefix}/students`, studentsRoutes);
  app.use(`${prefix}/faculty`, facultyRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/faculties`, facultiesRoutes);
  app.use(`${prefix}/admins`, adminsRoutes);
});

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

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });