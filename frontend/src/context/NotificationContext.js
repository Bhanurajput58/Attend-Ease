import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getUserNotifications(params);
      if (response.success) {
        setNotifications(response.data.notifications);
        setPagination(response.data.pagination);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await notificationService.markNotificationAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllNotificationsAsRead();
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            isRead: true,
            readAt: new Date()
          }))
        );
        
        // Reset unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
  }, []);

  // Send notification (Admin and Faculty)
  const sendNotification = useCallback(async (notificationData) => {
    try {
      const response = await notificationService.sendNotification(notificationData);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Delete notification (Admin and Faculty)
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        removeNotification(notificationId);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }, [removeNotification]);

  // Get notification statistics
  const getNotificationStats = useCallback(async () => {
    try {
      const response = await notificationService.getNotificationStats();
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications();
    }
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  // Set up polling for unread count (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    sendNotification,
    deleteNotification,
    getNotificationStats
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 