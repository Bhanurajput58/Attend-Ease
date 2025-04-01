const express = require('express');
const { register, login, getMe, testFindUser } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register and login routes
router.post('/register', register);
router.post('/login', login);
router.post('/test-find-user', testFindUser);
router.get('/me', protect, getMe);

module.exports = router; 