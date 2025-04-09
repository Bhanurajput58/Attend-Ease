import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography,
  Paper,
  Grid,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  timeout: 10000
});

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

// Mock course data for testing
const COURSES_DATA = {
  '0': { name: 'Operating System', code: 'CS2006' },
  '1': { name: 'Design & Analysis of Algorithm', code: 'CS2007' },
  '2': { name: 'Computer Network', code: 'CS2008' },
  '3': { name: 'IoT and Embedded Systems', code: 'CS2009' }
};

const CourseAttendanceDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const today = new Date();
  
  // Get course data from our mock data
  const courseData = COURSES_DATA[courseId] || { name: 'Unknown Course', code: 'N/A' };
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendar, setCalendar] = useState([]);
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    percentage: 0
  });

  useEffect(() => {
    console.log(`CourseAttendanceDetail mounted for course: ${courseId}`);
    console.log(`Course data:`, courseData);
    
    // Generate attendance data for the selected month
    generateCalendarData(calendarDate);
    setLoading(false);
  }, [courseId, calendarDate]);

  const generateCalendarData = (date) => {
    // First day of the month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    // Last day of the month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Class days: Monday (1), Wednesday (3), Friday (5)
    const classDays = [1, 3, 5];
    
    let calendarDays = [];
    let presentCount = 0;
    let absentCount = 0;
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      calendarDays.push({ date: null });
    }
    
    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), i);
      const dayOfWeek = currentDate.getDay();
      
      // Don't show attendance for future dates
      const isFutureDate = currentDate > today;
      
      // Check if it's a class day
      if (classDays.includes(dayOfWeek) && !isFutureDate) {
        // Random attendance status for past and present dates
        // In a real app, this would come from an API
        const status = Math.random() > 0.3 ? 'present' : 'absent';
        
        if (status === 'present') presentCount++;
        else absentCount++;
        
        calendarDays.push({
          date: currentDate,
          status: status
        });
      } else {
        calendarDays.push({
          date: currentDate,
          status: null
        });
      }
    }
    
    // Calculate percentage
    const totalDays = presentCount + absentCount;
    const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
    
    setCalendar(calendarDays);
    setSummary({
      present: presentCount,
      absent: absentCount,
      percentage: percentage
    });
  };

  const handlePrevMonth = () => {
    const prevMonth = new Date(calendarDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCalendarDate(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(calendarDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCalendarDate(nextMonth);
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

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading attendance data...</Typography>
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
    <Box sx={{ 
      p: { xs: 1, md: 2 }, 
      pt: { xs: 3, md: 4 },
      maxWidth: 900, 
      mx: 'auto', 
      display: 'flex',
      flexDirection: 'column',
      height: '90vh',
      overflow: 'hidden'
    }}>
      {/* Course Title Banner with Back Button */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 1, 
          mb: 1, 
          mt: 1,
          textAlign: 'center',
          background: 'linear-gradient(to right, #f5f5f5, #e8f5e9, #f5f5f5)',
          borderRadius: 2,
          position: 'relative'
        }}
      >
        {/* Back button */}
        <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
          <IconButton 
            onClick={handleBack} 
            size="small"
            sx={{ 
              color: 'primary.main',
              bgcolor: 'rgba(25, 118, 210, 0.08)',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.12)'
              }
            }}
          >
            <KeyboardBackspaceIcon fontSize="small" />
          </IconButton>
        </Box>
        
        
        
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold',
            color: '#2e7d32',
            mb: 0.5,
            mt: 0.75
          }}
        >
          {courseData.name}
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ fontWeight: 'medium' }}
        >
          Course Code: {courseData.code}
        </Typography>
      </Paper>
      
      {/* Calendar and Summary Section */}
      <Grid container spacing={1.5} sx={{ flexGrow: 1, mb: 0 }}>
        {/* Calendar */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 1.5, pb: 1, borderRadius: 2, height: '90%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
              <Button 
                startIcon={<ChevronLeftIcon />} 
                onClick={handlePrevMonth}
                variant="outlined"
                size="small"
                color="primary"
              >
                Prev
              </Button>
              <Typography variant="subtitle1" fontWeight="medium">
                {calendarDate.toLocaleString('default', { month: 'long' })} {calendarDate.getFullYear()}
              </Typography>
              <Button 
                endIcon={<ChevronRightIcon />} 
                onClick={handleNextMonth}
                variant="outlined"
                size="small"
                color="primary"
                disabled={isCurrentMonth(calendarDate) && isCurrentYear(calendarDate)}
              >
                Next
              </Button>
            </Box>
            <Grid container spacing={0} sx={{ textAlign: 'center', flexGrow: 1 }}>
              {DAYS_OF_WEEK.map((day) => (
                <Grid item xs={12/7} key={day}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    {day}
                  </Typography>
                </Grid>
              ))}
              {calendar.map((day, index) => {
                const isToday = day.date && 
                                day.date.getDate() === today.getDate() && 
                                day.date.getMonth() === today.getMonth() && 
                                day.date.getFullYear() === today.getFullYear();
                
                return (
                  <Grid item xs={12/7} key={index}>
                    {day.date ? (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 0, 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isToday ? '1px solid #2196f3' : '0.5px solid #e0e0e0',
                          borderRadius: 0.5,
                          background: day.status === 'present' 
                            ? 'rgba(76, 175, 80, 0.1)' 
                            : day.status === 'absent' 
                              ? 'rgba(244, 67, 54, 0.1)' 
                              : 'inherit',
                          position: 'relative',
                          minHeight: '32px'
                        }}
                      >
                        <Typography variant="caption" fontWeight={isToday ? 'bold' : 'normal'}>
                          {day.date.getDate()}
                        </Typography>
                        {day.status && (
                          <Box 
                            sx={{ 
                              mt: 0.1, 
                              width: 5, 
                              height: 5, 
                              borderRadius: '50%',
                              bgcolor: day.status === 'present' ? 'success.main' : 'error.main' 
                            }} 
                          />
                        )}
                        {isToday && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              position: 'absolute',
                              bottom: 0,
                              fontSize: '0.45rem',
                              color: 'primary.main',
                              fontWeight: 'bold'
                            }}
                          >
                            TODAY
                          </Typography>
                        )}
                      </Paper>
                    ) : (
                      <Box sx={{ p: 0, height: '100%', minHeight: '32px' }} />
                    )}
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
        
        {/* Attendance Summary */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            height: '90%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
              Attendance Summary
            </Typography>
            
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={6}>
                <Paper elevation={1} sx={{ 
                  p: 1, 
                  bgcolor: 'success.light', 
                  color: 'success.contrastText',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography variant="caption" gutterBottom>Present</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>{summary.present}</Typography>
                  <Typography variant="caption">days</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper elevation={1} sx={{ 
                  p: 1, 
                  bgcolor: 'error.light', 
                  color: 'error.contrastText',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography variant="caption" gutterBottom>Absent</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>{summary.absent}</Typography>
                  <Typography variant="caption">days</Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 0.5
              }}>
                <Typography variant="body2">Attendance Rate</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {summary.percentage}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={summary.percentage} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: summary.percentage >= 75 ? 'success.main' : summary.percentage >= 60 ? 'warning.main' : 'error.main'
                  }
                }}
              />
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              mt: 'auto', 
              mb: 0,
              bgcolor: 'info.lighter',
              p: 0.75,
              borderRadius: 1
            }}>
              <InfoIcon sx={{ color: 'info.main', mr: 0.75, fontSize: '0.8rem', mt: 0.15 }} />
              <Typography variant="caption" color="text.secondary">
                {summary.percentage >= 75 
                  ? 'Excellent attendance! Keep it up.' 
                  : summary.percentage >= 60 
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