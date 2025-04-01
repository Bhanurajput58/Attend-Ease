import React from 'react';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import '../../styles/DashboardPage.css';

const StudentDashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Student Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Welcome to your attendance management portal
            </Typography>
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
                    85%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall attendance rate
                  </Typography>
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

            {/* Course Progress Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Course Progress
                  </Typography>
                  <Typography variant="body1">
                    Current Semester: 3rd
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enrolled in 5 courses
                  </Typography>
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
                        <tr>
                          <td>2024-03-15</td>
                          <td>Mathematics</td>
                          <td><span className="status present">Present</span></td>
                          <td>On time</td>
                        </tr>
                        <tr>
                          <td>2024-03-14</td>
                          <td>Physics</td>
                          <td><span className="status absent">Absent</span></td>
                          <td>Medical leave</td>
                        </tr>
                        <tr>
                          <td>2024-03-13</td>
                          <td>Chemistry</td>
                          <td><span className="status present">Present</span></td>
                          <td>On time</td>
                        </tr>
                      </tbody>
                    </table>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </div>
    </div>
  );
};

export default StudentDashboard; 