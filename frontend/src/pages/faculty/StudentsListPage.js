import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Grid, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import API_BASE_URL from '../../config/api';
import '../../styles/DashboardPage.css';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';

/**
 * Students List Page Component
 * Displays a comprehensive list of all students for faculty members
 */
const StudentsListPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        let allStudents = [];

        // Try to fetch faculty courses first, then get students from each course
        try {
          console.log('Fetching faculty courses...');
          const coursesResponse = await api.get(API_ENDPOINTS.GET_COURSES);
          console.log('Courses response:', coursesResponse.data);
          
          if (coursesResponse.data && Array.isArray(coursesResponse.data.data)) {
            const coursesData = coursesResponse.data.data;
            
            // Process students from each course
            for (const course of coursesData) {
              if (course._id) {
                try {
                  console.log(`Fetching students for course ${course._id}...`);
                  const studentsResponse = await api.get(API_ENDPOINTS.GET_COURSE_STUDENTS(course._id));
                  console.log(`Students for course ${course._id}:`, studentsResponse.data);
                  
                  if (studentsResponse.data && studentsResponse.data.success && Array.isArray(studentsResponse.data.data)) {
                    allStudents = [...allStudents, ...studentsResponse.data.data];
                  }
                } catch (courseError) {
                  console.error(`Error fetching students for course ${course._id}:`, courseError);
                }
              }
            }
            
            // Try alternative course student endpoint if we didn't get any students
            if (allStudents.length === 0) {
              for (const course of coursesData) {
                if (course._id) {
                  try {
                    console.log(`Trying alternative endpoint for course ${course._id}...`);
                    const studentsResponse = await api.get(API_ENDPOINTS.GET_STUDENTS_BY_COURSE(course._id));
                    console.log(`Alternative students for course ${course._id}:`, studentsResponse.data);
                    
                    if (studentsResponse.data && studentsResponse.data.success && Array.isArray(studentsResponse.data.data)) {
                      allStudents = [...allStudents, ...studentsResponse.data.data];
                    }
                  } catch (altCourseError) {
                    console.error(`Error fetching alternative students for course ${course._id}:`, altCourseError);
                  }
                }
              }
            }
          }
          
          // Remove duplicates by student ID
          allStudents = allStudents.filter((student, index, self) => 
            student._id && index === self.findIndex(s => s._id === student._id)
          );
          
          if (allStudents.length > 0) {
            console.log(`Found ${allStudents.length} students from courses`);
            processStudents(allStudents);
            return;
          } else {
            console.log('No students found from courses');
          }
        } catch (coursesError) {
          console.error('Error fetching courses:', coursesError);
        }
        
        // If we didn't get any students from courses, set error message
        setError('No students found. Please import students first or create some courses.');
      } catch (error) {
        console.error('Main error fetching students data:', error);
        setError('Unable to load students data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Process student data
    const processStudents = (studentsData) => {
      if (!studentsData || studentsData.length === 0) {
        setError('No students found in the system.');
        setStudents([]);
        setFilteredStudents([]);
        return;
      }

      // Format student data for display
      const formattedStudents = studentsData.map(student => ({
        id: student._id || student.id,
        name: student.name || student.fullName || 'Unknown Name',
        enrollmentNumber: student.rollNumber || student.enrollmentNumber || 'Unknown ID',
        department: student.program || student.department || 'B.tech',
        semester: student.semester || 4,
        discipline: student.discipline || 'N/A',
        courses: student.courses || []
      }));
      
      console.log('Formatted students:', formattedStudents);
      setStudents(formattedStudents);
      setFilteredStudents(formattedStudents);
    };

    if (isAuthenticated) {
      fetchStudents();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Handle search input change
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    if (value) {
      const searchTermLower = value.toLowerCase();
      const filtered = students.filter(student => 
        (student.name && student.name.toLowerCase().includes(searchTermLower)) || 
        (student.enrollmentNumber && student.enrollmentNumber.toLowerCase().includes(searchTermLower)) ||
        (student.department && student.department.toLowerCase().includes(searchTermLower)) ||
        (student.discipline && student.discipline.toLowerCase().includes(searchTermLower))
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // View student profile (includes all details)
  const handleViewProfile = (studentId) => {
    // Navigate to the student profile page
    console.log(`Navigating to student profile page for ID: ${studentId}`);
    navigate(`/student-profile/${studentId}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography variant="h4" component="h1" gutterBottom>
                All Students
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {filteredStudents.length} students found
              </Typography>
            </div>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => navigate('/faculty/dashboard')}
            >
              Back to Dashboard
            </Button>
          </Box>

          {/* Search Bar */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <SearchIcon color="action" />
              </Grid>
              <Grid item xs>
                <TextField
                  fullWidth
                  placeholder="Search by name, roll no., program or discipline..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  variant="standard"
                />
              </Grid>
            </Grid>
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
              <Typography variant="h6">{error}</Typography>
            </Paper>
          ) : (
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <TableContainer>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Roll No.</strong></TableCell>
                      <TableCell><strong>Semester</strong></TableCell>
                      <TableCell><strong>Discipline</strong></TableCell>
                      <TableCell><strong>Program</strong></TableCell>
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((student) => (
                        <TableRow hover key={student.id}>
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                              {student.name}
                            </Box>
                          </TableCell>
                          <TableCell>{student.enrollmentNumber}</TableCell>
                          <TableCell>{typeof student.semester === 'number' ? `${student.semester}th` : student.semester}</TableCell>
                          <TableCell>{student.discipline}</TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={() => handleViewProfile(student.id)}
                            >
                              View Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body1" sx={{ py: 2 }}>
                            No students found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredStudents.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          )}
        </Container>
      </div>
    </div>
  );
};

export default StudentsListPage; 