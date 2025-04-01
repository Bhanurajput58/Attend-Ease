import React, { useState, useRef, useEffect } from 'react';
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
  FormControl,
  Select,
  MenuItem,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Tooltip,
  Link,
  TextField,
  Grid,
  InputLabel
} from '@mui/material';
import { CloudUpload, PersonAdd, Save, Download, Check, DeleteOutline } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/AttendancePage.css';

const AttendanceManager = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [courseId, setCourseId] = useState('');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Today's date in YYYY-MM-DD format
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Import related states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [rawExcelData, setRawExcelData] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [columnMappings, setColumnMappings] = useState({
    name: '',
    rollNumber: '',
    discipline: ''
  });
  const [showMappingStep, setShowMappingStep] = useState(false);
  const fileInputRef = useRef(null);
  
  // Confirm clear students states
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isClearingStudents, setIsClearingStudents] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [clearError, setClearError] = useState('');
  
  // Student edit dialog states
  const [editingStudent, setEditingStudent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    rollNumber: '',
    discipline: ''
  });
  
  // Course data mapping (would be fetched from backend in a real app)
  const courseMapping = {
    "class1": { id: "65f12abd0f70dab6a2876304", name: "Operating systems - CS2006" },
    "class2": { id: "65f12abd0f70dab6a2876305", name: "Design & Analysis of Algorithms - CS2007" },
    "class3": { id: "65f12abd0f70dab6a2876306", name: "Computer Network - CS2008" },
    "class4": { id: "65f12abd0f70dab6a2876307", name: "IoT and Embedded systems - CS2009" }
  };
  
  // Update courseId when selectedClass changes
  useEffect(() => {
    if (selectedClass && courseMapping[selectedClass]) {
      setCourseId(courseMapping[selectedClass].id);
    } else {
      setCourseId('');
    }
  }, [selectedClass]);
  
  // Fetch students and attendance data when course is selected
  useEffect(() => {
    if (courseId) {
      // Try to fetch existing attendance for today
      const fetchTodayAttendance = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          console.log(`Fetching attendance for course ${courseId} on date ${date}`);
          const formattedDate = new Date(date).toISOString().split('T')[0];
          console.log(`Formatted date for API request: ${formattedDate}`);
          
          const response = await axios.get(
            `${API_ENDPOINTS.GET_ATTENDANCE}?course=${courseId}&date=${formattedDate}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          console.log('Attendance API response:', response.data);
          
          if (response.data.success && response.data.data.length > 0) {
            // If attendance exists for today, load it
            const attendanceData = response.data.data[0];
            console.log('Found existing attendance record:', attendanceData);
            
            // Log the raw attendance data for debugging
            console.log('Raw student data in attendance record:', JSON.stringify(attendanceData.students, null, 2));
            
            // Map the students from the attendance record
            const studentRecords = attendanceData.students.map(record => {
              // Handle both populated and unpopulated student references
              const studentObj = record.student;
              
              console.log('Student record from API:', record);
              console.log('Student object:', studentObj);
              
              // Check if studentObj is a proper object or just an ID string
              const isValidObject = typeof studentObj === 'object' && studentObj !== null;
              
              // Get name and roll number with better fallbacks
              // First try to use the direct properties on the record, then fall back to student object
              const name = record.name ? record.name : 
                (isValidObject ? studentObj.name : 'Unknown');
              
              const rollNumber = record.rollNumber ? record.rollNumber :
                (isValidObject ? (studentObj.rollNumber || 'Unknown') : 'Unknown');
              
              const discipline = record.discipline ? record.discipline :
                (isValidObject ? (studentObj.discipline || 'Not Specified') : 'Not Specified');
              
              // Skip AUTO placeholder students if we can identify them
              const isAutoPlaceholder = isValidObject && 
                studentObj.rollNumber && 
                studentObj.rollNumber.startsWith('AUTO-') &&
                studentObj.name === 'Student';
              
              // Use cleaned up data for AUTO placeholders
              const displayName = isAutoPlaceholder ? 'Unknown Student' : name;
              const displayRollNumber = isAutoPlaceholder ? 'No Roll Number' : rollNumber;
              
              console.log(`Processed student: ${displayName}, ${displayRollNumber}, ${discipline}`);
              
              return {
                id: isValidObject ? studentObj._id : record.student,
                name: displayName,
                rollNumber: displayRollNumber,
                status: record.status === 'present' ? 'Present' : 'Absent',
                discipline: discipline,
                isPlaceholder: isAutoPlaceholder
              };
            });
            
            setStudents(studentRecords);
            console.log('Loaded existing attendance data:', studentRecords);
          } else {
            // Try to fetch students enrolled in this course
            try {
              console.log(`No existing attendance found. Fetching students for course: ${courseId}`);
              const studentsResponse = await axios.get(
                `${API_ENDPOINTS.GET_COURSES}/${courseId}/students`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              );
              
              console.log('Students API response:', studentsResponse.data);
              
              if (studentsResponse.data.success && studentsResponse.data.data.length > 0) {
                const enrolledStudents = studentsResponse.data.data.map(student => ({
                  id: student._id,
                  name: student.name,
                  rollNumber: student.rollNumber || 'Unknown',
                  status: 'Present', // Default all to present
                  discipline: student.discipline || 'Not Specified'
                }));
                
                setStudents(enrolledStudents);
                console.log('Loaded enrolled students:', enrolledStudents);
              } else {
                console.log('No students found for this course');
                setStudents([]);
              }
            } catch (err) {
              console.error('Error fetching enrolled students:', err.response?.data || err.message);
              // Don't show an error - students can still be imported
              setStudents([]);
            }
          }
        } catch (err) {
          console.error('Error fetching attendance data:', err.response?.data || err.message);
          // Don't show error on initial load
          setStudents([]);
        }
      };
      
      fetchTodayAttendance();
    } else {
      // Clear students if no course is selected
      setStudents([]);
    }
  }, [courseId, date]);

  const handleStatusChange = (studentId) => {
    // Update student status
    setStudents(students.map(student => 
      student.id === studentId 
        ? { ...student, status: student.status === 'Present' ? 'Absent' : 'Present' } 
        : student
    ));
  };

  const handleImportDialogOpen = () => {
    setIsImportDialogOpen(true);
    setImportError('');
    setImportedData([]);
    setRawExcelData([]);
    setAvailableColumns([]);
    setColumnMappings({
      name: '',
      rollNumber: '',
      discipline: ''
    });
    setShowMappingStep(false);
  };

  const handleImportDialogClose = () => {
    setIsImportDialogOpen(false);
    setImportError('');
    setImportedData([]);
    setRawExcelData([]);
    setAvailableColumns([]);
    setShowMappingStep(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
      setImportError('Please upload a CSV or Excel file.');
      return;
    }

    setIsImporting(true);
    setImportError('');
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setImportError('The file contains no data.');
          setIsImporting(false);
          return;
        }
        
        // Set the raw data and available columns
        setRawExcelData(jsonData);
        setAvailableColumns(Object.keys(jsonData[0]));
        
        // Show mapping step for user to confirm or adjust mappings
        setShowMappingStep(true);
        setIsImporting(false);
      } catch (error) {
        console.error('Error parsing file:', error);
        setImportError('Error parsing file. Please check the file format.');
        setIsImporting(false);
      }
    };
    
    reader.onerror = () => {
      setImportError('Error reading file.');
      setIsImporting(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleShowMappingStep = () => {
    try {
      // Get column headers from the first row
      const firstRow = rawExcelData[0];
      const columnHeaders = Object.keys(firstRow);
      
      if (columnHeaders.length === 0) {
        setImportError('No columns found in the file.');
        return;
      }
      
      setAvailableColumns(columnHeaders);
      
      // Try to guess column mappings based on common names (case insensitive)
      const nameMappingGuesses = ['name', 'student name', 'student_name', 'full name', 'studentname', 'student'];
      const rollNumberMappingGuesses = ['roll', 'roll no', 'roll number', 'roll_no', 'rollno', 'rollnumber', 'enrollment', 'id', 'student id'];
      const disciplineMappingGuesses = ['discipline', 'department', 'dept', 'program', 'course', 'branch', 'major'];
      
      const guessMapping = (guesses) => {
        const lowercaseHeaders = columnHeaders.map(h => h.toLowerCase());
        for (const guess of guesses) {
          const index = lowercaseHeaders.findIndex(h => h.includes(guess));
          if (index >= 0) return columnHeaders[index];
        }
        return '';
      };
      
      setColumnMappings({
        name: guessMapping(nameMappingGuesses),
        rollNumber: guessMapping(rollNumberMappingGuesses),
        discipline: guessMapping(disciplineMappingGuesses)
      });
      
      setShowMappingStep(true);
    } catch (error) {
      console.error('Error preparing column mapping:', error);
      setImportError('Error preparing column mapping. Please check your file format.');
    }
  };

  const handleImportStudents = () => {
    if (importedData.length === 0) {
      setImportError('No data to import.');
      return;
    }
    
    // Make sure imported data contains all necessary fields and ensure they use consistent format
    const formattedImportedData = importedData.map(student => ({
      id: student.id,
      name: student.name || 'Unknown',
      rollNumber: student.rollNumber || 'Unknown',
      discipline: student.discipline || 'Not Specified',
      status: student.status || 'Present',
      // Mark as not a placeholder explicitly
      isPlaceholder: false
    }));
    
    // Merge imported students with existing ones, avoiding duplicates by roll number first, then by ID
    const existingRollNumbers = new Set(students.map(student => student.rollNumber));
    const existingIds = new Set(students.map(student => student.id));
    
    // Filter out students that are already in the list (either by roll number or ID)
    const newStudents = formattedImportedData.filter(student => 
      !existingRollNumbers.has(student.rollNumber) && !existingIds.has(student.id)
    );
    
    setStudents([...students, ...newStudents]);
    setImportSuccess(true);
    setIsImportDialogOpen(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseSnackbar = () => {
    setImportSuccess(false);
    setSaveSuccess(false);
    setClearSuccess(false);
  };

  // Function to save attendance data to the backend
  const saveAttendance = async () => {
    if (!courseId) {
      setSaveError('Please select a course first.');
      return;
    }
    
    if (students.length === 0) {
      setSaveError('No students to save attendance for.');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError('');
      
      // Ensure all students have proper data before sending
      const cleanedStudents = students.map(student => {
        // Try to clean up the data as much as possible
        // This ensures that placeholder values don't override real data
        return {
          ...student,
          name: student.name && student.name !== 'Unknown' ? student.name : 'Unknown',
          rollNumber: student.rollNumber && student.rollNumber !== 'Unknown' ? student.rollNumber : 'Unknown',
          discipline: student.discipline && student.discipline !== 'Not Specified' ? student.discipline : 'Not Specified'
        };
      });
      
      // Log cleaned students data
      console.log('Cleaned student data for saving:', cleanedStudents);
      
      // For imported students with numeric IDs, create valid MongoDB ObjectIds
      const processedStudents = cleanedStudents.map(student => {
        // Check if id is numeric and not a MongoDB ObjectID
        const isNumericId = typeof student.id === 'number' || 
          (typeof student.id === 'string' && /^\d+$/.test(student.id) && student.id.length < 12);
        
        // Generate a random hex string (24 characters) to mimic a MongoDB ObjectId
        const generateObjectIdLike = () => {
          const hexChars = '0123456789abcdef';
          let result = '';
          for (let i = 0; i < 24; i++) {
            result += hexChars[Math.floor(Math.random() * 16)];
          }
          return result;
        };
        
        // If it's a numeric ID, create a proper ObjectId-like string (24 hex chars)
        const studentId = isNumericId ? generateObjectIdLike() : student.id;
        
        // Make sure name and rollNumber are never blank or undefined
        const finalName = student.name && student.name !== 'Unknown' ? student.name : 'Unknown';
        const finalRollNumber = student.rollNumber && student.rollNumber !== 'Unknown' ? student.rollNumber : `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const finalDiscipline = student.discipline && student.discipline !== 'Not Specified' ? student.discipline : 'Not Specified';
        
        console.log(`Processing student: ${finalName}, ${finalRollNumber}, ${finalDiscipline}`);
        
        // Include all student information for properly populating/updating the database
        return {
          student: studentId,
          status: student.status === 'Present' ? 'present' : 'absent',
          remarks: '',
          // Include all student details to ensure they're saved correctly
          name: finalName, 
          rollNumber: finalRollNumber,
          discipline: finalDiscipline,
          isPlaceholder: false // Force all students to not be placeholders to ensure real data is used
        };
      });
      
      // Format attendance data for API
      const attendanceData = {
        course: courseId,
        date: date,
        students: processedStudents
      };
      
      console.log('Sending attendance data:', JSON.stringify(attendanceData, null, 2));
      
      // Make API request to save attendance
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Log the actual request being made
      console.log(`Sending POST request to: ${API_ENDPOINTS.CREATE_ATTENDANCE}`);
      console.log('With headers:', { 'Authorization': `Bearer ${token.substring(0, 10)}...`, 'Content-Type': 'application/json' });
      
      const response = await axios.post(
        API_ENDPOINTS.CREATE_ATTENDANCE, 
        attendanceData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Attendance API Response:', response.data);
      
      if (response.data && response.data.success) {
        setSaveSuccess(true);
        console.log('Attendance saved successfully', response.data);
        
        // Update student IDs with proper database IDs from response
        if (response.data.data && response.data.data.students) {
          const savedStudents = response.data.data.students;
          
          // Create a mapping of student indices to their new database IDs
          const updatedStudents = [...cleanedStudents];
          savedStudents.forEach((savedStudent, index) => {
            if (index < updatedStudents.length) {
              updatedStudents[index].id = savedStudent.student;
            }
          });
          
          setStudents(updatedStudents);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to save attendance');
      }
    } catch (error) {
      console.error('Save attendance error:', error);
      console.log('Error details:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save attendance. Please try again.';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to generate and download sample Excel template
  const downloadSampleTemplate = () => {
    // Create a sample worksheet
    const sampleData = [
      { 'Student ID': '', 'Roll Number': '', 'Student Name': '', 'Department': '' },
      { 'Student ID': '', 'Roll Number': '', 'Student Name': '', 'Department': '' },
      { 'Student ID': '', 'Roll Number': '', 'Student Name': '', 'Department': '' }
    ];
    
    // Create a new workbook and add the sample data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    
    // Generate and download the Excel file
    XLSX.writeFile(wb, 'student_attendance_template.xlsx');
  };

  // Function to clear all students from a course
  const handleClearStudentsConfirm = () => {
    setConfirmClearOpen(true);
  };
  
  const handleClearStudentsCancel = () => {
    setConfirmClearOpen(false);
  };
  
  const clearAllStudents = async () => {
    if (!courseId) {
      setClearError('Please select a course first.');
      return;
    }
    
    try {
      setIsClearingStudents(true);
      setClearError('');
      
      // Get token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      console.log(`Deleting all students from course: ${courseId}`);
      
      // Make API request to delete all students from the course
      const response = await axios.delete(
        `${API_ENDPOINTS.GET_COURSES}/${courseId}/students`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Clear students response:', response.data);
      
      if (response.data && response.data.success) {
        // Clear the local students list
        setStudents([]);
        setClearSuccess(true);
        setConfirmClearOpen(false);
      } else {
        throw new Error(response.data?.message || 'Failed to clear students');
      }
    } catch (error) {
      console.error('Clear students error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clear students. Please try again.';
      setClearError(errorMessage);
    } finally {
      setIsClearingStudents(false);
    }
  };

  // Student edit functions
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      discipline: student.discipline || 'Not Specified'
    });
    setEditDialogOpen(true);
  };
  
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingStudent(null);
  };
  
  const handleEditFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSaveStudentEdit = () => {
    // Validate form data
    if (!editFormData.name || !editFormData.rollNumber) {
      return; // Don't save if required fields are missing
    }
    
    // Update the student in the local state
    setStudents(students.map(student => 
      student.id === editingStudent.id 
        ? { 
            ...student, 
            name: editFormData.name,
            rollNumber: editFormData.rollNumber,
            discipline: editFormData.discipline,
            isPlaceholder: false // No longer a placeholder if edited
          } 
        : student
    ));
    
    // Close the dialog
    setEditDialogOpen(false);
    setEditingStudent(null);
  };

  const applyColumnMappings = () => {
    if (!columnMappings.name || !columnMappings.rollNumber) {
      setImportError('Please map at least Name and Roll Number columns.');
      return;
    }

    try {
      // Transform the raw data using the column mappings
      const processedData = rawExcelData.map((item, index) => {
        // Get name and convert to string, ensuring it's not empty
        const name = item[columnMappings.name]?.toString().trim() || 'Unknown';
        
        // Get roll number and convert to string, ensuring it's not empty
        const rollNumber = item[columnMappings.rollNumber]?.toString().trim() || `Unknown-${index + 1}`;
        
        // Get discipline if mapped column exists
        const discipline = columnMappings.discipline ? 
          (item[columnMappings.discipline]?.toString().trim() || 'Not Specified') : 
          'Not Specified';
        
        return {
          id: index + 1, // Just use the index as ID
          name: name,
          rollNumber: rollNumber,
          discipline: discipline,
          status: 'Present', // Default status
          isPlaceholder: false // Explicitly mark as not a placeholder
        };
      });
      
      console.log('Processed imported data:', processedData);
      
      setImportedData(processedData);
      setImportError(''); // Clear any errors
    } catch (error) {
      console.error('Error mapping columns:', error);
      setImportError('Error processing data. Please check your column selections.');
    }
  };

  // Handle file input click
  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Manage Attendance
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<DeleteOutline />}
              onClick={handleClearStudentsConfirm}
              disabled={!courseId || students.length === 0}
            >
              Clear Students
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<CloudUpload />}
              onClick={handleImportDialogOpen}
            >
              Import Students
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select a Course</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                // Reset students when course changes
                setStudents([]);
              }}
              displayEmpty
              label="Select a Course"
            >
              <MenuItem value="">
                <em>Select a Course</em>
              </MenuItem>
              <MenuItem value="class1">Operating systems - CS2006</MenuItem>
              <MenuItem value="class2">Design & Analysis of Algorithms - CS2007</MenuItem>
              <MenuItem value="class3">Computer Network - CS2008</MenuItem>
              <MenuItem value="class4">IoT and Embedded systems - CS2009</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              // Reset students when date changes
              setStudents([]);
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          
          <Typography variant="body2" color="text.secondary">
            {selectedClass ? `${students.length} students enrolled` : ''}
          </Typography>
        </Box>
        
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}
        
        {clearError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {clearError}
          </Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Roll Number</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Discipline</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.discipline || 'Not Specified'}</TableCell>
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
                    >
                      {student.status === 'Present' ? 'Mark Absent' : 'Mark Present'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<Save />}
            onClick={saveAttendance}
            disabled={isSaving || !courseId || students.length === 0}
          >
            {isSaving ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                Saving...
              </>
            ) : 'Save Attendance'}
          </Button>
        </Box>
      </Paper>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onClose={handleImportDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Import Students</DialogTitle>
        <DialogContent>
          {showMappingStep ? (
            <Box sx={{ p: 1 }}>
              <Typography variant="h6" gutterBottom>
                Map Columns
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please select which columns from your Excel file correspond to each student attribute.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Student Name Column</InputLabel>
                    <Select
                      value={columnMappings.name}
                      onChange={(e) => setColumnMappings({...columnMappings, name: e.target.value})}
                      label="Student Name Column"
                    >
                      {availableColumns.map(column => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Roll Number Column</InputLabel>
                    <Select
                      value={columnMappings.rollNumber}
                      onChange={(e) => setColumnMappings({...columnMappings, rollNumber: e.target.value})}
                      label="Roll Number Column"
                    >
                      {availableColumns.map(column => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Discipline/Department Column (Optional)</InputLabel>
                    <Select
                      value={columnMappings.discipline}
                      onChange={(e) => setColumnMappings({...columnMappings, discipline: e.target.value})}
                      label="Discipline/Department Column (Optional)"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {availableColumns.map(column => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Preview of first 3 rows with current mapping:
                </Typography>
                <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 200 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Roll Number</TableCell>
                        <TableCell>Discipline</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rawExcelData.slice(0, 3).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{columnMappings.name ? row[columnMappings.name] : 'Not mapped'}</TableCell>
                          <TableCell>{columnMappings.rollNumber ? row[columnMappings.rollNumber] : 'Not mapped'}</TableCell>
                          <TableCell>{columnMappings.discipline ? row[columnMappings.discipline] : 'Not Specified'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          ) : (
            // Step 1: File Upload
            <Box sx={{ p: 1 }}>
              <Typography variant="body1" paragraph>
                Upload a CSV or Excel file with your student information. You can use any column names - you'll be able to map them in the next step.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={downloadSampleTemplate}
                >
                  Download Sample Template
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  accept=".csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                  id="raised-button-file"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="raised-button-file">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUpload />}
                    disabled={isImporting}
                    color="primary"
                    sx={{ px: 3, py: 1 }}
                  >
                    Select Excel File
                  </Button>
                </label>
                
                {fileInputRef.current?.files?.[0] && (
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Selected file: <strong>{fileInputRef.current.files[0].name}</strong>
                  </Typography>
                )}
              </Box>
              
              {isImporting && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              
              {importError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {importError}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {showMappingStep ? (
            <>
              <Button onClick={() => setShowMappingStep(false)}>Back</Button>
              <Button 
                onClick={applyColumnMappings} 
                variant="contained" 
                color="primary"
                disabled={!columnMappings.name || !columnMappings.rollNumber}
              >
                Apply Mapping
              </Button>
              <Button 
                onClick={handleImportStudents} 
                variant="contained" 
                color="success"
                disabled={importedData.length === 0}
              >
                Import Students
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleImportDialogClose}>Cancel</Button>
              <Button 
                onClick={handleFileInputClick} 
                variant="contained" 
                color="primary"
                disabled={isImporting}
              >
                Select File
              </Button>
              <Button 
                onClick={handleShowMappingStep} 
                variant="contained" 
                color="primary"
                disabled={isImporting || !rawExcelData.length}
              >
                Next
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirm Clear Students Dialog */}
      <Dialog
        open={confirmClearOpen}
        onClose={handleClearStudentsCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete all students from this course? This action cannot be undone.
          </Typography>
          {clearError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {clearError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearStudentsCancel}>Cancel</Button>
          <Button 
            onClick={clearAllStudents} 
            color="error" 
            variant="contained"
            disabled={isClearingStudents}
          >
            {isClearingStudents ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                Deleting...
              </>
            ) : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Edit Student Details</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Student Name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Roll Number"
                  name="rollNumber"
                  value={editFormData.rollNumber}
                  onChange={handleEditFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Discipline/Department"
                  name="discipline"
                  value={editFormData.discipline}
                  onChange={handleEditFormChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleSaveStudentEdit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar 
        open={importSuccess || saveSuccess || clearSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {importSuccess ? 'Students successfully imported!' : 
           clearSuccess ? 'All students successfully deleted!' :
           'Attendance saved successfully!'}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AttendanceManager; 