const express = require('express');
const { getFacultyById } = require('../controllers/faculty');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.get('/:id', authorize('faculty', 'admin'), getFacultyById);

module.exports = router; 