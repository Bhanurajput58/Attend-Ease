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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  padding: theme.spacing(2),
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
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

  const totalClasses = attendanceData.length;
  const presentClasses = attendanceData.filter(record => record.status === 'Present' || record.status === 'present').length;
  const absentClasses = attendanceData.filter(record => record.status === 'Absent' || record.status === 'absent').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

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

        <Grid container spacing={3} sx={{ mb: 3 }} className="student-attendance-stats-grid">
          <Grid item xs={12} md={3}>
            <StatCard elevation={2} className="student-attendance-stat-card total-classes">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }} className="student-attendance-stat-icon-container">
                <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary" className="student-attendance-stat-label">Total Classes</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="primary" className="student-attendance-stat-number">
                {totalClasses}
              </Typography>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StatCard elevation={2} className="student-attendance-stat-card present-classes">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }} className="student-attendance-stat-icon-container">
                <EventAvailableIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary" className="student-attendance-stat-label">Present</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="success.main" className="student-attendance-stat-number">
                {presentClasses}
              </Typography>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StatCard elevation={2} className="student-attendance-stat-card absent-classes">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }} className="student-attendance-stat-icon-container">
                <EventBusyIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary" className="student-attendance-stat-label">Absent</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="error.main" className="student-attendance-stat-number">
                {absentClasses}
              </Typography>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StatCard elevation={2} className="student-attendance-stat-card attendance-rate">
              <Typography variant="h6" color="text.secondary" gutterBottom className="student-attendance-stat-label">
                Attendance Rate
              </Typography>
              <Typography variant="h3" fontWeight="bold" color={attendanceRate >= 75 ? 'success.main' : 'warning.main'} className="student-attendance-stat-number">
                {attendanceRate}%
              </Typography>
              <Box 
                sx={{ 
                  width: '80%', 
                  height: 8, 
                  bgcolor: '#e0f2f1', 
                  borderRadius: 5,
                  mt: 1,
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
                    width: `${attendanceRate}%`,
                    bgcolor: attendanceRate >= 75 ? '#4caf50' : '#ff9800',
                    borderRadius: 5,
                  }}
                  className="student-attendance-progress-bar"
                />
              </Box>
            </StatCard>
          </Grid>
        </Grid>

        <ContentPaper className="student-attendance-content-paper">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="student-attendance-table-header">
            <Typography variant="h5" fontWeight="medium" className="student-attendance-table-title">
              Attendance Details
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
                {attendanceData.length > 0 ? (
                  attendanceData.map((record, index) => (
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