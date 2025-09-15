const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/users');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below this point are protected and require authentication
router.use(protect);
// All routes below this point are restricted to admin users only
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .patch(updateUser)
  .delete(deleteUser);

// Special route for updating user approval status
router.put('/:id/approval', async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    // Find the faculty document by user id
    const faculty = await Faculty.findOne({ user: req.params.id });
    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty profile not found' 
      });
    }
    faculty.approved = req.body.approved;
    await faculty.save();
    res.json({ 
      success: true, 
      message: `Faculty ${req.body.approved ? 'approved' : 'revoked'} successfully`,
      data: faculty 
    });
  } catch (error) {
    console.error('Faculty approval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating faculty approval status',
      error: error.message 
    });
  }
});

module.exports = router; 