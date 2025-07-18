import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  CircularProgress,
  Alert,
  Fade,
  Grow
} from '@mui/material';
import { 
  People as PeopleIcon, 
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import './AdminDashboardPage.css';

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
        axios.get(API_ENDPOINTS.GET_ALL_USERS, { withCredentials: true }),
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

  const StatCard = ({ title, value, subtitle, icon: Icon, color, delay = 0 }) => (
    <Grow in={!loading} timeout={800} style={{ transitionDelay: `${delay}ms` }}>
      <Paper 
        className="dashboard-card"
        sx={{
          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
          border: `1px solid ${color}20`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
          }
        }}
      >
        <Box sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                border: `2px solid ${color}30`,
              }}
            >
              <Icon sx={{ fontSize: 28, color: color }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '1.1rem'
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  mt: 0.5
                }}
              >
                {subtitle}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            {loading ? (
              <CircularProgress 
                size={32} 
                sx={{ color: color }}
              />
            ) : (
              <Fade in={!loading} timeout={1000}>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 700,
                    color: color,
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                  }}
                >
                  {value.toLocaleString()}
                </Typography>
              </Fade>
            )}
            <TrendingUpIcon 
              sx={{ 
                color: '#10b981', 
                fontSize: 20,
                opacity: loading ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }} 
            />
          </Box>
          
          {!loading && (
            <Box 
              sx={{ 
                mt: 2,
                p: 1.5,
                borderRadius: '8px',
                background: `${color}08`,
                border: `1px solid ${color}15`
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#4b5563',
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                System Status: <span style={{ color: '#10b981' }}>Active</span>
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Grow>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <Container maxWidth="lg">
          <Fade in timeout={600}>
            <Box sx={{ mt: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon 
                  sx={{ 
                    fontSize: 40, 
                    color: '#3b82f6', 
                    mr: 2,
                    background: 'linear-gradient(135deg, #3b82f615 0%, #3b82f608 100%)',
                    padding: '8px',
                    borderRadius: '12px',
                    border: '2px solid #3b82f620'
                  }} 
                />
                <Box>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#1f2937',
                      fontSize: '2.5rem',
                      lineHeight: 1.2,
                      mb: 1
                    }}
                  >
                    Admin Dashboard
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#6b7280',
                      fontWeight: 400,
                      fontSize: '1.125rem'
                    }}
                  >
                    System overview and management controls
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>

          {error && (
            <Fade in timeout={500}>
              <Box sx={{ mb: 3 }}>
                <Alert 
                  severity="error" 
                  sx={{
                    borderRadius: '8px',
                    '& .MuiAlert-icon': {
                      fontSize: '1.5rem'
                    }
                  }}
                >
                  {error}
                </Alert>
              </Box>
            </Fade>
          )}

          <Grid container spacing={4}>
            {/* Total Users Card */}
            <Grid item xs={12} md={6}>
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                subtitle="Registered users in system"
                icon={PeopleIcon}
                color="#3b82f6"
                delay={200}
              />
            </Grid>

            {/* Active Courses Card */}
            <Grid item xs={12} md={6}>
              <StatCard
                title="Active Courses"
                value={stats.activeCourses}
                subtitle="Current semester courses"
                icon={SchoolIcon}
                color="#10b981"
                delay={400}
              />
            </Grid>
          </Grid>
        </Container>
      </div>
    </div>
  );
};

export default AdminDashboard;