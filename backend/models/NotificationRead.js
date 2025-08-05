const mongoose = require('mongoose');

const notificationReadSchema = new mongoose.Schema({
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    model: {
      type: String,
      enum: ['Student', 'Faculty', 'Admin', 'User'],
      required: true
    }
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to ensure unique notification-user combinations
notificationReadSchema.index({ notification: 1, 'user.id': 1 }, { unique: true });

// Index for efficient queries
notificationReadSchema.index({ 'user.id': 1, readAt: -1 });
notificationReadSchema.index({ notification: 1, readAt: -1 });

module.exports = mongoose.model('NotificationRead', notificationReadSchema); 