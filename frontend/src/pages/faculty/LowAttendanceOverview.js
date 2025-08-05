import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert,
  Box,
  Chip
} from '@mui/material';
import {
  TrendingDown,
  Visibility,
  ArrowBack
} from '@mui/icons-material';
import { api, API_ENDPOINTS } from '../../config/api';
import './LowAttendanceOverview.css';

const LowAttendanceOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursesWithLowAttendance, setCoursesWithLowAttendance] = useState([]);

  useEffect(() => {
    fetchCoursesWithLowAttendance();
  }, []);

  // Get current user's faculty information
  const getCurrentFacultyInfo = async () => {
    try {
      const userResponse = await api.get(API_ENDPOINTS.GET_USER);
      console.log('Current user info:', userResponse.data);
      return userResponse.data;
    } catch (err) {
      console.error('Error getting user info:', err);
      return null;
    }
  };

  const fetchCoursesWithLowAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user info first
      const userInfo = await getCurrentFacultyInfo();
      console.log('Current faculty user info:', userInfo);

      console.log('Fetching courses from:', API_ENDPOINTS.GET_FACULTY_COURSES);
      let courses = [];
      
      try {
        const response = await api.get(API_ENDPOINTS.GET_FACULTY_COURSES);
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        
        if (response.data.success && response.data.data) {
          courses = response.data.data || [];
          console.log('Courses found from GET_FACULTY_COURSES:', courses);
        }
      } catch (coursesError) {
        console.log('GET_FACULTY_COURSES failed, trying dashboard endpoint:', coursesError.message);
        
        // Fallback to dashboard endpoint
        try {
          const dashboardResponse = await api.get(API_ENDPOINTS.GET_FACULTY_DASHBOARD);
          console.log('Dashboard API Response:', dashboardResponse);
          console.log('Dashboard Response data:', dashboardResponse.data);
          console.log('Dashboard Response data.data:', dashboardResponse.data.data);
          console.log('Dashboard Response data.data.courses:', dashboardResponse.data.data?.courses);
          
          if (dashboardResponse.data.success && dashboardResponse.data.data) {
            // Try different possible locations for courses
            let allCourses = dashboardResponse.data.data.coursesList || 
                            dashboardResponse.data.data.courses || 
                            dashboardResponse.data.data.courseList || 
                            dashboardResponse.data.data.facultyCourses ||
                            [];
            
            console.log('All courses from dashboard:', allCourses);
            
            // If courses is an array of objects, use them directly
            if (Array.isArray(allCourses) && allCourses.length > 0) {
              courses = allCourses;
            } else {
              // If courses is not found, check if the data itself contains course information
              const data = dashboardResponse.data.data;
              console.log('Checking data structure for courses:', Object.keys(data));
              
              // Look for any property that might contain course information
              for (const key in data) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                  const firstItem = data[key][0];
                  // Check if this looks like a course (has name, code, etc.)
                  if (firstItem && (firstItem.name || firstItem.code || firstItem.courseName)) {
                    console.log(`Found courses in property: ${key}`, data[key]);
                    courses = data[key];
                    break;
                  }
                }
              }
            }
            
            console.log('Final courses found:', courses);
            
            // If still no courses, log the entire data structure
            if (courses.length === 0) {
              console.log('No courses found. Full data structure:', JSON.stringify(dashboardResponse.data.data, null, 2));
            }
          } else {
            console.log('No courses data in dashboard endpoint');
          }
        } catch (dashboardError) {
          console.error('Both endpoints failed:', dashboardError);
          throw dashboardError;
        }
      }
      
      setCoursesWithLowAttendance(courses);
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchCoursesWithLowAttendance:', err);
      setError('Failed to load courses');
      setLoading(false);
    }
  };

  const handleViewLowAttendance = (courseId) => {
    console.log('Navigating to low attendance page with course ID:', courseId);
    console.log('Course data for this ID:', coursesWithLowAttendance.find(c => c.id === courseId));
    navigate(`/faculty/low-attendance/${courseId}`);
  };

  const handleGoBack = () => {
    navigate('/faculty/dashboard');
  };

  const getSeverityLevel = (lowAttendanceCount, totalStudents) => {
    if (!lowAttendanceCount || !totalStudents) return 'moderate';
    const percentage = (lowAttendanceCount / totalStudents) * 100;
    if (percentage > 25) return 'critical';
    if (percentage > 15) return 'warning';
    return 'moderate';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'warning': return '#ff9800';
      case 'moderate': return '#ffc107';
      default: return '#4caf50';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading courses...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" startIcon={<ArrowBack />} onClick={handleGoBack}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      width: '100%',
      minHeight: '100vh',
      zoom: 1,
      transform: 'scale(1)',
      transformOrigin: 'top left'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Course Attendance Overview
        </Typography>
      </Box>

      {coursesWithLowAttendance.length === 0 ? (
        <Alert severity="info">
          No courses found.
        </Alert>
      ) : (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Select a course to view detailed attendance information and manage student notifications.
          </Typography>

          <Grid container spacing={3}>
            {coursesWithLowAttendance.map((course) => {
              const severity = getSeverityLevel(course.lowAttendanceCount, course.totalStudents);
              const severityColor = getSeverityColor(severity);

              return (
                <Grid item xs={12} md={6} lg={4} key={course.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderLeft: `4px solid ${severityColor}`,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                          {course.name || 'Course Name Not Available'}
                        </Typography>
                        <Chip
                          label={severity.toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: severityColor,
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {course.code || 'Code Not Available'} • {course.semester || 'Semester Not Available'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {course.department || 'Department Not Available'}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                          <Typography variant="h4" color="error" sx={{ fontWeight: 700 }}>
                            {course.lowAttendanceCount || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Low Attendance
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                            {course.totalStudents || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Students
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TrendingDown sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          Average: {course.averageAttendance || 0}% (Threshold: {course.threshold || 75}%)
                        </Typography>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        startIcon={<Visibility />}
                        onClick={() => handleViewLowAttendance(course.id)}
                        fullWidth
                        sx={{
                          backgroundColor: severityColor,
                          '&:hover': {
                            backgroundColor: severityColor,
                            opacity: 0.9
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default LowAttendanceOverview; 