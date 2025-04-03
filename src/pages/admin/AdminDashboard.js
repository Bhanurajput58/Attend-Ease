import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/DashboardPage.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [usersResponse, coursesResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.GET_USERS, { withCredentials: true }),
        axios.get(API_ENDPOINTS.GET_COURSES, { withCredentials: true })
      ]);

      if (usersResponse.data.success && coursesResponse.data.success) {
        setStats({
          totalUsers: usersResponse.data.data.length,
          activeCourses: coursesResponse.data.data.length
        });
      } else {
        setError('Failed to fetch dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Error loading dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

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

          {error && (
            <Box sx={{ mb: 3 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Total Users Card */}
            <Grid item xs={12} md={6} lg={6}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Total Users
                  </Typography>
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography variant="h3" color="primary">
                      {stats.totalUsers}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Registered users
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Active Courses Card */}
            <Grid item xs={12} md={6} lg={6}>
              <Paper className="dashboard-card">
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Active Courses
                  </Typography>
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography variant="h3" color="primary">
                      {stats.activeCourses}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Current semester courses
                  </Typography>
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