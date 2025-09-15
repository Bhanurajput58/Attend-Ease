import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Avatar,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { api, API_ENDPOINTS } from '../../config/api';
import './FacultyDashboard.css';
import WarningIcon from '@mui/icons-material/Warning';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SendIcon from '@mui/icons-material/Send';
import NotificationBell from '../../components/NotificationBell';
import SendNotificationModal from '../../components/SendNotificationModal';
import { useNotifications } from '../../context/NotificationContext';

const FacultyDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { notifications: adminNotifications, unreadCount } = useNotifications();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    activeCourses: 0,
    totalStudents: 0,
    averageAttendance: 0,
    recentActivity: [],
    coursesList: [],
    facultyName: 'Faculty Member',
    isApproved: false
  });
  const [error, setError] = useState(null);
  const [appliedCourses, setAppliedCourses] = useState([]);
  const [applyLoading, setApplyLoading] = useState({});
  const [applyError, setApplyError] = useState({});
  const [availableCourses, setAvailableCourses] = useState([]);
  const [sendNotificationOpen, setSendNotificationOpen] = useState(false);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(API_ENDPOINTS.GET_FACULTY_DASHBOARD);
        if (response.data.success && response.data.data) {
          console.log('Faculty dashboard data:', response.data.data);
          console.log('Courses list:', response.data.data.coursesList);
          setDashboardData({
            activeCourses: response.data.data.activeCourses || 0,
            totalStudents: response.data.data.totalStudents || 0,
            averageAttendance: response.data.data.averageAttendance || 0,
            recentActivity: response.data.data.recentActivity || [],
            coursesList: response.data.data.coursesList || [],
            facultyName: user?.name || 'Faculty Member',
            isApproved: response.data.data.isApproved || false
          });
        } else {
          setDashboardData({
            activeCourses: 0,
            totalStudents: 0,
            averageAttendance: 0,
            recentActivity: [],
            coursesList: [],
            facultyName: user?.name || 'Faculty Member',
            isApproved: false
          });
          setError('Failed to load dashboard data.');
        }
      } catch (error) {
        setDashboardData({
          activeCourses: 0,
          totalStudents: 0,
          averageAttendance: 0,
          recentActivity: [],
          coursesList: [],
          facultyName: user?.name || 'Faculty Member',
          isApproved: false
        });
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchDashboardData();
      fetchAppliedCourses();
      fetchAvailableCourses();
    }
  }, [isAuthenticated, user]);

  // Fetch applied courses for this faculty
  const fetchAppliedCourses = async () => {
    try {
      const response = await api.get('/api/faculty/applied-courses');
      console.log('Applied courses response:', response.data);
      if (response.data.success && Array.isArray(response.data.data)) {
        // response.data.data is already an array of course IDs
        const appliedCourseIds = response.data.data;
        console.log('Applied course IDs:', appliedCourseIds);
        console.log('Setting appliedCourses state to:', appliedCourseIds);
        setAppliedCourses(appliedCourseIds);
      } else {
        console.log('No applied courses data or invalid response format');
        setAppliedCourses([]);
      }
    } catch (error) {
      console.error('Error fetching applied courses:', error);
      setAppliedCourses([]);
    }
  };

  const handleRefreshAppliedCourses = async () => {
    console.log('Manually refreshing applied courses...');
    setAppliedCourses([]); // Clear the state first
    await fetchAppliedCourses(); // Then fetch fresh data
  };

  // Fetch available (unassigned) courses
  const fetchAvailableCourses = async () => {
    try {
      // Use the correct endpoint that filters out courses assigned to current faculty
      const response = await api.get('/api/courses/available');
      console.log('Available courses response:', response.data);
      if (response.data.success && Array.isArray(response.data.data)) {
        setAvailableCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching available courses:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchAppliedCourses();
  }, [isAuthenticated]);

  // Fetch available courses on component mount
  useEffect(() => {
    if (isAuthenticated) fetchAvailableCourses();
  }, [isAuthenticated]);

  const handleTakeAttendance = () => navigate('/faculty/attendance');
  const viewAttendanceHistory = (activityId) => {
    const activity = dashboardData.recentActivity.find(act => act.id === activityId);
    if (activity) sessionStorage.setItem('selectedActivity', JSON.stringify(activity));
    navigate(`/faculty/attendance/${activityId}`);
  };
  const handleViewReports = () => navigate('/reports/attendance');
  const handleViewLowAttendance = () => navigate('/faculty/low-attendance');
  const viewLowAttendance = (courseId) => navigate(`/faculty/low-attendance/${courseId}`);
  const handleViewAllStudents = () => navigate('/faculty/students');

  // Handler for applying to a course
  const handleApply = async (courseId) => {
    // Check if faculty is approved before making the API call
    if (!dashboardData.isApproved) {
      setApplyError(prev => ({ 
        ...prev, 
        [courseId]: 'Your faculty account is not yet approved. Please contact the administrator for approval before applying for courses.' 
      }));
      return;
    }
    
    setApplyLoading(prev => ({ ...prev, [courseId]: true }));
    setApplyError(prev => ({ ...prev, [courseId]: null }));
    try {
      const response = await api.post(`/api/courses/${courseId}/applications/apply`);
      if (response.data.success) {
        setAppliedCourses(prev => [...prev, courseId]);
      } else {
        setApplyError(prev => ({ ...prev, [courseId]: response.data.message || 'Failed to apply' }));
      }
    } catch (err) {
      setApplyError(prev => ({ ...prev, [courseId]: err.response?.data?.message || 'Failed to apply' }));
    } finally {
      setApplyLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleWithdrawApplication = async (courseId) => {
    setApplyLoading(prev => ({ ...prev, [courseId]: true }));
    setApplyError(prev => ({ ...prev, [courseId]: null }));
    try {
      console.log(`Attempting to withdraw application for course: ${courseId}`);
      const response = await api.post(`/api/courses/${courseId}/applications/withdraw`);
      console.log('Withdraw response:', response.data);
      if (response.data.success) {
        console.log('Withdraw successful, updating appliedCourses state');
        setAppliedCourses(prev => prev.filter(id => id !== courseId));
      } else {
        console.log('Withdraw failed:', response.data.message);
        // If the error is "No application found", just remove it from the applied courses list
        if (response.data.message && response.data.message.includes('No application found')) {
          console.log('No application found, removing from applied courses list');
          setAppliedCourses(prev => prev.filter(id => id !== courseId));
        } else {
          setApplyError(prev => ({ ...prev, [courseId]: response.data.message || 'Failed to withdraw' }));
        }
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      console.error('Error response:', err.response?.data);
      // If the error is "No application found", just remove it from the applied courses list
      if (err.response?.data?.message && err.response.data.message.includes('No application found')) {
        console.log('No application found (from error), removing from applied courses list');
        setAppliedCourses(prev => prev.filter(id => id !== courseId));
      } else {
        setApplyError(prev => ({ ...prev, [courseId]: 'Failed to withdraw' }));
      }
    } finally {
      setApplyLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleSendNotification = () => {
    if (!dashboardData.isApproved) {
      // This shouldn't happen since the button is disabled, but adding extra protection
      return;
    }
    setSendNotificationOpen(true);
  };

  const handleNotificationSuccess = (notificationData) => {
    console.log('Notification sent successfully:', notificationData);
    setSendNotificationOpen(false);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return '#4caf50';
    if (percentage >= 75) return '#2196f3';
    if (percentage >= 60) return '#ff9800';
    return '#f44336';
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Average';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="faculty-dashboard-container">
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <Box textAlign="center">
              <CircularProgress size={60} />
              <Typography variant="h6" style={{ marginTop: 16 }}>
                Loading Dashboard...
              </Typography>
            </Box>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="faculty-dashboard-container">
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box className="faculty-dashboard-header-section">
          <Box className="faculty-welcome-section">
            <Avatar className="faculty-avatar">
              <PersonIcon />
            </Avatar>
            <Box className="faculty-welcome-text">
              <Typography variant="h3" className="faculty-welcome-title">
                Welcome back, {user?.roleData?.fullName || user?.name || 'Faculty Member'}!
              </Typography>
              <Typography variant="subtitle1" className="faculty-welcome-subtitle">
                Here's what's happening with your courses today
              </Typography>
            </Box>
          </Box>
          <Box className="faculty-header-actions">
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ErrorIcon />}
              onClick={handleViewLowAttendance}
              disabled={dashboardData.activeCourses === 0}
              className="faculty-action-button"
            >
              Low Attendance
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AssessmentIcon />}
              onClick={handleViewReports}
              disabled={dashboardData.activeCourses === 0}
              className="faculty-action-button"
            >
              Reports
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<SendIcon />}
              onClick={handleSendNotification}
              disabled={!dashboardData.isApproved}
              className="faculty-action-button"
              title={!dashboardData.isApproved ? "Account approval required to send notifications" : ""}
            >
              Send Notification
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AssignmentIcon />}
              onClick={handleTakeAttendance}
              disabled={dashboardData.activeCourses === 0}
              className="faculty-action-button primary"
            >
              Take Attendance
            </Button>
          </Box>
        </Box>

        {!dashboardData.isApproved && (
          <Alert severity="warning" className="faculty-approval-alert" sx={{ mb: 3 }}>
            <Typography variant="h6">Account Pending Approval</Typography>
            <Typography variant="body2">
              You cannot apply for courses until your account is approved by an administrator. 
              Please contact your administrator for approval.
            </Typography>
          </Alert>
        )}
        
        {error ? (
          <Alert severity="error" className="faculty-error-alert">
            <Typography variant="h6">{error}</Typography>
            <Typography variant="body2">
              No data available at the moment. Please try refreshing the page.
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Statistics Cards */}
            <Grid container spacing={3} className="faculty-stats-section">
              <Grid item xs={12} sm={6} md={3}>
                <Card className="faculty-stat-card active-courses">
                  <CardContent>
                    <Box className="faculty-stat-icon">
                      <SchoolIcon />
                    </Box>
                    <Typography variant="h2" className="faculty-stat-number">
                      {dashboardData.activeCourses}
                    </Typography>
                    <Typography variant="h6" className="faculty-stat-label">
                      Active Courses
                    </Typography>
                    <Typography variant="body2" className="faculty-stat-description">
                      Currently teaching
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card className="faculty-stat-card total-students">
                  <CardContent>
                    <Box className="faculty-stat-icon">
                      <PeopleIcon />
                    </Box>
                    <Typography variant="h2" className="faculty-stat-number">
                      {dashboardData.totalStudents}
                    </Typography>
                    <Typography variant="h6" className="faculty-stat-label">
                      Total Students
                    </Typography>
                    <Typography variant="body2" className="faculty-stat-description">
                      In each course
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card className="faculty-stat-card attendance-rate">
                  <CardContent>
                    <Box className="faculty-stat-icon">
                      <TrendingUpIcon />
                    </Box>
                    <Typography variant="h2" className="faculty-stat-number">
                      {dashboardData.averageAttendance}%
                    </Typography>
                    <Typography variant="h6" className="faculty-stat-label">
                      Attendance Rate
                    </Typography>
                    <Box className="faculty-attendance-progress">
                      <LinearProgress
                        variant="determinate"
                        value={dashboardData.averageAttendance}
                        className="faculty-progress-bar"
                        style={{ backgroundColor: '#e0e0e0' }}
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getAttendanceColor(dashboardData.averageAttendance)
                          }
                        }}
                      />
                      <Typography variant="caption" className="faculty-progress-label">
                        {getAttendanceStatus(dashboardData.averageAttendance)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card className="faculty-stat-card quick-actions">
                  <CardContent>
                    <Box className="faculty-stat-icon">
                      <HistoryIcon />
                    </Box>
                    <Typography variant="h6" className="faculty-stat-label">
                      Quick Actions
                    </Typography>
                    <Box className="faculty-quick-actions-buttons">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleViewAllStudents}
                        disabled={dashboardData.totalStudents === 0}
                        fullWidth
                        className="faculty-quick-action-btn"
                      >
                        View Students
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Main Content Grid */}
            <Grid container spacing={3} className="faculty-main-content">
              {/* Assigned Courses Section */}
              <Grid item xs={12} lg={8}>
                <Card className="faculty-content-card">
                  <CardContent>
                    <Box className="faculty-section-header">
                      <Typography variant="h5" className="faculty-section-title">
                        <SchoolIcon className="faculty-section-icon" />
                        My Courses
                      </Typography>
                      <Chip
                        label={`${dashboardData.coursesList.length} courses`}
                        color="primary"
                        size="small"
                      />
                    </Box>

                    {dashboardData.coursesList.length === 0 ? (
                      <Box className="faculty-empty-state">
                        <SchoolIcon className="faculty-empty-icon" />
                        <Typography variant="h6" className="faculty-empty-title">
                          No courses assigned yet
                        </Typography>
                        <Typography variant="body2" className="faculty-empty-description">
                          You'll see your assigned courses here once they're available. 
                          You can apply for available courses in the sidebar, or contact your administrator to be assigned courses.
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2} className="faculty-courses-grid">
                        {dashboardData.coursesList.map((course) => (
                          <Grid item xs={12} sm={6} key={course.id}>
                            <Card className="faculty-course-card">
                              <CardContent>
                                <Box className="faculty-course-header">
                                  <Typography variant="h6" className="faculty-course-name">
                                    {course.name}
                                  </Typography>
                                  <Chip
                                    label={course.code}
                                    size="small"
                                    variant="outlined"
                                    className="faculty-course-code"
                                  />
                                </Box>

                                {/* Course Details */}
                                <Box className="faculty-course-details" sx={{ mb: 1.5 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <SchoolIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                    {course.department || 'Department TBD'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                    Semester {course.semester || 'TBD'}
                                  </Typography>
                                </Box>

                                {/* Schedule Information */}
                                {course.schedule?.days && course.schedule.days.length > 0 && (
                                  <Box className="faculty-course-schedule" sx={{ mb: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                      <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                      {course.schedule.days.join(', ')}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Student Enrollment */}
                                <Box className="faculty-course-enrollment" sx={{ mb: 1.5 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <PeopleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                    {Array.isArray(course.students) ? course.students.length : 0} students enrolled
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min((Array.isArray(course.students) ? course.students.length : 0) / (course.capacity || 50) * 100, 100)}
                                    sx={{ height: 4, borderRadius: 2 }}
                                  />
                                </Box>

                                {/* Attendance Statistics */}
                                <Box className="faculty-course-attendance" sx={{ mb: 1.5 }}>
                                  {course.totalSessions > 0 ? (
                                    <>
                                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                        <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                        {course.attendanceRate || 0}% attendance rate
                                      </Typography>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                          {course.totalSessions || 0} sessions taken
                                        </Typography>
                                        {course.lastAttendanceDate && (
                                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            Last: {new Date(course.lastAttendanceDate).toLocaleDateString()}
                                          </Typography>
                                        )}
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip
                                          label={`${course.totalPresent || 0} present`}
                                          size="small"
                                          variant="outlined"
                                          color="success"
                                          sx={{ fontSize: '0.7rem' }}
                                        />
                                        <Chip
                                          label={`${course.totalAbsent || 0} absent`}
                                          size="small"
                                          variant="outlined"
                                          color="error"
                                          sx={{ fontSize: '0.7rem' }}
                                        />
                                      </Box>
                                    </>
                                  ) : (
                                    <Box sx={{ textAlign: 'center', py: 1 }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                                        <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5, color: '#ccc' }} />
                                        No attendance records yet
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        Take attendance to see statistics
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>

                                <Box className="faculty-course-actions">
                                  <Box className="faculty-action-buttons">
                                    <Tooltip title="Take Attendance">
                                      <IconButton 
                                        color="primary"
                                        onClick={() => navigate(`/faculty/attendance?courseId=${course.id}`)}
                                        className="faculty-action-icon"
                                      >
                                        <AssignmentIcon />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Low Attendance Alert">
                                      <IconButton
                                        color="warning"
                                        onClick={() => viewLowAttendance(course.id)}
                                        className="faculty-action-icon"
                                      >
                                        <WarningIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>

                                {applyError[course.id] && (
                                  <Alert severity="error" className="faculty-error-message">
                                    {applyError[course.id]}
                                  </Alert>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Sidebar */}
              <Grid item xs={12} lg={4}>
                <Grid container spacing={3}>
                  {/* Admin Notifications Section */}
                  <Grid item xs={12}>
                    <Card className="faculty-content-card">
                      <CardContent>
                        <Box className="faculty-section-header">
                          <Typography variant="h5" className="faculty-section-title">
                            <NotificationsIcon className="faculty-section-icon" />
                            Admin Notifications
                          </Typography>
                          <Chip
                            label={`${adminNotifications.filter(n => n.sender?.role === 'admin').length} notifications`}
                            color="secondary"
                            size="small"
                          />
                        </Box>

                        {adminNotifications.filter(n => n.sender?.role === 'admin').length === 0 ? (
                          <Box className="faculty-empty-state">
                            <NotificationsIcon className="faculty-empty-icon" />
                            <Typography variant="h6" className="faculty-empty-title">
                              No admin notifications
                            </Typography>
                            <Typography variant="body2" className="faculty-empty-description">
                              You'll see notifications from administrators here.
                            </Typography>
                          </Box>
                        ) : (
                          <Box className="faculty-admin-notifications-list">
                            {adminNotifications
                              .filter(n => n.sender?.role === 'admin')
                              .slice(0, 5)
                              .map((notification) => (
                                <Card key={notification._id} className="faculty-admin-notification-item" sx={{ mb: 2 }}>
                                  <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                                        {notification.title}
                                      </Typography>
                                      <Chip
                                        label={notification.priority}
                                        size="small"
                                        sx={{
                                          height: 16,
                                          fontSize: '0.6rem',
                                          bgcolor: notification.priority === 'urgent' ? '#d32f2f' : 
                                                   notification.priority === 'high' ? '#f57c00' : '#1976d2',
                                          color: 'white'
                                        }}
                                      />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                      {notification.message.length > 100 
                                        ? notification.message.substring(0, 100) + '...' 
                                        : notification.message}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                      </Typography>
                                      {!notification.isRead && (
                                        <Chip
                                          label="New"
                                          size="small"
                                          color="warning"
                                          sx={{ height: 16, fontSize: '0.6rem' }}
                                        />
                                      )}
                                    </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            {adminNotifications.filter(n => n.sender?.role === 'admin').length > 5 && (
                              <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                onClick={() => navigate('/notifications')}
                                sx={{ mt: 1 }}
                              >
                                View All Notifications
                              </Button>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Available Courses Section */}
                  <Grid item xs={12}>
                    <Card className="faculty-content-card">
                      <CardContent>
                        <Box className="faculty-section-header">
                          <Typography variant="h5" className="faculty-section-title">
                            <AddIcon className="faculty-section-icon" />
                            Available Courses
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={`${availableCourses.length} available`}
                              color="secondary"
                              size="small"
                            />
                            <IconButton 
                              size="small" 
                              onClick={handleRefreshAppliedCourses}
                              title="Refresh applied courses"
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Box>
                        </Box>

                        {availableCourses.length === 0 ? (
                          <Box className="faculty-empty-state">
                            <AddIcon className="faculty-empty-icon" />
                            <Typography variant="h6" className="faculty-empty-title">
                              {!dashboardData.isApproved ? 'Account Not Approved' : 'No courses available'}
                            </Typography>
                            <Typography variant="body2" className="faculty-empty-description">
                              {!dashboardData.isApproved 
                                ? 'You need administrator approval before you can apply for courses.' 
                                : 'Check back later for new course opportunities.'}
                            </Typography>
                          </Box>
                        ) : (
                          <Box className="faculty-available-courses-list">
                            {availableCourses.map((course) => (
                              <Card key={course._id || course.id} className="faculty-available-course-item">
                                <CardContent>
                                  <Typography variant="h6" className="faculty-course-name">
                                    {course.courseName || course.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" className="faculty-course-details">
                                    {(course.courseCode || course.code) +
                                      (course.department ? ` | ${course.department}` : '') +
                                      (course.semester ? ` | Semester ${course.semester}` : '')}
                                  </Typography>

                                  <Box className="faculty-apply-section">
                                    {(() => {
                                      const courseId = course._id || course.id;
                                      const isApplied = appliedCourses.includes(courseId);
                                      console.log(`Course: ${course.courseName || course.name}, ID: ${courseId}, Applied: ${isApplied}, AppliedCourses:`, appliedCourses);
                                      
                                      if (!dashboardData.isApproved) {
                                        return (
                                          <Button
                                            variant="outlined"
                                            color="warning"
                                            size="small"
                                            disabled
                                            startIcon={<ErrorIcon />}
                                            fullWidth
                                          >
                                            Account Not Approved
                                          </Button>
                                        );
                                      }
                                      
                                      return !isApplied ? (
                                        <Button
                                          variant="contained"
                                          color="primary"
                                          size="small"
                                          onClick={() => handleApply(courseId)}
                                          disabled={applyLoading[courseId]}
                                          startIcon={<AddIcon />}
                                          fullWidth
                                        >
                                          {applyLoading[courseId] ? 'Applying...' : 'Apply Now'}
                                        </Button>
                                      ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                          <Chip
                                            icon={<CheckCircleIcon />}
                                            label="Application Submitted"
                                            color="success"
                                            size="small"
                                            fullWidth
                                            sx={{ 
                                              backgroundColor: '#4caf50',
                                              color: 'white',
                                              fontWeight: 600
                                            }}
                                          />
                                          <Button
                                            variant="outlined"
                                            color="warning"
                                            size="small"
                                            onClick={() => handleWithdrawApplication(courseId)}
                                            disabled={applyLoading[courseId]}
                                            startIcon={<DeleteOutline />}
                                            fullWidth
                                          >
                                            {applyLoading[courseId] ? 'Withdrawing...' : 'Withdraw Application'}
                                          </Button>
                                        </Box>
                                      );
                                    })()}
                                  </Box>

                                  {applyError[course._id || course.id] && (
                                    <Alert severity="error" className="faculty-error-message">
                                      {applyError[course._id || course.id]}
                                    </Alert>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </Container>

      {/* Send Notification Modal */}
      <SendNotificationModal
        open={sendNotificationOpen}
        onClose={() => setSendNotificationOpen(false)}
        onSuccess={handleNotificationSuccess}
      />
    </div>
  );
};

export default FacultyDashboard; 