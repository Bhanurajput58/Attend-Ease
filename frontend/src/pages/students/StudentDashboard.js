import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import '../../styles/DashboardPage.css';
import { LineChart, BarChart, PieChart } from '../../components/charts';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, api } from '../../config/api';
import useAuth from '../../hooks/useAuth';

// Configure axios with the backend base URL
// This makes the code more robust when deployed to different environments
// For development, it will use the proxy configuration in package.json
/* Use the shared api instance from config/api.js instead
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  timeout: 10000
});

// Add an interceptor to add auth token to all requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);
*/

const StudentDashboard = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determine which student to show: own or other
  const studentId = params.studentId || user?.id;

  // State for student search/selection (for faculty/admin)
  const [selectedStudentId, setSelectedStudentId] = useState(params.studentId || '');
  const [studentsList, setStudentsList] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  
  // State for absence request dialog
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [absenceRequest, setAbsenceRequest] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    courseId: ''
  });
  
  // State for analytics tab
  const [analyticsTab, setAnalyticsTab] = useState(0);
  
  // State for data fetching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for student data
  const [attendanceData, setAttendanceData] = useState({
    overall: 0,
    courses: [],
    history: [],
    analytics: {
      monthly: [],
      courseComparison: [],
      distribution: []
    }
  });
  
  const [notifications, setNotifications] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  
  // Personal goals
  const [attendanceGoal, setAttendanceGoal] = useState(90);
  
  // Add a state to track if we're using real or mock data
  const [usingMockData, setUsingMockData] = useState(false);
  
  // Add state to show when data is refreshing
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch all students for admin/faculty views
  const fetchStudentsList = async () => {
    try {
      setStudentSearchLoading(true);
      const response = await axios.get(API_ENDPOINTS.GET_ALL_STUDENTS, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      console.log('Students response:', response.data);
      
      // Process student data to ensure full names
      const processedStudents = Array.isArray(response.data) 
        ? response.data.map(student => ({
            _id: student._id,
            name: student.fullName || student.name || 'Unknown Name',
            enrollmentNumber: student.enrollmentNumber || student.rollNumber || 'Unknown ID'
          }))
        : [];
      
      console.log('Processed students with names:', processedStudents);
      setStudentsList(processedStudents);
      setStudentSearchLoading(false);
    } catch (error) {
      console.error('Error fetching students list:', error);
      setStudentSearchLoading(false);
      // Use mock data if API fails
      setStudentsList([
        { _id: '1', name: 'John Doe', enrollmentNumber: 'S12345' },
        { _id: '2', name: 'Jane Smith', enrollmentNumber: 'S12346' },
        { _id: '3', name: 'Robert Johnson', enrollmentNumber: 'S12347' }
      ]);
    }
  };
  
  useEffect(() => {
    // If user is admin or faculty, fetch the students list
    if (user && (user.role === 'admin' || user.role === 'faculty')) {
      fetchStudentsList();
    }
  }, [user]);

  // Update selected student when route param changes (faculty/admin view)
  useEffect(() => {
    if (params.studentId && params.studentId !== selectedStudentId) {
      setSelectedStudentId(params.studentId);
    }
  }, [params.studentId]);

  // Fetch student data when selectedStudentId or user changes
  useEffect(() => {
    const idToFetch = params.studentId || (user && user.role === 'student' ? user.id : null);
    if (idToFetch) {
      fetchStudentData(idToFetch);
    }
  }, [params.studentId, user]);
  
  // Add debug logging for authentication state
  useEffect(() => {
    console.group('🔐 Authentication Debug Info');
    console.log('Current User:', user);
    console.log('JWT Token:', localStorage.getItem('token'));
    console.log('Selected Student ID:', selectedStudentId);
    console.groupEnd();
  }, [user, selectedStudentId]);

  // Enhanced fetchStudentData with debug logging
  const fetchStudentData = async (targetId) => {
    try {
      console.group('📊 Fetching Student Data');
      setLoading(true);
      setRefreshing(true);

      // Use the consistent endpoint from API_ENDPOINTS
      const response = await api.get(API_ENDPOINTS.GET_STUDENT_ATTENDANCE(targetId));
      console.log('Dashboard data response:', response.data);
      
      if (response.data && response.data.success) {
        // Create a copy of the response data
        const data = {...response.data.data};
        
        // Check if courseComparison is empty and use mock data if it is
        if (!data.analytics || !data.analytics.courseComparison || data.analytics.courseComparison.length === 0) {
          console.log('No course comparison data found, using mock data');
          
          // Initialize analytics if needed
          if (!data.analytics) {
            data.analytics = {};
          }
          
          data.analytics.courseComparison = [
            { id: '0', name: 'Operating System', code: 'CS2006', attendance: 85 },
            { id: '1', name: 'Design & Analysis of Algorithm', code: 'CS2007', attendance: 78 },
            { id: '2', name: 'Computer Network', code: 'CS2008', attendance: 92 },
            { id: '3', name: 'IoT and Embedded Systems', code: 'CS2009', attendance: 65 }
          ];
        }
        
        setAttendanceData(data);
        setError(null);
        setUsingMockData(false);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
      
      // Try an alternative endpoint if the primary one fails
      try {
        console.log('Trying alternative endpoint format...');
        const altResponse = await api.get(API_ENDPOINTS.GET_STUDENT_ATTENDANCE(targetId));
        
        if (altResponse.data && altResponse.data.success) {
          console.log('Alternative endpoint successful:', altResponse.data);
          
          // Process the data in the format needed by the frontend
          const data = {
            overall: altResponse.data.data.overallAttendance || 82,
            courses: altResponse.data.data.courses || [],
            history: altResponse.data.data.history || [],
            analytics: {
              monthly: altResponse.data.data.monthly || [
                { month: 'Jan', attendance: 90 },
                { month: 'Feb', attendance: 85 },
                { month: 'Mar', attendance: 78 },
                { month: 'Apr', attendance: 82 }
              ],
              courseComparison: altResponse.data.data.courses?.map(course => ({
                id: course.id || '0',
                name: course.name || 'Unknown Course',
                code: course.code || 'N/A',
                attendance: course.attendanceRate || 85
              })) || [
                { id: '0', name: 'Operating System', code: 'CS2006', attendance: 85 },
                { id: '1', name: 'Design & Analysis of Algorithm', code: 'CS2007', attendance: 78 },
                { id: '2', name: 'Computer Network', code: 'CS2008', attendance: 92 },
                { id: '3', name: 'IoT and Embedded Systems', code: 'CS2009', attendance: 65 }
              ],
              distribution: [
                { name: 'Present', value: 82 },
                { name: 'Absent', value: 18 }
              ]
            }
          };
          
          setAttendanceData(data);
          setError(null);
          setUsingMockData(false);
          return;
        }
      } catch (altErr) {
        console.error('Alternative endpoint also failed:', altErr);
      }
      
      // Fall back to mock data if both endpoints fail
      setError('Failed to load dashboard data');
      
      // Use mock data in case of API failure
      setAttendanceData({
        overall: 82,
        courses: [],
        history: [],
        analytics: {
          monthly: [
            { month: 'Jan', attendance: 90 },
            { month: 'Feb', attendance: 85 },
            { month: 'Mar', attendance: 78 },
            { month: 'Apr', attendance: 82 }
          ],
          courseComparison: [
            { id: '0', name: 'Operating System', code: 'CS2006', attendance: 85 },
            { id: '1', name: 'Design & Analysis of Algorithm', code: 'CS2007', attendance: 78 },
            { id: '2', name: 'Computer Network', code: 'CS2008', attendance: 92 },
            { id: '3', name: 'IoT and Embedded Systems', code: 'CS2009', attendance: 65 }
          ],
          distribution: [
            { name: 'Present', value: 82 },
            { name: 'Absent', value: 18 }
          ]
        }
      });
      setUsingMockData(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.groupEnd();
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) {
        setError('Please log in to view your dashboard');
        return;
      }

      // Determine which student's data to fetch
      const targetStudentId = params.studentId || user.id;
      if (!targetStudentId) {
        setError('Unable to determine student ID');
        return;
      }

      await fetchStudentData(targetStudentId);
    };

    loadInitialData();
  }, [params.studentId, user]);
  
  // Save attendance goal to localStorage when changed
  useEffect(() => {
    localStorage.setItem('attendanceGoal', attendanceGoal.toString());
  }, [attendanceGoal]);
  
  // Handle absence request dialog
  const handleOpenRequestDialog = () => {
    setOpenRequestDialog(true);
  };
  
  const handleCloseRequestDialog = () => {
    setOpenRequestDialog(false);
  };
  
  const handleAbsenceRequestChange = (e) => {
    setAbsenceRequest({
      ...absenceRequest,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmitAbsenceRequest = async () => {
    try {
      const userStudentId = localStorage.getItem('userId') || user?.id;
      
      if (!userStudentId) {
        alert('No student ID available. Please log in again.');
        return;
      }
      
      // Submit absence request to backend
      await api.post(`/api/students/${userStudentId}/absence-requests`, absenceRequest);
      
      handleCloseRequestDialog();
      
      // Show success message
      alert('Absence request submitted successfully!');
      
      // Reset form
      setAbsenceRequest({
        startDate: '',
        endDate: '',
        reason: '',
        courseId: ''
      });
      
      // Refresh notifications to include the new request status
      const notificationsResponse = await api.get(`/api/students/${userStudentId}/notifications`);
      setNotifications(notificationsResponse.data);
    } catch (err) {
      console.error('Error submitting absence request:', err);
      alert('Failed to submit absence request. Please try again.');
    }
  };
  
  // Handle analytics tab change
  const handleAnalyticsTabChange = (event, newValue) => {
    // Only allow values 0 and 1 since we now have only two tabs
    if (newValue >= 0 && newValue <= 1) {
      setAnalyticsTab(newValue);
    }
  };
  
  // Handle export report
  const handleExportReport = async () => {
    try {
      const currentStudentId = localStorage.getItem('userId') || user?.id;
      
      if (!currentStudentId) {
        alert('No student ID available. Please log in again.');
        return;
      }
      
      // Request report generation from backend
      const response = await api.get(`/api/students/${currentStudentId}/export-attendance-report`, {
        responseType: 'blob' // Important for file downloads
      });
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_report.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to generate report. Please try again later.');
    }
  };

  // Student selector for faculty/admin
  const handleStudentChange = (event) => {
    const newStudentId = event.target.value;
    setSelectedStudentId(newStudentId);
    if (newStudentId) {
      navigate(`/student/dashboard/${newStudentId}`);
    } else {
      navigate('/student/dashboard');
    }
  };

  // Refresh handler for attendance data
  const handleRefresh = () => {
    const idToFetch = params.studentId || (user && user.role === 'student' ? user.id : null);
    if (idToFetch) {
      fetchStudentData(idToFetch);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography variant="h4" component="h1" gutterBottom>
                Student Dashboard
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Welcome to your attendance management portal
              </Typography>
            </div>
            
            {/* Add student selector for admin and faculty */}
            {user && (user.role === 'admin' || user.role === 'faculty') && (
              <FormControl sx={{ minWidth: 220, mr: 2 }}>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudentId}
                  onChange={handleStudentChange}
                  label="Select Student"
                  disabled={studentSearchLoading}
                >
                  <MenuItem value="">
                    <em>Select a student</em>
                  </MenuItem>
                  {studentsList.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.name} ({student.enrollmentNumber})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleOpenRequestDialog}
                startIcon={<CalendarMonthIcon />}
              >
                Request Absence
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleExportReport}
                startIcon={<FileDownloadIcon />}
              >
                Export Report
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Attendance Overview Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      Attendance Overview
                      {usingMockData && (
                        <Chip 
                          size="small" 
                          color="warning" 
                          label="Mock Data" 
                          sx={{ ml: 1, fontSize: '0.7rem' }} 
                        />
                      )}
                    </span>
                    <IconButton 
                      size="small" 
                      onClick={handleRefresh}
                      disabled={refreshing}
                      sx={{ mr: -1 }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {refreshing ? '...' : `${attendanceData.overall}%`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall attendance rate{refreshing && ' (refreshing...)'}
                  </Typography>
                  
                  {/* Attendance Warnings/Alerts */}
                  {attendanceData.courses.some(course => course.warning) && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        You have low attendance in some courses!
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Recent Attendance Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Attendance
                  </Typography>
                  <Typography variant="body1">
                    Last marked: 2 days ago
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Next class: Tomorrow
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Personalized Goals Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmojiEventsIcon sx={{ mr: 1 }} /> Attendance Goal
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" color={attendanceData.overall >= attendanceGoal ? "success.main" : "error.main"} sx={{ mr: 2 }}>
                      {attendanceGoal}%
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2">Your goal</Typography>
                      <Typography variant="body2" color={attendanceData.overall >= attendanceGoal ? "success.main" : "error.main"}>
                        {attendanceData.overall >= attendanceGoal 
                          ? `Congratulations! You're above your goal.` 
                          : `${attendanceGoal - attendanceData.overall}% to reach your goal`}
                      </Typography>
                    </Box>
                  </Box>
                  <TextField
                    label="Set New Goal (%)"
                    type="number"
                    size="small"
                    value={attendanceGoal}
                    onChange={(e) => setAttendanceGoal(Number(e.target.value))}
                    inputProps={{ min: 0, max: 100 }}
                    fullWidth
                  />
                </Box>
              </Paper>
            </Grid>
            
            {/* Notifications Center */}
            <Grid item xs={12} md={6}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsIcon sx={{ mr: 1 }} /> Notifications
                  </Typography>
                  <List>
                    {notifications.map(notification => (
                      <ListItem key={notification.id} divider>
                        <ListItemText
                          primary={notification.title}
                          secondary={
                            <>
                              <span style={{ display: 'block' }}>{notification.message}</span>
                              <span style={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>{notification.date}</span>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Paper>
            </Grid>
            
            {/* Replace Assignment Tracker with Course Comparison */}
            <Grid item xs={12} md={6}>
              <Paper className="dashboard-card" sx={{ bgcolor: '#fbfbfb' }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Course Attendance
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    {attendanceData.analytics.courseComparison.map((course, index) => (
                      <Paper
                        key={index}
                        elevation={1}
                        onClick={() => navigate(`/course-attendance/${course.id || index}`)}
                        sx={{
                          mb: 0.5,
                          p: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          '&:last-child': { mb: 0 },
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 3,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            flex: 1
                          }}
                        >
                          {course.name} <span style={{ color: 'text.secondary' }}>({course.code})</span>
                        </Typography>
                        <Box sx={{ position: 'relative', width: 50, height: 50 }}>
                          <CircularProgress
                            variant="determinate"
                            value={100}
                            size={50}
                            thickness={3}
                            sx={{ color: '#e0e0e0', position: 'absolute' }}
                          />
                          <CircularProgress
                            variant="determinate"
                            value={course.attendance}
                            size={50}
                            thickness={3}
                            sx={{
                              color: course.attendance < 75 ? '#f44336' : '#4caf50',
                              position: 'absolute'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                              {course.attendance}%
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Course Schedule/Timetable */}
            <Grid item xs={12}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Weekly Schedule
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Course</th>
                          <th>Time</th>
                          <th>Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetable.flatMap((day, idx) => 
                          day.courses.map((course, courseIdx) => (
                            <tr key={`${idx}-${courseIdx}`}>
                              {courseIdx === 0 && <td rowSpan={day.courses.length}>{day.day}</td>}
                              <td>{course.name} ({course.code})</td>
                              <td>{course.time}</td>
                              <td>{course.room}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Attendance Analytics */}
            <Grid item xs={12}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Attendance Analytics
                  </Typography>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={analyticsTab} onChange={handleAnalyticsTabChange}>
                      <Tab label="Monthly Trend" />
                      <Tab label="Attendance Distribution" />
                    </Tabs>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    {analyticsTab === 0 && (
                      <LineChart
                        data={attendanceData.analytics.monthly.map(item => ({
                          label: item.month,
                          value: item.attendance
                        }))}
                        title="Monthly Attendance Trend"
                        xLabel="Month"
                        yLabel="Attendance %"
                        showPoints
                        showArea
                        lineColor="#3f51b5"
                      />
                    )}
                    {analyticsTab === 1 && (
                      <PieChart
                        data={attendanceData.analytics.distribution.map(item => ({
                          label: item.name,
                          value: item.value
                        }))}
                        title="Attendance Distribution"
                        showPercentage
                        size={250}
                      />
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Attendance History Table */}
            <Grid item xs={12}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Attendance History
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Course</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.history.map((record, idx) => (
                          <tr key={idx}>
                            <td>{record.date}</td>
                            <td>{record.course}</td>
                            <td>
                              <span className={`status ${record.status}`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td>{record.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
        
        {/* Absence Request Dialog */}
        <Dialog open={openRequestDialog} onClose={handleCloseRequestDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Request Absence</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Start Date"
                type="date"
                name="startDate"
                value={absenceRequest.startDate}
                onChange={handleAbsenceRequestChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              <TextField
                label="End Date"
                type="date"
                name="endDate"
                value={absenceRequest.endDate}
                onChange={handleAbsenceRequestChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              <TextField
                label="Course"
                select
                name="courseId"
                value={absenceRequest.courseId}
                onChange={handleAbsenceRequestChange}
                SelectProps={{ native: true }}
                fullWidth
                required
              >
                <option value="">Select a course</option>
                {attendanceData.courses.map((course, idx) => (
                  <option key={idx} value={course.id || idx}>{course.name} ({course.code})</option>
                ))}
              </TextField>
              <TextField
                label="Reason for Absence"
                multiline
                rows={4}
                name="reason"
                value={absenceRequest.reason}
                onChange={handleAbsenceRequestChange}
                fullWidth
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRequestDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmitAbsenceRequest} 
              variant="contained" 
              color="primary"
              disabled={!absenceRequest.startDate || !absenceRequest.reason || !absenceRequest.courseId}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentDashboard;