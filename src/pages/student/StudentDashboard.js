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
import { API_ENDPOINTS } from '../../config/api';
import useAuth from '../../hooks/useAuth';

// Configure axios with the backend base URL
// This makes the code more robust when deployed to different environments
// For development, it will use the proxy configuration in package.json
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  timeout: 10000
});

const StudentDashboard = () => {
  const { studentId } = useParams(); // Get studentId from URL if available
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for student search/selection
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
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
  
  // New effect to update selected student when studentId from URL changes
  useEffect(() => {
    if (studentId && studentId !== selectedStudentId) {
      setSelectedStudentId(studentId);
    }
  }, [studentId]);
  
  // Effect for fetching student data when component mounts or when selectedStudentId changes
  useEffect(() => {
    const idToFetch = selectedStudentId || (user && user.role === 'student' ? user.id : null);
    if (idToFetch) {
      fetchStudentData(idToFetch);
    }
  }, [selectedStudentId, user]);
  
  // Function to fetch data from backend for a specific student
  const fetchStudentData = async (id) => {
    try {
      setRefreshing(true);
      setLoading(true);
      
      const targetId = id || user?.id; // Use provided ID or fall back to current user
      
      if (!targetId) {
        setError('No student ID available');
        setRefreshing(false);
        setLoading(false);
        return;
      }
      
      // Fetch real data from the backend
      try {
        // Fetch attendance data
        const attendanceResponse = await api.get(`/api/students/${targetId}/attendance`);
        console.log('Fetched attendance data:', attendanceResponse.data);
        setAttendanceData(attendanceResponse.data);
        
        // Fetch notifications
        const notificationsResponse = await api.get(`/api/students/${targetId}/notifications`);
        setNotifications(notificationsResponse.data);
        
        // Fetch assignments
        const assignmentsResponse = await api.get(`/api/students/${targetId}/assignments`);
        setAssignments(assignmentsResponse.data);
        
        // Fetch timetable
        const timetableResponse = await api.get(`/api/students/${targetId}/timetable`);
        setTimetable(timetableResponse.data);
        
        setUsingMockData(false);
        setError(null);
      } catch (apiError) {
        console.error('API error fetching data:', apiError);
        
        // Use mock data if API fails
        console.warn('API not available. Using mock data instead.');
        setUsingMockData(true);
        
        // Mock data for Bhanu Pratap Singh
        const mockData = {
          attendanceData: {
            overall: 85,
            courses: [
              { id: 1, name: 'Operating Systems', code: 'CS2006', attendance: 90, warning: false },
              { id: 2, name: 'Design & Analysis of Algorithm', code: 'CS2007', attendance: 92, warning: false },
              { id: 3, name: 'Computer Network', code: 'CS2008', attendance: 92, warning: false },
              { id: 4, name: 'IoT and Embedded Systems', code: 'CS2009', attendance: 88, warning: false }
            ],
            history: [
              { date: '2024-03-15', course: 'Operating Systems', status: 'present', remarks: 'On time' },
              { date: '2024-03-14', course: 'Design & Analysis of Algorithm', status: 'absent', remarks: 'Medical leave' },
              { date: '2024-03-13', course: 'Computer Network', status: 'present', remarks: 'On time' }
            ],
            analytics: {
              monthly: [
                { month: 'Jan', attendance: 80 },
                { month: 'Feb', attendance: 85 },
                { month: 'Mar', attendance: 75 },
                { month: 'Apr', attendance: 90 }
              ],
              courseComparison: [
                { name: 'Operating Systems', code: 'CS2006', attendance: 90 },
                { name: 'Design & Analysis of Algorithm', code: 'CS2007', attendance: 92 },
                { name: 'Computer Network', code: 'CS2008', attendance: 92 },
                { name: 'IoT and Embedded Systems', code: 'CS2009', attendance: 88 }
              ],
              distribution: [
                { name: 'Present', value: 85 },
                { name: 'Absent', value: 10 },
                { name: 'Excused', value: 5 }
              ]
            }
          },
          notifications: [
            { id: 1, title: 'Attendance Warning', message: 'Your attendance in IoT and Embedded Systems is approaching the minimum threshold.', date: '2025-03-18' },
            { id: 2, title: 'Assignment Reminder', message: 'You have an upcoming assignment in operating system due in 3 days.', date: '2025-03-17' },
            { id: 3, title: 'Course Update', message: 'Design & Analysis of Algorithm class will be in room L-104 tomorrow instead of the regular room.', date: '2025-03-16' }
          ],
          
          timetable: [
            { day: 'Monday', courses: [
              { name: 'operating systems', code: 'CS2006', time: '09:00 - 10:30', room: 'L-105' },
              { name: 'Design & Analysis of Algorithm', code: 'CS2007', time: '11:00 - 12:30', room: 'L202' }
            ]},
            { day: 'Tuesday', courses: [
              { name: 'Computer Network', code: 'CS2008', time: '09:00 - 10:30', room: 'L303' },
              { name: 'IoT and Embedded Systems', code: 'CS2009', time: '11:00 - 12:30', room: 'L404' }
            ]},
            { day: 'Wednesday', courses: [
              { name: 'operating systems', code: 'CS2006', time: '11:00 - 12:30', room: 'L101' }
            ]},
            { day: 'Thursday', courses: [
              { name: 'Design & Analysis of Algorithm', code: 'CS2007', time: '09:00 - 10:30', room: 'L202' }
            ]},
            { day: 'Friday', courses: [
              { name: 'IoT and Embedded Systems', code: 'CS2009', time: '09:00 - 10:30', room: 'L404' },
              { name: 'Computer Network', code: 'CS2008', time: '11:00 - 12:30', room: 'L303' }
            ]}
          ]
        };
        
        setAttendanceData(mockData.attendanceData);
        setNotifications(mockData.notifications);
        setAssignments(mockData.assignments);
        setTimetable(mockData.timetable);
      }
      
      setRefreshing(false);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load dashboard data. Please try again later.');
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Handle student selection change
  const handleStudentChange = (event) => {
    const newStudentId = event.target.value;
    setSelectedStudentId(newStudentId);
    
    // Update URL to reflect selected student
    if (newStudentId) {
      navigate(`/student-dashboard/${newStudentId}`);
    } else {
      navigate('/student-dashboard');
    }
    
    // Fetch the selected student's data
    fetchStudentData(newStudentId);
  };
  
  // Function to handle manual refresh
  const handleRefresh = () => {
    const studentId = localStorage.getItem('userId') || '6603d12d5aec5ab5a16320c1';
    fetchStudentData(studentId);
  };
  
  // Fetch student data from backend - initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      
      // Determine the student ID - first try from authentication, then localStorage
      let studentId;
      
      // If you have an auth context, get the ID from there
      // const { user } = useAuth(); // Uncomment if you have auth context
      // studentId = user?.id;
      
      // Otherwise try localStorage
      if (!studentId) {
        studentId = localStorage.getItem('userId');
      }
      
      // If still no ID, use a test ID (temporary)
      if (!studentId) {
        console.warn('No user ID found, using test ID');
        // Using a simpler ID for testing
        studentId = '67ed7f5fb0110f457198851b'; // Updated test ID
        localStorage.setItem('userId', studentId);
      }
      
      console.log('Fetching data for student ID:', studentId);
      
      // Fetch data
      await fetchStudentData(studentId);
      
      // Fetch attendance goal if saved
      const savedGoal = localStorage.getItem('attendanceGoal');
      if (savedGoal) {
        setAttendanceGoal(Number(savedGoal));
      }
      
      setLoading(false);
    };
    
    loadInitialData();
  }, []);
  
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