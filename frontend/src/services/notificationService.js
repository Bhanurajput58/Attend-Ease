import { api } from '../config/api';

// Notification Service for handling all notification-related API calls
class NotificationService {
  // Send notification (Admin and Faculty)
  async sendNotification(notificationData) {
    try {
      const response = await api.post('/api/notifications/send', notificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to send notification' };
    }
  }

  // Get notifications for current user
  async getUserNotifications(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      });

      const response = await api.get(`/api/notifications/user?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get notifications' };
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.put(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to mark notification as read' };
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    try {
      const response = await api.put('/api/notifications/read-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to mark all notifications as read' };
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await api.get('/api/notifications/unread-count');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get unread count' };
    }
  }

  // Get notification statistics (Admin and Faculty)
  async getNotificationStats() {
    try {
      const response = await api.get('/api/notifications/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get notification statistics' };
    }
  }

  // Delete notification (Admin and Faculty - only their own)
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/api/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to delete notification' };
    }
  }

  // Get available courses for faculty notifications
  async getAvailableCourses() {
    try {
      const response = await api.get('/api/notifications/available-courses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get available courses' };
    }
  }

  // Get all students (for admin notifications)
  async getAllStudents() {
    try {
      const response = await api.get('/api/students');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get students' };
    }
  }

  // Get all faculty (for admin notifications)
  async getAllFaculty() {
    try {
      const response = await api.get('/api/faculties');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get faculty' };
    }
  }

  // Get all courses (for admin notifications)
  async getAllCourses() {
    try {
      const response = await api.get('/api/courses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get courses' };
    }
  }
}

export default new NotificationService(); 