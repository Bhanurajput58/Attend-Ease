import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Grid,
  Button,
  CircularProgress,
  Alert,
  tableCellClasses,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, api } from '../../config/api';
import useAuth from '../../hooks/useAuth';
import './StudentAttendancePage.css';

const PageContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const HeaderPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  background: 'linear-gradient(135deg, #4a90e2 0%, #6c3fd3 100%)',
  color: 'white',
}));

const ContentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[100],
    fontWeight: 'bold',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const StudentAttendance = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    course: '',
    status: '',
    dateRange: '',
  });
  const [availableCourses, setAvailableCourses] = useState([]);

  const studentId = params.studentId || user?._id;

  const fetchAttendanceData = async (targetId) => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);

      const response = await api.get(API_ENDPOINTS.GET_STUDENT_ATTENDANCE(targetId));
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        const transformedData = data.history || [];
        setAttendanceData(transformedData);
        
        // Extract unique courses for filter
        const courses = [...new Set(transformedData.map(record => record.course || record.subject).filter(Boolean))];
        setAvailableCourses(courses);
      } else {
        throw new Error('Failed to fetch attendance data');
      }
    } catch (err) {
      setError('Failed to load attendance data. Please try refreshing the page.');
      setAttendanceData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter attendance data based on selected filters
  const getFilteredAttendanceData = () => {
    let filteredData = [...attendanceData];

    // Filter by course
    if (filters.course) {
      filteredData = filteredData.filter(record => 
        (record.course || record.subject) === filters.course
      );
    }

    // Filter by status
    if (filters.status) {
      filteredData = filteredData.filter(record => 
        record.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Filter by date range
    if (filters.dateRange) {
      const today = new Date();
      const recordDate = new Date();
      
      filteredData = filteredData.filter(record => {
        if (!record.date) return false;
        
        try {
          recordDate.setTime(new Date(record.date).getTime());
        } catch (e) {
          return false;
        }
        
        switch (filters.dateRange) {
          case 'today':
            return recordDate.toDateString() === today.toDateString();
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return recordDate.toDateString() === yesterday.toDateString();
          case 'this-week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return recordDate >= startOfWeek;
          case 'last-week':
            const startOfLastWeek = new Date(today);
            startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
            startOfLastWeek.setHours(0, 0, 0, 0);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
            endOfLastWeek.setHours(23, 59, 59, 999);
            return recordDate >= startOfLastWeek && recordDate <= endOfLastWeek;
          case 'this-month':
            return recordDate.getMonth() === today.getMonth() && 
                   recordDate.getFullYear() === today.getFullYear();
          case 'last-month':
            const lastMonth = new Date(today);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return recordDate.getMonth() === lastMonth.getMonth() && 
                   recordDate.getFullYear() === lastMonth.getFullYear();
          default:
            return true;
        }
      });
    }

    return filteredData;
  };

  const filteredAttendanceData = getFilteredAttendanceData();

  useEffect(() => {
    if (!user) {
      setError('Please log in to view your attendance');
      setLoading(false);
      return;
    }

    const targetStudentId = params.studentId || user._id;
    if (!targetStudentId) {
      setError('Unable to determine student ID');
      setLoading(false);
      return;
    }

    fetchAttendanceData(targetStudentId);
  }, [params.studentId, user]);

  const handleRefresh = () => {
    const idToFetch = params.studentId || (user && user.role === 'student' ? user._id : null);
    if (idToFetch) {
      fetchAttendanceData(idToFetch);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ course: '', status: '', dateRange: '' });
  };

  // Use filtered data for statistics when filters are applied, otherwise use original data
  const totalClasses = attendanceData.length;
  const presentClasses = attendanceData.filter(record => record.status === 'Present' || record.status === 'present').length;
  const absentClasses = attendanceData.filter(record => record.status === 'Absent' || record.status === 'absent').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  // Calculate filtered statistics for display
  const filteredTotalClasses = filteredAttendanceData.length;
  const filteredPresentClasses = filteredAttendanceData.filter(record => record.status === 'Present' || record.status === 'present').length;
  const filteredAbsentClasses = filteredAttendanceData.filter(record => record.status === 'Absent' || record.status === 'absent').length;
  const filteredAttendanceRate = filteredTotalClasses > 0 ? Math.round((filteredPresentClasses / filteredTotalClasses) * 100) : 0;

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'present') return 'success';
    if (statusLower === 'absent') return 'error';
    if (statusLower === 'late') return 'warning';
    return 'default';
  };

  if (loading) {
    return (
      <div className="student-attendance-container">
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <Box textAlign="center">
              <CircularProgress size={60} />
              <Typography variant="h6" style={{ marginTop: 16 }}>
                Loading attendance data...
              </Typography>
            </Box>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="student-attendance-container">
      <PageContainer maxWidth="lg">
        <HeaderPaper className="student-attendance-header">
          <Box className="student-attendance-header-content">
            <Typography variant="h4" fontWeight="bold" gutterBottom className="student-attendance-title">
              Attendance Record
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }} className="student-attendance-subtitle">
              Your attendance history for the current semester
            </Typography>
          </Box>
          <Box className="student-attendance-header-actions">
            <Button 
              variant="outlined" 
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              className="student-attendance-refresh-btn"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </HeaderPaper>

        {error && (
          <Alert severity="warning" className="student-attendance-error-alert" sx={{ mb: 3 }}>
            <Typography variant="h6">{error}</Typography>
            <Typography variant="body2">
              Some data may be limited. Please try refreshing the page.
            </Typography>
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }} className="student-attendance-stats-grid">
          <Grid item xs={12} md={3}>
            <StatCard elevation={2} className="student-attendance-stat-card total-classes">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }} className="student-attendance-stat-icon-container">
                <CalendarTodayIcon color="primary" sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary" className="student-attendance-stat-label">Total Classes</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary" className="student-attendance-stat-number">
                {filters.course || filters.status || filters.dateRange ? filteredTotalClasses : totalClasses}
              </Typography>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StatCard elevation={2} className="student-attendance-stat-card present-classes">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }} className="student-attendance-stat-icon-container">
                <EventAvailableIcon color="success" sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary" className="student-attendance-stat-label">Present</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main" className="student-attendance-stat-number">
                {filters.course || filters.status || filters.dateRange ? filteredPresentClasses : presentClasses}
              </Typography>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StatCard elevation={2} className="student-attendance-stat-card absent-classes">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }} className="student-attendance-stat-icon-container">
                <EventBusyIcon color="error" sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary" className="student-attendance-stat-label">Absent</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error.main" className="student-attendance-stat-number">
                {filters.course || filters.status || filters.dateRange ? filteredAbsentClasses : absentClasses}
              </Typography>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StatCard elevation={2} className="student-attendance-stat-card attendance-rate">
              <Typography variant="body2" color="text.secondary" gutterBottom className="student-attendance-stat-label">
                Attendance Rate
              </Typography>
              <Typography variant="h4" fontWeight="bold" color={(filters.course || filters.status || filters.dateRange ? filteredAttendanceRate : attendanceRate) >= 75 ? 'success.main' : 'warning.main'} className="student-attendance-stat-number">
                {filters.course || filters.status || filters.dateRange ? filteredAttendanceRate : attendanceRate}%
              </Typography>
              <Box 
                sx={{ 
                  width: '70%', 
                  height: 6, 
                  bgcolor: '#e0f2f1', 
                  borderRadius: 3,
                  mt: 0.5,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="student-attendance-progress-container"
              >
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${filters.course || filters.status || filters.dateRange ? filteredAttendanceRate : attendanceRate}%`,
                    bgcolor: (filters.course || filters.status || filters.dateRange ? filteredAttendanceRate : attendanceRate) >= 75 ? '#4caf50' : '#ff9800',
                    borderRadius: 3,
                  }}
                  className="student-attendance-progress-bar"
                />
              </Box>
            </StatCard>
          </Grid>
        </Grid>

        {/* Filters Section */}
        <ContentPaper sx={{ mb: 2, p: 2 }} className="student-attendance-filters-paper">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="medium" className="student-attendance-filters-title">
              <FilterListIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
              Filters
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              disabled={!filters.course && !filters.status && !filters.dateRange}
              sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
            >
              Clear Filters
            </Button>
          </Box>
          
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Course</InputLabel>
                <Select
                  value={filters.course}
                  onChange={(e) => handleFilterChange('course', e.target.value)}
                  label="Course"
                >
                  <MenuItem value="">All Courses</MenuItem>
                  {availableCourses.map((course) => (
                    <MenuItem key={course} value={course}>
                      {course}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Date</InputLabel>
                <Select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  label="Date"
                >
                  <MenuItem value="">All Dates</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="yesterday">Yesterday</MenuItem>
                  <MenuItem value="this-week">This Week</MenuItem>
                  <MenuItem value="last-week">Last Week</MenuItem>
                  <MenuItem value="this-month">This Month</MenuItem>
                  <MenuItem value="last-month">Last Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </ContentPaper>

        <ContentPaper className="student-attendance-content-paper">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="student-attendance-table-header">
            <Typography variant="h5" fontWeight="medium" className="student-attendance-table-title">
              Attendance Details
              {filters.course || filters.status || filters.dateRange ? (
                <Chip 
                  label={`${filteredAttendanceData.length} of ${attendanceData.length} records`}
                  size="small"
                  color="primary"
                  sx={{ ml: 2 }}
                />
              ) : null}
            </Typography>
          </Box>
          
          <TableContainer className="student-attendance-table-container">
            <Table sx={{ minWidth: 650 }} className="student-attendance-table">
              <TableHead className="student-attendance-table-head">
                <TableRow className="student-attendance-table-head-row">
                  <StyledTableCell className="student-attendance-table-head-cell">Date</StyledTableCell>
                  <StyledTableCell className="student-attendance-table-head-cell">Course</StyledTableCell>
                  <StyledTableCell className="student-attendance-table-head-cell">Faculty</StyledTableCell>
                  <StyledTableCell className="student-attendance-table-head-cell">Status</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody className="student-attendance-table-body">
                {filteredAttendanceData.length > 0 ? (
                  filteredAttendanceData.map((record, index) => (
                    <StyledTableRow key={index} className="student-attendance-table-row">
                      <StyledTableCell className="student-attendance-table-cell">
                        <Box sx={{ display: 'flex', alignItems: 'center' }} className="student-attendance-date-cell">
                          <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'primary.light' }} />
                          {record.date}
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell className="student-attendance-table-cell">{record.course || record.subject || 'N/A'}</StyledTableCell>
                      <StyledTableCell className="student-attendance-table-cell">{record.faculty || record.teacher || 'N/A'}</StyledTableCell>
                      <StyledTableCell className="student-attendance-table-cell">
                        <Chip
                          label={record.status}
                          color={getStatusColor(record.status)}
                          size="small"
                          sx={{ fontWeight: 'medium', minWidth: '80px' }}
                          className="student-attendance-status-chip"
                        />
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                ) : (
                  <StyledTableRow className="student-attendance-empty-row">
                    <StyledTableCell colSpan={4} className="student-attendance-empty-cell">
                      <Box sx={{ textAlign: 'center', py: 4 }} className="student-attendance-empty-content">
                        <Typography variant="body1" color="text.secondary" className="student-attendance-empty-text">
                          No attendance records found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" className="student-attendance-empty-subtext">
                          Your attendance data will appear here once classes begin
                        </Typography>
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }} className="student-attendance-footer">
            <Typography variant="body2" color="text.secondary" className="student-attendance-note">
              Note: Minimum 75% attendance is required to be eligible for exams
            </Typography>
          </Box>
        </ContentPaper>
      </PageContainer>
    </div>
  );
};

export default StudentAttendance; 