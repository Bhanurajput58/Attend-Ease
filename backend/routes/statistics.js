const express = require('express');
const router = express.Router();
const { getHomepageStats } = require('../controllers/statistics');

// Get homepage statistics (public endpoint)
router.get('/homepage', getHomepageStats);

module.exports = router; 