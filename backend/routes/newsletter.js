const express = require('express');
const router = express.Router();
const { subscribeNewsletter } = require('../controllers/newsletter');

// Newsletter subscription endpoint
router.post('/subscribe', subscribeNewsletter);

module.exports = router; 