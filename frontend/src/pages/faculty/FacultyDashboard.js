import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, CircularProgress, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { api, API_ENDPOINTS } from '../../config/api';
import './FacultyDashboard.css';
import WarningIcon from '@mui/icons-material/Warning';

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
        const response = await api.get('/api/courses/available');
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <Container maxWidth="lg">
          <div className="dashboard-header">
            <div>
              <Typography variant="h4" component="h1" gutterBottom>
                Faculty Dashboard
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Welcome, {user?.roleData?.fullName || user?.name || 'Faculty Member'}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Manage your courses and student attendance
              </Typography>
            </div>
            <div className="dashboard-header-actions">
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleViewReports}
                disabled={dashboardData.activeCourses === 0}
              >
                Attendance Reports
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleTakeAttendance}
                disabled={dashboardData.activeCourses === 0}
              >
                Take Attendance
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="centered-box">
              <CircularProgress />
            </div>
          ) : error ? (
            <div className="text-center mb-2" style={{ color: 'red' }}>
              <Typography variant="h6">{error}</Typography>
              <Typography variant="body2" className="mt-1">
                No data available
              </Typography>
            </div>
          ) : dashboardData.activeCourses === 0 ? (
            <div className="text-center p-4 bg-paper border-radius-2">
              <WarningIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Courses Assigned
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {dashboardData.message || 'You currently don\'t have any courses assigned to you.'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please contact your administrator to get courses assigned to your account.
              </Typography>
            </div>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6} lg={4}>
                <Paper className="dashboard-card">
                  <div className="p-2">
                    <Typography variant="h6" gutterBottom>
                      Overview
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {dashboardData.activeCourses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active courses
                    </Typography>
                    <div style={{ minHeight: 32 }} /> {/* Placeholder for future overview data */}
                  </div>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <Paper className="dashboard-card">
                  <div className="p-2">
                    <Typography variant="h6" gutterBottom>
                      Students
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {dashboardData.totalStudents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="mb-2">
                      Total students
                    </Typography>
                    <Button 
                      variant="outlined"
                      size="small"
                      onClick={handleViewAllStudents}
                      disabled={dashboardData.totalStudents === 0}
                      fullWidth
                    >
                      View All Students
                    </Button>
                    <div style={{ minHeight: 32 }} /> {/* Placeholder for future students data */}
                  </div>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <Paper className="dashboard-card">
                  <div className="p-2">
                    <Typography variant="h6" gutterBottom>
                      Attendance Rate
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {dashboardData.averageAttendance}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average attendance rate
                    </Typography>
                    <div style={{ minHeight: 32 }} /> {/* Placeholder for future attendance data */}
                  </div>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper className="dashboard-card">
                  <div className="p-3">
                    <Typography variant="h6" gutterBottom>
                      Courses
                    </Typography>
                    <Grid container spacing={2} className="mt-1">
                      {dashboardData.coursesList.length === 0 ? (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            No courses assigned yet.
                          </Typography>
                          <div style={{ minHeight: 32 }} /> {/* Placeholder for future courses data */}
                        </Grid>
                      ) : (
                        dashboardData.coursesList.map((course) => (
                          <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Paper elevation={2} className="paper-course">
                              <div className="paper-course-content">
                                <Typography variant="h6">{course.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {course.code}
                                </Typography>
                              </div>
                              <div className="paper-course-actions">
                                {/* Show Apply button if not already applied or assigned */}
                                {!appliedCourses.includes(course.id) && !course.instructor && (
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleApply(course.id)}
                                    disabled={applyLoading[course.id]}
                                  >
                                    {applyLoading[course.id] ? 'Applying...' : 'Apply'}
                                  </Button>
                                )}
                                {appliedCourses.includes(course.id) && !course.instructor && (
                                  <Typography variant="body2" color="success.main">Applied</Typography>
                                )}
                                {course.instructor && (
                                  <Typography variant="body2" color="primary">Assigned</Typography>
                                )}
                                <Button 
                                  variant="outlined"
                                  size="small"
                                  onClick={() => navigate(`/faculty/attendance?courseId=${course.id}`)}
                                >
                                  Take Attendance
                                </Button>
                                <Button 
                                  variant="outlined"
                                  size="small"
                                  color="secondary"
                                  startIcon={<WarningIcon />}
                                  onClick={() => viewLowAttendance(course.id)}
                                >
                                  Low Attendance
                                </Button>
                              </div>
                              {applyError[course.id] && (
                                <Typography variant="body2" color="error">{applyError[course.id]}</Typography>
                              )}
                              <div style={{ minHeight: 24 }} /> {/* Placeholder for future course card data */}
                            </Paper>
                          </Grid>
                        ))
                      )}
                    </Grid>
                  </div>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Always show available courses section, even if no assigned courses */}
          {availableCourses.length > 0 && (
            <Paper className="dashboard-card" style={{ marginTop: 32 }}>
              <div className="p-3">
                <Typography variant="h6" gutterBottom>
                  Available Courses to Apply
                </Typography>
                <Grid container spacing={2} className="mt-1">
                  {availableCourses.map((course) => (
                    <Grid item xs={12} sm={6} md={4} key={course._id}>
                      <Paper elevation={1} className="paper-course">
                        <div className="paper-course-content">
                          <Typography variant="h6">{course.courseName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {course.courseCode} | {course.department} | Semester {course.semester}
                          </Typography>
                        </div>
                        <div className="paper-course-actions">
                          {!appliedCourses.includes(course._id) ? (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleApply(course._id)}
                              disabled={applyLoading[course._id]}
                            >
                              {applyLoading[course._id] ? 'Applying...' : 'Apply'}
                            </Button>
                          ) : (
                            <Typography variant="body2" color="success.main">Applied</Typography>
                          )}
                        </div>
                        {applyError[course._id] && (
                          <Typography variant="body2" color="error">{applyError[course._id]}</Typography>
                        )}
                        <div style={{ minHeight: 24 }} />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </div>
            </Paper>
          )}
        </Container>
      </div>
    </div>
  );
};

export default FacultyDashboard; 