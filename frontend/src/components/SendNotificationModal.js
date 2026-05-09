import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Autocomplete,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';
import useAuth from '../hooks/useAuth';
import notificationService from '../services/notificationService';

const SendNotificationModal = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    recipients: {
      type: 'all',
      ids: [],
      roles: []
    },
    courseId: '',
    expiresAt: '',
    metadata: {
      category: 'announcement',
      tags: []
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);


  // Load available data based on user role
  useEffect(() => {
    if (open) {
      loadAvailableData();
    }
  }, [open, user?.role]);

  const loadAvailableData = async () => {
    try {
      if (user?.role === 'faculty') {
        // For unapproved faculty, set recipient type to admin
        if (!user?.approved) {
          setFormData(prev => ({
            ...prev,
            recipients: {
              type: 'admin',
              ids: [],
              roles: []
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading available data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleRecipientTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      recipients: {
        type,
        ids: [],
        roles: []
      },
      courseId: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    // Validation for unapproved faculty
    if (user?.role === 'faculty' && !user?.approved) {
      if (formData.recipients.type !== 'admin') {
        setError('Unapproved faculty can only send notifications to administrators.');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await sendNotification(formData);
      if (response.success) {
        setSuccess('Notification sent successfully!');
        setTimeout(() => {
          onSuccess && onSuccess(response.data);
          handleClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to send notification');
      }
    } catch (error) {
      setError(error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      recipients: {
        type: 'all',
        ids: [],
        roles: []
      },
      courseId: '',
      expiresAt: '',
      metadata: {
        category: 'announcement',
        tags: []
      }
    });
    setError('');
    setSuccess('');
    onClose();
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

  const getRecipientCount = () => {
    switch (formData.recipients.type) {
      case 'all':
        return 'All users';
      case 'admin':
        return 'All administrators';
      case 'students':
        return 'All students';
      default:
        return 'No recipients selected';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Send Notification</Typography>
          <Button
            icon={<CloseIcon />}
            onClick={handleClose}
            sx={{ minWidth: 'auto' }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Simple interface for unapproved faculty */}
          {user?.role === 'faculty' && !user?.approved && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Send Notification to Administrator
              </Typography>
              <Typography variant="body2">
                You can send a notification to the administrator for approval or assistance.
              </Typography>
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Notification Details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder="Enter notification title"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                required
                multiline
                rows={4}
                placeholder="Enter notification message"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  label="Type"
                >
                  <MenuItem value="info">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InfoIcon color="info" />
                      Info
                    </Box>
                  </MenuItem>
                  <MenuItem value="success">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" />
                      Success
                    </Box>
                  </MenuItem>
                  <MenuItem value="warning">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" />
                      Warning
                    </Box>
                  </MenuItem>
                  <MenuItem value="error">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" />
                      Error
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.metadata.category}
                  onChange={(e) => handleInputChange('metadata.category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="announcement">Announcement</MenuItem>
                  <MenuItem value="academic">Academic</MenuItem>
                  <MenuItem value="administrative">Administrative</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="reminder">Reminder</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiration Date (Optional)"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Notification will be automatically removed after this date"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Recipients
              </Typography>
            </Grid>

            {user?.role === 'faculty' && !user?.approved ? (
              // Simple interface for unapproved faculty - no recipient selection needed
              <Grid item xs={12}>
                <Alert severity="info" sx={{ p: 2 }}>
                  <Typography variant="body2">
                    This notification will be sent to all administrators.
                  </Typography>
                </Alert>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Recipient Type</InputLabel>
                  <Select
                    value={formData.recipients.type}
                    onChange={(e) => handleRecipientTypeChange(e.target.value)}
                    label="Recipient Type"
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="students">Students</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Recipient selection completed - no additional selection needed for simple types */}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            disabled={loading || !formData.title.trim() || !formData.message.trim()}
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SendNotificationModal; 