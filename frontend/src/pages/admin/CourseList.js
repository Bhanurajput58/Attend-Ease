import React, { useState, useEffect, Fragment, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
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
  TextField,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  TableSortLabel,
  Collapse
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  AssignmentLate as AssignmentLateIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { api, API_ENDPOINTS } from '../../config/api';
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [unassignLoading, setUnassignLoading] = useState(false);
  const [selectedFacultyProfile, setSelectedFacultyProfile] = useState(null);
  
  // Enhanced table features
  const [orderBy, setOrderBy] = useState('courseName');
  const [order, setOrder] = useState('asc');
  const [expandedCourse, setExpandedCourse] = useState(null);

  // Add ref for handling click outside
  const expandedContentRef = useRef(null);

  useEffect(() => {
    fetchCourses();
    fetchFaculty();
  }, []);

  // Add click outside handler for expanded content
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is on the expand button or its children
      const isExpandButton = event.target.closest('[data-expand-button]') || 
                            event.target.closest('button')?.contains(event.target);
      
      // Only close if click is outside expanded content and not on expand button
      if (expandedCourse && 
          expandedContentRef.current && 
          !expandedContentRef.current.contains(event.target) && 
          !isExpandButton) {
        setExpandedCourse(null);
      }
    };

    // Add event listener when expanded course is set
    if (expandedCourse) {
      document.addEventListener('click', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [expandedCourse]);

  // Fetch applications for all courses after courses are loaded
  useEffect(() => {
    if (courses.length > 0) {
      fetchAllApplications();
    }
    // eslint-disable-next-line
  }, [courses]);

  // Fetch real applicants for each course
  const fetchAllApplications = async () => {
    setApplicationsLoading(true);
    const applications = {};
    
    try {
      console.log('Starting to fetch applications for', courses.length, 'courses');
      console.log('Course IDs:', courses.map(c => c._id));
      
      await Promise.all(
        courses.map(async (course) => {
          try {
            console.log(`Fetching applications for course: ${course._id}`);
            const response = await api.get(`/api/courses/${course._id}/applications`);
            console.log(`Response for course ${course._id}:`, response.data);
            console.log(`Response status:`, response.status);
            
            if (response.data.success && Array.isArray(response.data.data)) {
              // Store the full application objects
              applications[course._id] = response.data.data;
              console.log(`Stored ${response.data.data.length} applications for course ${course._id}`);
            } else {
              applications[course._id] = [];
              console.log(`No applications or invalid response for course ${course._id}`);
            }
          } catch (error) {
            console.error(`Error fetching applications for course ${course._id}:`, error);
            console.error(`Error response:`, error.response?.data);
            applications[course._id] = [];
          }
        })
      );
      
      console.log('Final applications object:', applications);
    } catch (error) {
      console.error('Error in fetchAllApplications:', error);
    } finally {
      setApplicationsLoading(false);
    }
    
    setCourseApplications(applications);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/courses');
      if (response.data.success) {
        setCourses(response.data.data);
      } else {
        setError('Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      // Try admin endpoint first, fallback to users endpoint
      let response = await api.get('/api/admin/users');
      if (response.data.success && response.data.data) {
        setFacultyList(response.data.data.filter(user => user.role === 'faculty'));
      } else {
        response = await api.get('/api/users');
        if (response.data.success && response.data.data) {
          setFacultyList(response.data.data.filter(user => user.role === 'faculty'));
        }
      }
    } catch (err) {
      console.error('Error fetching faculty:', err);
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
      // Use the general course update endpoint for assignment
      await api.put(`/api/courses/${selectedCourse._id}`, { instructor: selectedFaculty });
      setSnackbar({ open: true, message: 'Faculty assigned successfully!', severity: 'success' });
      
      // Refresh courses and applications
      await fetchCourses();
      await fetchAllApplications();
      
      handleCloseAssignDialog();
    } catch (err) {
      console.error('Error assigning faculty:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'Failed to assign faculty', 
        severity: 'error' 
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleOpenUnassignDialog = (course) => {
    setSelectedCourse(course);
    setUnassignDialogOpen(true);
  };

  const handleCloseUnassignDialog = () => {
    setUnassignDialogOpen(false);
    setSelectedCourse(null);
  };

  const handleUnassignFaculty = async () => {
    if (!selectedCourse) return;
    setUnassignLoading(true);
    try {
      console.log('Unassigning course:', selectedCourse._id);
      const response = await api.post(`/api/courses/${selectedCourse._id}/applications/unassign`);
      console.log('Unassign response:', response.data);
      setSnackbar({ open: true, message: 'Faculty unassigned successfully!', severity: 'success' });
      
      // Refresh courses and applications
      console.log('Refreshing courses and applications...');
      await fetchCourses();
      await fetchAllApplications();
      
      handleCloseUnassignDialog();
    } catch (err) {
      console.error('Error unassigning faculty:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'Failed to unassign faculty', 
        severity: 'error' 
      });
    } finally {
      setUnassignLoading(false);
    }
  };

  const handleViewApplication = async (courseId, appId) => {
    setViewLoading(true);
    setViewDialogOpen(true);
    setSelectedApplication(null);
    setSelectedFacultyProfile(null);
    try {
      const response = await api.get(`/api/courses/${courseId}/applications/${appId}`);
      if (response.data.success) {
        setSelectedApplication(response.data.data);
        
        // Fetch complete faculty profile details
        const facultyId = response.data.data.faculty?._id || response.data.data.faculty;
        if (facultyId) {
          try {
            const facultyResponse = await api.get(`/api/faculties/by-user/${facultyId}`);
            if (facultyResponse.data.success) {
              setSelectedFacultyProfile(facultyResponse.data.data);
            } else {
              console.log('Faculty profile not found, trying alternative endpoint');
              // Try alternative endpoint if the first one fails
              const altFacultyResponse = await api.get(`/api/users/${facultyId}`);
              if (altFacultyResponse.data.success) {
                setSelectedFacultyProfile(altFacultyResponse.data.data);
              } else {
                setSelectedFacultyProfile(null);
              }
            }
          } catch (facultyError) {
            console.error('Error fetching faculty profile:', facultyError);
            setSelectedFacultyProfile(null);
          }
        } else {
          setSelectedFacultyProfile(null);
        }
      } else {
        setSelectedApplication(null);
        setSelectedFacultyProfile(null);
      }
    } catch (err) {
      console.error('Error fetching application details:', err);
      setSelectedApplication(null);
      setSelectedFacultyProfile(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedApplication(null);
    setSelectedFacultyProfile(null);
  };

  const getApplicationStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip icon={<PendingIcon />} label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip icon={<CheckCircleIcon />} label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip icon={<WarningIcon />} label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Enhanced sorting and filtering functions
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortCourses = (coursesToSort) => {
    return coursesToSort.sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'courseName':
          aValue = (a.courseName || a.name || '').toLowerCase();
          bValue = (b.courseName || b.name || '').toLowerCase();
          break;
        case 'courseCode':
          aValue = (a.courseCode || a.code || '').toLowerCase();
          bValue = (b.courseCode || b.code || '').toLowerCase();
          break;
        case 'department':
          aValue = (a.department || '').toLowerCase();
          bValue = (b.department || '').toLowerCase();
          break;
        case 'semester':
          aValue = parseInt(a.semester) || 0;
          bValue = parseInt(b.semester) || 0;
          break;
        case 'faculty':
          aValue = (a.instructor?.name || a.instructor || 'Unassigned').toLowerCase();
          bValue = (b.instructor?.name || b.instructor || 'Unassigned').toLowerCase();
          break;
        case 'applications':
          aValue = (courseApplications[a._id] || []).length;
          bValue = (courseApplications[b._id] || []).length;
          break;
        default:
          aValue = (a.courseName || a.name || '').toLowerCase();
          bValue = (b.courseName || b.name || '').toLowerCase();
      }
      
      if (order === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });
  };

  const filterCourses = (coursesToFilter) => {
    return coursesToFilter.filter(course => {
      // Search filter
      const matchesSearch = !searchTerm || 
        (course.courseName && course.courseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (course.courseCode && course.courseCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (course.department && course.department.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Department filter
      const matchesDepartment = true; // No department filter
      
      // Semester filter
      const matchesSemester = true; // No semester filter
      
      // Faculty filter
      const matchesFaculty = true; // No faculty filter
      
      return matchesSearch && matchesDepartment && matchesSemester && matchesFaculty;
    });
  };

  const filteredAndSortedCourses = sortCourses(filterCourses(courses));

  // Calculate dashboard metrics
  const totalCourses = courses.length;
  const assignedCourses = courses.filter(c => c.instructor).length;
  const unassignedCourses = courses.filter(c => !c.instructor).length;
  const totalApplications = Object.values(courseApplications).flat().length;
  const pendingApplications = Object.values(courseApplications).flat().filter(app => app.status === 'pending').length;

  return (
    <Box sx={{ width: '100%', px: 3, py: 2 }}>
      <Box className="admin-course-list-header" sx={{ mb: 3 }}>
        <Typography variant="h4">Academic Course Management</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="admin-course-list-search"
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Dashboard Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Card sx={{ 
                p: 2, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <SchoolIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {totalCourses}
                </Typography>
                <Typography variant="body2">Total Courses</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Card sx={{ 
                p: 2, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white'
              }}>
                <AssignmentTurnedInIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {assignedCourses}
                </Typography>
                <Typography variant="body2">Assigned Courses</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Card sx={{ 
                p: 2, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white'
              }}>
                <AssignmentLateIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {unassignedCourses}
                </Typography>
                <Typography variant="body2">Unassigned Courses</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Card sx={{ 
                p: 2, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white'
              }}>
                <GroupIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {totalApplications}
                </Typography>
                <Typography variant="body2">Total Applications</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3} lg={2.4}>
              <Card sx={{ 
                p: 2, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white'
              }}>
                <PendingIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {pendingApplications}
                </Typography>
                <Typography variant="body2">Pending Applications</Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Enhanced Course Table */}
          <Paper sx={{ mt: 3, overflow: 'hidden', width: '100%' }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>
                      <TableSortLabel
                        active={orderBy === 'courseName'}
                        direction={orderBy === 'courseName' ? order : 'asc'}
                        onClick={() => handleRequestSort('courseName')}
                      >
                        Course Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>
                      <TableSortLabel
                        active={orderBy === 'courseCode'}
                        direction={orderBy === 'courseCode' ? order : 'asc'}
                        onClick={() => handleRequestSort('courseCode')}
                      >
                        Code
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>
                      <TableSortLabel
                        active={orderBy === 'department'}
                        direction={orderBy === 'department' ? order : 'asc'}
                        onClick={() => handleRequestSort('department')}
                      >
                        Department
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>
                      <TableSortLabel
                        active={orderBy === 'semester'}
                        direction={orderBy === 'semester' ? order : 'asc'}
                        onClick={() => handleRequestSort('semester')}
                      >
                        Semester
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 180 }}>
                      <TableSortLabel
                        active={orderBy === 'faculty'}
                        direction={orderBy === 'faculty' ? order : 'asc'}
                        onClick={() => handleRequestSort('faculty')}
                      >
                        Faculty
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>
                      <TableSortLabel
                        active={orderBy === 'applications'}
                        direction={orderBy === 'applications' ? order : 'asc'}
                        onClick={() => handleRequestSort('applications')}
                      >
                        Applications
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedCourses.map((course) => {
                    const applicants = courseApplications[course._id] || [];
                    const pendingApplicants = applicants.filter(applicant => applicant.status === 'pending');
                    const isExpanded = expandedCourse === course._id;
                    
                    return (
                      <React.Fragment key={course._id}>
                        <TableRow hover>
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {course.courseName || course.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={course.courseCode || course.code} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{course.department}</TableCell>
                          <TableCell>Semester {course.semester}</TableCell>
                          <TableCell>
                            {course.instructor ? (
                              <Chip 
                                icon={<CheckCircleIcon />}
                                label={course.instructor.name || course.instructor}
                                color="success" 
                                size="small"
                              />
                            ) : (
                              <Chip 
                                icon={<WarningIcon />}
                                label="Unassigned" 
                                color="error" 
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {pendingApplicants.length > 0 ? (
                                <Chip 
                                  label={`${pendingApplicants.length} pending`}
                                  color="warning"
                                  size="small"
                                />
                              ) : applicants.length > 0 ? (
                                <Chip 
                                  label="Processed"
                                  color="success"
                                  size="small"
                                />
                              ) : (
                                <Chip 
                                  label="No applications"
                                  color="default"
                                  size="small"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Tooltip title={applicants.length > 0 ? "View applications" : "No applications to view"}>
                                <IconButton
                                  size="small"
                                  onClick={() => setExpandedCourse(isExpanded ? null : course._id)}
                                  disabled={applicants.length === 0}
                                  data-expand-button
                                >
                                  <ExpandMoreIcon 
                                    sx={{ 
                                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                      transition: 'transform 0.2s'
                                    }} 
                                  />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View application details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewApplication(course._id, applicants[0]?._id)}
                                  disabled={applicants.length === 0}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              {course.instructor ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleOpenUnassignDialog(course)}
                                  startIcon={<PersonIcon />}
                                >
                                  Unassign
                                </Button>
                              ) : (
                                <Tooltip title={applicants.length === 0 ? "No faculty applications available for this course" : "Assign faculty to this course"}>
                                  <span>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => handleOpenAssignDialog(course)}
                                      startIcon={<AssignmentIcon />}
                                      disabled={applicants.length === 0}
                                    >
                                      Assign
                                    </Button>
                                  </span>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expandable Applications Row */}
                        {isExpanded && applicants.length > 0 && (
                          <TableRow ref={expandedContentRef}>
                            <TableCell colSpan={7} sx={{ p: 0 }}>
                              <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                  Faculty Applications ({applicants.length})
                                </Typography>
                                <Grid container spacing={2}>
                                  {applicants.map(applicant => (
                                    <Grid item xs={12} sm={6} md={4} key={applicant._id}>
                                      <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {applicant.faculty?.name || applicant.facultyName || 'Unknown Faculty'}
                                          </Typography>
                                          {getApplicationStatusChip(applicant.status)}
                                        </Box>
                                        
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                          {applicant.faculty?.email || applicant.facultyEmail}
                                        </Typography>
                                        
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                          {applicant.faculty?.department || applicant.facultyDepartment}
                                        </Typography>
                                        
                                        {applicant.faculty?.designation && (
                                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                            {applicant.faculty.designation}
                                          </Typography>
                                        )}
                                        
                                        {applicant.appliedAt && (
                                          <Typography variant="caption" color="textSecondary">
                                            Applied: {new Date(applicant.appliedAt).toLocaleDateString()}
                                          </Typography>
                                        )}
                                        
                                        <Box sx={{ mt: 1 }}>
                                          <Tooltip title="View full application details">
                                            <Button
                                              size="small"
                                              startIcon={<VisibilityIcon />}
                                              onClick={() => handleViewApplication(course._id, applicant._id)}
                                              variant="outlined"
                                              sx={{ fontSize: '0.75rem' }}
                                            >
                                              View Details
                                            </Button>
                                          </Tooltip>
                                        </Box>
                                      </Paper>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
      
      {/* Assign Faculty Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Faculty to Course</DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{selectedCourse.courseName || selectedCourse.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedCourse.courseCode || selectedCourse.code} | {selectedCourse.department}
              </Typography>
            </Box>
          )}
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="faculty-select-label">Select Faculty</InputLabel>
            <Select
              labelId="faculty-select-label"
              value={selectedFaculty}
              label="Select Faculty"
              onChange={e => setSelectedFaculty(e.target.value)}
            >
              {(() => {
                // Debug logging
                console.log('Selected course:', selectedCourse);
                console.log('Course applications:', courseApplications[selectedCourse?._id]);
                console.log('Faculty list:', facultyList);
                
                const courseApps = courseApplications[selectedCourse?._id] || [];
                const pendingApps = courseApps.filter(app => app.status === 'pending');
                const rejectedApps = courseApps.filter(app => app.status === 'rejected');
                
                console.log('Pending apps:', pendingApps);
                console.log('Rejected apps:', rejectedApps);
                
                // First priority: Show pending applications
                if (pendingApps.length > 0) {
                  return pendingApps.map(applicant => (
                    <MenuItem key={applicant._id} value={applicant.faculty?._id || applicant.faculty}>
                      <Box>
                        <Typography variant="body1">
                          {applicant.facultyName || applicant.faculty?.name} (Pending)
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {applicant.facultyEmail || applicant.faculty?.email}
                          {applicant.facultyDepartment || applicant.faculty?.department 
                            ? ` | ${applicant.facultyDepartment || applicant.faculty?.department}` 
                            : ''
                          }
                        </Typography>
                      </Box>
                    </MenuItem>
                  ));
                }
                
                // Second priority: Show rejected applications
                if (rejectedApps.length > 0) {
                  return rejectedApps.map(applicant => (
                    <MenuItem key={applicant._id} value={applicant.faculty?._id || applicant.faculty}>
                      <Box>
                        <Typography variant="body1">
                          {applicant.facultyName || applicant.faculty?.name} (Previously Applied)
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {applicant.facultyEmail || applicant.faculty?.email}
                          {applicant.facultyDepartment || applicant.faculty?.department 
                            ? ` | ${applicant.facultyDepartment || applicant.faculty?.department}` 
                            : ''
                          }
                        </Typography>
                      </Box>
                    </MenuItem>
                  ));
                }
                
                // Third priority: Show all faculty members
                if (facultyList.length > 0) {
                  return facultyList.map(faculty => (
                    <MenuItem key={faculty._id} value={faculty._id}>
                      <Box>
                        <Typography variant="body1">
                          {faculty.name} (Available Faculty)
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {faculty.email}
                          {faculty.department ? ` | ${faculty.department}` : ''}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ));
                }
                
                // Fallback: No options available
                return (
                  <MenuItem value="" disabled>
                    No faculty members available
                  </MenuItem>
                );
              })()}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button 
            onClick={handleAssignFaculty} 
            variant="contained" 
            disabled={assignLoading || !selectedFaculty}
            startIcon={assignLoading ? <CircularProgress size={16} /> : <AssignmentIcon />}
          >
            {assignLoading ? 'Assigning...' : 'Assign Faculty'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Unassign Faculty Dialog */}
      <Dialog open={unassignDialogOpen} onClose={handleCloseUnassignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Unassign Faculty from Course</DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{selectedCourse.courseName || selectedCourse.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedCourse.courseCode || selectedCourse.code} | {selectedCourse.department}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Currently assigned to: <strong>{selectedCourse.instructor?.name || selectedCourse.instructor}</strong>
              </Typography>
            </Box>
          )}
          
          <Typography variant="body1" sx={{ mt: 2 }}>
            Are you sure you want to unassign the faculty from this course? This action will:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2">
              Remove the faculty from the course
            </Typography>
            <Typography component="li" variant="body2">
              Update the course status to unassigned
            </Typography>
            <Typography component="li" variant="body2">
              Remove the course from the faculty's dashboard
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUnassignDialog}>Cancel</Button>
          <Button 
            onClick={handleUnassignFaculty} 
            variant="contained" 
            color="error"
            disabled={unassignLoading}
            startIcon={unassignLoading ? <CircularProgress size={16} /> : <PersonIcon />}
          >
            {unassignLoading ? 'Unassigning...' : 'Unassign Faculty'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Application Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedApplication ? (
            <Box sx={{ minWidth: 300 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1, 
                    backgroundColor: '#fafafa',
                    height: '100%'
                  }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
                      Faculty Information
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <b>Name:</b> {selectedFacultyProfile?.name || selectedApplication.faculty?.name || selectedApplication.facultyName || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <b>Email:</b> {selectedFacultyProfile?.email || selectedApplication.faculty?.email || selectedApplication.facultyEmail || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <b>Department:</b> {selectedFacultyProfile?.department || selectedApplication.faculty?.department || selectedApplication.facultyDepartment || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <b>Designation:</b> {selectedFacultyProfile?.designation || selectedApplication.faculty?.designation || 'N/A'}
                    </Typography>
                    {selectedFacultyProfile?.employeeId && (
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        <b>Employee ID:</b> {selectedFacultyProfile.employeeId}
                      </Typography>
                    )}
                    {selectedFacultyProfile?.joinDate && (
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        <b>Join Date:</b> {new Date(selectedFacultyProfile.joinDate).toLocaleDateString()}
                      </Typography>
                    )}
                    {selectedFacultyProfile?.specialization && (
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        <b>Specialization:</b> {selectedFacultyProfile.specialization}
                      </Typography>
                    )}
                    {selectedFacultyProfile?.qualifications && selectedFacultyProfile.qualifications.length > 0 && (
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        <b>Qualifications:</b> {selectedFacultyProfile.qualifications.join(', ')}
                      </Typography>
                    )}
                    {selectedFacultyProfile?.studentsCount !== undefined && (
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        <b>Students Count:</b> {selectedFacultyProfile.studentsCount}
                      </Typography>
                    )}
                    {selectedFacultyProfile?.approved !== undefined && (
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        <b>Status:</b> 
                        <Chip 
                          label={selectedFacultyProfile.approved ? 'Approved' : 'Pending Approval'} 
                          color={selectedFacultyProfile.approved ? 'success' : 'warning'} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1, 
                    backgroundColor: '#fafafa',
                    height: '100%'
                  }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
                      Application Details
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {getApplicationStatusChip(selectedApplication.status)}
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      <b>Course:</b> {selectedApplication.courseName || selectedApplication.course?.courseName}
                    </Typography>
                    {selectedApplication.appliedAt && (
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        <b>Applied At:</b> {new Date(selectedApplication.appliedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography variant="body2" color="error">Failed to load application details.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
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
    </Box>
  );
};

export default CourseList; 