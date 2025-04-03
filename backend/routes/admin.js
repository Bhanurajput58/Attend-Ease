const express = require('express');
const router = express.Router();
const { convertStudentsToUsers, getAllUsers } = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');

// All routes under admin require authentication
router.use(protect);

// All routes under admin require admin role
router.use(authorize('admin'));

// Route for getting all users
router.get('/users', getAllUsers);

// Route for converting imported students to user accounts
router.post('/convert-students-to-users', convertStudentsToUsers);

module.exports = router; 