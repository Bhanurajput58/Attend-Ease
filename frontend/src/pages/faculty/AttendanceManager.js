import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, FormControl, Select, MenuItem, Box, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Snackbar, TextField, Grid, InputLabel, Card, CardContent, Divider
} from '@mui/material';
import { CloudUpload, Save, Download, DeleteOutline } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import './AttendancePage.css';

const AttendanceManager = ({ mode = 'create' }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { id: attendanceId } = useParams(); // Get attendance ID from URL for edit mode
  const navigate = useNavigate(); // Use navigate for redirection
  
  const [state, setState] = useState({
    selectedClass: '',
    courseId: '',
    students: [],
    date: new Date().toISOString().split('T')[0],
    isSaving: false,
    saveError: '',
    saveSuccess: false,
    searchQuery: '',
    assignedCourses: [],
    loadingCourses: true,
    courseError: '',
    selectedCourseData: null,
    isImportDialogOpen: false,
    isImporting: false,
    importError: '',
    importedData: [],
    rawExcelData: [],
    availableColumns: [],
    columnMappings: { name: '', rollNumber: '', discipline: '' },
    showMappingStep: false,
    confirmClearOpen: false,
    isClearingStudents: false,
    clearSuccess: false,
    clearError: '',
    isEditMode: mode === 'edit',
    editingAttendanceId: attendanceId,
    loadingAttendanceData: false,
    attendanceDataError: '',
    facultyApprovalStatus: null
  });

  const updateState = (updates) => setState(prev => ({ ...prev, ...updates }));
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        updateState({ loadingCourses: true, courseError: '' });
        const response = await api.get(API_ENDPOINTS.GET_FACULTY_DASHBOARD);
        
        if (response.data.success && response.data.data) {
          const courses = response.data.data.coursesList || [];
          const isApproved = response.data.data.isApproved || false;
          updateState({ assignedCourses: courses, facultyApprovalStatus: isApproved });
          
          // If in edit mode, load the attendance data first
          if (state.isEditMode && attendanceId) {
            await loadAttendanceDataForEdit(attendanceId, courses);
          } else {
            // Handle normal course selection
            const urlParams = new URLSearchParams(location.search);
            const courseIdFromUrl = urlParams.get('courseId');
            
            if (courseIdFromUrl) {
              const course = courses.find(c => c.id === courseIdFromUrl);
              if (course) {
                updateState({ 
                  selectedClass: course.id, 
                  courseId: course.id, 
                  selectedCourseData: course 
                });
              }
            } else if (courses.length === 1) {
              updateState({ 
                selectedClass: courses[0].id, 
                courseId: courses[0].id, 
                selectedCourseData: courses[0] 
              });
            }
          }
        } else {
          updateState({ courseError: 'Failed to load courses' });
        }
      } catch (error) {
        updateState({ courseError: 'Error loading courses' });
      } finally {
        updateState({ loadingCourses: false });
      }
    };

    if (user?.role === 'faculty') {
      fetchCourses();
    }
  }, [user, location.search, state.isEditMode, attendanceId]);

  // Function to load attendance data for editing
  const loadAttendanceDataForEdit = async (attendanceId, courses) => {
    try {
      updateState({ loadingAttendanceData: true, attendanceDataError: '' });
      
      const response = await api.get(`${API_ENDPOINTS.GET_ATTENDANCE_BY_ID(attendanceId)}`);
      
      if (response.data.success && response.data.data) {
        const attendanceData = response.data.data;
        
        console.log('Attendance data received:', {
          attendanceId: attendanceId,
          course: attendanceData.course,
          courseId: attendanceData.course?._id,
          faculty: attendanceData.faculty,
          facultyId: attendanceData.faculty?._id || attendanceData.faculty,
          user: user._id,
          userRole: user.role
        });
        
        console.log('Available courses:', courses.map(c => ({ id: c.id, name: c.name })));
        
        // Find the course for this attendance record
        const course = courses.find(c => c.id === attendanceData.course?._id || attendanceData.course?.id || attendanceData.course?.courseId);
        
        console.log('Matched course:', course);
        
        if (course) {
          // Check if the faculty member has permission to edit this record
          const facultyId = attendanceData.faculty?._id || attendanceData.faculty;
          console.log('Faculty permission check:', {
            facultyId: facultyId,
            userId: user._id,
            userRole: user.role,
            canEdit: !facultyId || facultyId === user._id || user.role === 'admin'
          });
          
          if (facultyId && facultyId !== user._id && user.role !== 'admin') {
            updateState({ 
              attendanceDataError: 'You can only edit attendance records that you created.' 
            });
            return;
          }
          
          // Set the course and load students
          updateState({
            selectedClass: course.id,
            courseId: course.id,
            selectedCourseData: course,
            date: new Date(attendanceData.date).toISOString().split('T')[0]
          });
          
          // Load students for this course
          await loadStudentsForCourse(course.id);
          
          // Set the attendance data
          if (attendanceData.students && attendanceData.students.length > 0) {
            const studentRecords = attendanceData.students.map(student => {
              // Ensure consistent ID handling - check for populated student object first
              const studentObj = student.student;
              const isValidObject = studentObj && typeof studentObj === 'object';
              
              return {
                id: isValidObject ? studentObj._id : (student.studentId || student.id || student.student),
                name: student.student?.name || student.fullName || student.name || (isValidObject ? studentObj.name : 'Unknown'),
                rollNumber: student.student?.rollNumber || student.rollNumber || (isValidObject ? studentObj.rollNumber : 'Unknown'),
                discipline: student.student?.discipline || student.discipline || (isValidObject ? studentObj.discipline : '') || '',
                status: (student.status?.toLowerCase() || 'absent') === 'present' ? 'Present' : 'Absent',
                originalStatus: (student.status?.toLowerCase() || 'absent') === 'present' ? 'Present' : 'Absent'
              };
            });
            
            updateState({ students: studentRecords });
          }
        } else {
          updateState({ 
            attendanceDataError: 'Course not found for this attendance record. You may not have permission to edit this record.' 
          });
        }
      } else {
        updateState({ 
          attendanceDataError: 'Attendance record not found or you do not have permission to edit it.' 
        });
      }
    } catch (error) {
      console.error('Error loading attendance data for edit:', error);
      if (error.response?.status === 404) {
        updateState({ 
          attendanceDataError: 'Attendance record not found. It may have been deleted or you do not have permission to access it.' 
        });
      } else if (error.response?.status === 403) {
        updateState({ 
          attendanceDataError: 'You do not have permission to edit this attendance record.' 
        });
      } else {
        updateState({ 
          attendanceDataError: 'Error loading attendance data. Please try again.' 
        });
      }
    } finally {
      updateState({ loadingAttendanceData: false });
    }
  };

  // Function to load students for a course
  const loadStudentsForCourse = async (courseId) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.GET_COURSE_STUDENTS(courseId)}`);
      
      if (response.data.success && response.data.data) {
        const students = response.data.data.map(student => ({
          id: student._id || student.studentId || student.id,
          name: student.student?.name || student.fullName || student.name || 'Unknown',
          rollNumber: student.student?.rollNumber || student.rollNumber || 'Unknown',
          discipline: student.student?.discipline || student.discipline || '',
          status: 'Present', // Default status - properly capitalized
          originalStatus: 'Present'
        }));
        
        updateState({ students });
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  useEffect(() => {
    if (state.selectedClass) {
      updateState({ 
        courseId: state.selectedClass,
        selectedCourseData: state.assignedCourses.find(c => c.id === state.selectedClass)
      });
    } else {
      updateState({ courseId: '', selectedCourseData: null });
    }
  }, [state.selectedClass, state.assignedCourses]);

  useEffect(() => {
    if (state.courseId) {
      const fetchAttendance = async () => {
        try {
          const response = await api.get(
            `${API_ENDPOINTS.GET_ATTENDANCE}?course=${state.courseId}&date=${state.date}`
          );
          
          if (response.data.success && response.data.data.length > 0) {
            const attendanceData = response.data.data[0];
            const studentRecords = attendanceData.students.map(record => {
              const studentObj = record.student;
              const isValidObject = studentObj && typeof studentObj === 'object';
              
              return {
                id: isValidObject ? studentObj._id : record.student,
                name: record.student?.name || isValidObject ? studentObj.name : 'Unknown',
                rollNumber: record.student?.rollNumber || isValidObject ? studentObj.rollNumber : 'Unknown',
                status: record.status.toLowerCase() === 'present' ? 'Present' : 'Absent',
                discipline: record.student?.discipline || isValidObject ? (studentObj.discipline || 'Not Specified') : 'Not Specified'
              };
            });
            
            updateState({ students: studentRecords });
          } else {
            try {
              const studentsResponse = await api.get(
                `${API_ENDPOINTS.GET_COURSES}/${state.courseId}/students`
              );
              
              if (studentsResponse.data.success && studentsResponse.data.data.length > 0) {
                const enrolledStudents = studentsResponse.data.data.map(student => ({
                  id: student._id,
                  name: student.student?.name || student.fullName || student.name || 'Unknown',
                  rollNumber: student.student?.rollNumber || student.rollNumber || 'Unknown',
                  status: 'Present',
                  discipline: student.student?.discipline || student.discipline || 'Not Specified'
                }));
                
                updateState({ students: enrolledStudents });
              } else {
                updateState({ students: [] });
              }
            } catch (err) {
              updateState({ students: [] });
            }
          }
        } catch (err) {
          updateState({ students: [] });
        }
      };
      
      fetchAttendance();
    } else {
      updateState({ students: [] });
    }
  }, [state.courseId, state.date]);

  const handleStatusChange = (studentId) => {
    console.log('Status change requested for student ID:', studentId);
    console.log('Current students:', state.students.map(s => ({ id: s.id, name: s.name, status: s.status })));
    
    const updatedStudents = state.students.map(student => {
      if (student.id === studentId) {
        const newStatus = student.status === 'Present' ? 'Absent' : 'Present';
        console.log(`Changing ${student.name} (ID: ${student.id}) from ${student.status} to ${newStatus}`);
        return { ...student, status: newStatus };
      }
      return student;
    });
    
    console.log('Updated students:', updatedStudents.map(s => ({ id: s.id, name: s.name, status: s.status })));
    
    updateState({ students: updatedStudents });
    
    // Force a re-render to update stats
    setTimeout(() => {
      updateState({ students: [...updatedStudents] });
    }, 0);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    updateState({ searchQuery: query });
  };

  const filteredStudents = state.searchQuery.trim() 
    ? state.students.filter(student => 
        student.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    : state.students;

  const stats = {
    present: state.students.filter(s => s.status.toLowerCase() === 'present').length,
    absent: state.students.filter(s => s.status.toLowerCase() === 'absent').length,
    total: state.students.length,
    percentage: state.students.length > 0 
      ? Math.round((state.students.filter(s => s.status.toLowerCase() === 'present').length / state.students.length) * 100) 
      : 0
  };

  // Debug stats calculation
  console.log('Stats calculation:', {
    totalStudents: state.students.length,
    presentCount: state.students.filter(s => s.status.toLowerCase() === 'present').length,
    absentCount: state.students.filter(s => s.status.toLowerCase() === 'absent').length,
    percentage: stats.percentage,
    allStatuses: state.students.map(s => ({ name: s.name, status: s.status }))
  });

  const saveAttendance = async () => {
    try {
      updateState({ isSaving: true, saveError: '' });
      
      // Check if user is authenticated and has a valid token
      if (!user || !user.token) {
        updateState({ 
          saveError: 'Authentication required. Please log in again.' 
        });
        return;
      }
      
      // Validate token before proceeding
      try {
        const tokenValidation = await api.get(API_ENDPOINTS.GET_USER);
        if (!tokenValidation.data.success) {
          updateState({ 
            saveError: 'Session expired. Please log in again.' 
          });
          return;
        }
      } catch (validationError) {
        console.error('Token validation failed:', validationError);
        updateState({ 
          saveError: 'Session expired. Please log in again.' 
        });
        return;
      }
      
      if (!state.courseId || state.students.length === 0) {
        updateState({ saveError: 'Please select course and add students' });
        return;
      }
      
      const studentRecords = state.students.map(student => ({
        student: student.id,
        studentModel: 'ImportedStudent',
        status: student.status.toLowerCase(),
        remarks: '',
        name: student.name,
        rollNumber: student.rollNumber,
        discipline: student.discipline || 'Not Specified',
        program: 'B.tech',
        semester: 4
      }));
      
      let response;
      
      if (state.isEditMode && state.editingAttendanceId) {
        // Update existing attendance record
        response = await api.put(`${API_ENDPOINTS.UPDATE_ATTENDANCE(state.editingAttendanceId)}`, {
          course: state.courseId,
          date: new Date(state.date).toISOString(),
          students: studentRecords
        });
      } else {
        // Create new attendance record
        response = await api.post(API_ENDPOINTS.CREATE_ATTENDANCE, {
          course: state.courseId,
          date: new Date(state.date).toISOString(),
          students: studentRecords
        });
      }
      
      if (response.data.success) {
        updateState({ saveSuccess: true });
        
        // If in edit mode, redirect back to attendance list after successful update
        if (state.isEditMode) {
          setTimeout(() => {
            navigate('/attendance');
          }, 2000);
        }
      } else {
        updateState({ saveError: response.data.message || 'Failed to save' });
      }
    } catch (error) {
      console.error('Save attendance error:', error);
      
      // Handle authentication errors specifically
      if (error.response?.status === 401 || error.response?.status === 403) {
        updateState({ 
          saveError: 'Authentication failed. Please refresh the page and try again.' 
        });
        return;
      }
      
      // Handle other errors
      updateState({ 
        saveError: error.response?.data?.message || 'Failed to save attendance. Please try again.' 
      });
    } finally {
      updateState({ isSaving: false });
    }
  };

  const handleImportDialogOpen = () => {
    updateState({ 
      isImportDialogOpen: true, 
      importError: '', 
      importedData: [], 
      rawExcelData: [], 
      availableColumns: [],
      columnMappings: { name: '', rollNumber: '', discipline: '' },
      showMappingStep: false 
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
      updateState({ importError: 'Please upload CSV or Excel file' });
      return;
    }

    updateState({ isImporting: true, importError: '' });
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          updateState({ importError: 'File contains no data', isImporting: false });
          return;
        }
        
        updateState({ 
          rawExcelData: jsonData, 
          availableColumns: Object.keys(jsonData[0]), 
          showMappingStep: true, 
          isImporting: false 
        });
      } catch (error) {
        updateState({ importError: 'Error parsing file', isImporting: false });
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const applyColumnMappings = () => {
    if (!state.columnMappings.name || !state.columnMappings.rollNumber) {
      updateState({ importError: 'Please map Name and Roll Number columns' });
      return;
    }

    try {
      const processedData = state.rawExcelData.map((item, index) => ({
        id: `TEMP_${Date.now()}_${index}`,
        name: item[state.columnMappings.name]?.toString().trim() || 'Unknown',
        rollNumber: item[state.columnMappings.rollNumber]?.toString().trim() || `Unknown-${index + 1}`,
        discipline: state.columnMappings.discipline ? 
          (item[state.columnMappings.discipline]?.toString().trim() || 'Not Specified') : 
          'Not Specified',
        status: 'Present'
      }));
      
      updateState({ importedData: processedData, importError: '' });
    } catch (error) {
      updateState({ importError: 'Error processing data' });
    }
  };

  const handleImportStudents = () => {
    if (state.importedData.length === 0) {
      updateState({ importError: 'No data to import' });
      return;
    }
    
    const existingRollNumbers = new Set(state.students.map(s => s.rollNumber));
    const newStudents = state.importedData.filter(student => 
      !existingRollNumbers.has(student.rollNumber)
    );
    
    updateState({ 
      students: [...state.students, ...newStudents], 
      isImportDialogOpen: false 
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAllStudents = async () => {
    if (!state.courseId) {
      updateState({ clearError: 'Please select course first' });
      return;
    }
    
    try {
      updateState({ isClearingStudents: true, clearError: '' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await api.delete(
        `${API_ENDPOINTS.GET_COURSES}/${state.courseId}/students`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data && response.data.success) {
        updateState({ students: [], clearSuccess: true, confirmClearOpen: false });
      } else {
        throw new Error(response.data?.message || 'Failed to clear students');
      }
    } catch (error) {
      updateState({ clearError: error.message || 'Failed to clear students' });
    } finally {
      updateState({ isClearingStudents: false });
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      { 'Student ID': '', 'Roll Number': '', 'Student Name': '', 'Department': '' },
      { 'Student ID': '', 'Roll Number': '', 'Student Name': '', 'Department': '' }
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_attendance_template.xlsx');
  };

  if (user?.role === 'faculty' && !user?.approved) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          backgroundColor: '#fff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          maxWidth: 600,
          mx: 'auto'
        }}>
          <Typography variant="h4" sx={{ 
            color: '#4a90e2', 
            fontWeight: 600, 
            mb: 2
          }}>
            Attendance Access Restricted
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#666', 
            mb: 1,
            lineHeight: 1.6
          }}>
            You can't take attendance until your account is approved by admin.
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#4a90e2', 
            fontWeight: 500
          }}>
            Contact your administrator for approval.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Check for unapproved faculty restriction
  if (user?.role === 'faculty' && state.facultyApprovalStatus === false) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          backgroundColor: '#fff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          maxWidth: 600,
          mx: 'auto'
        }}>
          <Typography variant="h4" sx={{ 
            color: '#4a90e2', 
            fontWeight: 600, 
            mb: 2
          }}>
            Attendance Access Restricted
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#666', 
            mb: 1,
            lineHeight: 1.6
          }}>
            You can't take attendance until your account is approved by admin.
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#4a90e2', 
            fontWeight: 500
          }}>
            Contact your administrator for approval.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (user?.role === 'faculty' && !state.loadingCourses && state.assignedCourses.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="warning">
            <Typography variant="h6">No Courses Assigned</Typography>
            <Typography>No courses assigned. Contact administrator.</Typography>
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {state.isEditMode ? 'Edit Attendance Record' : 'Manage Attendance'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!state.isEditMode && (
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<DeleteOutline />}
                onClick={() => updateState({ confirmClearOpen: true })}
                disabled={!state.courseId || state.students.length === 0}
              >
                Clear Students
              </Button>
            )}
            {!state.isEditMode && (
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<CloudUpload />}
                onClick={handleImportDialogOpen}
              >
                Import Students
              </Button>
            )}
          </Box>
        </Box>
        
        {state.attendanceDataError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.attendanceDataError}
          </Alert>
        )}
        
        {state.loadingAttendanceData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading attendance data...</Typography>
          </Box>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Course</InputLabel>
            <Select
              value={state.selectedClass}
              onChange={(e) => updateState({ selectedClass: e.target.value, students: [] })}
              label="Select Course"
              disabled={state.isEditMode} // Disable course selection in edit mode
            >
              <MenuItem value="">Select Course</MenuItem>
              {state.loadingCourses ? (
                <MenuItem value="">Loading...</MenuItem>
              ) : state.courseError ? (
                <MenuItem value="">{state.courseError}</MenuItem>
              ) : (
                state.assignedCourses.map(course => (
                  <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          
          <TextField
            label="Date"
            type="date"
            value={state.date}
            onChange={(e) => updateState({ date: e.target.value, students: [] })}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: new Date().toISOString().split('T')[0] }}
            disabled={state.isEditMode} // Disable date selection in edit mode
          />
          
          <Typography variant="body2" color="text.secondary">
            {state.selectedClass ? `${state.students.length} students` : ''}
          </Typography>
        </Box>

        {state.saveError && <Alert severity="error" sx={{ mb: 2 }}>{state.saveError}</Alert>}
        {state.clearError && <Alert severity="error" sx={{ mb: 2 }}>{state.clearError}</Alert>}
        {state.saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {state.isEditMode ? 'Attendance record updated successfully!' : 'Attendance saved successfully!'}
          </Alert>
        )}

        {state.isEditMode && !state.attendanceDataError && !state.loadingAttendanceData && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Edit Mode:</strong> You can modify student attendance statuses. Course and date cannot be changed.
          </Alert>
        )}

        {state.selectedClass && state.students.length > 0 && (
          <>
            <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    {state.isEditMode ? 'Edit Session Attendance' : 'Current Session Attendance'}
                  </Typography>
                  <TextField
                    placeholder="Search students"
                    value={state.searchQuery}
                    onChange={handleSearchChange}
                    variant="outlined"
                    size="small"
                    sx={{ width: 300 }}
                  />
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="primary" fontWeight="bold">
                        {stats.percentage}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Attendance Rate</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {stats.present}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Present</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main" fontWeight="bold">
                        {stats.absent}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Absent</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="text.primary" fontWeight="bold">
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Students</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Paper sx={{ p: 3, mb: 3 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Roll Number</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Discipline</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.discipline}</TableCell>
                        <TableCell>
                          <span className={`status-badge ${student.status.toLowerCase()}`}>
                            {student.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color={student.status === 'Present' ? 'error' : 'success'}
                            size="small"
                            onClick={() => handleStatusChange(student.id)}
                            sx={{ 
                              minWidth: 140, 
                              height: 32,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              fontWeight: 500
                            }}
                          >
                            {student.status === 'Present' ? 'Mark Absent' : 'Mark Present'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {state.isEditMode && (
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={() => navigate('/attendance')}
            >
              Cancel
            </Button>
          )}
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<Save />}
            onClick={saveAttendance}
            disabled={state.isSaving || !state.courseId || state.students.length === 0}
          >
            {state.isSaving ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                {state.isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : state.isEditMode ? 'Update Attendance' : 'Save Attendance'}
          </Button>
        </Box>
      </Paper>

      <Dialog open={state.isImportDialogOpen} onClose={() => updateState({ isImportDialogOpen: false })} maxWidth="md" fullWidth>
        <DialogTitle>Import Students</DialogTitle>
        <DialogContent>
          {state.showMappingStep ? (
            <Box sx={{ p: 1 }}>
              <Typography variant="h6" gutterBottom>Map Columns</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which columns correspond to each student attribute.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Student Name Column</InputLabel>
                    <Select
                      value={state.columnMappings.name}
                      onChange={(e) => updateState({ 
                        columnMappings: { ...state.columnMappings, name: e.target.value } 
                      })}
                      label="Student Name Column"
                    >
                      {state.availableColumns.map(column => (
                        <MenuItem key={column} value={column}>{column}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Roll Number Column</InputLabel>
                    <Select
                      value={state.columnMappings.rollNumber}
                      onChange={(e) => updateState({ 
                        columnMappings: { ...state.columnMappings, rollNumber: e.target.value } 
                      })}
                      label="Roll Number Column"
                    >
                      {state.availableColumns.map(column => (
                        <MenuItem key={column} value={column}>{column}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Discipline Column (Optional)</InputLabel>
                    <Select
                      value={state.columnMappings.discipline}
                      onChange={(e) => updateState({ 
                        columnMappings: { ...state.columnMappings, discipline: e.target.value } 
                      })}
                      label="Discipline Column (Optional)"
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {state.availableColumns.map(column => (
                        <MenuItem key={column} value={column}>{column}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ p: 1 }}>
              <Typography variant="body1" paragraph>
                Upload a CSV or Excel file with student information.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={downloadSampleTemplate}
                >
                  Download Template
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  accept=".csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                  type="file"
                  onChange={handleFileChange}
                />
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={state.isImporting}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ px: 3, py: 1 }}
                >
                  Select File
                </Button>
              </Box>
              
              {state.isImporting && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              
              {state.importError && (
                <Alert severity="error" sx={{ mt: 2 }}>{state.importError}</Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {state.showMappingStep ? (
            <>
              <Button onClick={() => updateState({ showMappingStep: false })}>Back</Button>
              <Button onClick={applyColumnMappings} variant="contained" color="primary">
                Apply Mapping
              </Button>
              <Button onClick={handleImportStudents} variant="contained" color="success">
                Import Students
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => updateState({ isImportDialogOpen: false })}>Cancel</Button>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="contained" 
                color="primary"
                disabled={state.isImporting}
              >
                Select File
              </Button>
              <Button 
                onClick={() => updateState({ showMappingStep: true })} 
                variant="contained" 
                color="primary"
                disabled={state.isImporting || !state.rawExcelData.length}
              >
                Next
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={state.confirmClearOpen} onClose={() => updateState({ confirmClearOpen: false })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete all students from this course? This action cannot be undone.
          </Typography>
          {state.clearError && (
            <Alert severity="error" sx={{ mt: 2 }}>{state.clearError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => updateState({ confirmClearOpen: false })}>Cancel</Button>
          <Button 
            onClick={clearAllStudents} 
            color="error" 
            variant="contained"
            disabled={state.isClearingStudents}
          >
            {state.isClearingStudents ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                Deleting...
              </>
            ) : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={state.saveSuccess || state.clearSuccess} 
        autoHideDuration={6000} 
        onClose={() => updateState({ saveSuccess: false, clearSuccess: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => updateState({ saveSuccess: false, clearSuccess: false })} severity="success" sx={{ width: '100%' }}>
          {state.clearSuccess ? 'All students deleted!' : 'Attendance saved successfully!'}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AttendanceManager; 