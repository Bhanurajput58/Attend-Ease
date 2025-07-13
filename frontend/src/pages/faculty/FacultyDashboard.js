import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, CircularProgress, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { api, API_ENDPOINTS } from '../../config/api';
import '../../styles/DashboardPage.css';
import WarningIcon from '@mui/icons-material/Warning';
import EmailIcon from '@mui/icons-material/Email';

/**
 * Faculty Dashboard Component
 * Displays faculty information, course data, and attendance overview
 */
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
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching faculty dashboard data');
        
        // Use the configured api instance
        const response = await api.get(API_ENDPOINTS.GET_FACULTY_DASHBOARD);
        
        console.log('Dashboard API response:', response.data);
        
        // Check if the response is just an API status message rather than actual data
        if (response.data && response.data.status === 'online' && response.data.message === 'API is running') {
          console.log('API is online but returned status message instead of data, using mock data');
          
          // Use mock data as fallback
          const mockDashboardData = {
            activeCourses: 3,
            totalStudents: 45,
            averageAttendance: 87,
            recentActivity: [
              {
                id: 'mock1',
                date: new Date().toISOString(),
                course: { id: 'c1', name: 'Operating Systems', code: 'CS2006' },
                studentsPresent: 28,
                studentsAbsent: 4,
                totalStudents: 32,
                percentage: 87.5
              },
              {
                id: 'mock2',
                date: new Date(Date.now() - 86400000).toISOString(), // yesterday
                course: { id: 'c2', name: 'Design & Analysis of Algorithm', code: 'CS2007' },
                studentsPresent: 25,
                studentsAbsent: 3,
                totalStudents: 28,
                percentage: 89.3
              }
            ],
            coursesList: [
              { id: 'c1', name: 'Operating Systems', code: 'CS2006' },
              { id: 'c2', name: 'Design & Analysis of Algorithm', code: 'CS2007' },
              { id: 'c3', name: 'Computer Networks', code: 'CS2008' }
            ]
          };
          
          setDashboardData({
            ...mockDashboardData,
            facultyName: user?.name || 'Faculty Member'
          });
          
          setError('Backend returned API status instead of dashboard data. Using mock data.');
          return;
        }
        
        if (response.data.success && response.data.data) {
          // Check if coursesList exists in the response
          console.log('Courses list from API:', response.data.data.coursesList || 'No courses data provided');
          
          setDashboardData({
            activeCourses: response.data.data.activeCourses || 0,
            totalStudents: response.data.data.totalStudents || 0,
            averageAttendance: response.data.data.averageAttendance || 0,
            recentActivity: response.data.data.recentActivity || [],
            coursesList: response.data.data.coursesList || [],
            facultyName: user?.name || 'Faculty Member'
          });
        } else {
          console.error('Invalid response format:', response.data);
          
          // Use mock data as fallback
          const mockDashboardData = {
            activeCourses: 3,
            totalStudents: 45,
            averageAttendance: 87,
            recentActivity: [
              {
                id: 'mock1',
                date: new Date().toISOString(),
                course: { id: 'c1', name: 'Operating Systems', code: 'CS2006' },
                studentsPresent: 28,
                studentsAbsent: 4,
                totalStudents: 32,
                percentage: 87.5
              },
              {
                id: 'mock2',
                date: new Date(Date.now() - 86400000).toISOString(), // yesterday
                course: { id: 'c2', name: 'Design & Analysis of Algorithm', code: 'CS2007' },
                studentsPresent: 25,
                studentsAbsent: 3,
                totalStudents: 28,
                percentage: 89.3
              }
            ],
            coursesList: [
              { id: 'c1', name: 'Operating Systems', code: 'CS2006' },
              { id: 'c2', name: 'Design & Analysis of Algorithm', code: 'CS2007' },
              { id: 'c3', name: 'Computer Networks', code: 'CS2008' }
            ]
          };
          
          setDashboardData({
            ...mockDashboardData,
            facultyName: user?.name || 'Faculty Member'
          });
          
          setError('Failed to load dashboard data. Using mock data instead.');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Use mock data as fallback
        const mockDashboardData = {
          activeCourses: 3,
          totalStudents: 45,
          averageAttendance: 87,
          recentActivity: [
            {
              id: 'mock1',
              date: new Date().toISOString(),
              course: { id: 'c1', name: 'Operating Systems', code: 'CS2006' },
              studentsPresent: 28,
              studentsAbsent: 4,
              totalStudents: 32,
              percentage: 87.5
            },
            {
              id: 'mock2',
              date: new Date(Date.now() - 86400000).toISOString(), // yesterday
              course: { id: 'c2', name: 'Design & Analysis of Algorithm', code: 'CS2007' },
              studentsPresent: 25,
              studentsAbsent: 3,
              totalStudents: 28,
              percentage: 89.3
            }
          ],
          coursesList: [
            { id: 'c1', name: 'Operating Systems', code: 'CS2006' },
            { id: 'c2', name: 'Design & Analysis of Algorithm', code: 'CS2007' },
            { id: 'c3', name: 'Computer Networks', code: 'CS2008' }
          ]
        };
        
        setDashboardData({
          ...mockDashboardData,
          facultyName: user?.name || 'Faculty Member'
        });
        
        setError('Error connecting to server. Using mock data instead.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, user?.name]);

  const handleTakeAttendance = () => {
    navigate('/faculty/attendance');
  };

  const viewAttendanceHistory = (activityId) => {
    console.log('Viewing attendance details for activity:', activityId);
    
    // Find the activity data by ID
    const activity = dashboardData.recentActivity.find(act => act.id === activityId);
    
    if (activity) {
      // Store the selected activity data in session storage
      try {
        sessionStorage.setItem('selectedActivity', JSON.stringify(activity));
        console.log('Stored activity in session storage:', activity);
      } catch (error) {
        console.error('Error storing activity data:', error);
      }
    }
    
    // Navigate to the attendance detail page with the activity ID
    navigate(`/faculty/attendance/${activityId}`);
  };
  
  const handleViewReports = () => {
    navigate('/reports/attendance');
  };

  const viewLowAttendance = (courseId) => {
    console.log('Viewing low attendance for course:', courseId);
    navigate(`/faculty/low-attendance/${courseId}`);
  };

  const handleViewAllStudents = () => {
    console.log('Viewing all students');
    navigate('/faculty/students');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <Box sx={{ display: 'flex', gap: 2 }}>
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
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', my: 4, color: 'error.main' }}>
              <Typography variant="h6">{error}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Using mock data instead
              </Typography>
            </Box>
          ) : dashboardData.activeCourses === 0 ? (
            <Box sx={{ textAlign: 'center', my: 4, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
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
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Overview Card */}
              <Grid item xs={12} md={6} lg={4}>
                <Paper className="dashboard-card">
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Overview
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {dashboardData.activeCourses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active courses
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Students Card */}
              <Grid item xs={12} md={6} lg={4}>
                <Paper className="dashboard-card">
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Students
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {dashboardData.totalStudents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                  </Box>
                </Paper>
              </Grid>

              {/* Attendance Card */}
              <Grid item xs={12} md={6} lg={4}>
                <Paper className="dashboard-card">
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Attendance Rate
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {dashboardData.averageAttendance}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average attendance rate
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Courses Section */}
              <Grid item xs={12}>
                <Paper className="dashboard-card">
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Courses
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {dashboardData.coursesList.length === 0 ? (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            No courses assigned yet.
                          </Typography>
                        </Grid>
                      ) : (
                        dashboardData.coursesList.map((course) => (
                          <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Paper
                              elevation={2}
                              sx={{
                                p: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 2,
                                '&:hover': {
                                  boxShadow: 4,
                                },
                              }}
                            >
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="h6">{course.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {course.code}
                                </Typography>
                              </Box>

                              <Box sx={{ mt: 'auto', display: 'flex', gap: 1, pt: 1 }}>
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
                              </Box>
                            </Paper>
                          </Grid>
                        ))
                      )}
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              {/* Recent Activity Table */}
              <Grid item xs={12}>
                <Paper className="dashboard-card">
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Recent Attendance Activity
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
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
                                  <div className="attendance-indicator" style={{ position: 'relative', width: '100%', height: '24px', backgroundColor: '#eee', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div 
                                      className={`attendance-bar ${
                                        activity.attendanceRate >= 90 ? 'status-excellent' :
                                        activity.attendanceRate >= 80 ? 'status-good' :
                                        activity.attendanceRate >= 70 ? 'status-average' : 'status-poor'
                                      }`}
                                      style={{ 
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        height: '100%',
                                        width: `${activity.attendanceRate}%`,
                                        transition: 'width 0.3s ease'
                                      }}
                                    ></div>
                                    <span style={{
                                      position: 'absolute',
                                      left: '50%',
                                      top: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      color: '#000',
                                      fontSize: '0.875rem',
                                      fontWeight: 500,
                                      zIndex: 1
                                    }}>
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
                              <td colSpan="5" style={{ textAlign: 'center' }}>
                                No recent activity found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </Box>
                  </Box>
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