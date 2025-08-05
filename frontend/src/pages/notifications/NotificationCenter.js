import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Grid, Chip, Button, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Pagination, CircularProgress, Alert, Avatar, Divider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Notifications as NotificationsIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon, Info as InfoIcon, Error as ErrorIcon, PriorityHigh as PriorityHighIcon, DoneAll as DoneAllIcon, Delete as DeleteIcon, FilterList as FilterListIcon, Sort as SortIcon, Refresh as RefreshIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import useAuth from '../../hooks/useAuth';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const { user } = useAuth();
  const { notifications, loading, error, pagination, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const [filters, setFilters] = useState({ type: '', priority: '', category: '', isRead: '', search: '' });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  useEffect(() => {
    fetchNotifications({ page: 1, limit: 20, ...filters, sortBy, sortOrder });
  }, [fetchNotifications, filters, sortBy, sortOrder]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (event, page) => {
    fetchNotifications({ page, limit: pagination.limit, ...filters, sortBy, sortOrder });
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteClick = (notification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (notificationToDelete) {
      await deleteNotification(notificationToDelete._id);
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  const handleRefresh = () => {
    fetchNotifications({ page: pagination.page, limit: pagination.limit, ...filters, sortBy, sortOrder });
  };

  const clearFilters = () => {
    setFilters({ type: '', priority: '', category: '', isRead: '', search: '' });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'urgent': return <PriorityHighIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      case 'urgent': return '#d32f2f';
      default: return '#2196f3';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#1976d2';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  const formatNotificationTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const formatFullDate = (date) => {
    try {
      return format(new Date(date), 'PPP p');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notification-center-container">
      <div className="notification-center-content">
        <Box className="notification-center-header">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <Box>
              <Box className="notification-center-title">
                <NotificationsIcon />
                <Typography variant="h4" component="h1">Notification Center</Typography>
              </Box>
              <Typography variant="body1" className="notification-center-subtitle">
                Manage and view all your notifications from {user?.role === 'admin' ? 'the system' : 'your courses and administrators'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              className="header-refresh-button"
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Card className="notification-filters-card">
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search notifications..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="notification-search-field"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small" className="notification-filter-select">
                  <InputLabel>Type</InputLabel>
                  <Select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} label="Type">
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small" className="notification-filter-select">
                  <InputLabel>Priority</InputLabel>
                  <Select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)} label="Priority">
                    <MenuItem value="">All Priorities</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small" className="notification-filter-select">
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.isRead} onChange={(e) => handleFilterChange('isRead', e.target.value)} label="Status">
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="false">Unread</MenuItem>
                    <MenuItem value="true">Read</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box className="filter-buttons-container">
                  <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearFilters} className="filter-button clear">
                    Clear
                  </Button>
                  {unreadCount > 0 && (
                    <Button variant="contained" startIcon={<DoneAllIcon />} onClick={handleMarkAllAsRead} disabled={loading} className="filter-button mark-all-read">
                      Mark All Read
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={2} className="notification-stats-grid">
          <Grid item xs={12} sm={6} md={3}>
            <Card className="notification-stat-card">
              <CardContent>
                <Typography variant="h4" className="notification-stat-number">{notifications.length}</Typography>
                <Typography variant="body2" className="notification-stat-label">Total Notifications</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="notification-stat-card">
              <CardContent>
                <Typography variant="h4" className="notification-stat-number" sx={{ color: 'error.main' }}>{unreadCount}</Typography>
                <Typography variant="body2" className="notification-stat-label">Unread</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="notification-stat-card">
              <CardContent>
                <Typography variant="h4" className="notification-stat-number" sx={{ color: 'success.main' }}>{notifications.length - unreadCount}</Typography>
                <Typography variant="body2" className="notification-stat-label">Read</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="notification-stat-card">
              <CardContent>
                <Typography variant="h4" className="notification-stat-number" sx={{ color: 'warning.main' }}>{notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length}</Typography>
                <Typography variant="body2" className="notification-stat-label">High Priority</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {loading ? (
          <Box className="notification-loading">
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Card className="notification-list-container">
            <CardContent className="notification-empty-state">
              <NotificationsIcon />
              <Typography variant="h6" gutterBottom>No notifications found</Typography>
              <Typography variant="body2">
                {Object.values(filters).some(f => f !== '') 
                  ? 'Try adjusting your filters to see more notifications.'
                  : 'You\'re all caught up! No notifications at the moment.'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card className="notification-list-container">
            <Box className="notification-sort-header">
              <Typography variant="body2" color="text.secondary">
                Showing {notifications.length} of {pagination.total} notifications
              </Typography>
              <Box className="notification-sort-buttons">
                <Button
                  size="small"
                  startIcon={<SortIcon />}
                  onClick={() => handleSortChange('createdAt')}
                  variant={sortBy === 'createdAt' ? 'contained' : 'outlined'}
                  className="notification-sort-button"
                >
                  Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  size="small"
                  startIcon={<SortIcon />}
                  onClick={() => handleSortChange('priority')}
                  variant={sortBy === 'priority' ? 'contained' : 'outlined'}
                  className="notification-sort-button"
                >
                  Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </Box>
            </Box>

            <Box>
              {notifications.map((notification, index) => (
                <Card key={notification._id} className={`notification-item-card ${!notification.isRead ? 'unread' : ''}`}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar className="notification-avatar" sx={{ bgcolor: getNotificationColor(notification.type), color: 'white' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                      
                      <Box className="notification-content">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" className="notification-title" onClick={() => setSelectedNotification(notification)}>
                            {notification.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip label={notification.priority} size="small" className={`notification-chip priority-${notification.priority}`} />
                            <Typography variant="caption" className="notification-time">
                              {formatNotificationTime(notification.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" className="notification-message">
                          {notification.message}
                        </Typography>
                        
                        <Box className="notification-meta">
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="caption" className="notification-sender">
                              From: {notification.sender?.name || 'Unknown'}
                            </Typography>
                            {notification.metadata?.category && (
                              <Chip label={notification.metadata.category} size="small" variant="outlined" className="notification-chip" />
                            )}
                            {notification.courseId && (
                              <Chip label={`Course: ${notification.courseId.courseName || notification.courseId.name}`} size="small" variant="outlined" color="primary" className="notification-chip" />
                            )}
                          </Box>
                          
                          <Box className="notification-actions">
                            {!notification.isRead && (
                              <Button size="small" variant="outlined" onClick={() => handleMarkAsRead(notification._id)} className="notification-action-button mark-read">
                                Mark as Read
                              </Button>
                            )}
                            {(user?.role === 'admin' || user?.role === 'faculty') && (
                              <Tooltip title="Delete notification">
                                <IconButton size="small" color="error" onClick={() => handleDeleteClick(notification)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {pagination.pages > 1 && (
              <Box className="notification-pagination">
                <Pagination count={pagination.pages} page={pagination.page} onChange={handlePageChange} color="primary" showFirstButton showLastButton />
              </Box>
            )}
          </Card>
        )}

        <Dialog open={!!selectedNotification} onClose={() => setSelectedNotification(null)} maxWidth="md" fullWidth className="notification-dialog">
          {selectedNotification && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: getNotificationColor(selectedNotification.type), color: 'white' }}>
                    {getNotificationIcon(selectedNotification.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedNotification.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFullDate(selectedNotification.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedNotification.message}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Sender</Typography>
                    <Typography variant="body2">{selectedNotification.sender?.name || 'Unknown'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                    <Chip label={selectedNotification.priority} size="small" className={`notification-chip priority-${selectedNotification.priority}`} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                    <Chip label={selectedNotification.type} size="small" variant="outlined" className="notification-chip" />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={selectedNotification.isRead ? 'Read' : 'Unread'} size="small" color={selectedNotification.isRead ? 'success' : 'warning'} className="notification-chip" />
                  </Grid>
                  {selectedNotification.metadata?.category && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                      <Typography variant="body2">{selectedNotification.metadata.category}</Typography>
                    </Grid>
                  )}
                  {selectedNotification.courseId && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Course</Typography>
                      <Typography variant="body2">{selectedNotification.courseId.courseName || selectedNotification.courseId.name}</Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                {!selectedNotification.isRead && (
                  <Button onClick={() => { handleMarkAsRead(selectedNotification._id); setSelectedNotification(null); }} className="notification-action-button mark-read">
                    Mark as Read
                  </Button>
                )}
                <Button onClick={() => setSelectedNotification(null)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} className="notification-dialog">
          <DialogTitle>Delete Notification</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this notification? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default NotificationCenter; 