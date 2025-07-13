import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Skeleton,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import HelpIcon from '@mui/icons-material/Help';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/DashboardPage.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const EnhancedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0,
    userRoles: [],
    courseStats: [],
    attendanceStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Use this ref to track if detailed data has been fetched
  const detailedDataFetchedRef = useRef(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 0 || activeTab === 1) {
      fetchDashboardStats();
    }
  }, [activeTab]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard statistics...');
      
      // Request courses with students populated
      const coursesUrl = `${API_ENDPOINTS.GET_COURSES}?includeStudents=true`;
      console.log('Requesting courses with URL:', coursesUrl);
      
      const [usersResponse, coursesResponse, attendanceResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.GET_USERS, { withCredentials: true }),
        axios.get(coursesUrl, { withCredentials: true }),
        axios.get(API_ENDPOINTS.GET_ATTENDANCE, { withCredentials: true })
      ]);

      console.log('Courses API Response:', coursesResponse.data);
      console.log('Courses count:', coursesResponse.data?.data?.length || 0);
      
      if (coursesResponse.data && coursesResponse.data.data && coursesResponse.data.data.length > 0) {
        const sampleCourse = coursesResponse.data.data[0];
        console.log('Sample course object structure:', JSON.stringify(sampleCourse, null, 2));
        console.log('Course keys:', Object.keys(sampleCourse));
        console.log('Students array exists:', !!sampleCourse.students);
        console.log('Students count in first course:', sampleCourse.students?.length || 0);
      }

      if (usersResponse.data.success && coursesResponse.data.success) {
        const userRoles = processUserRoles(usersResponse.data.data);
        const courseStats = processCourseStats(coursesResponse.data.data);
        const attendanceStats = processAttendanceStats(attendanceResponse.data.data);

        console.log('Processed Course Stats:', courseStats);

        setStats(prev => ({
          ...prev,
          totalUsers: usersResponse.data.data.length,
          activeCourses: coursesResponse.data.data.length,
          userRoles,
          courseStats,
          attendanceStats
        }));
        setRetryCount(0);
        showSnackbar('Dashboard data refreshed successfully', 'success');
      } else {
        throw new Error('Failed to fetch dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchDashboardStats, 5000);
        showSnackbar(`Retrying to fetch data (${retryCount + 1}/${MAX_RETRIES})...`, 'warning');
      } else {
        setError('Error loading dashboard statistics. Please try refreshing the page.');
        showSnackbar('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedCourseData = async (courseStats) => {
    try {
      console.log('Fetching detailed student counts for courses...');
      
      // Create a copy of the course stats
      const updatedCourseStats = [...courseStats];
      
      // For each course, make a separate API call to get student count
      for (let i = 0; i < updatedCourseStats.length; i++) {
        const course = updatedCourseStats[i];
        
        if (course.id) {
          try {
            console.log(`Fetching detailed data for course: ${course.name} (${course.id})`);
            
            // Get detailed course information including students
            const response = await axios.get(
              `${API_ENDPOINTS.GET_COURSE_BY_ID(course.id)}`,
              { withCredentials: true }
            );
            
            if (response.data && response.data.success) {
              const courseData = response.data.data;
              
              // Get student count
              let studentCount = 0;
              
              if (Array.isArray(courseData.students)) {
                studentCount = courseData.students.length;
                console.log(`Course ${course.name} has ${studentCount} students`);
              }
              
              // Update the course stats with the new student count
              updatedCourseStats[i] = {
                ...course,
                enrolled: studentCount > 0 ? studentCount : course.enrolled
              };
            }
          } catch (err) {
            console.error(`Error fetching detailed data for course ${course.name}:`, err);
            // Keep original course data
          }
        }
      }
      
      // Update stats state with the new detailed course stats
      setStats(prev => ({
        ...prev,
        courseStats: updatedCourseStats
      }));
      
      console.log('Updated course stats with detailed student counts:', updatedCourseStats);
    } catch (err) {
      console.error('Error fetching detailed course data:', err);
    }
  };

  const handleRefresh = () => {
    setRetryCount(0);
    // Reset the flag to allow fetching detailed data again
    detailedDataFetchedRef.current = false;
    fetchDashboardStats();
  };

  useEffect(() => {
    // Only run this once after initial data load
    if (stats.courseStats && stats.courseStats.length > 0 && !loading && !detailedDataFetchedRef.current) {
      detailedDataFetchedRef.current = true;
      fetchDetailedCourseData(stats.courseStats);
    }
  }, [loading, stats.courseStats]);

  const handleExport = async (type) => {
    try {
      let endpoint;
      switch (type) {
        case 'users':
          endpoint = API_ENDPOINTS.EXPORT_USERS;
          break;
        case 'courses':
          endpoint = API_ENDPOINTS.EXPORT_COURSES;
          break;
        case 'attendance':
          endpoint = API_ENDPOINTS.EXPORT_ATTENDANCE;
          break;
        default:
          return;
      }

      const response = await axios.get(endpoint, {
        withCredentials: true,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSnackbar(`${type} report exported successfully`, 'success');
    } catch (err) {
      console.error('Error exporting report:', err);
      showSnackbar('Failed to export report', 'error');
    }
  };

  const filteredCourses = (stats.courseStats || []).filter(course =>
    course?.name?.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const filteredAttendance = (stats.attendanceStats || []).filter(record => {
    if (!record?.date) return false;
    const recordDate = new Date(record.date);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    return recordDate >= startDate && recordDate <= endDate;
  });

  const processUserRoles = (users) => {
    const roleCount = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(roleCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const processCourseStats = (courses) => {
    console.log('Raw courses data:', courses);
    if (!courses || !Array.isArray(courses)) {
      console.log('Invalid courses data');
      return [];
    }
    
    const processedCourses = courses.map(course => {
      console.log('Processing course:', course);
      const fullName = course.courseName || course.name || course.courseCode || 'Unnamed Course';
      
      // Calculate student count from various possible sources
      let studentCount = 0;
      
      // First check if students array exists and has items
      if (Array.isArray(course.students)) {
        studentCount = course.students.length;
        console.log(`Course ${fullName} has ${studentCount} students in students array`);
      } 
      // Check for enrolledStudents property next
      else if (typeof course.enrolledStudents === 'number') {
        studentCount = course.enrolledStudents;
        console.log(`Course ${fullName} has ${studentCount} from enrolledStudents property`);
      }
      // Check for enrolled property as fallback
      else if (typeof course.enrolled === 'number') {
        studentCount = course.enrolled;
        console.log(`Course ${fullName} has ${studentCount} from enrolled property`);
      }
      
      // Additional logging to investigate
      if (studentCount === 0) {
        console.log(`Warning: No students found for course ${fullName}`, course);
      }
      
      return {
        id: course._id || course.id,
        name: fullName,
        fullName: fullName,
        enrolled: studentCount,
        department: course.department || 'N/A',
        semester: course.semester || 'Current'
      };
    });
    
    console.log('Processed courses:', processedCourses);
    return processedCourses;
  };

  const processAttendanceStats = (attendance) => {
    // Group attendance by date and calculate average
    const dailyStats = attendance.reduce((acc, record) => {
      const date = new Date(record.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { present: 0, total: 0 };
      }
      acc[date].present += record.present ? 1 : 0;
      acc[date].total += 1;
      return acc;
    }, {});

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      attendanceRate: (stats.present / stats.total) * 100
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Dashboard Overview</Typography>
          <Box>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Reports">
              <IconButton onClick={() => handleExport('dashboard')}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Grid>

      {/* Total Users Card */}
      <Grid item xs={12} md={6} lg={6}>
        <Paper className="dashboard-card">
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Total Users
              </Typography>
              <Tooltip title="Total number of registered users in the system">
                <HelpIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
            {loading ? (
              <Skeleton variant="text" width="60%" height={40} />
            ) : (
              <Typography variant="h3" color="primary">
                {stats.totalUsers}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Registered users
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Active Courses Card */}
      <Grid item xs={12} md={6} lg={6}>
        <Paper className="dashboard-card">
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Active Courses
              </Typography>
              <Tooltip title="Number of courses currently active in the current semester">
                <HelpIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
            {loading ? (
              <Skeleton variant="text" width="60%" height={40} />
            ) : (
              <Typography variant="h3" color="primary">
                {stats.activeCourses}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Current semester courses
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* User Role Distribution Chart */}
      <Grid item xs={12} md={12} lg={6}>
        <Paper className="dashboard-card" sx={{ height: '550px' }}>
          <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                User Role Distribution
              </Typography>
              <Tooltip title="Shows distribution of user roles">
                <HelpIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, height: 'calc(100% - 40px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.userRoles}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {stats.userRoles.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value, name) => [`${value} users`, name]}
                  />
                  <Legend 
                    layout="horizontal" 
                    align="center" 
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Course Enrollment Chart */}
      <Grid item xs={12} md={12} lg={6}>
        <Paper className="dashboard-card" sx={{ height: '550px' }}>
          <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                Course Enrollment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Refresh enrollment data">
                  <IconButton 
                    size="small"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Shows enrolled students">
                  <HelpIcon fontSize="small" color="action" />
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, height: 'calc(100% - 40px)' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : stats.courseStats.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No course data available</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.courseStats}
                    margin={{ top: 20, right: 20, left: 20, bottom: 130 }}
                    barGap={0}
                    barCategoryGap={40}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number"
                      tick={{ fontSize: 12 }}
                      label={{ 
                        value: 'Number of Students', 
                        position: 'insideBottom',
                        offset: -10,
                        style: { fontSize: 12 }
                      }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      width={150}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        // Truncate text if it's too long
                        let displayText = payload.value;
                        if (displayText.length > 25) {
                          displayText = displayText.substring(0, 22) + '...';
                        }
                        
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text 
                              x={-5} 
                              y={0} 
                              dy={4} 
                              textAnchor="end" 
                              fill="#666" 
                              style={{ fontSize: '12px', fontWeight: 'medium' }}
                            >
                              {displayText}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <RechartsTooltip 
                      formatter={(value, name, props) => {
                        if (name === 'Enrolled') {
                          return [`${value} students`, props.payload.fullName];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        return ''; // Don't show label since we show fullName in formatter
                      }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '12px',
                        padding: '10px'
                      }}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Bar 
                      dataKey="enrolled" 
                      fill="#1976d2" 
                      name="Enrolled"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={30}
                      label={{ position: 'right', formatter: (value) => value, fontSize: 12 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderCourseManagement = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Course Management</Typography>
          <Box>
            <TextField
              size="small"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('courses')}
            >
              Export
            </Button>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Paper className="dashboard-card">
          <Box sx={{ p: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Semester</TableCell>
                    <TableCell>Enrolled</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCourses.map((course, index) => (
                    <TableRow key={index}>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>{course.department}</TableCell>
                      <TableCell>{course.semester}</TableCell>
                      <TableCell>{course.enrolled}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit Course">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderAttendanceAnalytics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Attendance Analytics</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              type="date"
              label="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('attendance')}
            >
              Export
            </Button>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Paper className="dashboard-card">
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Trends
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredAttendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="attendanceRate" fill="#8884d8" name="Attendance Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Dashboard" />
          <Tab label="Course Management" />
          <Tab label="Attendance Analytics" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && renderDashboard()}
          {activeTab === 1 && renderCourseManagement()}
          {activeTab === 2 && renderAttendanceAnalytics()}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EnhancedAdminDashboard; 