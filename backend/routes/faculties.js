const express = require('express');
const { getFacultyById, getFacultyByUserId, updateFaculty } = require('../controllers/faculty');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.get('/by-user/:userId', authorize('faculty', 'admin'), getFacultyByUserId);
router.get('/:id', authorize('faculty', 'admin'), getFacultyById);
// Add PUT route for updating faculty profile
router.put('/:id', authorize('faculty', 'admin'), updateFaculty);

module.exports = router; 