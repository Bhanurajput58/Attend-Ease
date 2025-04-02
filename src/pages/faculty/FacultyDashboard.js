import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, CircularProgress, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import axios from 'axios';
import '../../styles/DashboardPage.css';

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
    coursesList: [] 
  });
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching faculty dashboard data');
        
        // The token is automatically sent via cookie
        const response = await axios.get(API_ENDPOINTS.GET_FACULTY_DASHBOARD, {
          withCredentials: true
        });
        
        console.log('Dashboard API response:', response.data);
        
        if (response.data.success && response.data.data) {
          // Check if coursesList exists in the response
          console.log('Courses list from API:', response.data.data.coursesList || 'No courses data provided');
          
          setDashboardData({
            activeCourses: response.data.data.activeCourses || 0,
            totalStudents: response.data.data.totalStudents || 0,
            averageAttendance: response.data.data.averageAttendance || 0,
            recentActivity: response.data.data.recentActivity || [],
            coursesList: response.data.data.coursesList || []
          });
          console.log('Dashboard data updated with courses:', response.data.data.coursesList || []);
        } else {
          console.error('Failed to fetch dashboard data:', response.data);
          setError('Failed to load dashboard data. Please try again later.');
          // Use mock data as fallback
          const mockCourses = [
            { id: '1', name: 'Advanced Mathematics' },
            { id: '2', name: 'Physics 101' },
            { id: '3', name: 'Chemistry Lab' },
            { id: '4', name: 'Computer Science Fundamentals' },
            { id: '5', name: 'Data Structures and Algorithms' }
          ];
          console.log('Using fallback mock data with courses:', mockCourses);
          
          setDashboardData({
            activeCourses: 5,
            totalStudents: 150,
            averageAttendance: 92,
            recentActivity: [
              {
                id: '1',
                date: '2024-03-15',
                course: 'Advanced Mathematics',
                studentsPresent: '45/50',
                attendanceRate: 90
              },
              {
                id: '2',
                date: '2024-03-14',
                course: 'Physics 101',
                studentsPresent: '48/50',
                attendanceRate: 96
              },
              {
                id: '3',
                date: '2024-03-13',
                course: 'Chemistry Lab',
                studentsPresent: '42/50',
                attendanceRate: 84
              }
            ],
            coursesList: mockCourses
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(`Failed to load dashboard data: ${error.message}`);
        // Use mock data as fallback
        const mockCourses = [
          { id: '1', name: 'Advanced Mathematics' },
          { id: '2', name: 'Physics 101' },
          { id: '3', name: 'Chemistry Lab' },
          { id: '4', name: 'Computer Science Fundamentals' },
          { id: '5', name: 'Data Structures and Algorithms' }
        ];
        console.log('Using fallback mock data with courses:', mockCourses);
        
        setDashboardData({
          activeCourses: 5,
          totalStudents: 150,
          averageAttendance: 92,
          recentActivity: [
            {
              id: '1',
              date: '2024-03-15',
              course: 'Advanced Mathematics',
              studentsPresent: '45/50',
              attendanceRate: 90
            },
            {
              id: '2',
              date: '2024-03-14',
              course: 'Physics 101',
              studentsPresent: '48/50',
              attendanceRate: 96
            },
            {
              id: '3',
              date: '2024-03-13',
              course: 'Chemistry Lab',
              studentsPresent: '42/50',
              attendanceRate: 84
            }
          ],
          coursesList: mockCourses
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      console.log('User is not authenticated');
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleTakeAttendance = () => {
    navigate('/faculty/attendance');
  };

  const viewAttendanceHistory = (activityId) => {
    console.log('Viewing attendance details for activity:', activityId);
    // Navigate to the attendance detail page with the activity ID
    navigate(`/faculty/attendance/${activityId}`);
  };
  
  const handleViewReports = () => {
    navigate('/reports/attendance');
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
                Manage your courses and student attendance
              </Typography>
            </div>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleViewReports}
              >
                Attendance Reports
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleTakeAttendance}
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
                    <Typography variant="body2" color="text.secondary">
                      Total students
                    </Typography>
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

              {/* Courses List */}
              <Grid item xs={12} md={6}>
                <Paper className="dashboard-card">
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Your Courses
                    </Typography>
                    <Box sx={{ overflowY: 'auto', maxHeight: '200px' }}>
                      {dashboardData.coursesList.length > 0 ? (
                        <ul className="courses-list">
                          {dashboardData.coursesList.map((course) => (
                            <li key={course.id} className="course-item">
                              <span className="course-name">{course.name}</span>
                              <Button 
                                variant="outlined" 
                                size="small"
                                onClick={() => navigate(`/faculty/attendance?courseId=${course.id}`)}
                              >
                                Take Attendance
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No courses found
                        </Typography>
                      )}
                    </Box>
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