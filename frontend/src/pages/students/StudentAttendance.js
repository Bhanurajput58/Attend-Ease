import React, { useState } from 'react';
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
  Divider,
  tableCellClasses,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';

// Custom styled components
const PageContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
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
  const [attendanceData] = useState([
    {
      date: '2024-03-25',
      subject: 'Mathematics',
      status: 'Present',
      teacher: 'Dr. Smith',
    },
    {
      date: '2024-03-24',
      subject: 'Physics',
      status: 'Present',
      teacher: 'Prof. Johnson',
    },
    {
      date: '2024-03-23',
      subject: 'Chemistry',
      status: 'Absent',
      teacher: 'Dr. Brown',
    },
    {
      date: '2024-03-22',
      subject: 'Computer Science',
      status: 'Present',
      teacher: 'Dr. Williams',
    },
    {
      date: '2024-03-21',
      subject: 'English Literature',
      status: 'Present',
      teacher: 'Prof. Davis',
    },
  ]);

  // Calculate statistics
  const totalClasses = attendanceData.length;
  const presentClasses = attendanceData.filter(record => record.status === 'Present').length;
  const absentClasses = attendanceData.filter(record => record.status === 'Absent').length;
  const attendanceRate = Math.round((presentClasses / totalClasses) * 100);

  const getStatusColor = (status) => {
    return status === 'Present' ? 'success' : 'error';
  };

  return (
    <PageContainer maxWidth="lg">
      {/* Header Section */}
      <HeaderPaper>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Attendance Record
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Your attendance history for the current semester
        </Typography>
      </HeaderPaper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard elevation={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">Total Classes</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" color="primary">
              {totalClasses}
            </Typography>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <StatCard elevation={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventAvailableIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">Present</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" color="success.main">
              {presentClasses}
            </Typography>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <StatCard elevation={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventBusyIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">Absent</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" color="error.main">
              {absentClasses}
            </Typography>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <StatCard elevation={2}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Attendance Rate
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={attendanceRate >= 75 ? 'success.main' : 'warning.main'}>
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
              />
            </Box>
          </StatCard>
        </Grid>
      </Grid>

      {/* Attendance Table */}
      <ContentPaper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="medium">
            Attendance Details
          </Typography>
          <Button variant="outlined" color="primary">
            Download Report
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <StyledTableCell>Date</StyledTableCell>
                <StyledTableCell>Subject</StyledTableCell>
                <StyledTableCell>Teacher</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceData.map((record, index) => (
                <StyledTableRow key={index}>
                  <StyledTableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'primary.light' }} />
                      {record.date}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>{record.subject}</StyledTableCell>
                  <StyledTableCell>{record.teacher}</StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={record.status}
                      color={getStatusColor(record.status)}
                      size="small"
                      sx={{ fontWeight: 'medium', minWidth: '80px' }}
                    />
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="body2" color="text.secondary">
            Note: Minimum 75% attendance is required to be eligible for exams
          </Typography>
        </Box>
      </ContentPaper>
    </PageContainer>
  );
};

export default StudentAttendance; 