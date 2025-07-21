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
              <Grid item xs={12}>
                <Paper className="dashboard-card">
                  <div className="p-2">
                    <Typography variant="h6" gutterBottom>
                      Recent Attendance Activity
                    </Typography>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Course</th>
                            <th>Students Present</th>
                            <th>Attendance Rate</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.recentActivity.length > 0 ? (
                            dashboardData.recentActivity.map((activity) => (
                              <tr key={activity.id}>
                                <td>{activity.date}</td>
                                <td>{activity.course}</td>
                                <td>{activity.studentsPresent}</td>
                                <td>
                                  <div className="attendance-indicator">
                                    <div 
                                      className={`attendance-bar ${
                                        activity.attendanceRate >= 90 ? 'status-excellent' :
                                        activity.attendanceRate >= 80 ? 'status-good' :
                                        activity.attendanceRate >= 70 ? 'status-average' : 'status-poor'
                                      }`}
                                      style={{ width: `${activity.attendanceRate}%` }}
                                    ></div>
                                    <span className="attendance-indicator-label">
                                      {activity.attendanceRate}%
                                    </span>
                                  </div>
                                </td>
                                <td className="action-buttons">
                                  <button 
                                    className="action-button" 
                                    onClick={() => viewAttendanceHistory(activity.id)}
                                    aria-label={`View attendance details for ${activity.course} on ${activity.date}`}
                                    title={`View attendance details for ${activity.course}`}
                                  >
                                    View Details
                                  </button>
                                  <button className="action-button edit" onClick={() => navigate(`/faculty/attendance/edit/${activity.id}`)}>
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center">
                                No recent activity found
                                <div style={{ minHeight: 32 }} /> {/* Placeholder for future activity data */}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Container>
      </div>
    </div>
  );
};

export default FacultyDashboard; 