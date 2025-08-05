const Notification = require('../models/Notification');
const NotificationRead = require('../models/NotificationRead');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const Course = require('../models/Course');
const User = require('../models/User');
const ImportedStudent = require('../models/ImportedStudent');
const mongoose = require('mongoose');

// Helper function to get user model based on role
const getUserModel = (role) => {
  switch (role) {
    case 'student': return Student;
    case 'faculty': return Faculty;
    case 'admin': return Admin;
    default: throw new Error('Invalid role');
  }
};

// Helper function to get sender details based on role and user ID
const getSenderDetails = async (senderId, senderRole) => {
  switch (senderRole) {
    case 'student':
      const student = await Student.findOne({ user: senderId });
      if (student) {
        return {
          _id: student._id,
          fullName: student.fullName || student.name || 'Unknown Student',
          name: student.fullName || student.name || 'Unknown Student',
          user: senderId
        };
      }
      // If no student document found, return user info
      const studentUser = await User.findById(senderId);
      return studentUser;
    case 'faculty':
      // For faculty, we need to find the Faculty document that references the User
      const faculty = await Faculty.findOne({ user: senderId });
      if (faculty) {
        return {
          _id: faculty._id,
          fullName: faculty.fullName || faculty.name || 'Unknown Faculty',
          name: faculty.fullName || faculty.name || 'Unknown Faculty',
          user: senderId
        };
      }
      // If no faculty document found, return user info
      const facultyUser = await User.findById(senderId);
      return facultyUser;
    case 'admin':
      const admin = await Admin.findOne({ user: senderId });
      if (admin) {
        return {
          _id: admin._id,
          fullName: admin.fullName || admin.name || 'Unknown Admin',
          name: admin.fullName || admin.name || 'Unknown Admin',
          user: senderId
        };
      }
      // If no admin document found, return user info
      const adminUser = await User.findById(senderId);
      return adminUser;
    default:
      throw new Error('Invalid role');
  }
};

// Helper function to get recipient IDs based on recipient type
const getRecipientIds = async (recipients) => {
  const { type, ids, roles, model } = recipients;
  
  switch (type) {
    case 'all':
      // Get all users from the User collection
      const allUsers = await User.find({}, '_id');
      return allUsers.map(user => user._id.toString());
      
    case 'course':
      if (!ids || ids.length === 0) return [];
      const course = await Course.findById(ids[0]).populate('students');
      // For course recipients, we need to get the User IDs from the Student documents
      if (course && course.students) {
        const studentUserIds = [];
        for (const student of course.students) {
          // If the student is a Student document, get its user field
          if (student.user) {
            studentUserIds.push(student.user);
          } else {
            // If it's already a User ID, use it directly
            studentUserIds.push(student._id);
          }
        }
        return studentUserIds;
      }
      return [];
      
    case 'individual':
      return ids || [];
      
    case 'role':
      if (roles && roles.includes('student')) {
        const students = await Student.find({}, 'user');
        return students.map(s => s.user);
      }
      if (roles && roles.includes('faculty')) {
        const faculty = await Faculty.find({}, 'user');
        return faculty.map(f => f.user);
      }
      return [];
      
    case 'faculty':
      const allFaculty = await Faculty.find({}, 'user');
      return allFaculty.map(f => f.user);
      
    default:
      return [];
  }
};

