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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import useAuth from '../../hooks/useAuth';

const ManageUsers = () => {
  const [openDialog, setOpenDialog] = useState(false);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.GET_ALL_USERS, {
        withCredentials: true
      });
      
      if (response.data.success && response.data.data) {
        setUsers(response.data.data.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          username: user.username,
          rollNumber: user.rollNumber,
          createdAt: user.createdAt,
          department: user.department || 'CSE',
          semester: user.semester || '4'
        })));
      } else {
        setError('Failed to load users data');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error loading users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddUser = () => {
    // Handle add user logic here
    handleCloseDialog();
  };

  const handleOpenConvertDialog = () => {
    setOpenConvertDialog(true);
  };

  const handleCloseConvertDialog = () => {
    setOpenConvertDialog(false);
  };

  const handleConvertStudents = async () => {
    try {
      setConverting(true);
      const response = await axios.post(
        API_ENDPOINTS.CONVERT_STUDENTS_TO_USERS,
        {},
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      setConvertResult(response.data.data);
      setSnackbarMessage(`Successfully created ${response.data.data.created} user accounts!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseConvertDialog();
      
      // Refresh the users list after conversion
      fetchUsers();
    } catch (error) {
      console.error('Error converting students to users:', error);
      setSnackbarMessage('Failed to convert students: ' + (error.response?.data?.message || error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setConverting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };
  
  const handleCloseUserDetails = () => {
    setUserDetailsOpen(false);
    setSelectedUser(null);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">
            Manage Users
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleOpenConvertDialog} 
              sx={{ mr: 2 }}
            >
              Convert Imported Students to Users
            </Button>
            <Button variant="contained" color="primary" onClick={handleOpenDialog}>
              Add New User
            </Button>
          </Box>
        </Box>

        {convertResult && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Conversion results: {convertResult.created} users created, {convertResult.skipped} skipped, {convertResult.errors} errors
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow 
                    key={user.id}
                    sx={{ '& > *': { py: 1 } }}
                  >
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {user.role === 'student' ? (user.rollNumber || 'N/A') : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleViewDetails(user)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add User Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Add New User</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                fullWidth
                margin="normal"
              />
              <TextField
                label="Email"
                fullWidth
                margin="normal"
                type="email"
              />
              <FormControl fullWidth margin="normal">
                <Select
                  label="Role"
                  defaultValue=""
                >
                  <MenuItem value="Student">Student</MenuItem>
                  <MenuItem value="Faculty">Faculty</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleAddUser} variant="contained" color="primary">
              Add User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Convert Students Dialog */}
        <Dialog open={openConvertDialog} onClose={handleCloseConvertDialog}>
          <DialogTitle>Convert Imported Students to User Accounts</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1">
                This will create user accounts for all imported students in the system.
              </Typography>
              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                - Each student will get an email based on their roll number
              </Typography>
              <Typography variant="body2" color="warning.main">
                - Default password will be set to "password123"
              </Typography>
              <Typography variant="body2" color="warning.main">
                - Students already with user accounts will be skipped
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Are you sure you want to continue?
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConvertDialog}>Cancel</Button>
            <Button 
              onClick={handleConvertStudents} 
              variant="contained" 
              color="primary"
              disabled={converting}
            >
              {converting ? <CircularProgress size={24} /> : 'Convert Students'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* User Details Dialog */}
        <Dialog 
          open={userDetailsOpen} 
          onClose={handleCloseUserDetails}
          maxWidth="sm"
          fullWidth
        >
          {selectedUser && (
            <>
              <DialogTitle>
                User Details: {selectedUser.name}
              </DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Name" 
                        secondary={selectedUser.name} 
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Email" 
                        secondary={selectedUser.email} 
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Role" 
                        secondary={selectedUser.role} 
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Username" 
                        secondary={selectedUser.username || 'N/A'} 
                      />
                    </ListItem>
                    <Divider />
                    
                    {selectedUser.role === 'student' && (
                      <>
                        <ListItem>
                          <ListItemText 
                            primary="Roll Number" 
                            secondary={selectedUser.rollNumber || 'N/A'} 
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText 
                            primary="Department" 
                            secondary={selectedUser.department} 
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText 
                            primary="Semester" 
                            secondary={selectedUser.semester} 
                          />
                        </ListItem>
                        <Divider />
                      </>
                    )}
                    
                    <ListItem>
                      <ListItemText 
                        primary="Account Created" 
                        secondary={formatDate(selectedUser.createdAt)} 
                      />
                    </ListItem>
                  </List>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseUserDetails}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default ManageUsers; 