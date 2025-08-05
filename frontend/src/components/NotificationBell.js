import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  PriorityHigh as PriorityHighIcon,
  Close as CloseIcon,
  DoneAll as DoneAllIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const menuRef = useRef(null);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Fetch fresh notifications when opening
    if (!loading) {
      setMenuLoading(true);
      fetchNotifications({ limit: 10 }).finally(() => setMenuLoading(false));
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    handleClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    handleClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'urgent':
        return <PriorityHighIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      case 'urgent':
        return '#d32f2f';
      default:
        return '#2196f3';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#1976d2';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  const formatNotificationTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          size="small"
          sx={{
            position: 'relative',
            width: '32px',
            height: '32px',
            minWidth: '32px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.1rem'
            }
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: '16px',
                minWidth: '16px',
                borderRadius: '8px'
              }
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsIcon />
            ) : (
              <NotificationsNoneIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        ref={menuRef}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 450,
            overflow: 'auto',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
            mt: 1
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.06)', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<DoneAllIcon sx={{ fontSize: '0.9rem' }} />}
                  onClick={handleMarkAllAsRead}
                  sx={{ 
                    minWidth: 'auto', 
                    px: 1, 
                    py: 0.5, 
                    fontSize: '0.75rem',
                    height: '28px'
                  }}
                >
                  Mark all read
                </Button>
              )}
              <IconButton size="small" onClick={handleClose} sx={{ width: '28px', height: '28px' }}>
                <CloseIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Box sx={{ minHeight: 180, maxHeight: 320 }}>
          {menuLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <NotificationsNoneIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.slice(0, 8).map((notification, index) => (
              <React.Fragment key={notification._id}>
                <MenuItem
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    display: 'block',
                    py: 1,
                    px: 1.5,
                    borderLeft: notification.isRead ? 'none' : `3px solid ${getNotificationColor(notification.type)}`,
                    backgroundColor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.03)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.06)'
                    },
                    borderRadius: '0',
                    mx: 0.5,
                    my: 0.25
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: getNotificationColor(notification.type),
                        color: 'white',
                        fontSize: '0.8rem'
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: notification.isRead ? 400 : 600,
                            color: notification.isRead ? 'text.secondary' : 'text.primary',
                            fontSize: '0.85rem',
                            lineHeight: 1.3
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <Chip
                            label={notification.priority}
                            size="small"
                            sx={{
                              height: 14,
                              fontSize: '0.55rem',
                              bgcolor: getPriorityColor(notification.priority),
                              color: 'white',
                              '& .MuiChip-label': {
                                px: 0.5
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {formatNotificationTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.75rem',
                          lineHeight: 1.3
                        }}
                      >
                        {truncateText(notification.message, 80)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          From: {notification.sender?.name || 'Unknown'}
                        </Typography>
                        {notification.metadata?.category && (
                          <Chip
                            label={notification.metadata.category}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              height: 16, 
                              fontSize: '0.55rem',
                              '& .MuiChip-label': {
                                px: 0.5
                              }
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </MenuItem>
                {index < notifications.length - 1 && <Divider sx={{ mx: 1, my: 0.25 }} />}
              </React.Fragment>
            ))
          )}
        </Box>

        {notifications.length > 8 && (
          <Box sx={{ p: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.06)', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => {
                handleClose();
                navigate('/notifications');
              }}
              sx={{ 
                fontSize: '0.8rem',
                py: 0.5,
                height: '32px'
              }}
            >
              View All Notifications
            </Button>
          </Box>
        )}
        
        {/* Always show View All button */}
        <Box sx={{ p: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.06)', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => {
              handleClose();
              navigate('/notifications');
            }}
            sx={{ 
              fontSize: '0.8rem',
              py: 0.5,
              height: '32px'
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell; 