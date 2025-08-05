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
  FormHelperText,
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
      actionUrl: '',
      tags: []
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  // Load available data based on user role
  useEffect(() => {
    if (open) {
      loadAvailableData();
    }
  }, [open, user?.role]);

  const loadAvailableData = async () => {
    try {
      if (user?.role === 'faculty') {
        const coursesResponse = await notificationService.getAvailableCourses();
        if (coursesResponse.success) {
          setAvailableCourses(coursesResponse.data);
        }
      } else if (user?.role === 'admin') {
        // Load all data for admin
        const [studentsResponse, facultyResponse, coursesResponse] = await Promise.all([
          notificationService.getAllStudents(),
          notificationService.getAllFaculty(),
          notificationService.getAllCourses()
        ]);

        if (studentsResponse.success) setAllStudents(studentsResponse.data);
        if (facultyResponse.success) setAllFaculty(facultyResponse.data);
        if (coursesResponse.success) setAllCourses(coursesResponse.data);
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
    setSelectedStudents([]);
    setSelectedFaculty([]);
    setSelectedCourses([]);
  };

  const handleStudentSelection = (students) => {
    setSelectedStudents(students);
    setFormData(prev => ({
      ...prev,
      recipients: {
        ...prev.recipients,
        ids: students.map(s => s.user || s._id) // Use user ID if available, fallback to _id
      }
    }));
  };

  const handleFacultySelection = (faculty) => {
    setSelectedFaculty(faculty);
    setFormData(prev => ({
      ...prev,
      recipients: {
        ...prev.recipients,
        ids: faculty.map(f => f.user || f._id) // Use user ID if available, fallback to _id
      }
    }));
  };

  const handleCourseSelection = (courses) => {
    setSelectedCourses(courses);
    setFormData(prev => ({
      ...prev,
      recipients: {
        ...prev.recipients,
        ids: courses.map(c => c._id)
      },
      courseId: courses.length === 1 ? courses[0]._id : ''
    }));
  };

  const handleRoleSelection = (roles) => {
    setFormData(prev => ({
      ...prev,
      recipients: {
        ...prev.recipients,
        roles
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required');
      return;
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
        actionUrl: '',
        tags: []
      }
    });
    setSelectedStudents([]);
    setSelectedFaculty([]);
    setSelectedCourses([]);
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
      case 'course':
        return `${selectedCourses.length} course${selectedCourses.length !== 1 ? 's' : ''}`;
      case 'individual':
        return `${selectedStudents.length + selectedFaculty.length} user${(selectedStudents.length + selectedFaculty.length) !== 1 ? 's' : ''}`;
      case 'role':
        return `${formData.recipients.roles.length} role${formData.recipients.roles.length !== 1 ? 's' : ''}`;
      case 'faculty':
        return 'All faculty members';
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
                  <MenuItem value="urgent">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PriorityHighIcon color="error" />
                      Urgent
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
                  <MenuItem value="urgent">Urgent</MenuItem>
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
                label="Action URL (Optional)"
                value={formData.metadata.actionUrl}
                onChange={(e) => handleInputChange('metadata.actionUrl', e.target.value)}
                placeholder="https://example.com"
                helperText="Link to relevant page or resource"
              />
            </Grid>

            <Grid item xs={12}>
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

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Recipient Type</InputLabel>
                <Select
                  value={formData.recipients.type}
                  onChange={(e) => handleRecipientTypeChange(e.target.value)}
                  label="Recipient Type"
                >
                  <MenuItem value="all">All Users</MenuItem>
                  {user?.role === 'admin' && (
                    <>
                      <MenuItem value="role">By Role</MenuItem>
                      <MenuItem value="faculty">All Faculty</MenuItem>
                    </>
                  )}
                  <MenuItem value="course">By Course</MenuItem>
                  <MenuItem value="individual">Individual Users</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Role-based selection (Admin only) */}
            {user?.role === 'admin' && formData.recipients.type === 'role' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Roles</InputLabel>
                  <Select
                    multiple
                    value={formData.recipients.roles}
                    onChange={(e) => handleRoleSelection(e.target.value)}
                    label="Select Roles"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="student">Students</MenuItem>
                    <MenuItem value="faculty">Faculty</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Course selection */}
            {formData.recipients.type === 'course' && (
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={user?.role === 'admin' ? allCourses : availableCourses}
                  getOptionLabel={(option) => option.courseName || option.name}
                  value={selectedCourses}
                  onChange={(event, newValue) => handleCourseSelection(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Courses"
                      placeholder="Choose courses..."
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.courseName || option.name}
                        {...getTagProps({ index })}
                        size="small"
                      />
                    ))
                  }
                />
              </Grid>
            )}

            {/* Individual user selection (Admin only) */}
            {user?.role === 'admin' && formData.recipients.type === 'individual' && (
              <>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    multiple
                    options={allStudents}
                    getOptionLabel={(option) => `${option.fullName || option.name} (${option.studentId || option.rollNumber})`}
                    value={selectedStudents}
                    onChange={(event, newValue) => handleStudentSelection(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Students"
                        placeholder="Choose students..."
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.fullName || option.name}
                          {...getTagProps({ index })}
                          size="small"
                        />
                      ))
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    multiple
                    options={allFaculty}
                    getOptionLabel={(option) => option.fullName || option.name}
                    value={selectedFaculty}
                    onChange={(event, newValue) => handleFacultySelection(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Faculty"
                        placeholder="Choose faculty..."
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.fullName || option.name}
                          {...getTagProps({ index })}
                          size="small"
                        />
                      ))
                    }
                  />
                </Grid>
              </>
            )}

            {/* Recipient Summary */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recipient Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getRecipientCount()}
                </Typography>
              </Box>
            </Grid>
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