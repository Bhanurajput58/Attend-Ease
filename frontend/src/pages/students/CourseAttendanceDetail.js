import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, IconButton, Button, CircularProgress,
  Alert, LinearProgress, Select, MenuItem, FormControl
} from '@mui/material';
import {
  KeyboardBackspace as KeyboardBackspaceIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { API_ENDPOINTS, api } from '../../config/api';
import useAuth from '../../hooks/useAuth';
import './CourseAttendanceDetail.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CourseAttendanceDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date();
  
  const [courseData, setCourseData] = useState({ name: 'Loading...', code: 'N/A' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendar, setCalendar] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    sessions: [],
    summary: {
      present: 0,
      absent: 0,
      total: 0,
      percentage: 0
    }
  });
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filterOptions = [
    { value: 'this', label: 'This month' },
    { value: 'all', label: 'All months' }
  ];

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use student-specific endpoint for course info
        const courseResponse = await api.get(API_ENDPOINTS.GET_COURSE_STUDENT_INFO(courseId));
        if (courseResponse.data && courseResponse.data.success) {
          const course = courseResponse.data.data;
          setCourseData({
            name: course.courseName || 'Unknown Course',
            code: course.courseCode || 'N/A'
          });
        }
        
        await fetchAttendanceData();
        
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchAttendanceData();
    }
  }, [selectedFilter, courseId]);

  const fetchAttendanceData = async () => {
    try {
      const endpoint = selectedFilter === 'this' 
        ? `${API_ENDPOINTS.GET_COURSE_ATTENDANCE_DASHBOARD(courseId)}?filter=this_month`
        : `${API_ENDPOINTS.GET_COURSE_ATTENDANCE_DASHBOARD(courseId)}?filter=all_months`;
      
      const response = await api.get(endpoint);
      
      if (response.data && response.data.success) {
        const data = response.data;
        
        let sessions = [];
        let presentCount = 0;
        let absentCount = 0;
        let totalSessions = 0;
        
        if (data.studentAttendance && data.studentAttendance.courses && data.studentAttendance.courses.length > 0) {
          const courseAttendance = data.studentAttendance.courses[0];
          
          sessions = courseAttendance.sessions || [];
          presentCount = courseAttendance.present || 0;
          absentCount = courseAttendance.absent || 0;
          totalSessions = courseAttendance.total || sessions.length;
        } else if (data.courseAttendance && data.courseAttendance.sessions) {
          sessions = data.courseAttendance.sessions || [];
          presentCount = data.courseAttendance.present || 0;
          absentCount = data.courseAttendance.absent || 0;
          totalSessions = data.courseAttendance.total || sessions.length;
        }
        
        const filteredSessions = filterSessionsByMonth(sessions, selectedFilter);
        const filteredStats = calculateFilteredStats(filteredSessions);
        
        setAttendanceData({
          sessions: filteredSessions,
          summary: filteredStats
        });
        
        generateCalendarData(calendarDate, filteredSessions);
        
      } else {
        throw new Error('Failed to fetch attendance data');
      }
    } catch (error) {
      setError('Failed to load attendance data. Please try again.');
    }
  };

  const filterSessionsByMonth = (sessions, filter) => {
    if (filter === 'all') {
      return sessions;
    }
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return sessions.filter(session => {
      let sessionDate;
      if (typeof session.date === 'string') {
        sessionDate = new Date(session.date);
      } else {
        sessionDate = new Date(session.date);
      }
      
      return sessionDate.getMonth() === currentMonth && 
             sessionDate.getFullYear() === currentYear;
    });
  };

  const calculateFilteredStats = (sessions) => {
    let presentCount = 0;
    let absentCount = 0;
    
    sessions.forEach(session => {
      if (session.status === 'present') {
        presentCount++;
      } else if (session.status === 'absent') {
        absentCount++;
      }
    });
    
    const totalSessions = sessions.length;
    const percentage = totalSessions > 0 ? Math.round(((presentCount / totalSessions) * 100)) : 0;
    
    return {
      present: presentCount,
      absent: absentCount,
      total: totalSessions,
      percentage: percentage
    };
  };

  const generateCalendarData = (date, sessions = []) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    let calendarDays = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      calendarDays.push({ date: null });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), i);
      
      const attendanceForDate = sessions.find(session => {
        let sessionDate;
        if (typeof session.date === 'string') {
          sessionDate = new Date(session.date);
        } else {
          sessionDate = new Date(session.date);
        }
        
        const currentDateStr = currentDate.toISOString().split('T')[0];
        const sessionDateStr = sessionDate.toISOString().split('T')[0];
        
        return currentDateStr === sessionDateStr;
      });
      
      calendarDays.push({
        date: currentDate,
        status: attendanceForDate ? attendanceForDate.status : null,
        topic: attendanceForDate ? attendanceForDate.topic : null
      });
    }
    
    setCalendar(calendarDays);
  };

  const handlePrevMonth = () => {
    const prevMonth = new Date(calendarDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCalendarDate(prevMonth);
    generateCalendarData(prevMonth, attendanceData.sessions);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(calendarDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCalendarDate(nextMonth);
    generateCalendarData(nextMonth, attendanceData.sessions);
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === today.getMonth();
  };

  const isCurrentYear = (date) => {
    return date.getFullYear() === today.getFullYear();
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
        <Typography variant="h6" className="loading-text">Loading attendance data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="error-container">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="course-attendance-container">
      <Paper className="course-title-banner">
        <Box className="course-back-button">
          <IconButton 
            onClick={handleBack} 
            size="small"
          >
            <KeyboardBackspaceIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography 
          variant="h5" 
          component="h1" 
          className="course-title"
        >
          {courseData.name}
        </Typography>
        <Typography 
          variant="subtitle1" 
          className="course-code"
        >
          Course Code: {courseData.code}
        </Typography>
      </Paper>
      
      <Grid container spacing={1.5} className="calendar-summary-grid">
        <Grid item xs={12} md={6}>
          <Paper className="calendar-paper">
            <Box className="calendar-header">
              <Button 
                startIcon={<ChevronLeftIcon />} 
                onClick={handlePrevMonth}
                variant="outlined"
                size="small"
                color="primary"
                className="calendar-nav-button"
              >
                Prev
              </Button>
              <Typography variant="subtitle1" className="calendar-month-title">
                {calendarDate.toLocaleString('default', { month: 'long' })} {calendarDate.getFullYear()}
              </Typography>
              <Button 
                endIcon={<ChevronRightIcon />} 
                onClick={handleNextMonth}
                variant="outlined"
                size="small"
                color="primary"
                disabled={isCurrentMonth(calendarDate) && isCurrentYear(calendarDate)}
                className="calendar-nav-button"
              >
                Next
              </Button>
            </Box>
            <div className="calendar-grid">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="calendar-day-header">
                  {day}
                </div>
              ))}
              {calendar.map((day, index) => {
                const isToday = day.date && 
                                day.date.getDate() === today.getDate() && 
                                day.date.getMonth() === today.getMonth() && 
                                day.date.getFullYear() === today.getFullYear();
                
                return (
                  <div key={index}>
                    {day.date ? (
                      <Paper 
                        elevation={0} 
                        className={`calendar-day-cell ${isToday ? 'today' : ''} ${day.status ? day.status : ''}`}
                      >
                        <Typography variant="caption" className={`calendar-day-number ${isToday ? 'today' : ''}`}>
                          {day.date.getDate()}
                        </Typography>
                        {isToday && day.status && (
                          <div 
                            className={`calendar-attendance-indicator today-indicator ${day.status}`}
                          /> 
                        )}
                      </Paper>
                    ) : (
                      <div className="calendar-empty-cell" />
                    )}
                  </div>
                );
              })}
            </div>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper className="attendance-summary-paper">
            <Box className="attendance-summary-header">
              <Box className="attendance-title-section">
                <Typography variant="subtitle1" className="attendance-summary-title">
                  {selectedFilter === 'this' ? 'Attendance for this month' : 'Attendance for all months'}
                </Typography>
              </Box>
              <FormControl size="small" className="month-filter-control">
                <Select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  displayEmpty
                  IconComponent={ExpandMoreIcon}
                  className="month-filter-select"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200
                      }
                    }
                  }}
                  renderValue={() => ''}
                >
                  {filterOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Grid container spacing={1.5} className="attendance-stats-grid">
              <Grid item xs={6}>
                <Paper elevation={1} className="attendance-stat-card present">
                  <Typography variant="caption" className="attendance-stat-label">Present</Typography>
                  <Typography variant="h5" className="attendance-stat-value">{attendanceData.summary.present}</Typography>
                  <Typography variant="caption" className="attendance-stat-unit">days</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper elevation={1} className="attendance-stat-card absent">
                  <Typography variant="caption" className="attendance-stat-label">Absent</Typography>
                  <Typography variant="h5" className="attendance-stat-value">{attendanceData.summary.absent}</Typography>
                  <Typography variant="caption" className="attendance-stat-unit">days</Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Box className="attendance-details">
              <Box className="attendance-detail-row">
                <Typography variant="body2" className="attendance-detail-label">Total Classes</Typography>
                <Typography variant="body2" className="attendance-detail-value">
                  {attendanceData.summary.total}
                </Typography>
              </Box>
              <Box className="attendance-detail-row">
                <Typography variant="body2" className="attendance-detail-label">Attendance Rate</Typography>
                <Typography variant="body2" className="attendance-detail-value">
                  {attendanceData.summary.percentage}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={attendanceData.summary.percentage} 
                className={`attendance-progress-bar ${
                  attendanceData.summary.percentage >= 75 ? 'excellent' : 
                  attendanceData.summary.percentage >= 60 ? 'satisfactory' : 'warning'
                }`}
              />
            </Box>
            
            <Box className="attendance-info-box">
              <InfoIcon className="attendance-info-icon" />
              <Typography variant="caption" className="attendance-info-text">
                {attendanceData.summary.percentage >= 75 
                  ? 'Excellent attendance! Keep it up.' 
                  : attendanceData.summary.percentage >= 60 
                    ? 'Your attendance is satisfactory but could be improved.' 
                    : 'Warning: Your attendance is below minimum requirements.'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseAttendanceDetail; 