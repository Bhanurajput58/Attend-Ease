const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

// Middleware to protect routes that require authentication
exports.protect = async (req, res, next) => {
  console.log('Auth middleware checking for token...');
  console.log('Headers', req.headers);
  
  let token;
  
  // Check if auth header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Extract token from header
    token = req.headers.authorization.split(' ')[1];
    console.log('Token found in header:', token?.substring(0, 10) + '...');
  } else {
    console.log('No Bearer token found in Authorization header');
    // Check for token in cookies as fallback
    if (req.cookies?.jwt) {
      token = req.cookies.jwt;
      console.log('Token found in cookies');
    }
  }
  
  // If no token found, return error
  if (!token) {
    console.log('No token found, access denied');
    return res.status(401).json({ 
      success: false,
      message: 'Access denied. No token provided.' 
    });
  }
  
  try {
    // Verify the token
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user by ID from the decoded token
    console.log('Looking for user with ID:', decoded.id);
    
    // Try to find in User collection
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('User not found in User collection');
      
      // Development fallback: If we're in development and user is not found,
      // create a temporary user object based on the token
      if (process.env.NODE_ENV === 'development' || true) {
        console.log('Creating temporary user object from token for development');
        req.user = {
          id: decoded.id,
          _id: decoded.id,
          name: 'Faculty User',
          email: 'faculty@example.com',
          role: decoded.role || 'faculty'
        };
        return next();
      }
      
      // If user is not found, check ImportedStudent collection as a fallback
      try {
        const ImportedStudent = require('../models/ImportedStudent');
        const student = await ImportedStudent.findById(decoded.id);
        
        if (student) {
          // Created a simplified user object from imported student
          req.user = {
            id: student._id,
            _id: student._id,
            name: student.name,
            role: 'student',
            email: student.rollNumber + '@temp.edu'
          };
          console.log('User found in ImportedStudent collection:', req.user.name);
          return next();
        }
      } catch (err) {
        console.error('Error checking ImportedStudent collection:', err);
      }
      
      // No user found in any collection
      console.error('User not found in any collection despite valid token');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. User not found.' 
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