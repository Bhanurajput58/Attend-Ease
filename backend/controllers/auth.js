const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', department, designation } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    const studentExists = await Student.findOne({ email });
    const facultyExists = await Faculty.findOne({ email });
    const adminExists = await Admin.findOne({ email });
    if (userExists || studentExists || facultyExists || adminExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with that email' 
      });
    }

    // Create user
    let authUser;
    try {
      authUser = await User.create({
        name,
        email,
        password,
        role
      });
    } catch (authUserError) {
      // Cleanup on fail
      if (user && user._id) {
        switch (role) {
          case 'student': await Student.findByIdAndDelete(user._id); break;
          case 'faculty': await Faculty.findByIdAndDelete(user._id); break;
          case 'admin': await Admin.findByIdAndDelete(user._id); break;
          default: await User.findByIdAndDelete(user._id);
        }
      }
      return res.status(500).json({ 
        success: false,
        message: 'Failed to create user account', 
        error: authUserError.message 
      });
    }

    // Create faculty doc
    let facultyDoc = null;
    if (role === 'faculty') {
      const Faculty = require('../models/Faculty');
      facultyDoc = await Faculty.create({
        user: authUser._id,
        name,
        email,
        department: department || '',
        designation: designation || 'Assistant Professor',
      });
    }

    // Generate token
    const token = generateToken(authUser._id);
    let userInfo = {
      id: authUser._id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role
    };
    if (role === 'student' && user.studentId) userInfo.studentId = user.studentId;
    else if (role === 'faculty' && user.facultyId) userInfo.facultyId = user.facultyId;
    else if (role === 'admin' && user.adminId) userInfo.adminId = user.adminId;

    res.status(201).json({
      success: true,
      token,
      user: userInfo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, role: selectedRole } = req.body;
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide an email and password' 
      });
    }
    
    let user = null;
    let userModel = null;
    
    // If role is specified, search in that specific model first
    if (selectedRole) {
      switch (selectedRole) {
        case 'student':
          user = await Student.findOne({ email }).select('+password');
          if (user) userModel = Student;
          break;
        case 'faculty':
          user = await Faculty.findOne({ email }).select('+password');
          if (user) userModel = Faculty;
          break;
        case 'admin':
          user = await Admin.findOne({ email }).select('+password');
          if (user) userModel = Admin;
          break;
      }
    }
    
    // If not found in specific model or no role specified, search in all models
    if (!user) {
      user = await Student.findOne({ email }).select('+password');
      if (user) userModel = Student;
    }
    if (!user) {
      user = await Faculty.findOne({ email }).select('+password');
      if (user) userModel = Faculty;
    }
    if (!user) {
      user = await Admin.findOne({ email }).select('+password');
      if (user) userModel = Admin;
    }
    if (!user) {
      user = await User.findOne({ email }).select('+password');
      if (user) userModel = User;
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // If role was specified, verify it matches
    if (selectedRole && user.role !== selectedRole) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid role for this user' 
      });
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    const token = generateToken(user._id);
    
    if (user.role === 'admin' && userModel === Admin) {
      user.lastLogin = Date.now();
      await user.save();
    }
    
    let userInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    if (user.role === 'student' && user.studentId) userInfo.studentId = user.studentId;
    else if (user.role === 'faculty' && user.facultyId) userInfo.facultyId = user.facultyId;
    else if (user.role === 'admin' && user.adminId) userInfo.adminId = user.adminId;
    
    res.json({
      success: true,
      token,
      user: userInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get current user info
exports.getMe = async (req, res) => {
  try {
    let user = null;
    switch (req.user.role) {
      case 'student': user = await Student.findById(req.user.id); break;
      case 'faculty': user = await Faculty.findOne({ user: req.user.id }); break;
      case 'admin': user = await Admin.findById(req.user.id); break;
      default: user = await User.findById(req.user.id);
    }
    if (!user) {
      user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
    }
    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
    if (user.role === 'student') {
      userData = {
        ...userData,
        studentId: user.studentId,
        batch: user.batch,
        department: user.department,
        enrolledCourses: user.enrolledCourses
      };
    } else if (user.role === 'faculty') {
      userData = {
        ...userData,
        facultyId: user.facultyId,
        department: user.department,
        designation: user.designation,
        assignedCourses: user.assignedCourses,
        approved: user.approved
      };
    } else if (user.role === 'admin') {
      userData = {
        ...userData,
        adminId: user.adminId,
        permissions: user.permissions,
        isSuper: user.isSuper,
        lastLogin: user.lastLogin
      };
    }
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Test endpoint: find user by email
exports.testFindUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ 
        success: false, 
        exists: false,
        message: 'User not found with this email' 
      });
    }
    res.json({
      success: true,
      exists: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 