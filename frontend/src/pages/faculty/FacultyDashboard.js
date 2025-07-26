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

const FacultyDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    activeCourses: 0,
    totalStudents: 0,
    averageAttendance: 0,
    recentActivity: [],
    coursesList: [],
    facultyName: 'Faculty Member'
  });
  const [error, setError] = useState(null);
  const [appliedCourses, setAppliedCourses] = useState([]);
  const [applyLoading, setApplyLoading] = useState({});
  const [applyError, setApplyError] = useState({});
  const [availableCourses, setAvailableCourses] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(API_ENDPOINTS.GET_FACULTY_DASHBOARD);
        if (response.data.success && response.data.data) {
          setDashboardData({
            activeCourses: response.data.data.activeCourses || 0,
            totalStudents: response.data.data.totalStudents || 0,
            averageAttendance: response.data.data.averageAttendance || 0,
            recentActivity: response.data.data.recentActivity || [],
            coursesList: response.data.data.coursesList || [],
            facultyName: user?.name || 'Faculty Member'
          });
        } else {
          setDashboardData({
            activeCourses: 0,
            totalStudents: 0,
            averageAttendance: 0,
            recentActivity: [],
            coursesList: [],
            facultyName: user?.name || 'Faculty Member'
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
          facultyName: user?.name || 'Faculty Member'
        });
        setError('Error connecting to server.');
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchDashboardData();
    else navigate('/login');
  }, [isAuthenticated, navigate, user?.name]);

  // Fetch applied courses for this faculty
  useEffect(() => {
    const fetchAppliedCourses = async () => {
      try {
        const response = await api.get('/api/faculty/applied-courses');
        if (response.data.success && Array.isArray(response.data.data)) {
          setAppliedCourses(response.data.data.map(app => app.course));
        }
      } catch {}
    };
    if (isAuthenticated) fetchAppliedCourses();
  }, [isAuthenticated]);

  // Fetch available (unassigned) courses
  useEffect(() => {
    const fetchAvailableCourses = async () => {
      try {
        // Fetch only courses with assigned: false
        const response = await api.get('/api/courses?assigned=false');
        if (response.data.success && Array.isArray(response.data.data)) {
          setAvailableCourses(response.data.data);
        }
      } catch {}
    };
    if (isAuthenticated) fetchAvailableCourses();
  }, [isAuthenticated]);

  const handleTakeAttendance = () => navigate('/faculty/attendance');
  const viewAttendanceHistory = (activityId) => {
    const activity = dashboardData.recentActivity.find(act => act.id === activityId);
    if (activity) sessionStorage.setItem('selectedActivity', JSON.stringify(activity));
    navigate(`/faculty/attendance/${activityId}`);
  };
  const handleViewReports = () => navigate('/reports/attendance');
  const viewLowAttendance = (courseId) => navigate(`/faculty/low-attendance/${courseId}`);
  const handleViewAllStudents = () => navigate('/faculty/students');

  // Handler for applying to a course
  const handleApply = async (courseId) => {
    setApplyLoading(prev => ({ ...prev, [courseId]: true }));
    setApplyError(prev => ({ ...prev, [courseId]: null }));
    try {
      const response = await api.post(`/api/courses/${courseId}/apply`);
      if (response.data.success) {
        setAppliedCourses(prev => [...prev, courseId]);
      } else {
        setApplyError(prev => ({ ...prev, [courseId]: response.data.message || 'Failed to apply' }));
      }
    } catch (err) {
      setApplyError(prev => ({ ...prev, [courseId]: 'Failed to apply' }));
    } finally {
      setApplyLoading(prev => ({ ...prev, [courseId]: false }));
    }
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
      <div className="dashboard-container">
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
    <div className="dashboard-container">
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box className="dashboard-header-section">
          <Box className="welcome-section">
            <Avatar className="faculty-avatar">
              <PersonIcon />
            </Avatar>
            <Box className="welcome-text">
              <Typography variant="h3" className="welcome-title">
                Welcome back, {user?.roleData?.fullName || user?.name || 'Faculty Member'}!
              </Typography>
              <Typography variant="subtitle1" className="welcome-subtitle">
                Here's what's happening with your courses today
              </Typography>
            </Box>
          </Box>
          <Box className="header-actions">
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<AssessmentIcon />}
              onClick={handleViewReports}
              disabled={dashboardData.activeCourses === 0}
              className="action-button"
            >
              Reports
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AssignmentIcon />}
              onClick={handleTakeAttendance}
              disabled={dashboardData.activeCourses === 0}
              className="action-button primary"
            >
              Take Attendance
            </Button>
          </Box>
        </Box>

        {error ? (
          <Alert severity="error" className="error-alert">
            <Typography variant="h6">{error}</Typography>
            <Typography variant="body2">
              No data available at the moment. Please try refreshing the page.
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Statistics Cards */}
            <Grid container spacing={3} className="stats-section">
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stat-card active-courses">
                  <CardContent>
                    <Box className="stat-icon">
                      <SchoolIcon />
                    </Box>
                    <Typography variant="h2" className="stat-number">
                      {dashboardData.activeCourses}
                    </Typography>
                    <Typography variant="h6" className="stat-label">
                      Active Courses
                    </Typography>
                    <Typography variant="body2" className="stat-description">
                      Currently teaching
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stat-card total-students">
                  <CardContent>
                    <Box className="stat-icon">
                      <PeopleIcon />
                    </Box>
                    <Typography variant="h2" className="stat-number">
                      {dashboardData.totalStudents}
                    </Typography>
                    <Typography variant="h6" className="stat-label">
                      Total Students
                    </Typography>
                    <Typography variant="body2" className="stat-description">
                      Across all courses
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stat-card attendance-rate">
                  <CardContent>
                    <Box className="stat-icon">
                      <TrendingUpIcon />
                    </Box>
                    <Typography variant="h2" className="stat-number">
                      {dashboardData.averageAttendance}%
                    </Typography>
                    <Typography variant="h6" className="stat-label">
                      Attendance Rate
                    </Typography>
                    <Box className="attendance-progress">
                      <LinearProgress 
                        variant="determinate" 
                        value={dashboardData.averageAttendance} 
                        className="progress-bar"
                        style={{ backgroundColor: '#e0e0e0' }}
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getAttendanceColor(dashboardData.averageAttendance)
                          }
                        }}
                      />
                      <Typography variant="caption" className="progress-label">
                        {getAttendanceStatus(dashboardData.averageAttendance)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stat-card quick-actions">
                  <CardContent>
                    <Box className="stat-icon">
                      <HistoryIcon />
                    </Box>
                    <Typography variant="h6" className="stat-label">
                      Quick Actions
                    </Typography>
                    <Box className="quick-actions-buttons">
                      <Button 
                        variant="outlined"
                        size="small"
                        onClick={handleViewAllStudents}
                        disabled={dashboardData.totalStudents === 0}
                        fullWidth
                        className="quick-action-btn"
                      >
                        View Students
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Main Content Grid */}
            <Grid container spacing={3} className="main-content">
              {/* Assigned Courses Section */}
              <Grid item xs={12} lg={8}>
                <Card className="content-card">
                  <CardContent>
                    <Box className="section-header">
                      <Typography variant="h5" className="section-title">
                        <SchoolIcon className="section-icon" />
                        My Courses
                      </Typography>
                      <Chip 
                        label={`${dashboardData.coursesList.length} courses`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    
                    {dashboardData.coursesList.length === 0 ? (
                      <Box className="empty-state">
                        <SchoolIcon className="empty-icon" />
                        <Typography variant="h6" className="empty-title">
                          No courses assigned yet
                        </Typography>
                        <Typography variant="body2" className="empty-description">
                          You'll see your assigned courses here once they're available.
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2} className="courses-grid">
                        {dashboardData.coursesList.map((course) => (
                          <Grid item xs={12} sm={6} key={course.id}>
                            <Card className="course-card">
                              <CardContent>
                                <Box className="course-header">
                                  <Typography variant="h6" className="course-name">
                                    {course.name}
                                  </Typography>
                                  <Chip 
                                    label={course.code}
                                    size="small"
                                    variant="outlined"
                                    className="course-code"
                                  />
                                </Box>
                                
                                <Box className="course-status">
                                  {!appliedCourses.includes(course.id) && !course.instructor && (
                                    <Chip 
                                      icon={<PendingIcon />}
                                      label="Available"
                                      color="warning"
                                      size="small"
                                    />
                                  )}
                                  {appliedCourses.includes(course.id) && !course.instructor && (
                                    <Chip 
                                      icon={<PendingIcon />}
                                      label="Applied"
                                      color="info"
                                      size="small"
                                    />
                                  )}
                                  {course.instructor && (
                                    <Chip 
                                      icon={<CheckCircleIcon />}
                                      label="Assigned"
                                      color="success"
                                      size="small"
                                    />
                                  )}
                                </Box>
                                
                                <Box className="course-actions">
                                  {!appliedCourses.includes(course.id) && !course.instructor && (
                                    <Button
                                      variant="contained"
                                      color="primary"
                                      size="small"
                                      onClick={() => handleApply(course.id)}
                                      disabled={applyLoading[course.id]}
                                      startIcon={<AddIcon />}
                                      fullWidth
                                    >
                                      {applyLoading[course.id] ? 'Applying...' : 'Apply'}
                                    </Button>
                                  )}
                                  
                                  <Box className="action-buttons">
                                    <Tooltip title="Take Attendance">
                                      <IconButton 
                                        color="primary"
                                        onClick={() => navigate(`/faculty/attendance?courseId=${course.id}`)}
                                        className="action-icon"
                                      >
                                        <AssignmentIcon />
                                      </IconButton>
                                    </Tooltip>
                                    
                                    <Tooltip title="Low Attendance Alert">
                                      <IconButton 
                                        color="warning"
                                        onClick={() => viewLowAttendance(course.id)}
                                        className="action-icon"
                                      >
                                        <WarningIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                                
                                {applyError[course.id] && (
                                  <Alert severity="error" className="error-message">
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

              {/* Available Courses Section */}
              <Grid item xs={12} lg={4}>
                <Card className="content-card">
                  <CardContent>
                    <Box className="section-header">
                      <Typography variant="h5" className="section-title">
                        <AddIcon className="section-icon" />
                        Available Courses
                      </Typography>
                      <Chip 
                        label={`${availableCourses.length} available`}
                        color="secondary"
                        size="small"
                      />
                    </Box>
                    
                    {availableCourses.length === 0 ? (
                      <Box className="empty-state">
                        <AddIcon className="empty-icon" />
                        <Typography variant="h6" className="empty-title">
                          No courses available
                        </Typography>
                        <Typography variant="body2" className="empty-description">
                          Check back later for new course opportunities.
                        </Typography>
                      </Box>
                    ) : (
                      <Box className="available-courses-list">
                        {availableCourses.map((course) => (
                          <Card key={course._id || course.id} className="available-course-item">
                            <CardContent>
                              <Typography variant="h6" className="course-name">
                                {course.courseName || course.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" className="course-details">
                                {(course.courseCode || course.code) + 
                                 (course.department ? ` | ${course.department}` : '') + 
                                 (course.semester ? ` | Semester ${course.semester}` : '')}
                              </Typography>
                              
                              <Box className="apply-section">
                                {!appliedCourses.includes(course._id || course.id) ? (
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleApply(course._id || course.id)}
                                    disabled={applyLoading[course._id || course.id]}
                                    startIcon={<AddIcon />}
                                    fullWidth
                                  >
                                    {applyLoading[course._id || course.id] ? 'Applying...' : 'Apply Now'}
                                  </Button>
                                ) : (
                                  <Chip 
                                    icon={<CheckCircleIcon />}
                                    label="Applied"
                                    color="success"
                                    size="small"
                                    fullWidth
                                  />
                                )}
                              </Box>
                              
                              {applyError[course._id || course.id] && (
                                <Alert severity="error" className="error-message">
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
          </>
        )}
      </Container>
    </div>
  );
};

export default FacultyDashboard; 