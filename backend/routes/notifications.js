const express = require('express');
const router = express.Router();
const { 
  sendNotification,
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadCount,
  getNotificationStats,
  deleteNotification,
  getAvailableCourses
} = require('../controllers/notifications');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Send notification (Admin and Faculty)
router.post('/send', authorize('admin', 'faculty'), sendNotification);

// Get notifications for current user (All roles)
router.get('/user', getUserNotifications);

// Mark notification as read (All roles)
router.put('/:id/read', markNotificationAsRead);

// Mark all notifications as read (All roles)
router.put('/read-all', markAllNotificationsAsRead);

// Get unread count (All roles)
router.get('/unread-count', getUnreadCount);

// Get notification statistics (Admin and Faculty)
router.get('/stats', authorize('admin', 'faculty'), getNotificationStats);

// Delete notification (Admin and Faculty - only their own)
router.delete('/:id', authorize('admin', 'faculty'), deleteNotification);

// Get available courses for faculty notifications
router.get('/available-courses', authorize('faculty'), getAvailableCourses);

module.exports = router; 