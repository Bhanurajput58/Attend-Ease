const express = require('express');
const { getAdminById } = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.get('/:id', authorize('admin'), getAdminById);

module.exports = router; 