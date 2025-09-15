import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Button, TextField, Alert, CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Avatar, Paper } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import axios from 'axios';
import './StudentDashboardPage.css';
import { LineChart } from '../../components/charts';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, api } from '../../config/api';
import useAuth from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const StudentDashboard = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications();

  const [selectedStudentId, setSelectedStudentId] = useState(params.studentId || '');
  const [studentsList, setStudentsList] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState({ overall: 0, courses: [], history: [], analytics: { monthly: [], courseComparison: [] } });
  const [attendanceGoal, setAttendanceGoal] = useState(90);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchAttendanceGoal = async (targetId) => {
    try {
      const response = await api.get(API_ENDPOINTS.GET_ATTENDANCE_GOAL(targetId));
      if (response.data && response.data.success) setAttendanceGoal(response.data.data.attendanceGoal);
    } catch (error) { console.error('Error fetching attendance goal:', error); }
  };
  
  const updateAttendanceGoalInBackend = async (newGoal) => {
    try {
      const targetId = params.studentId || user?._id;
      if (!targetId) return;
      const response = await api.put(API_ENDPOINTS.UPDATE_ATTENDANCE_GOAL(targetId), { attendanceGoal: newGoal });
      if (response.data && response.data.success) { /* Goal updated successfully */ }
    } catch (error) {
      console.error('Error updating attendance goal:', error);
      alert('Failed to save attendance goal. Please try again.');
    }
  };

  const debouncedUpdateGoal = React.useCallback(React.useMemo(() => {
    let timeoutId;
    return (newGoal) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => updateAttendanceGoalInBackend(newGoal), 500);
    };
  }, []), []);
  
  const fetchStudentsList = async () => {
    try {
      setStudentSearchLoading(true);
      const response = await axios.get(API_ENDPOINTS.GET_ALL_STUDENTS, {
        withCredentials: true,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const processedStudents = Array.isArray(response.data) ? response.data.map(student => ({
        _id: student._id,
        name: student.fullName || student.name || 'Unknown Name',
        enrollmentNumber: student.enrollmentNumber || student.rollNumber || 'Unknown ID'
      })) : [];
      setStudentsList(processedStudents);
      setStudentSearchLoading(false);
    } catch (error) {
      console.error('Error fetching students list:', error);
      setStudentSearchLoading(false);
      setStudentsList([]);
    }
  };
  
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'faculty')) fetchStudentsList();
  }, [user]);

  useEffect(() => {
    if (params.studentId && params.studentId !== selectedStudentId) setSelectedStudentId(params.studentId);
  }, [params.studentId]);

  const fetchStudentData = async (targetId) => {
    try {
      setLoading(true);
      setRefreshing(true);
      const currentGoal = attendanceGoal;
      const studentResponse = await api.get(API_ENDPOINTS.GET_STUDENT_ATTENDANCE(targetId));
      
      if (studentResponse.data && studentResponse.data.success) {
        const data = {...studentResponse.data.data};
        if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
          if (!data.analytics) data.analytics = {};
          data.analytics.courseComparison = data.courses.map(course => ({
            id: course._id, name: course.courseName, code: course.courseCode, attendance: course.attendanceRate || 0
          }));
        } else {
          if (!data.analytics) data.analytics = {};
          data.analytics.courseComparison = [];
        }
        setAttendanceData(data);
        setError(null);
        if (data.attendanceGoal !== undefined && data.attendanceGoal !== null) {
          setAttendanceGoal(data.attendanceGoal);
        } else if (currentGoal === 90) {
          await fetchAttendanceGoalIfNeeded(targetId);
        }
      } else throw new Error('Failed to fetch dashboard data');
    } catch (err) {
      console.error('Error fetching student data:', err);
      const fallbackData = { overall: 0, courses: [], history: [], analytics: { monthly: [], courseComparison: [] } };
      setAttendanceData(fallbackData);
      setError('Unable to fetch attendance data. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAttendanceGoalIfNeeded = async (targetId) => {
    try {
      if (attendanceGoal === 90) {
        const response = await api.get(API_ENDPOINTS.GET_ATTENDANCE_GOAL(targetId));
        if (response.data && response.data.success) {
          const fetchedGoal = response.data.data.attendanceGoal;
          if (fetchedGoal !== 90) setAttendanceGoal(fetchedGoal);
        }
      }
    } catch (error) { console.error('Error fetching attendance goal separately:', error); }
  };
  
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) { setError('Please log in to view your dashboard'); return; }
      const targetStudentId = params.studentId || user._id;
      if (!targetStudentId) { setError('Unable to determine student ID'); return; }
      await fetchStudentData(targetStudentId);
      await fetchAttendanceGoalIfNeeded(targetStudentId);
    };
    loadInitialData();
  }, [params.studentId, user]);

  const handleStudentChange = (event) => {
    const newStudentId = event.target.value;
    setSelectedStudentId(newStudentId);
    if (newStudentId) navigate(`/student/dashboard/${newStudentId}`);
    else navigate('/student/dashboard');
  };

  const handleRefresh = () => {
    const idToFetch = params.studentId || (user && user.role === 'student' ? user._id : null);
    if (idToFetch) refreshAttendanceDataOnly(idToFetch);
  };

  const refreshAttendanceDataOnly = async (targetId) => {
    try {
      setRefreshing(true);
      const studentResponse = await api.get(API_ENDPOINTS.GET_STUDENT_ATTENDANCE(targetId));
      
      if (studentResponse.data && studentResponse.data.success) {
        const data = {...studentResponse.data.data};
        if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
          if (!data.analytics) data.analytics = {};
          data.analytics.courseComparison = data.courses.map(course => ({
            id: course._id, name: course.courseName, code: course.courseCode, attendance: course.attendanceRate || 0
          }));
        } else {
          if (!data.analytics) data.analytics = {};
          data.analytics.courseComparison = [];
        }
        const { attendanceGoal: _, ...dataWithoutGoal } = data;
        setAttendanceData(dataWithoutGoal);
        setError(null);
      } else throw new Error('Failed to fetch dashboard data');
    } catch (err) {
      console.error('Error refreshing attendance data:', err);
      const fallbackData = { overall: 0, courses: [], history: [], analytics: { monthly: [], courseComparison: [] } };
      setAttendanceData(fallbackData);
      setError('Unable to refresh attendance data. Please check your connection and try again.');
    } finally { setRefreshing(false); }
  };

  if (loading) {
    return (
      <div className="student-dashboard-container">
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <Box textAlign="center">
              <CircularProgress size={60} />
              <Typography variant="h6" style={{ marginTop: 16 }}>Loading Dashboard...</Typography>
            </Box>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="student-dashboard-container">
      <Container maxWidth="xl">
        <Box className="student-dashboard-header-section">
          <Box className="student-welcome-section">
            <Avatar className="student-avatar"><PersonIcon /></Avatar>
            <Box className="student-welcome-text">
              <Typography variant="h3" className="student-welcome-title">
                Welcome back, {user?.name || user?.fullName || 'Student'}!
              </Typography>
              <Typography variant="subtitle1" className="student-welcome-subtitle">Here's your attendance overview</Typography>
            </Box>
          </Box>
          <Box className="student-header-actions">
            {user && (user.role === 'admin' || user.role === 'faculty') && (
              <FormControl sx={{ minWidth: 220, mr: 2 }}>
                <InputLabel>Select Student</InputLabel>
                <Select value={selectedStudentId} onChange={handleStudentChange} label="Select Student" disabled={studentSearchLoading}>
                  <MenuItem value=""><em>Select a student</em></MenuItem>
                  {studentsList.map((student) => (
                    <MenuItem key={student._id} value={student._id}>{student.name} ({student.enrollmentNumber})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button variant="outlined" color="primary" startIcon={<RefreshIcon />} onClick={handleRefresh} className="student-action-button">Refresh</Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="warning" className="student-error-alert" sx={{ mb: 3 }}>
            <Typography variant="h6">{error}</Typography>
            <Typography variant="body2">Some data may be limited. Please try refreshing the page.</Typography>
          </Alert>
        )}

        <Grid container spacing={3} className="student-stats-section">
          <Grid item xs={12} sm={6} md={3}>
            <Card className="student-stat-card attendance-overview">
              <CardContent>
                <Box className="student-stat-icon"><TrendingUpIcon /></Box>
                <Typography variant="h2" className="student-stat-number">{refreshing ? '...' : `${attendanceData.overall || 0}%`}</Typography>
                <Typography variant="h6" className="student-stat-label">Overall Attendance</Typography>
                <Typography variant="body2" className="student-stat-description">{refreshing ? 'Refreshing...' : 'Current semester'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className="student-stat-card enrolled-courses">
              <CardContent>
                <Box className="student-stat-icon"><SchoolIcon /></Box>
                <Typography variant="h2" className="student-stat-number">{refreshing ? '...' : (attendanceData.courses ? attendanceData.courses.length : 0)}</Typography>
                <Typography variant="h6" className="student-stat-label">Enrolled Courses</Typography>
                <Typography variant="body2" className="student-stat-description">{refreshing ? 'Refreshing...' : 'Your enrolled courses'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className="student-stat-card notifications">
              <CardContent>
                <Box className="student-stat-icon"><NotificationsIcon /></Box>
                <Typography variant="h2" className="student-stat-number">{notifications.filter(n => !n.isRead).length}</Typography>
                <Typography variant="h6" className="student-stat-label">Unread Notifications</Typography>
                <Typography variant="body2" className="student-stat-description">{notifications.length} total notifications</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className="student-stat-card attendance-goal">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box className="student-stat-icon"><EmojiEventsIcon /></Box>
                    <Typography variant="h2" className="student-stat-number">{attendanceGoal}%</Typography>
                    <Typography variant="h6" className="student-stat-label">Attendance Goal</Typography>
                    <Typography variant="body2" className="student-stat-description">
                      {refreshing ? 'Refreshing...' : (attendanceData.overall >= attendanceGoal ? 'Goal achieved!' : `${attendanceGoal - (attendanceData.overall || 0)}% to go`)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 500 }}>Set Goal</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TextField
                        type="number" size="small" value={attendanceGoal}
                        onChange={(e) => { const newGoal = Number(e.target.value); setAttendanceGoal(newGoal); debouncedUpdateGoal(newGoal); }}
                        inputProps={{ min: 0, max: 100, style: { fontSize: '0.8rem', padding: '2px 6px', textAlign: 'center' } }}
                        sx={{ width: 50, '& .MuiOutlinedInput-root': { height: 28, fontSize: '0.8rem' } }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>%</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} className="student-main-content">
          <Grid item xs={12} lg={8}>
            <Card className="student-content-card">
              <CardContent>
                <Box className="student-section-header">
                  <Typography variant="h5" className="student-section-title">
                    <AssessmentIcon className="student-section-icon" />Attendance Analytics
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#3f51b5', fontWeight: 600 }}>Monthly Attendance Trend</Typography>
                </Box>
                <Box className="student-tab-content">
                  {refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Box textAlign="center">
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Refreshing analytics...</Typography>
                      </Box>
                    </Box>
                  ) : (!attendanceData.analytics.monthly || attendanceData.analytics.monthly.length === 0) ? (
                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Box textAlign="center">
                        <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">No monthly attendance data available yet.</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Monthly trends will appear here once attendance is taken.</Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <LineChart
                        data={attendanceData.analytics.monthly.map(item => ({ label: item.month, value: item.attendance }))}
                        title="" xLabel="Month" yLabel="Attendance %" showPoints showArea lineColor="#3f51b5"
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card className="student-content-card">
              <CardContent>
                <Box className="student-section-header">
                  <Typography variant="h6" className="student-section-title" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    <NotificationsIcon className="student-section-icon" sx={{ fontSize: '1.2rem', mr: 1 }} />Recent Notifications
                  </Typography>
                  {notifications.length > 0 && (
                    <Button size="small" variant="outlined" onClick={() => navigate('/notifications')} sx={{ fontSize: '0.7rem', padding: '2px 8px', minWidth: 'auto', height: '24px' }}>View All</Button>
                  )}
                </Box>
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
                    </Box>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <Card key={notification._id} sx={{
                        mb: 0.5, borderLeft: notification.isRead ? 'none' : '2px solid #1976d2',
                        backgroundColor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.02)',
                        '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                      }}>
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                            <Avatar sx={{
                              width: 20, height: 20,
                              bgcolor: notification.type === 'urgent' ? '#d32f2f' : notification.type === 'warning' ? '#ff9800' : '#1976d2',
                              color: 'white', fontSize: '0.7rem'
                            }}>
                              <NotificationsIcon sx={{ fontSize: '0.7rem' }} />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.2 }}>
                                <Typography variant="body2" sx={{
                                  fontWeight: notification.isRead ? 400 : 600,
                                  color: notification.isRead ? 'text.secondary' : 'text.primary',
                                  fontSize: '0.7rem', lineHeight: 1.1
                                }}>{notification.title}</Typography>
                                <Chip label={notification.priority || 'normal'} size="small" sx={{
                                  height: 12, fontSize: '0.5rem',
                                  bgcolor: notification.priority === 'urgent' ? '#d32f2f' : notification.priority === 'high' ? '#f57c00' : '#1976d2',
                                  color: 'white', '& .MuiChip-label': { px: 0.5 }
                                }} />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{
                                mb: 0.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                                overflow: 'hidden', fontSize: '0.65rem', lineHeight: 1.1
                              }}>{notification.message.length > 60 ? notification.message.substring(0, 60) + '...' : notification.message}</Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card className="student-content-card">
              <CardContent>
                <Box className="student-section-header">
                  <Typography variant="h5" className="student-section-title">
                    <SchoolIcon className="student-section-icon" />Course Attendance
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {refreshing ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Refreshing attendance data...</Typography>
                    </Box>
                  ) : attendanceData.analytics.courseComparison.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {attendanceData.courses && attendanceData.courses.length > 0 ? 'No attendance records found for your enrolled courses yet.' : 'No courses enrolled or no attendance data available.'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Attendance will appear here once faculty takes attendance for your courses.</Typography>
                    </Box>
                  ) : (
                    attendanceData.analytics.courseComparison.map((course, index) => (
                      <Paper key={index} elevation={1} onClick={() => navigate(`/course-attendance/${course.id || index}`)} sx={{
                        mb: 0.5, p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        '&:last-child': { mb: 0 }, cursor: 'pointer', transition: 'all 0.2s',
                        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }
                      }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, flex: 1 }}>
                          {course.name} <span style={{ color: 'text.secondary' }}>({course.code})</span>
                        </Typography>
                        <Box sx={{ position: 'relative', width: 50, height: 50 }}>
                          <CircularProgress variant="determinate" value={100} size={50} thickness={3} sx={{ color: '#e0e0e0', position: 'absolute' }} />
                          <CircularProgress variant="determinate" value={course.attendance} size={50} thickness={3} sx={{
                            color: course.attendance < 75 ? '#f44336' : '#4caf50', position: 'absolute'
                          }} />
                          <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{course.attendance}%</Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default StudentDashboard;