import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
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
  Alert,
  Snackbar,
  Card,
  CardContent,
  Chip,
  Avatar
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
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import SendNotificationModal from '../../components/SendNotificationModal';
import { useNotifications } from '../../context/NotificationContext';
import './AdminDashboardPage.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = () => {
  const { getNotificationStats } = useNotifications();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0,
    userRoles: [],
    courseStats: []
  });
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    byType: {},
    byPriority: {},
    byCategory: {},
    readRate: 0,
    totalRecipients: 0,
    totalReads: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [sendNotificationOpen, setSendNotificationOpen] = useState(false);
  const MAX_RETRIES = 3;

  useEffect(() => {
    fetchDashboardStats();
    fetchNotificationStats();
  }, []);

  useEffect(() => {
    if (activeTab === 0 || activeTab === 1) {
      fetchDashboardStats();
    }
  }, [activeTab]);

  // Debug effect to log stats changes
  useEffect(() => {
    console.log('Stats state updated:', stats);
    console.log('Course stats:', stats.courseStats);
  }, [stats]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchNotificationStats = async () => {
    try {
      console.log('Fetching notification stats...');
      const response = await getNotificationStats();
      console.log('Notification stats response:', response);
      
      if (response.success) {
        // Filter notifications sent by admin only
        const adminNotifications = response.data.bySender?.admin || 0;
        console.log('Admin notifications count:', adminNotifications);
        console.log('Full bySender data:', response.data.bySender);
        
        setNotificationStats({
          total: adminNotifications,
          byType: response.data.byType || {},
          byPriority: response.data.byPriority || {},
          byCategory: response.data.byCategory || {},
          readRate: response.data.readRate || 0,
          totalRecipients: response.data.totalRecipients || 0,
          totalReads: response.data.totalReads || 0
        });
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const handleSendNotification = () => {
    setSendNotificationOpen(true);
  };

  const handleNotificationSuccess = async (notificationData) => {
    showSnackbar('Notification sent successfully!', 'success');
    
    // Add a small delay to ensure the backend has processed the notification
    setTimeout(async () => {
      console.log('Refreshing notification stats after sending notification...');
      await fetchNotificationStats();
      console.log('Notification stats refreshed');
    }, 1000);
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesUrl = `${API_ENDPOINTS.GET_COURSES}?includeStudents=true`;
      const [usersResponse, coursesResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.GET_USERS, { withCredentials: true }),
        axios.get(coursesUrl, { withCredentials: true })
      ]);
      
      if (usersResponse.data.success && coursesResponse.data.success) {
        const userRoles = processUserRoles(usersResponse.data.data);
        const courseStats = processCourseStats(coursesResponse.data.data);
        
        console.log('Processed course stats:', courseStats);
        
        setStats(prev => ({
          ...prev,
          totalUsers: usersResponse.data.data.length,
          activeCourses: coursesResponse.data.data.length,
          userRoles,
          courseStats: courseStats
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

  const handleRefresh = () => {
    setRetryCount(0);
    fetchDashboardStats();
  };

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
      showSnackbar('Failed to export report', 'error');
    }
  };

  const filteredCourses = (stats.courseStats || []).filter(course =>
    course?.name?.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

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
    if (!courses || !Array.isArray(courses)) {
      return [];
    }
    const processedCourses = courses.map(course => {
      const fullName = course.courseName || course.name || course.courseCode || 'Unnamed Course';
      
      // Use mock data of 98 students for each course
      const studentCount = 98;
      
      console.log(`Course: ${fullName} - Mock data: ${studentCount} students enrolled`);
      
      return {
        id: course._id || course.id,
        name: fullName,
        fullName: fullName,
        enrolled: studentCount,
        department: course.department || 'N/A',
        semester: course.semester || 'Current'
      };
    });
    return processedCourses;
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <Box textAlign="center">
              <CircularProgress size={60} />
              <Typography variant="h6" style={{ marginTop: 16 }}>
                Loading Dashboard...
              </Typography>
            </Box>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box className="admin-dashboard-header-section">
          <Box className="admin-welcome-section">
            <Avatar className="admin-avatar">
              <AdminPanelSettingsIcon />
            </Avatar>
            <Box className="admin-welcome-text">
              <Typography variant="h4" className="admin-welcome-title">
                Welcome, Administrator!
              </Typography>
              <Typography variant="body1" className="admin-welcome-subtitle">
                Here's your system overview and management tools
              </Typography>
            </Box>
          </Box>
          <Box className="admin-header-actions">
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<SendIcon />}
              onClick={handleSendNotification}
              className="admin-action-button"
            >
              Send Notification
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              className="admin-action-button"
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {error ? (
          <Alert severity="error" className="admin-error-alert">
            <Typography variant="h6">{error}</Typography>
            <Typography variant="body2">
              Please try refreshing the page or contact support if the issue persists.
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Statistics Cards */}
            <Grid container spacing={3} className="admin-stats-section">
              <Grid item xs={12} sm={6} md={4}>
                <Card className="admin-stat-card total-users">
                  <CardContent>
                    <Box className="admin-stat-icon">
                      <PeopleIcon />
                    </Box>
                    <Typography variant="h2" className="admin-stat-number">
                      {stats.totalUsers}
                    </Typography>
                    <Typography variant="h6" className="admin-stat-label">
                      Total Users
                    </Typography>
                    <Typography variant="body2" className="admin-stat-description">
                      Students, Faculty & Admin
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="admin-stat-card active-courses">
                  <CardContent>
                    <Box className="admin-stat-icon">
                      <SchoolIcon />
                    </Box>
                    <Typography variant="h2" className="admin-stat-number">
                      {stats.activeCourses}
                    </Typography>
                    <Typography variant="h6" className="admin-stat-label">
                      Active Courses
                    </Typography>
                    <Typography variant="body2" className="admin-stat-description">
                      Currently running
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="admin-stat-card notifications">
                  <CardContent>
                    <Box className="admin-stat-icon">
                      <NotificationsIcon />
                    </Box>
                    <Typography variant="h2" className="admin-stat-number">
                      {notificationStats.total}
                    </Typography>
                    <Typography variant="h6" className="admin-stat-label">
                      Notifications Sent
                    </Typography>
                    <Typography variant="body2" className="admin-stat-description">
                      By Administrator
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Main Content Grid */}
            <Grid container spacing={3} className="admin-main-content">
              {/* System Analytics Section */}
              <Grid item xs={12} lg={6}>
                <Card className="admin-content-card">
                  <CardContent>
                    <Box className="admin-section-header">
                      <Typography variant="h5" className="admin-section-title">
                        <AssessmentIcon className="admin-section-icon" />
                        System Analytics
                      </Typography>
                    </Box>
                    
                    <Box className="admin-tab-content">
                      <Card className="admin-chart-card">
                        <CardContent>
                          <Typography variant="h6" className="admin-chart-title">
                            User Distribution
                          </Typography>
                          <Box className="admin-chart-container">
                            {stats.userRoles.length > 0 ? (
                              <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                  <Pie
                                    data={stats.userRoles}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {stats.userRoles.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <Box className="admin-empty-state">
                                <SchoolIcon className="admin-empty-icon" />
                                <Typography variant="h6" className="admin-empty-title">
                                  No user data available
                                </Typography>
                                <Typography variant="body2" className="admin-empty-description">
                                  User statistics will appear here once data is available.
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Course Analytics Section */}
              <Grid item xs={12} lg={6}>
                <Card className="admin-content-card">
                  <CardContent>
                    <Box className="admin-section-header">
                      <Typography variant="h5" className="admin-section-title">
                        <SchoolIcon className="admin-section-icon" />
                        Course Enrollment Overview
                      </Typography>
                    </Box>
                    
                    <Card className="admin-chart-card">
                      <CardContent>
                        <Box className="admin-chart-container">
                          {stats.courseStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={450}>
                              <BarChart data={stats.courseStats} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="name" 
                                  height={60}
                                  interval={0}
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis domain={[0, 200]} />
                                <RechartsTooltip 
                                  formatter={(value, name, props) => [
                                    `${value} students`, 
                                    name
                                  ]}
                                  labelFormatter={(label) => `${label}`}
                                />
                                <Legend />
                                <Bar dataKey="enrolled" fill="#00C49F" name="Enrolled Students" />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <Box className="admin-empty-state">
                              <SchoolIcon className="admin-empty-icon" />
                              <Typography variant="h6" className="admin-empty-title">
                                No course data available
                              </Typography>
                              <Typography variant="body2" className="admin-empty-description">
                                Course analytics will appear here once data is available.
                              </Typography>
                            </Box>
                          )}
                          
                        </Box>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
      
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

      <SendNotificationModal
        open={sendNotificationOpen}
        onClose={() => setSendNotificationOpen(false)}
        onSuccess={handleNotificationSuccess}
      />
    </div>
  );
};

export default AdminDashboard;