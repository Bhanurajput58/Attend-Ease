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
  const [customMessage, setCustomMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refreshing, setRefreshing] = useState(false);

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
    
    console.log('Fetching data for course ID:', courseId);
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch course data
      try {
        console.log('Fetching course data from:', `${API_ENDPOINTS.GET_COURSE_BY_ID(courseId)}`);
        const courseResponse = await api.get(`${API_ENDPOINTS.GET_COURSE_BY_ID(courseId)}`);
        console.log('Course response:', courseResponse.data);
        if (courseResponse.data && courseResponse.data.success) {
          setCourseData(courseResponse.data.data);
        } else {
          setCourseData(null);
          setError('Course data not available');
        }
      } catch (err) {
        console.error('Error fetching course data:', err);
        setCourseData(null);
        setError('Failed to load course information');
      }
      
      // Fetch low attendance students
      try {
        console.log('Fetching low attendance students from:', `${API_ENDPOINTS.GET_LOW_ATTENDANCE(courseId)}?threshold=${thresholdPercentage}`);
        const studentsResponse = await api.get(`${API_ENDPOINTS.GET_LOW_ATTENDANCE(courseId)}?threshold=${thresholdPercentage}`);
        console.log('Students response:', studentsResponse.data);
        
        if (studentsResponse.data && studentsResponse.data.success) {
          // Backend returns { data: { students: [...], course: {...}, statistics: {...} } }
          const studentsData = studentsResponse.data.data;
          console.log('Students data:', studentsData);
          setLowAttendanceStudents(studentsData.students || []);
          
          // Also update course data if not already set
          if (!courseData && studentsData.course) {
            setCourseData(studentsData.course);
          }
        } else {
          setLowAttendanceStudents([]);
        }
      } catch (err) {
        console.error('Error fetching low attendance students:', err);
        setLowAttendanceStudents([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchLowAttendanceData:', err);
      setError('Failed to load data. Please try again.');
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
    if (!attendance) return 'unknown';
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
      case 'unknown': return '#9e9e9e';
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
      const matchesSearch = (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (student.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      
      const status = getAttendanceStatus(student.attendance);
      return matchesSearch && status === filterStatus;
    });

    // Sort students
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'attendance') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
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
      
      if (selectedStudentData.length === 0) {
        showSnackbar('No students selected', 'warning');
        return;
      }
      
      // Show loading state
      setSnackbar({ open: true, message: 'Sending emails...', severity: 'info' });
      
      // Prepare the email data
      const emailData = {
        courseId: courseId,
        studentIds: selectedStudentData.map(s => s.id),
        customMessage: customMessage,
        threshold: thresholdPercentage
      };
      
      // Call the low attendance emails API
      const response = await api.post(API_ENDPOINTS.SEND_LOW_ATTENDANCE_EMAILS, emailData);
      
      if (response.data && response.data.success) {
        setNotificationDialog(false);
        setSelectedStudents([]);
        setCustomMessage('');
        
        // Show detailed results
        const { data } = response.data;
        let message = response.data.message;
        
        // Add detailed statistics
        if (data.emailResults && data.emailResults.length > 0) {
          const successful = data.emailResults.filter(r => r.success).length;
          const failed = data.emailResults.filter(r => !r.success).length;
          message += `\n\nDetailed Results: ${successful} successful, ${failed} failed`;
          
          // Log detailed results for debugging
          console.log('Email Results:');
          data.emailResults.forEach(result => {
            if (result.success) {
              console.log(`✅ Email sent to ${result.studentName} (${result.email})`);
            } else {
              console.log(`❌ Email failed for ${result.studentName}: ${result.error}`);
            }
          });
        }
        
        showSnackbar(message, 'success');
        
      } else {
        throw new Error('Failed to send emails');
      }
      
    } catch (err) {
      console.error('Error sending emails:', err);
      
      let errorMessage = 'Failed to send emails. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showSnackbar(errorMessage, 'error');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Roll Number', 'Attendance %', 'Classes Attended', 'Total Classes', 'Status', 'Last Attended'];
    const csvData = filteredStudents.map(student => [
      student.name || 'N/A',
      student.rollNumber || 'N/A',
      student.attendance || 0,
      student.classesAttended || 0,
      student.totalClasses || 0,
      getAttendanceStatus(student.attendance),
      student.lastAttended || 'N/A'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `low-attendance-${courseData?.code || 'course'}-${new Date().toISOString().split('T')[0]}.csv`;
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

  if (!courseData) {
    return (
      <div className="low-attendance-error">
        <Typography variant="h6" color="error">Course information not available</Typography>
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
          <div className="low-attendance-header-top">
            <div className="low-attendance-course-info">
              <Typography variant="h4" component="h1">
                Low Attendance Students
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {courseData.name || 'Course Name Not Available'} ({courseData.code || 'Code Not Available'}) - {courseData.semester || 'Semester Not Available'}
              </Typography>
            </div>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon className={refreshing ? 'low-attendance-rotating' : ''} />
              </IconButton>
            </Tooltip>
          </div>

          {/* Statistics Cards */}
          <Grid container spacing={3} className="low-attendance-statistics-grid">
            <Grid item xs={12} sm={6} md={3}>
              <Card className="low-attendance-stat-card critical">
                <CardContent>
                  <div className="low-attendance-stat-content">
                    <CriticalIcon className="low-attendance-stat-icon" />
                    <div>
                      <Typography variant="h4">{stats.critical}</Typography>
                      <Typography variant="body2">Critical (&lt;50%)</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="low-attendance-stat-card warning">
                <CardContent>
                  <div className="low-attendance-stat-content">
                    <WarningIcon className="low-attendance-stat-icon" />
                    <div>
                      <Typography variant="h4">{stats.warning}</Typography>
                      <Typography variant="body2">Warning (50-64%)</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="low-attendance-stat-card at-risk">
                <CardContent>
                  <div className="low-attendance-stat-content">
                    <WarningIcon className="low-attendance-stat-icon" />
                    <div>
                      <Typography variant="h4">{stats.atRisk}</Typography>
                      <Typography variant="body2">At Risk (65-74%)</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="low-attendance-stat-card total">
                <CardContent>
                  <div className="low-attendance-stat-content">
                    <PersonIcon className="low-attendance-stat-icon" />
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
        <div className="low-attendance-controls-section">
          <div className="low-attendance-filters">
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
              className="low-attendance-search-field"
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
              className="low-attendance-threshold-field"
            />

            <FormControl size="small" className="low-attendance-filter-select">
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
          
          <div className="low-attendance-actions">
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
              startIcon={<EmailIcon />}
              onClick={openNotificationDialog}
              disabled={selectedStudents.length === 0}
            >
              Send Email ({selectedStudents.length})
            </Button>
          </div>
        </div>
        
        {/* Students Table */}
        <Paper className="low-attendance-students-table-container">
          <div className="low-attendance-table-header">
            <Typography variant="h6">
              {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''} with Attendance Below {thresholdPercentage}%
            </Typography>
            {filteredStudents.length > 0 && (
              <Button 
                size="small"
                onClick={handleSelectAll}
                className="low-attendance-select-all-button"
              >
                {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
          
          <div className="low-attendance-table-wrapper">
            <table className="low-attendance-students-table">
              <thead>
                <tr>
                  <th className="low-attendance-checkbox-column">
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
                        <td className="low-attendance-student-name">{student.name || 'Name Not Available'}</td>
                        <td>{student.rollNumber || 'Roll Number Not Available'}</td>
                        <td>
                          <div className="low-attendance-attendance-cell">
                            <div className="low-attendance-attendance-bar">
                              <div 
                                className="low-attendance-attendance-fill"
                                style={{ 
                                  width: `${student.attendance || 0}%`,
                                  backgroundColor: getStatusColor(status)
                                }}
                              ></div>
                              <span className="low-attendance-attendance-text">
                                {(student.attendance || 0).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{student.classesAttended || 0}/{student.totalClasses || 0}</td>
                        <td>
                          <Chip
                            label={status === 'at-risk' ? 'At Risk' : status.charAt(0).toUpperCase() + status.slice(1)}
                            className={`low-attendance-status-chip ${status}`}
                            size="small"
                          />
                          {!student.email && (
                            <Chip
                              label="No Email"
                              color="warning"
                              size="small"
                              sx={{ ml: 0.5, fontSize: '0.6rem', height: 16 }}
                              title="This student doesn't have an email address and cannot receive emails"
                            />
                          )}
                        </td>
                        <td>
                          <Tooltip title="View Profile">
                            <IconButton
                              size="small"
                              onClick={() => viewStudentProfile(student.id)}
                              className="low-attendance-action-button"
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
                    <td colSpan="8" className="low-attendance-no-data">
                      {lowAttendanceStudents.length === 0 
                        ? 'No students found with attendance below the threshold'
                        : 'No students match the current search criteria'
                      }
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
          <DialogTitle>Send Email</DialogTitle>
          <DialogContent>
            <div className="low-attendance-notification-form">
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
                This will send email to {selectedStudents.length} selected students about their low attendance.
                {filteredStudents.filter(s => selectedStudents.includes(s.id) && !s.email).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Note:</strong> Some students don't have email addresses and cannot receive emails.
                    The system will use the email addresses from the imported students collection.
                  </div>
                )}
              </Alert>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNotificationDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSendNotifications}>
              Send Email
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