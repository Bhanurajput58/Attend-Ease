import React from 'react';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import '../../styles/DashboardPage.css';

const AdminDashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              System overview and management
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Total Users Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h3" color="primary">
                    500
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registered users
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Active Courses Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Active Courses
                  </Typography>
                  <Typography variant="h3" color="primary">
                    25
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current semester courses
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* System Status Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    System Status
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    99.9%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Recent Activity Table */}
            <Grid item xs={12}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent System Activity
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Action</th>
                          <th>User</th>
                          <th>Details</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>2024-03-15 10:30</td>
                          <td>User Registration</td>
                          <td>New Student</td>
                          <td>Computer Science</td>
                          <td><span className="status success">Completed</span></td>
                        </tr>
                        <tr>
                          <td>2024-03-15 09:15</td>
                          <td>Course Creation</td>
                          <td>Admin</td>
                          <td>New Course Added</td>
                          <td><span className="status success">Completed</span></td>
                        </tr>
                        <tr>
                          <td>2024-03-15 08:45</td>
                          <td>System Update</td>
                          <td>System</td>
                          <td>Database Backup</td>
                          <td><span className="status success">Completed</span></td>
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

export default AdminDashboard; 