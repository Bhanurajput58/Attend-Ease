import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import useAuth from '../../hooks/useAuth';

const LowAttendanceManager = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [students, setStudents] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [threshold, setThreshold] = useState(75);
  
  useEffect(() => {
    const fetchLowAttendanceStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(
          `${API_ENDPOINTS.GET_LOW_ATTENDANCE}/${courseId}?threshold=${threshold}`,
          { withCredentials: true }
        );
        
        if (response.data.success) {
          setStudents(response.data.data.students);
          setCourse(response.data.data.course);
        } else {
          setError('Failed to fetch low attendance data');
        }
      } catch (error) {
        console.error('Error fetching low attendance students:', error);
        setError(`Error: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId) {
      fetchLowAttendanceStudents();
    }
  }, [courseId, threshold]);
  
  // Handle threshold change
  const handleThresholdChange = (event) => {
    setThreshold(event.target.value);
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <div>
            <Typography variant="h4" gutterBottom>
              Low Attendance Management
            </Typography>
            {course && (
              <Typography variant="subtitle1" color="text.secondary">
                {course.name} ({course.code})
              </Typography>
            )}
          </div>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="threshold-select-label">Threshold</InputLabel>
              <Select
                labelId="threshold-select-label"
                id="threshold-select"
                value={threshold}
                label="Threshold"
                onChange={handleThresholdChange}
              >
                <MenuItem value={60}>60%</MenuItem>
                <MenuItem value={65}>65%</MenuItem>
                <MenuItem value={70}>70%</MenuItem>
                <MenuItem value={75}>75%</MenuItem>
                <MenuItem value={80}>80%</MenuItem>
                <MenuItem value={85}>85%</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/faculty/dashboard')}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : (
          <>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Students with Attendance Below {threshold}%
                </Typography>
              </Box>
              
              {students.length === 0 ? (
                <Alert severity="info">No students found with attendance below {threshold}%.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Attendance</TableCell>
                        <TableCell>Present/Total</TableCell>
                        <TableCell>Last Present</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.id}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={student.attendancePercentage < 65 ? 'error' : 'warning'}
                              sx={{ fontWeight: 'bold' }}
                            >
                              {student.attendancePercentage}%
                            </Typography>
                          </TableCell>
                          <TableCell>{student.presentClasses}/{student.totalClasses}</TableCell>
                          <TableCell>{student.lastPresent}</TableCell>
                          <TableCell>
                            {student.attendancePercentage < 65 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                                <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                                Critical
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                                <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                                Warning
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
};

export default LowAttendanceManager; 