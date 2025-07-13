import React, { useState, useRef } from 'react';
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
import { CloudUpload, PersonAdd, Save, Download, Check } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import useAuth from '../../hooks/useAuth';
import '../../styles/AttendancePage.css';

const ManageAttendance = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  
  // Import related states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [rawExcelData, setRawExcelData] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [columnMappings, setColumnMappings] = useState({
    id: '',
    name: '',
    rollNumber: ''
  });
  const [showMappingStep, setShowMappingStep] = useState(false);
  const fileInputRef = useRef(null);

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
      id: '',
      name: '',
      rollNumber: ''
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
        
        // Get column headers from the first row
        const firstRow = jsonData[0];
        const columnHeaders = Object.keys(firstRow);
        
        if (columnHeaders.length === 0) {
          setImportError('No columns found in the file.');
          setIsImporting(false);
          return;
        }
        
        // Set the raw data and available columns
        setRawExcelData(jsonData);
        setAvailableColumns(columnHeaders);
        
        // Try to guess column mappings based on common names
        const nameMappingGuesses = ['name', 'student name', 'student_name', 'full name', 'studentname'];
        const rollNumberMappingGuesses = ['roll', 'roll no', 'roll number', 'roll_no', 'rollno', 'rollnumber', 'enrollment', 'id'];
        const idMappingGuesses = ['sl.no', 'slno', 'serial', 'id', 'serial no', 'serial number'];
        
        const guessMapping = (guesses) => {
          const lowercaseHeaders = columnHeaders.map(h => h.toLowerCase());
          for (const guess of guesses) {
            const index = lowercaseHeaders.findIndex(h => h.includes(guess));
            if (index >= 0) return columnHeaders[index];
          }
          return '';
        };
        
        setColumnMappings({
          id: guessMapping(idMappingGuesses),
          name: guessMapping(nameMappingGuesses),
          rollNumber: guessMapping(rollNumberMappingGuesses)
        });
        
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

  const handleColumnMappingChange = (field, value) => {
    setColumnMappings({
      ...columnMappings,
      [field]: value
    });
  };

  const applyColumnMappings = () => {
    if (!columnMappings.name || !columnMappings.rollNumber) {
      setImportError('Please map at least Name and Roll Number columns.');
      return;
    }

    try {
      // Transform the raw data using the column mappings
      const processedData = rawExcelData.map((item, index) => {
        // For ID, use mapped column or index+1 as fallback
        const id = columnMappings.id ? item[columnMappings.id] : (index + 1);
        
        return {
          id: typeof id === 'number' ? id : parseInt(id) || (index + 1),
          name: item[columnMappings.name] || 'Unknown',
          rollNumber: item[columnMappings.rollNumber]?.toString() || `Unknown-${index + 1}`,
          discipline: columnMappings.discipline ? item[columnMappings.discipline] : 'Not Specified',
          status: 'Present' // Default status
        };
      });
      
      setImportedData(processedData);
    } catch (error) {
      console.error('Error mapping columns:', error);
      setImportError('Error mapping columns. Please check your column selections.');
    }
  };

  const handleImportStudents = () => {
    if (importedData.length === 0) {
      setImportError('No data to import.');
      return;
    }
    
    // Merge imported students with existing ones, avoiding duplicates by ID
    const existingIds = new Set(students.map(student => student.id));
    const newStudents = importedData.filter(student => !existingIds.has(student.id));
    
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Manage Attendance
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<CloudUpload />}
            onClick={handleImportDialogOpen}
          >
            Import Students
          </Button>
        </Box>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select a Course
              </MenuItem>
              <MenuItem value="class1">Operating systems - CS2006</MenuItem>
              <MenuItem value="class2">Design & Analysis of Algorithms - CS2007</MenuItem>
              <MenuItem value="class3">Computer Network - CS2008</MenuItem>
              <MenuItem value="class4">IoT and Embedded systems - CS2009</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {selectedClass ? `${students.length} students enrolled` : ''}
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Roll Number</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.name}</TableCell>
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
          >
            Save Attendance
          </Button>
        </Box>
      </Paper>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onClose={handleImportDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Import Students</DialogTitle>
        <DialogContent>
          {!showMappingStep ? (
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
          ) : (
            // Step 2: Column Mapping
            <Box sx={{ p: 1 }}>
              <Typography variant="body1" paragraph>
                Map your Excel columns to the required fields. At minimum, please specify which columns contain the student's name and roll number.
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="name-column-label">Name Column *</InputLabel>
                    <Select
                      labelId="name-column-label"
                      value={columnMappings.name}
                      onChange={(e) => handleColumnMappingChange('name', e.target.value)}
                      label="Name Column *"
                      required
                    >
                      <MenuItem value="" disabled><em>Select column</em></MenuItem>
                      {availableColumns.map(col => (
                        <MenuItem key={col} value={col}>{col}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="roll-column-label">Roll Number Column *</InputLabel>
                    <Select
                      labelId="roll-column-label"
                      value={columnMappings.rollNumber}
                      onChange={(e) => handleColumnMappingChange('rollNumber', e.target.value)}
                      label="Roll Number Column *"
                      required
                    >
                      <MenuItem value="" disabled><em>Select column</em></MenuItem>
                      {availableColumns.map(col => (
                        <MenuItem key={col} value={col}>{col}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="id-column-label">ID Column (Optional)</InputLabel>
                    <Select
                      labelId="id-column-label"
                      value={columnMappings.id}
                      onChange={(e) => handleColumnMappingChange('id', e.target.value)}
                      label="ID Column (Optional)"
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {availableColumns.map(col => (
                        <MenuItem key={col} value={col}>{col}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="discipline-column-label">Department/Discipline (Optional)</InputLabel>
                    <Select
                      labelId="discipline-column-label"
                      value={columnMappings.discipline || ''}
                      onChange={(e) => handleColumnMappingChange('discipline', e.target.value)}
                      label="Department/Discipline (Optional)"
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {availableColumns.map(col => (
                        <MenuItem key={col} value={col}>{col}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={applyColumnMappings}
                  startIcon={<Check />}
                  disabled={!columnMappings.name || !columnMappings.rollNumber}
                >
                  Apply Mappings
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {importError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {importError}
                </Alert>
              )}
              
              {/* Preview of raw data */}
              {rawExcelData.length > 0 && !importedData.length && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">
                    Raw Data Preview
                  </Typography>
                  <TableContainer sx={{ maxHeight: 200, mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {availableColumns.slice(0, 5).map(col => (
                            <TableCell key={col}>{col}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rawExcelData.slice(0, 3).map((row, idx) => (
                          <TableRow key={idx}>
                            {availableColumns.slice(0, 5).map(col => (
                              <TableCell key={col}>{row[col]?.toString() || ''}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              
              {/* Preview of mapped data */}
              {importedData.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">
                    Preview: {importedData.length} students mapped
                  </Typography>
                  <TableContainer sx={{ maxHeight: 200, mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Roll Number</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Discipline</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importedData.slice(0, 5).map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>{student.id}</TableCell>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.discipline}</TableCell>
                            <TableCell>{student.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {importedData.length > 5 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Showing 5 of {importedData.length} records
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDialogClose}>Cancel</Button>
          {showMappingStep && !importedData.length && (
            <Button 
              onClick={() => setShowMappingStep(false)}
              color="secondary"
            >
              Back to Upload
            </Button>
          )}
          {importedData.length > 0 && (
            <Button 
              onClick={handleImportStudents}
              color="primary"
              variant="contained"
            >
              Import Students
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar 
        open={importSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Students successfully imported!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManageAttendance; 