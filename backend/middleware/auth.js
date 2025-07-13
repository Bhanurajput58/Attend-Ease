const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

// Middleware to protect routes that require authentication
exports.protect = async (req, res, next) => {
  console.log('Auth middleware checking for token...');
  
  let token;
  
  // Check for token in cookies first (server-side authentication)
  if (req.cookies?.token) {
    token = req.cookies.token;
    console.log('Token found in cookies');
  } 
  // Then fall back to header authorization if needed (for API clients)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Token found in Authorization header');
  }
  
  // If no token found, return error
  if (!token) {
    console.log('No token found in cookies or Authorization header');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'attend_ease_secret_key_2609');
    console.log('Token decoded successfully:', decoded);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('No user found with token ID');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set user object in the request for use in protected routes
    req.user = user;
    console.log('Authentication successful for user:', user.name);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token. Authentication failed.' 
    });
  }
};

// Middleware to restrict access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ 
        success: false,
        message: 'Authorization error. User not set by protect middleware.' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource.` 
      });
    }
    
    next();
  };
};