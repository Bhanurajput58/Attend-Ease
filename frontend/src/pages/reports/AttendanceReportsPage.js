import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Button, 
  Menu, 
  MenuItem, 
  Divider, 
  Paper, 
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GetAppIcon from '@mui/icons-material/GetApp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import useAuth from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../config/api';
import API_BASE_URL from '../../config/api';
import axios from 'axios';
import './AttendanceReportsPage.css';

/**
 * Attendance Reports Page Component
 * Dedicated page for generating and exporting attendance reports
 */
const AttendanceReportsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coursesList, setCoursesList] = useState([]);

  // Menu states for the export options
  const [formatMenuAnchor, setFormatMenuAnchor] = useState(null);
  const [periodMenuAnchor, setPeriodMenuAnchor] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courseMenuAnchor, setCourseMenuAnchor] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching faculty courses data');
        
        // The token is automatically sent via cookie
        const response = await axios.get(API_ENDPOINTS.GET_FACULTY_DASHBOARD, {
          withCredentials: true
        });
        
        console.log('Dashboard API response:', response.data);
        
        if (response.data.success && response.data.data) {
          // Extract course list from the response
          setCoursesList(response.data.data.coursesList || []);
          console.log('Courses list updated:', response.data.data.coursesList || []);
        } else {
          console.error('Failed to fetch courses data:', response.data);
          setError('Failed to load courses data. Please try again later.');
          // Use mock data as fallback
          const mockCourses = [
            { id: '1', name: 'Advanced Mathematics' },
            { id: '2', name: 'Physics 101' },
            { id: '3', name: 'Chemistry Lab' },
            { id: '4', name: 'Computer Science Fundamentals' },
            { id: '5', name: 'Data Structures and Algorithms' }
          ];
          console.log('Using fallback mock data with courses:', mockCourses);
          setCoursesList(mockCourses);
        }
      } catch (error) {
        console.error('Error fetching courses data:', error);
        setError(`Failed to load courses data: ${error.message}`);
        // Use mock data as fallback
        const mockCourses = [
          { id: '1', name: 'Advanced Mathematics' },
          { id: '2', name: 'Physics 101' },
          { id: '3', name: 'Chemistry Lab' },
          { id: '4', name: 'Computer Science Fundamentals' },
          { id: '5', name: 'Data Structures and Algorithms' }
        ];
        console.log('Using fallback mock data with courses:', mockCourses);
        setCoursesList(mockCourses);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchCourses();
    } else {
      console.log('User is not authenticated');
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Functions for handling the export menus
  const handleFormatMenuOpen = (event) => {
    setFormatMenuAnchor(event.currentTarget);
  };

  const handleFormatMenuClose = () => {
    setFormatMenuAnchor(null);
  };

  const handlePeriodMenuOpen = (event) => {
    setPeriodMenuAnchor(event.currentTarget);
  };

  const handlePeriodMenuClose = () => {
    setPeriodMenuAnchor(null);
  };
  
  const handleCourseMenuOpen = (event) => {
    setCourseMenuAnchor(event.currentTarget);
  };

  const handleCourseMenuClose = () => {
    setCourseMenuAnchor(null);
  };
  
  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    handleFormatMenuClose();
  };

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    handlePeriodMenuClose();
  };
  
  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    handleCourseMenuClose();
  };

  const generateExportFileName = () => {
    const currentDate = new Date();
    const date = currentDate.toISOString().split('T')[0];
    const courseName = selectedCourse === 'all' 
      ? 'All-Courses' 
      : coursesList.find(c => c.id === selectedCourse)?.name.replace(/\s+/g, '-') || 'Course';
    
    return `Attendance-${courseName}-${selectedPeriod}-${date}.${selectedFormat === 'excel' ? 'xlsx' : 'pdf'}`;
  };

  // Fetch attendance data based on parameters
  const fetchAttendanceData = async (...args) => {
    try {
      let startDate, endDate, courseId, periodValue;
      
      if (args.length >= 2 && args[1] instanceof Date) {
        // Handle direct date objects (for backward compatibility)
        [startDate, endDate, courseId] = args;
        courseId = courseId || 'all'; 
      } else {
        // Handle string period values
        [courseId, periodValue] = args;
        
        if (typeof periodValue !== 'string') {
          throw new Error('Invalid period parameter');
        }
        
        // Get current date from the system
        const currentDate = new Date();
        console.log('System current date for query:', currentDate.toLocaleString());
        
        endDate = new Date(currentDate);
        startDate = new Date(currentDate);
        
        // Extend the date range to ensure we catch all records
        switch(periodValue) {
          case 'daily':
            // For daily, use the whole day (midnight to midnight)
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'weekly':
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'monthly':
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'semester':
            startDate.setMonth(startDate.getMonth() - 6);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          default:
            // Default to today
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        }
      }
      
      console.log('Date range for attendance query:', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        formattedStart: startDate.toLocaleDateString(),
        formattedEnd: endDate.toLocaleDateString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
      
      if (courseId && courseId !== 'all') {
        params.courseId = courseId;
      }
      
      console.log('Requesting attendance data with params:', params);
      console.log('API endpoint:', API_ENDPOINTS.GET_ATTENDANCE);
      
      const response = await axios.get(API_ENDPOINTS.GET_ATTENDANCE, {
        params,
        withCredentials: true
      });
      
      console.log('Attendance API response:', {
        success: response.data?.success,
        message: response.data?.message,
        recordCount: response.data?.attendanceRecords?.length || 0
      });
      
      if (response.data && response.data.success) {
        return response.data.attendanceRecords || [];
      } else {
        throw new Error(response.data?.message || 'Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      throw error;
    }
  };

  // Export report function
  const handleExportReport = async () => {
    setExportLoading(true);
    try {
      console.log('Starting export process with format:', selectedFormat);
      console.log('Selected course:', selectedCourse);
      console.log('Selected period:', selectedPeriod);

      // Get the current date for debug logging
      const sysDate = new Date();
      console.log('System current date:', sysDate.toLocaleString());

      // Set up date range based on selected period
      const now = new Date();
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      // Handle different period types
      if (selectedPeriod === 'weekly') {
        // Start from 7 days ago
        startDate.setDate(now.getDate() - 7);
      } else if (selectedPeriod === 'monthly') {
        // Start from 30 days ago
        startDate.setDate(now.getDate() - 30);
      } else if (selectedPeriod === 'semester') {
        // Start from 6 months ago
        startDate.setMonth(now.getMonth() - 6);
      } else {
          // Default to today
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
      }
      
      console.log('Date range for export:', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        formattedStart: startDate.toLocaleDateString(),
        formattedEnd: endDate.toLocaleDateString()
      });

      // Skip the attendance data check - we'll leave it to the backend
      // to return data if available or empty report if not
      
      // Construct the export endpoint URL with date range
      const endpoint = `${API_BASE_URL}/api/attendance/export?format=${selectedFormat}&courseId=${selectedCourse}&startDate=${encodeURIComponent(startDate.toISOString())}&endDate=${encodeURIComponent(endDate.toISOString())}`;
      console.log('Export endpoint URL:', endpoint);

      // Use Fetch API with proper blob handling
      console.log('Making export request for real PDF/Excel file');
      
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Accept': selectedFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export request failed:', response.status, errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get content disposition to extract filename if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = generateExportFileName();
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }
      
      // Get the blob data
      const blob = await response.blob();
      console.log('Received blob response:', {
        type: blob.type,
        size: blob.size,
        fileName: fileName
      });
      
      if (blob.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      // Create object URL for download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      
      // Append to html page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Report downloaded successfully');
    } catch (error) {
      console.error('Error preparing export:', error);
      alert(`Failed to prepare export: ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  // Get period icon
  const getPeriodIcon = (period) => {
    switch(period) {
      case 'daily': return <CalendarTodayIcon />;
      case 'weekly': return <ViewWeekIcon />;
      case 'monthly': return <DateRangeIcon />;
      case 'semester': return <DateRangeIcon />;
      default: return <CalendarTodayIcon />;
    }
  };

  // Get period label
  const getPeriodLabel = (period) => {
    switch(period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'semester': return 'Semester';
      default: return 'Daily';
    }
  };

  // Get format icon
  const getFormatIcon = (format) => {
    return format === 'pdf' ? <PictureAsPdfIcon /> : <TableChartIcon />;
  };

  // Get format label
  const getFormatLabel = (format) => {
    return format === 'pdf' ? 'PDF' : 'Excel';
  };

  if (loading) {
    return (
      <div className="attendance-reports-container">
        <Container maxWidth="lg">
          <Box className="loading-container">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading Reports...
            </Typography>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="attendance-reports-container">
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box className="reports-header">
          <Box className="header-content">
            <Box className="header-text">
              <Typography variant="h3" className="page-title">
                Attendance Reports
              </Typography>
              <Typography variant="subtitle1" className="page-subtitle">
                Generate and export comprehensive attendance reports for your courses
              </Typography>
            </Box>
            <Box className="header-icon">
              <AssessmentIcon className="header-icon-svg" />
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="warning" className="error-alert">
            <Typography variant="body2">
              {error} - Using fallback options with mock data
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Custom Report Builder */}
          <Grid item xs={12} lg={8}>
            <Card className="report-card">
              <CardContent>
                <Box className="card-header">
                  <Typography variant="h5" className="card-title">
                    <GetAppIcon className="card-icon" />
                    Custom Report Builder
                  </Typography>
                  <Typography variant="body2" className="card-description">
                    Create personalized attendance reports by selecting your preferred options
                  </Typography>
                </Box>

                <Box className="report-builder">
                  <Grid container spacing={2}>
                    {/* Format Selection */}
                    <Grid item xs={12} sm={4}>
                      <Box className="selection-group">
                        <Typography variant="subtitle2" className="selection-label">
                          Report Format
                        </Typography>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={handleFormatMenuOpen}
                          startIcon={getFormatIcon(selectedFormat)}
                          className="selection-button"
                        >
                          {getFormatLabel(selectedFormat)}
                        </Button>
                        <Menu
                          anchorEl={formatMenuAnchor}
                          open={Boolean(formatMenuAnchor)}
                          onClose={handleFormatMenuClose}
                        >
                          <MenuItem onClick={() => handleFormatSelect('pdf')}>
                            <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
                            PDF Report
                          </MenuItem>
                          <MenuItem onClick={() => handleFormatSelect('excel')}>
                            <TableChartIcon fontSize="small" sx={{ mr: 1 }} />
                            Excel Report
                          </MenuItem>
                        </Menu>
                      </Box>
                    </Grid>
                    
                    {/* Time Period Selection */}
                    <Grid item xs={12} sm={4}>
                      <Box className="selection-group">
                        <Typography variant="subtitle2" className="selection-label">
                          Time Period
                        </Typography>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={handlePeriodMenuOpen}
                          startIcon={getPeriodIcon(selectedPeriod)}
                          className="selection-button"
                        >
                          {getPeriodLabel(selectedPeriod)}
                        </Button>
                        <Menu
                          anchorEl={periodMenuAnchor}
                          open={Boolean(periodMenuAnchor)}
                          onClose={handlePeriodMenuClose}
                        >
                          <MenuItem onClick={() => handlePeriodSelect('daily')}>
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                            Daily Report
                          </MenuItem>
                          <MenuItem onClick={() => handlePeriodSelect('weekly')}>
                            <ViewWeekIcon fontSize="small" sx={{ mr: 1 }} />
                            Weekly Report
                          </MenuItem>
                          <MenuItem onClick={() => handlePeriodSelect('monthly')}>
                            <DateRangeIcon fontSize="small" sx={{ mr: 1 }} />
                            Monthly Report
                          </MenuItem>
                          <MenuItem onClick={() => handlePeriodSelect('semester')}>
                            <DateRangeIcon fontSize="small" sx={{ mr: 1 }} />
                            Semester Report
                          </MenuItem>
                        </Menu>
                      </Box>
                    </Grid>
                    
                    {/* Course Selection */}
                    <Grid item xs={12} sm={4}>
                      <Box className="selection-group">
                        <Typography variant="subtitle2" className="selection-label">
                          Course Selection
                        </Typography>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={handleCourseMenuOpen}
                          startIcon={<SchoolIcon />}
                          className="selection-button"
                        >
                          {selectedCourse === 'all' ? 'All Courses' : 
                           coursesList.find(c => c.id === selectedCourse)?.name || 'Select Course'}
                        </Button>
                        <Menu
                          anchorEl={courseMenuAnchor}
                          open={Boolean(courseMenuAnchor)}
                          onClose={handleCourseMenuClose}
                        >
                          <MenuItem onClick={() => handleCourseSelect('all')}>
                            All Courses
                          </MenuItem>
                          <Divider />
                          {coursesList && coursesList.length > 0 ? (
                            coursesList.map(course => (
                              <MenuItem key={course.id} onClick={() => handleCourseSelect(course.id)}>
                                {course.name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>No courses available</MenuItem>
                          )}
                        </Menu>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Generate Report Button */}
                  <Box className="generate-section">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                      onClick={handleExportReport}
                      disabled={exportLoading}
                      size="large"
                      className="generate-button"
                    >
                      {exportLoading ? 'Generating Report...' : 'Generate Report'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card className="report-card">
              <CardContent>
                <Box className="card-header">
                  <Typography variant="h6" className="card-title">
                    <AssessmentIcon className="card-icon" />
                    Quick Actions
                  </Typography>
                </Box>
                
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={() => {
                      setSelectedPeriod('daily');
                      setSelectedFormat('pdf');
                      setSelectedCourse('all');
                      setTimeout(handleExportReport, 100);
                    }}
                    className="quick-action-button"
                  >
                    Today's Report (PDF)
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<TableChartIcon />}
                    onClick={() => {
                      setSelectedPeriod('weekly');
                      setSelectedFormat('excel');
                      setSelectedCourse('all');
                      setTimeout(handleExportReport, 100);
                    }}
                    className="quick-action-button"
                  >
                    Weekly Summary (Excel)
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={() => {
                      setSelectedPeriod('monthly');
                      setSelectedFormat('pdf');
                      setSelectedCourse('all');
                      setTimeout(handleExportReport, 100);
                    }}
                    className="quick-action-button"
                  >
                    Monthly Report (PDF)
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Course-Specific Quick Export */}
          <Grid item xs={12}>
            <Card className="report-card">
              <CardContent>
                <Box className="card-header">
                  <Typography variant="h5" className="card-title">
                    <SchoolIcon className="card-icon" />
                    Course-Specific Reports
                  </Typography>
                  <Typography variant="body2" className="card-description">
                    Generate reports for individual courses with one click
                  </Typography>
                </Box>
                
                {coursesList.length > 0 ? (
                  <Grid container spacing={2}>
                    {coursesList.map((course) => (
                      <Grid item xs={12} sm={6} md={4} key={course.id}>
                        <Card className="course-card">
                          <CardContent>
                            <Typography variant="h6" className="course-name">
                              {course.name}
                            </Typography>
                            <Box className="course-actions">
                              <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<PictureAsPdfIcon />}
                                onClick={() => {
                                  setSelectedPeriod('daily');
                                  setSelectedFormat('pdf');
                                  setSelectedCourse(course.id);
                                  setTimeout(handleExportReport, 100);
                                }}
                                className="course-action-button"
                              >
                                Today (PDF)
                              </Button>
                              <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<TableChartIcon />}
                                onClick={() => {
                                  setSelectedPeriod('weekly');
                                  setSelectedFormat('excel');
                                  setSelectedCourse(course.id);
                                  setTimeout(handleExportReport, 100);
                                }}
                                className="course-action-button"
                              >
                                Weekly (Excel)
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box className="empty-state">
                    <SchoolIcon className="empty-icon" />
                    <Typography variant="body2" className="empty-text">
                      No courses found. Please check your course assignments.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Report Instructions */}
          <Grid item xs={12}>
            <Card className="report-card">
              <CardContent>
                <Box className="card-header">
                  <Typography variant="h5" className="card-title">
                    <HelpOutlineIcon className="card-icon" />
                    Report Types & Instructions
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box className="instruction-section">
                      <Typography variant="h6" className="instruction-title">
                        Report Types
                      </Typography>
                      <Box className="instruction-list">
                        <Box className="instruction-item">
                          <Chip label="Daily" size="small" color="primary" />
                          <Typography variant="body2">
                            Current day attendance with present/absent counts and percentages
                          </Typography>
                        </Box>
                        <Box className="instruction-item">
                          <Chip label="Weekly" size="small" color="secondary" />
                          <Typography variant="body2">
                            7-day overview showing attendance trends and patterns
                          </Typography>
                        </Box>
                        <Box className="instruction-item">
                          <Chip label="Monthly" size="small" color="info" />
                          <Typography variant="body2">
                            Comprehensive view of attendance patterns over the past month
                          </Typography>
                        </Box>
                       
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box className="instruction-section">
                      <Typography variant="h6" className="instruction-title">
                        Export Formats
                      </Typography>
                      <Box className="instruction-list">
                        <Box className="instruction-item">
                          <Chip icon={<PictureAsPdfIcon />} label="PDF" size="small" color="error" />
                          <Typography variant="body2">
                            Perfect for printing, sharing, and official documentation
                          </Typography>
                        </Box>
                        <Box className="instruction-item">
                          <Chip icon={<TableChartIcon />} label="Excel" size="small" color="success" />
                          <Typography variant="body2">
                            Ideal for data analysis, filtering, and further processing
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default AttendanceReportsPage; 