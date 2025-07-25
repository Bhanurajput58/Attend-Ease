import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  CircularProgress,
  TextField
} from '@mui/material';
import { Download as DownloadIcon, Search as SearchIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import './CourseList.css';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [courseApplications, setCourseApplications] = useState({}); // { courseId: [applicants] }

  useEffect(() => {
    fetchCourses();
    fetchFaculty();
  }, []);

  // Fetch applications for all courses after courses are loaded
  useEffect(() => {
    if (courses.length > 0) {
      fetchAllApplications();
    }
    // eslint-disable-next-line
  }, [courses]);

  // Fetch real applicants for each course
  const fetchAllApplications = async () => {
    const applications = {};
    await Promise.all(
      courses.map(async (course) => {
        try {
          const response = await axios.get(`/api/courses/${course._id}/applications`, { withCredentials: true });
          if (response.data.success && Array.isArray(response.data.data)) {
            // Store the full application objects
            applications[course._id] = response.data.data;
          } else {
            applications[course._id] = [];
          }
        } catch {
          applications[course._id] = [];
        }
      })
    );
    setCourseApplications(applications);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_ENDPOINTS.GET_COURSES, { withCredentials: true });
      if (response.data.success) {
        setCourses(response.data.data);
      } else {
        setError('Failed to fetch courses');
      }
    } catch (err) {
      setError('Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      // Try admin endpoint first, fallback to users endpoint
      let response = await axios.get(API_ENDPOINTS.GET_ALL_USERS, { withCredentials: true });
      if (response.data.success && response.data.data) {
        setFacultyList(response.data.data.filter(user => user.role === 'faculty'));
      } else {
        response = await axios.get(API_ENDPOINTS.GET_USERS, { withCredentials: true });
        if (response.data.success && response.data.data) {
          setFacultyList(response.data.data.filter(user => user.role === 'faculty'));
        }
      }
    } catch (err) {
      setFacultyList([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenAssignDialog = (course) => {
    setSelectedCourse(course);
    setSelectedFaculty('');
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedCourse(null);
    setSelectedFaculty('');
  };

  const handleAssignFaculty = async () => {
    if (!selectedCourse || !selectedFaculty) return;
    setAssignLoading(true);
    try {
      await axios.put(API_ENDPOINTS.UPDATE_COURSE(selectedCourse._id), { instructor: selectedFaculty }, { withCredentials: true });
      setSnackbar({ open: true, message: 'Faculty assigned successfully!', severity: 'success' });
      fetchCourses();
      handleCloseAssignDialog();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to assign faculty', severity: 'error' });
    } finally {
      setAssignLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (!searchTerm) return true;
    return (
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.department && course.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <Container maxWidth="lg" className="admin-course-list-container">
      <Box className="admin-course-list-header">
        <Typography variant="h4">Courses</Typography>
        <TextField
          size="small"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="admin-course-list-search"
        />
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {filteredCourses.map((course) => {
            const applicants = courseApplications[course._id] || [];
            // Only pending applicants for enabling the button
            const pendingApplicants = applicants.filter(applicant => applicant.status === 'pending');
            return (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{course.courseName} ({course.courseCode})</Typography>
                    <Typography variant="body2" color="textSecondary">{course.department} | Semester {course.semester}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <b>Faculty:</b> {course.instructor ? course.instructor.name : <span style={{ color: 'red' }}>Unassigned</span>}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Applicants:</Typography>
                      {applicants.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">No applications yet</Typography>
                      ) : (
                        applicants.map(applicant => (
                          <Box key={applicant._id} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                            <Typography variant="body2"><b>Name:</b> {applicant.facultyName || applicant.faculty?.name}</Typography>
                            <Typography variant="body2"><b>Email:</b> {applicant.facultyEmail || applicant.faculty?.email}</Typography>
                            <Typography variant="body2"><b>Department:</b> {applicant.facultyDepartment || applicant.faculty?.department}</Typography>
                            {applicant.faculty?.designation && (
                              <Typography variant="body2"><b>Designation:</b> {applicant.faculty.designation}</Typography>
                            )}
                            <Typography variant="body2"><b>Status:</b> {applicant.status}</Typography>
                            {applicant.createdAt && (
                              <Typography variant="body2"><b>Applied At:</b> {new Date(applicant.createdAt).toLocaleString()}</Typography>
                            )}
                          </Box>
                        ))
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" variant="outlined" onClick={() => handleOpenAssignDialog(course)} disabled={pendingApplicants.length === 0}>
                      Assign Faculty
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog}>
        <DialogTitle>Assign Faculty</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="faculty-select-label">Faculty</InputLabel>
            <Select
              labelId="faculty-select-label"
              value={selectedFaculty}
              label="Faculty"
              onChange={e => setSelectedFaculty(e.target.value)}
            >
              {(selectedCourse && courseApplications[selectedCourse._id] && courseApplications[selectedCourse._id].length > 0)
                ? courseApplications[selectedCourse._id].map(applicant => (
                  <MenuItem key={applicant._id} value={applicant.faculty?._id || applicant.faculty}>
                    {applicant.facultyName || applicant.faculty?.name} ({applicant.facultyEmail || applicant.faculty?.email})
                    {applicant.facultyDepartment || applicant.faculty?.department ? ` | ${applicant.facultyDepartment || applicant.faculty?.department}` : ''}
                  </MenuItem>
                ))
                : <MenuItem value="" disabled>No applicants</MenuItem>
              }
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button onClick={handleAssignFaculty} variant="contained" disabled={assignLoading || !selectedFaculty}>
            {assignLoading ? <CircularProgress size={20} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseList; 