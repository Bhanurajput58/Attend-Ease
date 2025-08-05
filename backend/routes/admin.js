const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');

// All routes under admin require authentication
router.use(protect);

// All routes under admin require admin role
router.use(authorize('admin'));

// Route for getting all users
router.get('/users', getAllUsers);

module.exports = router; 