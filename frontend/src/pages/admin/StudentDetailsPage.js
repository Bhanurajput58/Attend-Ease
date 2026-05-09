import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  CircularProgress, 
  Avatar, 
  Chip, 
  Divider,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookIcon from '@mui/icons-material/Book';
import AssessmentIcon from '@mui/icons-material/Assessment';
import './StudentDetailsPage.css';

/**
 * Student Details Page Component
 * Displays comprehensive student information including attendance and course details
 */
const StudentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Data states
  const [attendanceData, setAttendanceData] = useState({
    overall: 0,
    courses: [],
    history: []
  });
  const [coursesData, setCoursesData] = useState([]);

  // Helper function to extract roll number from email
  const getRollNumber = (student) => {
    if (student.rollNumber) {
      return student.rollNumber;
    }
    
    if (student.email) {
      // Extract roll number from email format: 23BCS001@example.com
      const emailParts = student.email.split('@');
      if (emailParts.length > 0) {
        return emailParts[0];
      }
    }
    
    return 'N/A';
  };

  // Helper function to get department (default to CSE)
  const getDepartment = (student) => {
    return student.department || 'CSE';
  };

  // Helper function to get semester (default to 4)
  const getSemester = (student) => {
    return student.semester || '4';
  };

  // Helper function to safely get course name
  const getCourseName = (course) => {
    if (typeof course.name === 'string') return course.name;
    if (typeof course.courseName === 'string') return course.courseName;
    return 'N/A';
  };

  // Helper function to safely get course code
  const getCourseCode = (course) => {
    if (typeof course.code === 'string') return course.code;
    if (typeof course.courseCode === 'string') return course.courseCode;
    return 'N/A';
  };

  // Helper function to safely get instructor name
  const getInstructorName = (course) => {
    if (typeof course.instructor === 'string') return course.instructor;
    if (typeof course.faculty === 'string') return course.faculty;
    if (course.instructor && typeof course.instructor === 'object' && course.instructor.name) {
      return course.instructor.name;
    }
    if (course.faculty && typeof course.faculty === 'object' && course.faculty.name) {
      return course.faculty.name;
    }
    return 'N/A';
  };

  // Helper function to safely get faculty name from attendance records
  const getFacultyName = (record) => {
    if (typeof record.faculty === 'string') return record.faculty;
    if (record.faculty && typeof record.faculty === 'object' && record.faculty.name) {
      return record.faculty.name;
    }
    return 'N/A';
  };

  // Helper function to get course credits (default to 4)
  const getCourseCredits = (course) => {
    return course.credits || 4;
  };

  // Debug logging
  console.log('StudentDetailsPage render:', {
    id,
    isAuthenticated,
    user,
    loading,
    error,
    student
  });

  useEffect(() => {
    console.log('StudentDetailsPage useEffect triggered:', {
      id,
      isAuthenticated,
      loading
    });

    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    if (id) {
      console.log('Starting to fetch student details for ID:', id);
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('Request timed out, setting error');
          setLoading(false);
          setError('Request timed out. Please try again.');
        }
      }, 10000); // 10 second timeout

      fetchStudentDetails().finally(() => {
        clearTimeout(timeoutId);
      });
    } else {
      console.log('No student ID provided');
      setError('No student ID provided');
      setLoading(false);
    }
  }, [id, isAuthenticated, navigate]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching student details for ID:', id);

      // Fetch student basic information - try multiple endpoints
      let studentData = null;
      
      try {
        // Try the direct student endpoint first
        const studentResponse = await api.get(`/api/students/${id}`);
        console.log('Student response:', studentResponse);
        
        if (studentResponse.data && studentResponse.data.success) {
          studentData = studentResponse.data.data;
        }
      } catch (studentError) {
        console.error('Error fetching student:', studentError);
        
        // Try alternative endpoint
        try {
          const altResponse = await api.get(`/api/users/${id}`);
          console.log('Alternative user response:', altResponse);
          
          if (altResponse.data && altResponse.data.success) {
            studentData = altResponse.data.data;
          }
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError);
        }
      }

      if (!studentData) {
        setError('Student not found');
        setLoading(false);
        return;
      }

      setStudent(studentData);

      // Fetch attendance data using the correct endpoint
      try {
        const attendanceResponse = await api.get(API_ENDPOINTS.GET_STUDENT_ATTENDANCE(id));
        console.log('Attendance response:', attendanceResponse);
        
        if (attendanceResponse.data && attendanceResponse.data.success) {
          const data = {...attendanceResponse.data.data};
          // Process courses data the same way as StudentDashboard
          if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
            if (!data.analytics) data.analytics = {};
            data.analytics.courseComparison = data.courses.map(course => ({
              id: course._id, 
              name: course.courseName, 
              code: course.courseCode, 
              attendance: course.attendanceRate || 0
            }));
          } else {
            if (!data.analytics) data.analytics = {};
            data.analytics.courseComparison = [];
          }
          setAttendanceData(data);
        } else {
          // Set empty attendance data if API returns no data
          setAttendanceData({
            overall: 0,
            courses: [],
            history: [],
            analytics: { monthly: [], courseComparison: [] }
          });
        }
      } catch (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        // Set empty attendance data if API fails
        setAttendanceData({
          overall: 0,
          courses: [],
          history: [],
          analytics: { monthly: [], courseComparison: [] }
        });
      }

      // Fetch courses data - try to get from student's courses array
      try {
        if (studentData.courses && studentData.courses.length > 0) {
          // If student has courses array, use that
          setCoursesData(studentData.courses);
        } else {
          // Try to fetch courses from API
          const coursesResponse = await api.get(API_ENDPOINTS.GET_COURSES);
          console.log('Courses response:', coursesResponse);
          
          if (coursesResponse.data && coursesResponse.data.success) {
            // Filter courses that might be relevant to this student
            setCoursesData(coursesResponse.data.data.slice(0, 5)); // Limit to 5 courses
          } else {
            // Set empty courses data
            setCoursesData([]);
          }
        }
      } catch (coursesError) {
        console.error('Error fetching courses:', coursesError);
        // Set empty courses data
        setCoursesData([]);
      }

      console.log('All data loaded successfully');

    } catch (error) {
      console.error('Error fetching student details:', error);
      setError('Failed to load student details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => {
                setError(null);
                fetchStudentDetails();
              }}
            >
              Retry
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="warning">
            Student not found.
          </Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">Student Details</Typography>
        </Box>

        {/* Student Profile Section */}
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={student.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`}
              alt={student.name}
              sx={{ width: 80, height: 80, fontSize: '2rem' }}
            />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {student.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="Student" 
                  color="primary" 
                  size="small"
                  icon={<PersonIcon />}
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  label={`Roll: ${getRollNumber(student)}`}
                  variant="outlined"
                  size="small"
                  icon={<BadgeIcon />}
                  sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
                />
                <Chip 
                  label={`${getDepartment(student)}`}
                  variant="outlined"
                  size="small"
                  icon={<SchoolIcon />}
                  sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Quick Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon color="primary" sx={{ fontSize: 2.5, mr: 1 }} />
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                    {attendanceData.overall || 0}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Overall Attendance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BookIcon color="secondary" sx={{ fontSize: 2.5, mr: 1 }} />
                  <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
                    {coursesData.length || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Enrolled Courses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarTodayIcon color="info" sx={{ fontSize: 2.5, mr: 1 }} />
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                    {getSemester(student)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Semester
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="student details tabs"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                minHeight: 64
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#667eea'
              }
            }}
          >
            <Tab label="Overview" />
            <Tab label="Attendance" />
            <Tab label="Courses" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' }
                }}>
                  <CardHeader 
                    title="Personal Information" 
                    sx={{ 
                      borderBottom: '1px solid #e0e0e0',
                      '& .MuiCardHeader-title': { fontWeight: 600, color: '#333' }
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <EmailIcon color="primary" />
                        <Typography>
                          <span style={{ fontWeight: 600, color: '#666' }}>Email:</span> {student.email || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <BadgeIcon color="primary" />
                        <Typography>
                          <span style={{ fontWeight: 600, color: '#666' }}>Roll Number:</span> {getRollNumber(student)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' }
                }}>
                  <CardHeader 
                    title="Academic Information" 
                    sx={{ 
                      borderBottom: '1px solid #e0e0e0',
                      '& .MuiCardHeader-title': { fontWeight: 600, color: '#333' }
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SchoolIcon color="primary" />
                        <Typography>
                          <span style={{ fontWeight: 600, color: '#666' }}>Department:</span> {getDepartment(student)}
                        </Typography>
                      </Box>
                      {student.program && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <SchoolIcon color="primary" />
                          <Typography>
                            <span style={{ fontWeight: 600, color: '#666' }}>Program:</span> {student.program}
                          </Typography>
                        </Box>
                      )}
                      {student.discipline && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <SchoolIcon color="primary" />
                          <Typography>
                            <span style={{ fontWeight: 600, color: '#666' }}>Discipline:</span> {student.discipline}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CalendarTodayIcon color="primary" />
                        <Typography>
                          <span style={{ fontWeight: 600, color: '#666' }}>Semester:</span> {getSemester(student)}
                        </Typography>
                      </Box>
                      {student.gpa && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <AssessmentIcon color="primary" />
                          <Typography>
                            <span style={{ fontWeight: 600, color: '#666' }}>GPA:</span> {student.gpa}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Attendance Summary */}
              <Grid item xs={12}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' }
                }}>
                  <CardHeader 
                    title="Attendance Summary" 
                    sx={{ 
                      borderBottom: '1px solid #e0e0e0',
                      '& .MuiCardHeader-title': { fontWeight: 600, color: '#333' }
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    {attendanceData.analytics && attendanceData.analytics.courseComparison && attendanceData.analytics.courseComparison.length > 0 ? (
                      <Grid container spacing={2}>
                        {attendanceData.analytics.courseComparison.map((course, index) => {
                          // Use the processed attendance data from courseComparison
                          const attendancePercentage = course.attendance || 0;
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                  {course.name} <span style={{ color: 'text.secondary' }}>({course.code})</span>
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={attendancePercentage}
                                    color={getAttendanceColor(attendancePercentage)}
                                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                  />
                                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                                    {attendancePercentage}%
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  Attendance Rate
                                </Typography>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    ) : attendanceData.courses && attendanceData.courses.length > 0 ? (
                      <Grid container spacing={2}>
                        {attendanceData.courses.map((course, index) => {
                          // Fallback to original courses data if courseComparison is not available
                          const attendancePercentage = course.attendanceRate || course.attendancePercentage || 0;
                          const presentSessions = course.presentSessions || 0;
                          const totalSessions = course.totalSessions || 0;
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                  {getCourseName(course)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={attendancePercentage}
                                    color={getAttendanceColor(attendancePercentage)}
                                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                  />
                                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                                    {attendancePercentage}%
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {presentSessions} / {totalSessions} sessions
                                </Typography>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    ) : (
                      <Typography color="text.secondary" align="center">
                        No attendance data available.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Attendance Tab */}
          {activeTab === 1 && (
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' }
            }}>
              <CardHeader 
                title="Attendance History" 
                sx={{ 
                  borderBottom: '1px solid #e0e0e0',
                  '& .MuiCardHeader-title': { fontWeight: 600, color: '#333' }
                }}
              />
              <CardContent sx={{ p: 3 }}>
                {attendanceData.history && attendanceData.history.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Faculty</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendanceData.history.map((record, index) => (
                          <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.courseName || record.course || 'N/A'}</TableCell>
                            <TableCell>{getFacultyName(record) || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip
                                label={record.status || 'N/A'}
                                color={record.status?.toLowerCase() === 'present' ? 'success' : 'error'}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center">
                    No attendance records found.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Courses Tab */}
          {activeTab === 2 && (
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' }
            }}>
              <CardHeader 
                title="Enrolled Courses" 
                sx={{ 
                  borderBottom: '1px solid #e0e0e0',
                  '& .MuiCardHeader-title': { fontWeight: 600, color: '#333' }
                }}
              />
              <CardContent sx={{ p: 3 }}>
                {coursesData.length > 0 ? (
                  <Grid container spacing={2}>
                    {coursesData.map((course, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card variant="outlined" sx={{ 
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
                        }}>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {getCourseName(course)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {getCourseCode(course)}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <span style={{ fontWeight: 600, color: '#666' }}>Credits:</span> {getCourseCredits(course)}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <span style={{ fontWeight: 600, color: '#666' }}>Instructor:</span> {getInstructorName(course)}
                            </Typography>
                            {course.schedule && (
                              <Typography variant="body2">
                                <span style={{ fontWeight: 600, color: '#666' }}>Schedule:</span> {course.schedule}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary" align="center">
                    No course enrollments found.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default StudentDetailsPage; 