// Send notification (Admin and Faculty)
exports.sendNotification = async (req, res) => {
  try {
    console.log('sendNotification called with body:', req.body);
    console.log('User from request:', req.user);
    
    const {
      title,
      message,
      type = 'info',
      priority = 'medium',
      recipients,
      courseId,
      expiresAt,
      metadata = {}
    } = req.body;

    const senderId = req.user.id;
    const senderRole = req.user.role;

    console.log('Sender ID:', senderId);
    console.log('Sender Role:', senderRole);

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    if (!recipients || !recipients.type) {
      return res.status(400).json({
        success: false,
        message: 'Recipients configuration is required'
      });
    }

    // Get sender details
    console.log('Getting sender details for:', senderId, senderRole);
    const sender = await getSenderDetails(senderId, senderRole);
    console.log('Sender details:', sender);
    
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found'
      });
    }

    // Get recipient IDs
    console.log('Getting recipient IDs for:', recipients);
    const recipientIds = await getRecipientIds(recipients);
    console.log('Recipient IDs:', recipientIds);
    
    // Validate recipient IDs
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients found for the specified criteria'
      });
    }

    // Filter out any invalid ObjectIds
    const validRecipientIds = recipientIds.filter(id => {
      if (!id || typeof id !== 'string') return false;
      return mongoose.Types.ObjectId.isValid(id);
    });

    if (validRecipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipients found for the specified criteria'
      });
    }

    console.log('Valid recipient IDs:', validRecipientIds);

    // Create notification
    const notificationData = {
      title,
      message,
      type,
      priority,
      sender: {
        id: senderId, // Use the User ID directly
        name: sender.fullName || sender.name || 'Unknown',
        role: senderRole,
        model: senderRole === 'faculty' ? 'Faculty' : 
               senderRole === 'admin' ? 'Admin' : 'Student'
      },
      recipients: {
        ...recipients,
        ids: validRecipientIds,
        model: 'User' 
      },
      courseId: courseId && courseId.trim() !== '' ? courseId : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata,
      stats: {
        totalRecipients: validRecipientIds.length,
        readCount: 0,
        readRate: 0
      }
    };

    console.log('Creating notification with data:', notificationData);
    const notification = new Notification(notificationData);
    console.log('Notification object created:', notification);

    await notification.save();
    console.log('Notification saved successfully');

    // Create NotificationRead records for all recipients
    const readRecords = validRecipientIds.map(userId => ({
      notification: notification._id,
      user: {
        id: userId,
        model: 'User' // Since we're using User IDs directly
      },
      readAt: null // Will be set when user actually reads the notification
    }));

    if (readRecords.length > 0) {
      try {
        await NotificationRead.insertMany(readRecords, { ordered: false });
        console.log(`Created ${readRecords.length} notification read records`);
      } catch (error) {
        console.error('Error creating notification read records:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notification: {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          recipients: validRecipientIds.length,
          createdAt: notification.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// Get notifications for current user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 20, unreadOnly = false, type, priority } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Build query based on user role and preferences
    if (userRole === 'student') {
      query['recipients.ids'] = userId;
    } else if (userRole === 'faculty') {
      // Faculty can see notifications sent to them and admin notifications
      query.$or = [
        { 'recipients.ids': userId },
        { 'recipients.type': 'faculty' },
        { 'sender.role': 'admin' }
      ];
    } else if (userRole === 'admin') {
      // Admins can see all notifications they sent
      query['sender.id'] = userId;
    }

    if (unreadOnly === 'true') {
      // For unread notifications, we need to check NotificationRead collection
      const unreadNotifications = await NotificationRead.find({
        'user.id': userId,
        readAt: null
      }).distinct('notification');
      
      query._id = { $in: unreadNotifications };
    }

    if (type) {
      query.type = type;
    }

    if (priority) {
      query.priority = priority;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender.id', 'fullName name')
      .populate('courseId', 'courseName name');

    // Get total count
    const total = await Notification.countDocuments(query);

    // Get unread count from NotificationRead collection
    const unreadCount = await NotificationRead.countDocuments({
      'user.id': userId,
      readAt: null
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is a recipient
    const isRecipient = notification.recipients.ids.includes(userId);
    if (!isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark this notification as read'
      });
    }

    // Create or update read record
    await NotificationRead.findOneAndUpdate(
      { notification: id, 'user.id': userId },
      { 
        notification: id,
        user: {
          id: userId,
          model: 'User' // Use User model directly
        },
        readAt: new Date()
      },
      { upsert: true }
    );

    // Update notification stats
    const readCount = await NotificationRead.countDocuments({ 
      notification: id,
      readAt: { $ne: null } // Only count actually read notifications
    });
    notification.stats.readCount = readCount;
    await notification.updateReadStats();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get all unread notifications for the user
    const query = { isRead: false };
    
    if (userRole === 'student') {
      query['recipients.ids'] = userId;
    } else if (userRole === 'faculty') {
      query.$or = [
        { 'recipients.ids': userId },
        { 'recipients.type': 'faculty' },
        { 'sender.role': 'admin' }
      ];
    }

    const unreadNotifications = await Notification.find(query);
    
    // Mark all as read
    const readRecords = unreadNotifications.map(notification => ({
      notification: notification._id,
      user: {
        id: userId,
        model: 'User' // Use User model directly
      },
      readAt: new Date()
    }));

    if (readRecords.length > 0) {
      await NotificationRead.insertMany(readRecords, { ordered: false });
    }

    // Update notification stats
    for (const notification of unreadNotifications) {
      const readCount = await NotificationRead.countDocuments({ 
        notification: notification._id,
        readAt: { $ne: null } // Only count actually read notifications
      });
      notification.stats.readCount = readCount;
      await notification.updateReadStats();
    }

    res.json({
      success: true,
      message: `Marked ${unreadNotifications.length} notifications as read`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get unread count from NotificationRead collection
    const count = await NotificationRead.countDocuments({
      'user.id': userId,
      readAt: null
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

// Get notification statistics (Admin and Faculty)
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = {};
    if (userRole === 'faculty') {
      query['sender.id'] = userId;
    }

    const notifications = await Notification.find(query);
    
    const stats = {
      total: notifications.length,
      byType: {},
      byPriority: {},
      byCategory: {},
      readRate: 0,
      totalRecipients: 0,
      totalReads: 0
    };

    notifications.forEach(notification => {
      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      
      // Count by priority
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      
      // Count by category
      const category = notification.metadata.category || 'announcement';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // Aggregate stats
      stats.totalRecipients += notification.stats.totalRecipients;
      stats.totalReads += notification.stats.readCount;
    });

    if (stats.totalRecipients > 0) {
      stats.readRate = Math.round((stats.totalReads / stats.totalRecipients) * 100);
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: error.message
    });
  }
};

// Delete notification (Admin and Faculty - only their own)
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the sender
    if (notification.sender.id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete notifications you sent'
      });
    }

    // Delete notification and related read records
    await NotificationRead.deleteMany({ notification: id });
    await Notification.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Get available courses for faculty notifications
exports.getAvailableCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty can access this endpoint'
      });
    }

    // Get courses assigned to the faculty
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    const courses = await Course.find({ faculty: faculty._id })
      .select('courseName name courseCode code department semester')
      .populate('students', 'fullName name studentId');

    res.json({
      success: true,
      data: courses
    });

  } catch (error) {
    console.error('Error getting available courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available courses',
      error: error.message
    });
  }
}; 