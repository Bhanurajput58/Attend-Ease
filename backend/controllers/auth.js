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

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', department, designation } = req.body;
    
    console.log('Registration request received:', { name, email, role });

    // Check if user already exists in any collection
    const userExists = await User.findOne({ email });
    const studentExists = await Student.findOne({ email });
    const facultyExists = await Faculty.findOne({ email });
    const adminExists = await Admin.findOne({ email });
    
    if (userExists || studentExists || facultyExists || adminExists) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with that email' 
      });
    }

    // Create user in the main User collection for authentication
    let authUser;
    try {
      authUser = await User.create({
        name,
        email,
        password,
        role
      });
      console.log('Auth user created successfully:', authUser._id);
    } catch (authUserError) {
      console.error('Error creating auth user:', authUserError);
      // If we failed to create the auth user, clean up the role-specific user
      if (user && user._id) {
        switch (role) {
          case 'student':
            await Student.findByIdAndDelete(user._id);
            break;
          case 'faculty':
            await Faculty.findByIdAndDelete(user._id);
            break;
          case 'admin':
            await Admin.findByIdAndDelete(user._id);
            break;
          default:
            await User.findByIdAndDelete(user._id);
        }
      }
      return res.status(500).json({ 
        success: false,
        message: 'Failed to create user account', 
        error: authUserError.message 
      });
    }

    // If faculty, also create in faculties collection
    let facultyDoc = null;
    if (role === 'faculty') {
      const Faculty = require('../models/Faculty');
      facultyDoc = await Faculty.create({
        user: authUser._id,
        name,
        email,
        department: department || '',
        designation: designation || 'Assistant Professor',
        // other faculty fields can be added here if present in req.body
      });
    }

    // Generate token
    const token = generateToken(authUser._id);
    
    // Extract user info based on role
    let userInfo = {
      id: authUser._id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role
    };
    
    // Add role-specific properties
    if (role === 'student' && user.studentId) {
      userInfo.studentId = user.studentId;
    } else if (role === 'faculty' && user.facultyId) {
      userInfo.facultyId = user.facultyId;
    } else if (role === 'admin' && user.adminId) {
      userInfo.adminId = user.adminId;
    }

    console.log('Registration successful, returning user info:', userInfo);
    res.status(201).json({
      success: true,
      token,
      user: userInfo
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);

    // Validate email & password
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Please provide an email and password' });
    }

    // Check for user in all collections
    let user = null;
    let userModel = null;
    
    // Try to find user in the Student collection
    user = await Student.findOne({ email }).select('+password');
    if (user) {
      console.log('User found in Student collection:', user.email);
      userModel = Student;
    }
    
    // If not found, try Faculty collection
    if (!user) {
      user = await Faculty.findOne({ email }).select('+password');
      if (user) {
        console.log('User found in Faculty collection:', user.email);
        userModel = Faculty;
      }
    }
    
    // If not found, try Admin collection
    if (!user) {
      user = await Admin.findOne({ email }).select('+password');
      if (user) {
        console.log('User found in Admin collection:', user.email);
        userModel = Admin;
      }
    }
    
    // If not found in any role-based collection, try the main User collection
    if (!user) {
      user = await User.findOne({ email }).select('+password');
      if (user) {
        console.log('User found in main User collection:', user.email);
        userModel = User;
      }
    }
    
    // If user not found in any collection
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('Login successful, token generated');
    
    // Update last login for admins
    if (user.role === 'admin' && userModel === Admin) {
      user.lastLogin = Date.now();
      await user.save();
    }
    
    // Extract user info based on role
    let userInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    // Add role-specific properties
    if (user.role === 'student' && user.studentId) {
      userInfo.studentId = user.studentId;
    } else if (user.role === 'faculty' && user.facultyId) {
      userInfo.facultyId = user.facultyId;
    } else if (user.role === 'admin' && user.adminId) {
      userInfo.adminId = user.adminId;
    }

    res.json({
      success: true,
      token,
      user: userInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    console.log('getMe endpoint called with user ID:', req.user.id);
    
    // Check which collection the user belongs to based on their role
    let user = null;
    
    switch (req.user.role) {
      case 'student':
        user = await Student.findById(req.user.id);
        break;
        
      case 'faculty':
        user = await Faculty.findById(req.user.id);
        break;
        
      case 'admin':
        user = await Admin.findById(req.user.id);
        break;
        
      default:
        // Fallback to main User collection
        user = await User.findById(req.user.id);
    }
    
    if (!user) {
      // If not found in role-specific collection, try the main User collection
      user = await User.findById(req.user.id);
      
      if (!user) {
        console.log('User not found in database');
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
    }
    
    console.log('User found, returning data');
    
    // Build the response data based on role
    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
    
    // Add role-specific data
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
        assignedCourses: user.assignedCourses
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
    console.error('Error in getMe endpoint:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Test endpoint to find a user by email (for debugging)
// @route   POST /api/auth/test-find-user
// @access  Public
exports.testFindUser = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }
    
    // Find user without including password
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ 
        success: false, 
        exists: false,
        message: 'User not found with this email' 
      });
    }
    
    // Return user data without sensitive information
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
    console.error('Test find user error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 