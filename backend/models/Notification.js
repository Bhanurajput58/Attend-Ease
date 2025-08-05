const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'urgent'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  sender: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'faculty'],
      required: true
    },
    model: {
      type: String,
      enum: ['Admin', 'Faculty'],
      required: true
    }
  },
  recipients: {
    type: {
      type: String,
      enum: ['all', 'course', 'individual', 'role', 'faculty'],
      required: true
    },
    ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    roles: [{
      type: String,
      enum: ['student', 'faculty']
    }],
    model: {
      type: String,
      enum: ['Student', 'Faculty', 'Course', 'User'],
      required: function() {
        return this.recipients.type === 'course' || this.recipients.type === 'individual';
      }
    }
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: function() {
      return this.recipients.type === 'course';
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  metadata: {
    actionUrl: {
      type: String,
      trim: true
    },
    icon: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['academic', 'administrative', 'emergency', 'reminder', 'announcement'],
      default: 'announcement'
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  // For tracking notification delivery and engagement
  stats: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    readCount: {
      type: Number,
      default: 0
    },
    readRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ 'sender.id': 1, createdAt: -1 });
notificationSchema.index({ 'recipients.type': 1, createdAt: -1 });
notificationSchema.index({ 'recipients.ids': 1, createdAt: -1 });
notificationSchema.index({ courseId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ 'metadata.category': 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to update read statistics
notificationSchema.methods.updateReadStats = function() {
  if (this.stats.totalRecipients > 0) {
    this.stats.readRate = Math.round((this.stats.readCount / this.stats.totalRecipients) * 100);
  }
  return this.save();
};

// Pre-save middleware to set default icon based on type
notificationSchema.pre('save', function(next) {
  if (!this.metadata.icon) {
    const iconMap = {
      'info': 'info',
      'warning': 'warning',
      'success': 'check_circle',
      'error': 'error',
      'urgent': 'priority_high'
    };
    this.metadata.icon = iconMap[this.type] || 'notifications';
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 