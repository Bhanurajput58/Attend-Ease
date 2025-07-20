import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Alert, Snackbar, CircularProgress, Grid, Card, CardContent, CardActions
} from '@mui/material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import './ManageUsers.css';

const ManageUsers = () => {
  const [openConvertDialog, setOpenConvertDialog] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('student');
  const [studentSearch, setStudentSearch] = useState('');
  const [facultySearch, setFacultySearch] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

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

  const handleOpenConvertDialog = () => setOpenConvertDialog(true);
  const handleCloseConvertDialog = () => setOpenConvertDialog(false);

  const handleConvertStudents = async () => {
    try {
      setConverting(true);
      const response = await axios.post(API_ENDPOINTS.CONVERT_STUDENTS_TO_USERS, {}, { headers: { 'Content-Type': 'application/json' }, withCredentials: true });
      setConvertResult(response.data.data);
      setSnackbarMessage(`Successfully created ${response.data.data.created} user accounts!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseConvertDialog();
      fetchUsers();
    } catch (error) {
      setSnackbarMessage('Failed to convert students: ' + (error.response?.data?.message || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setConverting(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const handleViewDetails = async (user) => {
    if (user.role === 'student') {
      setDetailsLoading(true);
      try {
        const response = await axios.get(API_ENDPOINTS.GET_STUDENT_BY_USER_ID(user.id || user._id), { withCredentials: true });
        if (response.data && response.data.success && response.data.data) {
          setSelectedUser({ ...user, ...response.data.data });
        } else {
          setSelectedUser(user);
        }
      } catch {
        setSelectedUser(user);
      } finally {
        setDetailsLoading(false);
        setUserDetailsOpen(true);
      }
    } else {
      setSelectedUser(user);
      setUserDetailsOpen(true);
    }
  };

  const handleCloseUserDetails = () => { setUserDetailsOpen(false); setSelectedUser(null); };
  const formatDate = (dateString) => !dateString ? 'N/A' : new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Filter users
  const students = users.filter(user => user.role === 'student');
  const faculty = users.filter(user => user.role === 'faculty');
  const filteredStudents = students.filter(user => {
    const search = studentSearch.toLowerCase();
    return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search) || (user.rollNumber && user.rollNumber.toLowerCase().includes(search));
  });
  const filteredFaculty = faculty.filter(user => {
    const search = facultySearch.toLowerCase();
    return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search) || (user.username && user.username.toLowerCase().includes(search));
  });

  const handleToggleApproval = async (user, approve) => {
    try {
      await axios.patch(API_ENDPOINTS.UPDATE_USER(user.user), { approved: approve }, { withCredentials: true });
      if (user._id) await axios.put(API_ENDPOINTS.UPDATE_FACULTY(user._id), { approved: approve }, { withCredentials: true });
      setSnackbarMessage(`Faculty ${approve ? 'approved' : 'revoked'} successfully!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchUsers();
    } catch {
      setSnackbarMessage('Failed to update faculty status.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Container maxWidth="lg" className="manage-users-container">
      <Paper className="manage-users-paper">
        <Box className="manage-users-header">
          <Typography variant="h4" className="manage-users-title">Manage Users</Typography>
          <Box>
            <Button variant="outlined" color="secondary" onClick={handleOpenConvertDialog} className="manage-users-btn-secondary" sx={{ mr: 2 }}>
              Convert Imported Students to Users
            </Button>
          </Box>
        </Box>
        {/* Tabs and Search */}
        <Box className="manage-users-tabs" sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant={activeTab === 'student' ? 'contained' : 'outlined'} color={activeTab === 'student' ? 'primary' : 'secondary'} onClick={() => setActiveTab('student')}>Students</Button>
            <Button variant={activeTab === 'faculty' ? 'contained' : 'outlined'} color={activeTab === 'faculty' ? 'primary' : 'secondary'} onClick={() => setActiveTab('faculty')}>Faculty</Button>
          </Box>
          <Box sx={{ maxWidth: 320, minWidth: 220 }}>
            {activeTab === 'student' && (
              <TextField size="small" fullWidth variant="outlined" label="Search students" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} InputProps={{ style: { background: '#f7f9fc', borderRadius: 8 } }} />
            )}
            {activeTab === 'faculty' && (
              <TextField size="small" fullWidth variant="outlined" label="Search faculty" value={facultySearch} onChange={e => setFacultySearch(e.target.value)} InputProps={{ style: { background: '#f7f9fc', borderRadius: 8 } }} />
            )}
          </Box>
        </Box>
        {convertResult && <Alert severity="info">Conversion results: {convertResult.created} users created, {convertResult.skipped} skipped, {convertResult.errors} errors</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
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
                        <Button variant="outlined" color="primary" size="small" onClick={() => handleViewDetails(user)}>View Details</Button>
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
                filteredFaculty.map((user) => (
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
                        <Button variant="outlined" color="primary" size="small" onClick={() => handleViewDetails(user)}>View Details</Button>
                        {user.approved ? (
                          <Button variant="contained" color="error" size="small" onClick={() => handleToggleApproval(user, false)}>Revoke</Button>
                        ) : (
                          <Button variant="contained" color="success" size="small" onClick={() => handleToggleApproval(user, true)}>Approve</Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        )}
        {/* Convert Students Dialog */}
        <Dialog open={openConvertDialog} onClose={handleCloseConvertDialog}>
          <DialogTitle>Convert Imported Students to User Accounts</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1">This will create user accounts for all imported students.</Typography>
              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>- Each student will get an email based on their roll number</Typography>
              <Typography variant="body2" color="warning.main">- Default password will be set to "password123"</Typography>
              <Typography variant="body2" color="warning.main">- Students already with user accounts will be skipped</Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>Are you sure you want to continue?</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConvertDialog}>Cancel</Button>
            <Button onClick={handleConvertStudents} variant="contained" color="primary" disabled={converting}>{converting ? <CircularProgress size={24} /> : 'Convert Students'}</Button>
          </DialogActions>
        </Dialog>
        {/* User Details Dialog */}
        <Dialog open={userDetailsOpen} onClose={handleCloseUserDetails} maxWidth="sm" fullWidth>
          {selectedUser && (
            <>
              <DialogTitle>User Details: {selectedUser.name}</DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  {detailsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}><CircularProgress /></Box>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      <li><b>Name:</b> {selectedUser.name}</li>
                      <li><b>Email:</b> {selectedUser.email}</li>
                      {selectedUser.username && <li><b>Username:</b> {selectedUser.username}</li>}
                      {selectedUser.role === 'student' && <>
                        <li><b>Roll Number:</b> {selectedUser.rollNumber || 'N/A'}</li>
                        {selectedUser.department && <li><b>Department:</b> {selectedUser.department}</li>}
                        {selectedUser.semester && <li><b>Semester:</b> {selectedUser.semester}</li>}
                        {selectedUser.program && <li><b>Program:</b> {selectedUser.program}</li>}
                        {selectedUser.gpa && <li><b>GPA:</b> {selectedUser.gpa}</li>}
                        {selectedUser.phone && <li><b>Phone:</b> {selectedUser.phone}</li>}
                        {selectedUser.enrollmentDate && <li><b>Enrollment Date:</b> {formatDate(selectedUser.enrollmentDate)}</li>}
                        {selectedUser.excelImportId && <li><b>Excel Import ID:</b> {selectedUser.excelImportId}</li>}
                        {selectedUser.courses && <li><b>Courses:</b> {Array.isArray(selectedUser.courses) ? selectedUser.courses.length : selectedUser.courses}</li>}
                      </>}
                      {selectedUser.role === 'faculty' && <>
                        {selectedUser.department && <li><b>Department:</b> {selectedUser.department}</li>}
                        {selectedUser.designation && <li><b>Designation:</b> {selectedUser.designation}</li>}
                        {selectedUser.employeeId && <li><b>Employee ID:</b> {selectedUser.employeeId}</li>}
                        {selectedUser.specialization && <li><b>Specialization:</b> {selectedUser.specialization}</li>}
                        {selectedUser.qualifications && <li><b>Qualifications:</b> {Array.isArray(selectedUser.qualifications) ? selectedUser.qualifications.join(', ') : selectedUser.qualifications}</li>}
                        {selectedUser.courses && <li><b>Courses:</b> {Array.isArray(selectedUser.courses) ? selectedUser.courses.length : selectedUser.courses}</li>}
                        {selectedUser.phone && <li><b>Phone:</b> {selectedUser.phone}</li>}
                      </>}
                    </ul>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseUserDetails}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        {/* Snackbar */}
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>{snackbarMessage}</Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default ManageUsers; 