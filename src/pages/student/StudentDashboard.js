import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import '../../styles/DashboardPage.css';
import { LineChart, BarChart, PieChart } from '../../components/charts';

const StudentDashboard = () => {
  // State for absence request dialog
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [absenceRequest, setAbsenceRequest] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    courseId: ''
  });
  
  // State for analytics tab
  const [analyticsTab, setAnalyticsTab] = useState(0);
  
  // Sample data - in a real app, this would come from API calls
  const attendanceData = {
    overall: 85,
    courses: [
      { name: 'Mathematics', attendance: 90, warning: false },
      { name: 'Physics', attendance: 75, warning: true },
      { name: 'Chemistry', attendance: 95, warning: false },
      { name: 'Computer Science', attendance: 88, warning: false },
      { name: 'English', attendance: 65, warning: true }
    ],
    history: [
      { date: '2024-03-15', course: 'Mathematics', status: 'present', remarks: 'On time' },
      { date: '2024-03-14', course: 'Physics', status: 'absent', remarks: 'Medical leave' },
      { date: '2024-03-13', course: 'Chemistry', status: 'present', remarks: 'On time' }
    ],
    analytics: {
      monthly: [
        { month: 'Jan', attendance: 80 },
        { month: 'Feb', attendance: 85 },
        { month: 'Mar', attendance: 75 },
        { month: 'Apr', attendance: 90 }
      ],
      courseComparison: [
        { name: 'Mathematics', attendance: 90 },
        { name: 'Physics', attendance: 75 },
        { name: 'Chemistry', attendance: 95 },
        { name: 'Computer Science', attendance: 88 },
        { name: 'English', attendance: 65 }
      ],
      distribution: [
        { name: 'Present', value: 85 },
        { name: 'Absent', value: 10 },
        { name: 'Excused', value: 5 }
      ]
    }
  };
  
  const notifications = [
    { id: 1, title: 'Attendance Alert', message: 'Your Physics attendance is below 75%', date: '2024-03-18' },
    { id: 2, title: 'Course Update', message: 'New study materials uploaded for Mathematics', date: '2024-03-17' },
    { id: 3, title: 'Faculty Announcement', message: 'Chemistry class rescheduled to 2PM tomorrow', date: '2024-03-16' }
  ];
  
  const assignments = [
    { id: 1, course: 'Mathematics', title: 'Complex Numbers Assignment', deadline: '2024-03-25', submitted: false },
    { id: 2, course: 'Physics', title: 'Mechanics Lab Report', deadline: '2024-03-22', submitted: true },
    { id: 3, course: 'Chemistry', title: 'Periodic Table Quiz', deadline: '2024-03-30', submitted: false }
  ];
  
  const timetable = [
    { day: 'Monday', courses: [
      { name: 'Mathematics', time: '09:00 - 10:30', room: 'A101' },
      { name: 'Physics', time: '11:00 - 12:30', room: 'B202' }
    ]},
    { day: 'Tuesday', courses: [
      { name: 'Chemistry', time: '09:00 - 10:30', room: 'C303' },
      { name: 'Computer Science', time: '11:00 - 12:30', room: 'D404' }
    ]},
    { day: 'Wednesday', courses: [
      { name: 'English', time: '09:00 - 10:30', room: 'E505' },
      { name: 'Mathematics', time: '11:00 - 12:30', room: 'A101' }
    ]}
  ];
  
  const classMaterials = [
    { course: 'Mathematics', title: 'Calculus Handbook', type: 'PDF', date: '2024-03-10' },
    { course: 'Physics', title: 'Mechanics Formulas', type: 'DOCX', date: '2024-03-12' },
    { course: 'Chemistry', title: 'Lab Safety Guidelines', type: 'PDF', date: '2024-03-15' }
  ];
  
  const academicPerformance = [
    { course: 'Mathematics', attendance: 90, grade: 'A', cgpa: 3.7 },
    { course: 'Physics', attendance: 75, grade: 'B', cgpa: 3.0 },
    { course: 'Chemistry', attendance: 95, grade: 'A+', cgpa: 4.0 },
    { course: 'Computer Science', attendance: 88, grade: 'A-', cgpa: 3.5 },
    { course: 'English', attendance: 65, grade: 'C+', cgpa: 2.3 }
  ];
  
  // Personal goals
  const [attendanceGoal, setAttendanceGoal] = useState(90);
  
  // Handle absence request dialog
  const handleOpenRequestDialog = () => {
    setOpenRequestDialog(true);
  };
  
  const handleCloseRequestDialog = () => {
    setOpenRequestDialog(false);
  };
  
  const handleAbsenceRequestChange = (e) => {
    setAbsenceRequest({
      ...absenceRequest,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmitAbsenceRequest = () => {
    // Here you would submit the request to the backend
    console.log('Submitting absence request:', absenceRequest);
    handleCloseRequestDialog();
    // In a real app, you would show a success message and update the UI
  };
  
  // Handle analytics tab change
  const handleAnalyticsTabChange = (event, newValue) => {
    setAnalyticsTab(newValue);
  };
  
  // Handle export report
  const handleExportReport = () => {
    // In a real app, this would generate and download a PDF/Excel file
    console.log('Exporting attendance report');
    alert('Report downloaded successfully!');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography variant="h4" component="h1" gutterBottom>
                Student Dashboard
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Welcome to your attendance management portal
              </Typography>
            </div>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleOpenRequestDialog}
                startIcon={<CalendarMonthIcon />}
              >
                Request Absence
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleExportReport}
                startIcon={<FileDownloadIcon />}
              >
                Export Report
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Attendance Overview Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Attendance Overview
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {attendanceData.overall}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall attendance rate
                  </Typography>
                  
                  {/* Attendance Warnings/Alerts */}
                  {attendanceData.courses.some(course => course.warning) && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        You have low attendance in some courses!
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Recent Attendance Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Attendance
                  </Typography>
                  <Typography variant="body1">
                    Last marked: 2 days ago
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Next class: Tomorrow
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Personalized Goals Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmojiEventsIcon sx={{ mr: 1 }} /> Attendance Goal
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" color={attendanceData.overall >= attendanceGoal ? "success.main" : "error.main"} sx={{ mr: 2 }}>
                      {attendanceGoal}%
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2">Your goal</Typography>
                      <Typography variant="body2" color={attendanceData.overall >= attendanceGoal ? "success.main" : "error.main"}>
                        {attendanceData.overall >= attendanceGoal 
                          ? `Congratulations! You're above your goal.` 
                          : `${attendanceGoal - attendanceData.overall}% to reach your goal`}
                      </Typography>
                    </Box>
                  </Box>
                  <TextField
                    label="Set New Goal (%)"
                    type="number"
                    size="small"
                    value={attendanceGoal}
                    onChange={(e) => setAttendanceGoal(Number(e.target.value))}
                    inputProps={{ min: 0, max: 100 }}
                    fullWidth
                  />
                </Box>
              </Paper>
            </Grid>
            
            {/* Notifications Center */}
            <Grid item xs={12} md={6}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsIcon sx={{ mr: 1 }} /> Notifications
                  </Typography>
                  <List>
                    {notifications.map(notification => (
                      <ListItem key={notification.id} divider>
                        <ListItemText
                          primary={notification.title}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">{notification.message}</Typography>
                              <Typography variant="caption" component="p" color="text.secondary">{notification.date}</Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Paper>
            </Grid>
            
            {/* Assignment Tracker */}
            <Grid item xs={12} md={6}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssignmentIcon sx={{ mr: 1 }} /> Assignment Tracker
                  </Typography>
                  <List>
                    {assignments.map(assignment => (
                      <ListItem key={assignment.id} divider>
                        <ListItemText
                          primary={`${assignment.title} (${assignment.course})`}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                Due: {assignment.deadline}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                component="p" 
                                color={assignment.submitted ? "success.main" : "error.main"}
                              >
                                {assignment.submitted ? "Submitted" : "Not Submitted"}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Paper>
            </Grid>
            
            {/* Course Schedule/Timetable */}
            <Grid item xs={12}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Weekly Schedule
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Course</th>
                          <th>Time</th>
                          <th>Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetable.flatMap((day, idx) => 
                          day.courses.map((course, courseIdx) => (
                            <tr key={`${idx}-${courseIdx}`}>
                              {courseIdx === 0 && <td rowSpan={day.courses.length}>{day.day}</td>}
                              <td>{course.name}</td>
                              <td>{course.time}</td>
                              <td>{course.room}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Attendance Analytics */}
            <Grid item xs={12}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Attendance Analytics
                  </Typography>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={analyticsTab} onChange={handleAnalyticsTabChange}>
                      <Tab label="Monthly Trend" />
                      <Tab label="Course Comparison" />
                      <Tab label="Attendance Distribution" />
                    </Tabs>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    {analyticsTab === 0 && (
                      <LineChart
                        data={attendanceData.analytics.monthly.map(item => ({
                          label: item.month,
                          value: item.attendance
                        }))}
                        title="Monthly Attendance Trend"
                        xLabel="Month"
                        yLabel="Attendance %"
                        showPoints
                        showArea
                        lineColor="#3f51b5"
                      />
                    )}
                    {analyticsTab === 1 && (
                      <BarChart
                        data={attendanceData.analytics.courseComparison.map(item => ({
                          label: item.name,
                          value: item.attendance,
                          color: item.attendance < 75 ? '#f44336' : '#4caf50'
                        }))}
                        title="Attendance by Course"
                        xLabel="Course"
                        yLabel="Attendance %"
                        showValues
                        valueFormatter={val => `${val}%`}
                      />
                    )}
                    {analyticsTab === 2 && (
                      <PieChart
                        data={attendanceData.analytics.distribution.map(item => ({
                          label: item.name,
                          value: item.value
                        }))}
                        title="Attendance Distribution"
                        showPercentage
                        size={250}
                      />
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Academic Performance Section */}
            <Grid item xs={12}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Academic Performance
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Attendance (%)</th>
                          <th>Grade</th>
                          <th>CGPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {academicPerformance.map((course, idx) => (
                          <tr key={idx}>
                            <td>{course.course}</td>
                            <td>
                              <span className={`status ${course.attendance < 75 ? 'absent' : 'present'}`}>
                                {course.attendance}%
                              </span>
                            </td>
                            <td>{course.grade}</td>
                            <td>{course.cgpa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Class Materials/Resources Section */}
            <Grid item xs={12}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Class Materials & Resources
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classMaterials.map((material, idx) => (
                          <tr key={idx}>
                            <td>{material.course}</td>
                            <td>{material.title}</td>
                            <td>{material.type}</td>
                            <td>{material.date}</td>
                            <td>
                              <Button size="small" variant="outlined">
                                Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Attendance History Table */}
            <Grid item xs={12}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Attendance History
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Course</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.history.map((record, idx) => (
                          <tr key={idx}>
                            <td>{record.date}</td>
                            <td>{record.course}</td>
                            <td>
                              <span className={`status ${record.status}`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td>{record.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
        
        {/* Absence Request Dialog */}
        <Dialog open={openRequestDialog} onClose={handleCloseRequestDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Request Absence</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Start Date"
                type="date"
                name="startDate"
                value={absenceRequest.startDate}
                onChange={handleAbsenceRequestChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End Date"
                type="date"
                name="endDate"
                value={absenceRequest.endDate}
                onChange={handleAbsenceRequestChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Course"
                select
                name="courseId"
                value={absenceRequest.courseId}
                onChange={handleAbsenceRequestChange}
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="">Select a course</option>
                {attendanceData.courses.map((course, idx) => (
                  <option key={idx} value={idx}>{course.name}</option>
                ))}
              </TextField>
              <TextField
                label="Reason for Absence"
                multiline
                rows={4}
                name="reason"
                value={absenceRequest.reason}
                onChange={handleAbsenceRequestChange}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRequestDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmitAbsenceRequest} 
              variant="contained" 
              color="primary"
              disabled={!absenceRequest.startDate || !absenceRequest.reason || !absenceRequest.courseId}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentDashboard; 