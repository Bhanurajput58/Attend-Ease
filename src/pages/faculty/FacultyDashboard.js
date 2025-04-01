import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, CircularProgress, Button, Menu, MenuItem, IconButton, Divider } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import GetAppIcon from '@mui/icons-material/GetApp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import '../../styles/DashboardPage.css';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';

const FacultyDashboard = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    activeCourses: 0,
    totalStudents: 0,
    averageAttendance: 0,
    recentActivity: [],
    coursesList: [] // Added to store active courses for quick access
  });
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Menu states for the export options
  const [formatMenuAnchor, setFormatMenuAnchor] = useState(null);
  const [periodMenuAnchor, setPeriodMenuAnchor] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courseMenuAnchor, setCourseMenuAnchor] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching faculty dashboard data with token:', token ? 'Token exists' : 'No token');
        
        // Fetch dashboard data from API
        const response = await axios.get(API_ENDPOINTS.GET_FACULTY_DASHBOARD, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

    if (token) {
      fetchDashboardData();
    } else {
      console.log('No authentication token available');
      setLoading(false);
    }
  }, [token]);

  const handleTakeAttendance = () => {
    navigate('/faculty/attendance');
  };

  const viewAttendanceHistory = (activityId) => {
    navigate(`/faculty/attendance/${activityId}`);
  };
  
  // Functions for handling the export menus
  const handleFormatMenuOpen = (event) => {
    setFormatMenuAnchor(event.currentTarget);
  };

  const handleFormatMenuClose = () => {
    setFormatMenuAnchor(null);
  };

  const handlePeriodMenuOpen = (event) => {
    setPeriodMenuAnchor(event.currentTarget);
  };

  const handlePeriodMenuClose = () => {
    setPeriodMenuAnchor(null);
  };
  
  const handleCourseMenuOpen = (event) => {
    setCourseMenuAnchor(event.currentTarget);
  };

  const handleCourseMenuClose = () => {
    setCourseMenuAnchor(null);
  };
  
  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    handleFormatMenuClose();
  };

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    handlePeriodMenuClose();
  };
  
  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    handleCourseMenuClose();
  };

  const generateExportFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    const courseName = selectedCourse === 'all' 
      ? 'All-Courses' 
      : dashboardData.coursesList.find(c => c.id === selectedCourse)?.name.replace(/\s+/g, '-') || 'Course';
    
    return `Attendance-${courseName}-${selectedPeriod}-${date}.${selectedFormat === 'excel' ? 'xlsx' : 'pdf'}`;
  };

  const handleExportReport = async () => {
    try {
      setExportLoading(true);
      
      if (!token) {
        throw new Error('No authentication token available. Please log in again.');
      }
      
      console.log(`Exporting ${selectedPeriod} attendance report in ${selectedFormat} format for course: ${selectedCourse}`);
      console.log('Using token:', token ? `${token.substring(0, 10)}...` : 'No token available');
      
      // Get the date range based on the selected period
      const endDate = new Date();
      let startDate = new Date();
      
      switch(selectedPeriod) {
        case 'daily':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'semester':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        default:
          startDate.setHours(0, 0, 0, 0);
      }
      
      // Construct URL with query parameters
      const queryParams = new URLSearchParams({
        format: selectedFormat,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      if (selectedCourse !== 'all') {
        queryParams.append('courseId', selectedCourse);
      }
      
      const endpoint = `${API_ENDPOINTS.GET_ATTENDANCE}/export?${queryParams.toString()}`;
      console.log('Requesting export from endpoint:', endpoint);
      
      // Make the request with proper headers
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': selectedFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.message || `Failed to export report: ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a blob link to download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', generateExportFileName());
      
      // Append to html page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Report downloaded successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      if (error.message.includes('session has expired')) {
        // Redirect to login page
        navigate('/login');
      } else {
        alert(`Failed to export report: ${error.message}`);
      }
    } finally {
      setExportLoading(false);
    }
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
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleTakeAttendance}
              sx={{ height: 'fit-content' }}
            >
              Take Attendance
            </Button>
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

              {/* Export / Reports Section */}
              <Grid item xs={12}>
                <Paper className="dashboard-card">
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Export Attendance Reports
                    </Typography>
                    <Box className="export-controls">
                      <div className="export-section">
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Generate and download attendance reports in various formats
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                          {/* Format Selection */}
                          <div className="export-option">
                            <Button
                              variant="outlined"
                              onClick={handleFormatMenuOpen}
                              startIcon={selectedFormat === 'pdf' ? <PictureAsPdfIcon /> : <TableChartIcon />}
                              size="small"
                            >
                              {selectedFormat === 'pdf' ? 'PDF' : 'Excel'}
                            </Button>
                            <Menu
                              anchorEl={formatMenuAnchor}
                              open={Boolean(formatMenuAnchor)}
                              onClose={handleFormatMenuClose}
                            >
                              <MenuItem onClick={() => handleFormatSelect('pdf')}>
                                <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
                                PDF Format
                              </MenuItem>
                              <MenuItem onClick={() => handleFormatSelect('excel')}>
                                <TableChartIcon fontSize="small" sx={{ mr: 1 }} />
                                Excel Format
                              </MenuItem>
                            </Menu>
                          </div>
                          
                          {/* Time Period Selection */}
                          <div className="export-option">
                            <Button
                              variant="outlined"
                              onClick={handlePeriodMenuOpen}
                              startIcon={
                                selectedPeriod === 'daily' ? <CalendarTodayIcon /> : 
                                selectedPeriod === 'weekly' ? <ViewWeekIcon /> : 
                                <DateRangeIcon />
                              }
                              size="small"
                            >
                              {selectedPeriod === 'daily' ? 'Daily' : 
                               selectedPeriod === 'weekly' ? 'Weekly' : 
                               selectedPeriod === 'monthly' ? 'Monthly' : 'Semester'}
                            </Button>
                            <Menu
                              anchorEl={periodMenuAnchor}
                              open={Boolean(periodMenuAnchor)}
                              onClose={handlePeriodMenuClose}
                            >
                              <MenuItem onClick={() => handlePeriodSelect('daily')}>
                                <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                                Daily Report
                              </MenuItem>
                              <MenuItem onClick={() => handlePeriodSelect('weekly')}>
                                <ViewWeekIcon fontSize="small" sx={{ mr: 1 }} />
                                Weekly Report
                              </MenuItem>
                              <MenuItem onClick={() => handlePeriodSelect('monthly')}>
                                <DateRangeIcon fontSize="small" sx={{ mr: 1 }} />
                                Monthly Report
                              </MenuItem>
                              <MenuItem onClick={() => handlePeriodSelect('semester')}>
                                <DateRangeIcon fontSize="small" sx={{ mr: 1 }} />
                                Semester Report
                              </MenuItem>
                            </Menu>
                          </div>
                          
                          {/* Course Selection */}
                          <div className="export-option">
                            <Button
                              variant="outlined"
                              onClick={handleCourseMenuOpen}
                              size="small"
                            >
                              {selectedCourse === 'all' ? 'All Courses' : 
                               dashboardData.coursesList.find(c => c.id === selectedCourse)?.name || 'Select Course'}
                            </Button>
                            <Menu
                              anchorEl={courseMenuAnchor}
                              open={Boolean(courseMenuAnchor)}
                              onClose={handleCourseMenuClose}
                            >
                              <MenuItem onClick={() => handleCourseSelect('all')}>
                                All Courses
                              </MenuItem>
                              <Divider />
                              {dashboardData.coursesList && dashboardData.coursesList.length > 0 ? (
                                dashboardData.coursesList.map(course => (
                                  <MenuItem key={course.id} onClick={() => handleCourseSelect(course.id)}>
                                    {course.name}
                                  </MenuItem>
                                ))
                              ) : (
                                <MenuItem disabled>No courses available</MenuItem>
                              )}
                            </Menu>
                          </div>
                          
                          {/* Export Button */}
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<GetAppIcon />}
                            onClick={handleExportReport}
                            disabled={exportLoading}
                          >
                            {exportLoading ? 'Exporting...' : 'Export Report'}
                          </Button>
                        </Box>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Quick Export Options:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => {
                                setSelectedPeriod('daily');
                                setSelectedFormat('pdf');
                                setSelectedCourse('all');
                                setTimeout(handleExportReport, 100);
                              }}
                            >
                              Today's Attendance (PDF)
                            </Button>
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => {
                                setSelectedPeriod('weekly');
                                setSelectedFormat('excel');
                                setSelectedCourse('all');
                                setTimeout(handleExportReport, 100);
                              }}
                            >
                              Weekly Report (Excel)
                            </Button>
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => {
                                setSelectedPeriod('monthly');
                                setSelectedFormat('pdf');
                                setSelectedCourse('all');
                                setTimeout(handleExportReport, 100);
                              }}
                            >
                              Monthly Summary (PDF)
                            </Button>
                          </Box>
                        </Box>
                      </div>
                    </Box>
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

              {/* Quick Stats Card */}
              <Grid item xs={12} md={6}>
                <Paper className="dashboard-card">
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Attendance Overview
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <div className="stat-item">
                        <span>Today's classes:</span>
                        <span className="stat-value">{Math.floor(Math.random() * 3)} scheduled</span>
                      </div>
                      <div className="stat-item">
                        <span>This week:</span>
                        <span className="stat-value">{dashboardData.recentActivity.length} sessions</span>
                      </div>
                      <div className="stat-item">
                        <span>Low attendance courses:</span>
                        <span className="stat-value">
                          {dashboardData.recentActivity.filter(a => a.attendanceRate < 80).length} courses
                        </span>
                      </div>
                      <div className="stat-item">
                        <span>High attendance courses:</span>
                        <span className="stat-value">
                          {dashboardData.recentActivity.filter(a => a.attendanceRate >= 90).length} courses
                        </span>
                      </div>
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
                                  <div className="attendance-indicator">
                                    <div 
                                      className={`attendance-bar ${
                                        activity.attendanceRate >= 90 ? 'status-excellent' :
                                        activity.attendanceRate >= 80 ? 'status-good' :
                                        activity.attendanceRate >= 70 ? 'status-average' : 'status-poor'
                                      }`} 
                                      style={{ width: `${activity.attendanceRate}%` }}
                                    ></div>
                                    <span className="attendance-value">{activity.attendanceRate}%</span>
                                  </div>
                                </td>
                                <td className="action-buttons">
                                  <button className="action-button" onClick={() => viewAttendanceHistory(activity.id)}>
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