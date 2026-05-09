import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Alert, Snackbar, CircularProgress, Grid, Card, CardContent, CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import './ManageUsers.css';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('student');
  const [studentSearch, setStudentSearch] = useState('');
  const [facultySearch, setFacultySearch] = useState('');
  const [faculties, setFaculties] = useState([]);

  useEffect(() => { fetchUsers(); fetchFaculties(); }, []);
  useEffect(() => {
    console.log("useEffect for activeTab triggered. activeTab:", activeTab);
    if (activeTab === 'faculty') fetchFaculties();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.GET_ALL_USERS, { withCredentials: true });
      if (response.data.success && response.data.data) {
        setUsers(response.data.data.map(user => ({ ...user, id: user._id, department: user.department || 'CSE', semester: user.semester || '4' })));
      } else {
        setError('Failed to load users data');
      }
    } catch (err) {
      setError('Error loading users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      console.log("Fetching faculties...");
      const response = await axios.get(API_ENDPOINTS.GET_ALL_FACULTIES, { withCredentials: true });
      console.log("Faculties response:", response.data);
      if (response.data.success && response.data.data) {
        setFaculties(response.data.data.map(faculty => ({
          ...faculty,
          id: faculty.user || faculty._id,
          approved: faculty.approved === true || faculty.approved === "true"
        })));
        console.log("Faculties set in state:", response.data.data);
      } else {
        setError('Failed to load faculties data');
        console.log("Faculties fetch failed: no data");
      }
    } catch (err) {
      setError('Error loading faculties: ' + (err.response?.data?.message || err.message));
      console.error("Error fetching faculties:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const handleViewFullDetails = (user) => {
    if (user.role === 'student') {
      navigate(`/admin/students/${user.id || user._id}`);
    }
  };

  // Filter users
  const students = users.filter(user => user.role === 'student');
  const filteredStudents = students.filter(user => {
    const search = studentSearch.toLowerCase();
    return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search) || (user.rollNumber && user.rollNumber.toLowerCase().includes(search));
  });
  const filteredFaculty = faculties.filter(user => {
    const search = facultySearch.toLowerCase();
    return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search) || (user.department && user.department.toLowerCase().includes(search));
  });

  const handleToggleApproval = async (user, approve) => {
    // Optimistically update UI
    setFaculties(prevFaculties => prevFaculties.map(fac =>
      fac.id === user.id ? { ...fac, approved: approve } : fac
    ));
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_USER_APPROVAL(user.id || user._id), { approved: approve }, { withCredentials: true });
      if (response.data.success) {
        setSnackbarMessage(`User ${approve ? 'approved' : 'revoked'} successfully!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error) {
      // Revert UI if backend fails
      setFaculties(prevFaculties => prevFaculties.map(fac =>
        fac.id === user.id ? { ...fac, approved: !approve } : fac
      ));
      setSnackbarMessage('Failed to update user approval: ' + (error.response?.data?.message || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">Manage Users</Typography>
          <TextField
            size="small"
            placeholder={activeTab === 'student' ? "Search students..." : "Search faculty..."}
            value={activeTab === 'student' ? studentSearch : facultySearch}
            onChange={(e) => activeTab === 'student' ? setStudentSearch(e.target.value) : setFacultySearch(e.target.value)}
            variant="outlined"
            sx={{ width: 300 }}
          />
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Button 
            variant={activeTab === 'student' ? 'contained' : 'text'} 
            onClick={() => setActiveTab('student')}
            sx={{ mr: 2 }}
          >
            Students ({students.length})
          </Button>
          <Button 
            variant={activeTab === 'faculty' ? 'contained' : 'text'} 
            onClick={() => setActiveTab('faculty')}
          >
            Faculty ({faculties.length})
          </Button>
        </Box>

        {/* Students Table */}
        {activeTab === 'student' && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center">No students found</TableCell></TableRow>
                ) : (
                  filteredStudents.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.rollNumber || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Button variant="contained" color="primary" size="small" onClick={() => handleViewFullDetails(user)}>View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {/* Faculty Table */}
        {activeTab === 'faculty' && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {loading ? (
                <Grid item xs={12}><Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}><CircularProgress /></Box></Grid>
              ) : filteredFaculty.length === 0 ? (
                <Grid item xs={12}><Typography align="center">No faculty found</Typography></Grid>
              ) : (
                filteredFaculty.map((user) => {
                  return (
                    <Grid item xs={12} sm={6} md={4} key={user.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">{user.name}</Typography>
                          <Typography color="textSecondary">{user.email}</Typography>
                          <Typography color="textSecondary">{user.department}</Typography>
                          <Typography color="textSecondary">{user.designation}</Typography>
                          <Typography color="textSecondary">Username: {user.username || 'N/A'}</Typography>
                        </CardContent>
                        <CardActions>
                          {user.approved ? (
                            <Button variant="contained" color="error" size="small" onClick={() => handleToggleApproval(user, false)}>Revoke</Button>
                          ) : (
                            <Button variant="contained" color="success" size="small" onClick={() => handleToggleApproval(user, true)}>Approve</Button>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </Box>
        )}
        {/* Snackbar */}
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>{snackbarMessage}</Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default ManageUsers; 