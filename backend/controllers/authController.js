const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate unique IDs for different roles
const generateUniqueId = async (role, department) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const deptCode = department ? department.slice(0, 3).toUpperCase() : 'ADM';
  
  let prefix = '';
  let Model;
  let idField = '';
  
  switch(role) {
    case 'student':
      prefix = `S${year}${deptCode}`;
      Model = Student;
      idField = 'rollNumber';
      break;
    case 'faculty':
      prefix = `F${year}${deptCode}`;
      Model = Faculty;
      idField = 'employeeId';
      break;
    case 'admin':
      prefix = `A${year}`;
      Model = Admin;
      idField = 'adminId';
      break;
  }

  // Find the latest ID with the same prefix
  const latestDoc = await Model.findOne({
    [idField]: new RegExp(`^${prefix}`)
  }).sort({ [idField]: -1 });

  let number = 1;
  if (latestDoc) {
    const lastNumber = parseInt(latestDoc[idField].slice(-3));
    number = lastNumber + 1;
  }

  return `${prefix}${number.toString().padStart(3, '0')}`;
};

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, semester } = req.body;

    // Create base user
    const user = await User.create({
      name,
      email,
      password,
      role,
      username: email.split('@')[0]
    });

    // Generate role-specific ID
    const uniqueId = await generateUniqueId(role, department);

    // Create role-specific entry
    let roleSpecificUser;
    switch (role) {
      case 'student':
        roleSpecificUser = await Student.create({
          user: user._id,
          rollNumber: uniqueId,
          department,
          semester
        });
        break;

      case 'faculty':
        roleSpecificUser = await Faculty.create({
          user: user._id,
          employeeId: uniqueId,
          department,
          designation: req.body.designation || 'Assistant Professor'
        });
        break;

      case 'admin':
        roleSpecificUser = await Admin.create({
          user: user._id,
          adminId: uniqueId,
          permissions: {
            manageUsers: true,
            manageCourses: true,
            manageAttendance: true,
            generateReports: true
          }
        });
        break;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        ...user._doc,
        roleSpecificData: roleSpecificUser
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get role-specific data
    let roleSpecificData;
    switch (user.role) {
      case 'student':
        roleSpecificData = await Student.findOne({ user: user._id })
          .populate('enrolledCourses');
        break;
      case 'faculty':
        roleSpecificData = await Faculty.findOne({ user: user._id })
          .populate('assignedCourses');
        break;
      case 'admin':
        roleSpecificData = await Admin.findOne({ user: user._id });
        // Update last login
        if (roleSpecificData) {
          roleSpecificData.lastLogin = Date.now();
          await roleSpecificData.save();
        }
        break;
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      token,
      user: {
        ...userResponse,
        roleSpecificData
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message
    });
  }
}; 