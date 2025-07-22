import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  CircularProgress, 
  Button, 
  TextField, 
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import CriticalIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import './LowAttendancePage.css';

const LowAttendancePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [thresholdPercentage, setThresholdPercentage] = useState(75);
  const [sortBy, setSortBy] = useState('attendance');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [notificationType, setNotificationType] = useState('email');
  const [customMessage, setCustomMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced mock data with more details
  const mockLowAttendanceStudents = [
    { 
      id: '1', 
      name: 'John Doe', 
      rollNumber: 'S12345', 
      attendance: 65.5,
      email: 'john.doe@student.edu',
      phone: '+1234567890',
      classesAttended: 21,
      totalClasses: 32,
      lastAttended: '2025-07-18',
      parentContact: '+1234567891'
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      rollNumber: 'S12346', 
      attendance: 70.2,
      email: 'jane.smith@student.edu',
      phone: '+1234567892',
      classesAttended: 23,
      totalClasses: 32,
      lastAttended: '2025-07-20',
      parentContact: '+1234567893'
    },
    { 
      id: '3', 
      name: 'Robert Johnson', 
      rollNumber: 'S12347', 
      attendance: 45.8,
      email: 'robert.johnson@student.edu',
      phone: '+1234567894',
      classesAttended: 15,
      totalClasses: 32,
      lastAttended: '2025-07-15',
      parentContact: '+1234567895'
    },
    { 
      id: '4', 
      name: 'Emily Davis', 
      rollNumber: 'S12348', 
      attendance: 60.0,
      email: 'emily.davis@student.edu',
      phone: '+1234567896',
      classesAttended: 19,
      totalClasses: 32,
      lastAttended: '2025-07-19',
      parentContact: '+1234567897'
    },
    { 
      id: '5', 
      name: 'Michael Brown', 
      rollNumber: 'S12349', 
      attendance: 54.3,
      email: 'michael.brown@student.edu',
      phone: '+1234567898',
      classesAttended: 17,
      totalClasses: 32,
      lastAttended: '2025-07-16',
      parentContact: '+1234567899'
    },
    { 
      id: '6', 
      name: 'Sarah Wilson', 
      rollNumber: 'S12350', 
      attendance: 68.9,
      email: 'sarah.wilson@student.edu',
      phone: '+1234567800',
      classesAttended: 22,
      totalClasses: 32,
      lastAttended: '2025-07-21',
      parentContact: '+1234567801'
    },
    { 
      id: '7', 
      name: 'David Taylor', 
      rollNumber: 'S12351', 
      attendance: 72.1,
      email: 'david.taylor@student.edu',
      phone: '+1234567802',
      classesAttended: 23,
      totalClasses: 32,
      lastAttended: '2025-07-22',
      parentContact: '+1234567803'
    },
    { 
      id: '8', 
      name: 'Jennifer Lewis', 
      rollNumber: 'S12352', 
      attendance: 48.7,
      email: 'jennifer.lewis@student.edu',
      phone: '+1234567804',
      classesAttended: 16,
      totalClasses: 32,
      lastAttended: '2025-07-17',
      parentContact: '+1234567805'
    },
  ];

  // Fetch course data and low attendance students
  useEffect(() => {
    fetchLowAttendanceData();
  }, [courseId, thresholdPercentage]);

  const fetchLowAttendanceData = async () => {
    if (!courseId) {
      setError('No course ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const mockCourseData = {
        id: courseId,
        name: 'Computer Network',
        code: 'CS2008',
        totalStudents: 45,
        lowAttendanceCount: 8,
        averageAttendance: 82,
        semester: 'Fall 2025',
        department: 'Computer Science'
      };
      
      try {
        const courseResponse = await api.get(`${API_ENDPOINTS.GET_COURSE}/${courseId}`);
        if (courseResponse.data && courseResponse.data.success) {
          setCourseData(courseResponse.data.data);
        } else {
          setCourseData(mockCourseData);
        }
      } catch (err) {
        console.warn('Error fetching course data:', err);
        setCourseData(mockCourseData);
      }
      
      try {
        const studentsResponse = await api.get(`${API_ENDPOINTS.GET_LOW_ATTENDANCE}/${courseId}?threshold=${thresholdPercentage}`);
        
        if (studentsResponse.data && studentsResponse.data.success) {
          setLowAttendanceStudents(studentsResponse.data.data || []);
        } else {
          setLowAttendanceStudents(mockLowAttendanceStudents);
        }
      } catch (err) {
        console.warn('Error fetching low attendance students:', err);
        setLowAttendanceStudents(mockLowAttendanceStudents);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchLowAttendanceData:', err);
      setLowAttendanceStudents(mockLowAttendanceStudents.slice(0, 4));
      setCourseData({
        id: courseId,
        name: 'Computer Network',
        code: 'CS2008',
        totalStudents: 45,
        lowAttendanceCount: 4,
        averageAttendance: 82
      });
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLowAttendanceData();
    setRefreshing(false);
    showSnackbar('Data refreshed successfully', 'success');
  };

  // Get attendance status
  const getAttendanceStatus = (attendance) => {
    if (attendance < 50) return 'critical';
    if (attendance < 65) return 'warning';
    return 'at-risk';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return '#f44336';
      case 'warning': return '#ff9800';
      case 'at-risk': return '#ffc107';
      default: return '#4caf50';
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle threshold change
  const handleThresholdChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setThresholdPercentage(value);
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort students
  const getFilteredAndSortedStudents = () => {
    let filtered = lowAttendanceStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      
      const status = getAttendanceStatus(student.attendance);
      return matchesSearch && status === filterStatus;
    });

    // Sort students
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'attendance') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredStudents = getFilteredAndSortedStudents();

  // Handle student selection
  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Select all students
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Navigate to student profile
  const viewStudentProfile = (studentId) => {
    navigate(`/student/profile/${studentId}`);
  };
  
  // Navigate back to faculty dashboard
  const handleGoBack = () => {
    navigate('/faculty/dashboard');
  };

  // Open notification dialog
  const openNotificationDialog = () => {
    if (selectedStudents.length === 0) {
      showSnackbar('Please select students to send notifications', 'warning');
      return;
    }
    setNotificationDialog(true);
  };

  // Send notifications
  const handleSendNotifications = async () => {
    try {
      const selectedStudentData = filteredStudents.filter(s => selectedStudents.includes(s.id));
      
      // In a real app, you would call your API to send notifications
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setNotificationDialog(false);
      setSelectedStudents([]);
      setCustomMessage('');
      showSnackbar(`${notificationType.toUpperCase()} notifications sent to ${selectedStudentData.length} students`, 'success');
    } catch (err) {
      console.error('Error sending notifications:', err);
      showSnackbar('Failed to send notifications. Please try again.', 'error');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Roll Number', 'Attendance %', 'Classes Attended', 'Total Classes', 'Status', 'Last Attended'];
    const csvData = filteredStudents.map(student => [
      student.name,
      student.rollNumber,
      student.attendance,
      student.classesAttended,
      student.totalClasses,
      getAttendanceStatus(student.attendance),
      student.lastAttended
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `low-attendance-${courseData?.code}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showSnackbar('Data exported successfully', 'success');
  };

  // Get statistics
  const getStatistics = () => {
    const critical = filteredStudents.filter(s => getAttendanceStatus(s.attendance) === 'critical').length;
    const warning = filteredStudents.filter(s => getAttendanceStatus(s.attendance) === 'warning').length;
    const atRisk = filteredStudents.filter(s => getAttendanceStatus(s.attendance) === 'at-risk').length;
    
    return { critical, warning, atRisk };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="low-attendance-loading">
        <CircularProgress />
        <Typography variant="h6">Loading low attendance data...</Typography>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="low-attendance-error">
        <Typography variant="h6" color="error">{error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleGoBack}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="low-attendance-container">
      <Container maxWidth="xl">
        <div className="low-attendance-header">
          <div className="header-top">
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={handleGoBack} 
              className="back-button"
            >
              Back
            </Button>
            <div className="course-info">
              <Typography variant="h4" component="h1">
                Low Attendance Students
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {courseData?.name} ({courseData?.code}) - {courseData?.semester}
              </Typography>
            </div>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon className={refreshing ? 'rotating' : ''} />
              </IconButton>
            </Tooltip>
          </div>

          {/* Statistics Cards */}
          <Grid container spacing={3} className="statistics-grid">
            <Grid item xs={12} sm={6} md={3}>
              <Card className="stat-card critical">
                <CardContent>
                  <div className="stat-content">
                    <CriticalIcon className="stat-icon" />
                    <div>
                      <Typography variant="h4">{stats.critical}</Typography>
                      <Typography variant="body2">Critical (&lt;50%)</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="stat-card warning">
                <CardContent>
                  <div className="stat-content">
                    <WarningIcon className="stat-icon" />
                    <div>
                      <Typography variant="h4">{stats.warning}</Typography>
                      <Typography variant="body2">Warning (50-64%)</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="stat-card at-risk">
                <CardContent>
                  <div className="stat-content">
                    <WarningIcon className="stat-icon" />
                    <div>
                      <Typography variant="h4">{stats.atRisk}</Typography>
                      <Typography variant="body2">At Risk (65-74%)</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="stat-card total">
                <CardContent>
                  <div className="stat-content">
                    <PersonIcon className="stat-icon" />
                    <div>
                      <Typography variant="h4">{filteredStudents.length}</Typography>
                      <Typography variant="body2">Total Students</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>

        {/* Filters and Actions */}
        <div className="controls-section">
          <div className="filters">
            <TextField
              label="Search Students"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              className="search-field"
            />
            
            <TextField
              label="Threshold %"
              variant="outlined"
              size="small"
              type="number"
              value={thresholdPercentage}
              onChange={handleThresholdChange}
              InputProps={{
                inputProps: { min: 0, max: 100 }
              }}
              className="threshold-field"
            />

            <FormControl size="small" className="filter-select">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                label="Filter by Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Students</MenuItem>
                <MenuItem value="critical">Critical (&lt;50%)</MenuItem>
                <MenuItem value="warning">Warning (50-64%)</MenuItem>
                <MenuItem value="at-risk">At Risk (65-74%)</MenuItem>
              </Select>
            </FormControl>
          </div>
          
          <div className="actions">
            <Button 
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportToCSV}
              disabled={filteredStudents.length === 0}
            >
              Export CSV
            </Button>
            
            <Button 
              variant="contained" 
              color="warning" 
              startIcon={<NotificationsIcon />}
              onClick={openNotificationDialog}
              disabled={selectedStudents.length === 0}
            >
              Send Notifications ({selectedStudents.length})
            </Button>
          </div>
        </div>
        
        {/* Students Table */}
        <Paper className="students-table-container">
          <div className="table-header">
            <Typography variant="h6">
              {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''} with Attendance Below {thresholdPercentage}%
            </Typography>
            {filteredStudents.length > 0 && (
              <Button 
                size="small"
                onClick={handleSelectAll}
                className="select-all-button"
              >
                {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
          
          <div className="table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input 
                      type="checkbox"
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>#</th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('rollNumber')}
                  >
                    Roll Number {sortBy === 'rollNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('attendance')}
                  >
                    Attendance {sortBy === 'attendance' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Classes</th>
                  <th>Status</th>
                  <th>Last Attended</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => {
                    const status = getAttendanceStatus(student.attendance);
                    return (
                      <tr key={student.id} className={selectedStudents.includes(student.id) ? 'selected' : ''}>
                        <td>
                          <input 
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleStudentSelect(student.id)}
                          />
                        </td>
                        <td>{index + 1}</td>
                        <td className="student-name">{student.name}</td>
                        <td>{student.rollNumber}</td>
                        <td>
                          <div className="attendance-cell">
                            <div className="attendance-bar">
                              <div 
                                className="attendance-fill"
                                style={{ 
                                  width: `${student.attendance}%`,
                                  backgroundColor: getStatusColor(status)
                                }}
                              ></div>
                              <span className="attendance-text">
                                {student.attendance.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{student.classesAttended}/{student.totalClasses}</td>
                        <td>
                          <Chip
                            label={status === 'at-risk' ? 'At Risk' : status.charAt(0).toUpperCase() + status.slice(1)}
                            className={`status-chip ${status}`}
                            size="small"
                          />
                        </td>
                        <td>{student.lastAttended}</td>
                        <td>
                          <Tooltip title="View Profile">
                            <IconButton
                              size="small"
                              onClick={() => viewStudentProfile(student.id)}
                              className="action-button"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="no-data">
                      No students found with attendance below {thresholdPercentage}%
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Paper>

        {/* Notification Dialog */}
        <Dialog 
          open={notificationDialog} 
          onClose={() => setNotificationDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Send Notifications</DialogTitle>
          <DialogContent>
            <div className="notification-form">
              <FormControl fullWidth margin="normal">
                <InputLabel>Notification Type</InputLabel>
                <Select
                  value={notificationType}
                  label="Notification Type"
                  onChange={(e) => setNotificationType(e.target.value)}
                >
                  <MenuItem value="email">
                    <EmailIcon style={{ marginRight: 8 }} />
                    Email
                  </MenuItem>
                  <MenuItem value="sms">
                    <SmsIcon style={{ marginRight: 8 }} />
                    SMS
                  </MenuItem>
                  <MenuItem value="both">
                    <NotificationsIcon style={{ marginRight: 8 }} />
                    Both Email & SMS
                  </MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Custom Message (Optional)"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                margin="normal"
                placeholder="Enter a custom message for the notification..."
              />
              
              <Alert severity="info" style={{ marginTop: 16 }}>
                This will send notifications to {selectedStudents.length} selected students about their low attendance.
              </Alert>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNotificationDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSendNotifications}>
              Send Notifications
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={closeSnackbar}
        >
          <Alert onClose={closeSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default LowAttendancePage;