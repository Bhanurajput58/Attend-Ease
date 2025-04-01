import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { BarChart, PieChart, LineChart } from '../../components/charts';
import '../../styles/DashboardPage.css';

const StatsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  
  // Mock data for user statistics
  const mockStatsData = {
    month: {
      attendanceRates: [
        { date: '2023-10-15', rate: 93 },
        { date: '2023-10-22', rate: 88 },
        { date: '2023-10-29', rate: 95 },
        { date: '2023-11-05', rate: 91 },
        { date: '2023-11-12', rate: 94 }
      ],
      coursePerformance: [
        { name: 'Computer Science 101', attendanceRate: 94, studentsCount: 45, color: '#4CAF50' },
        { name: 'Database Systems', attendanceRate: 89, studentsCount: 38, color: '#2196F3' },
        { name: 'Software Engineering', attendanceRate: 92, studentsCount: 37, color: '#FF9800' },
      ],
      timeDistribution: {
        teaching: 45,
        preparation: 25,
        grading: 15,
        administrative: 10,
        research: 5
      },
      sessionsByDayOfWeek: [
        { day: 'Monday', count: 8 },
        { day: 'Tuesday', count: 6 },
        { day: 'Wednesday', count: 8 },
        { day: 'Thursday', count: 6 },
        { day: 'Friday', count: 4 },
        { day: 'Saturday', count: 0 },
        { day: 'Sunday', count: 0 }
      ],
      studentPerformance: {
        excellent: 32,
        good: 35,
        average: 21,
        poor: 12
      },
      totalSessions: 32,
      averageAttendance: 91.2,
      studentsSupervised: 120
    },
    semester: {
      attendanceRates: [
        { date: '2023-09-01', rate: 90 },
        { date: '2023-09-15', rate: 92 },
        { date: '2023-10-01', rate: 88 },
        { date: '2023-10-15', rate: 93 },
        { date: '2023-11-01', rate: 95 },
        { date: '2023-11-15', rate: 94 }
      ],
      coursePerformance: [
        { name: 'Computer Science 101', attendanceRate: 92, studentsCount: 45, color: '#4CAF50' },
        { name: 'Database Systems', attendanceRate: 88, studentsCount: 38, color: '#2196F3' },
        { name: 'Software Engineering', attendanceRate: 90, studentsCount: 37, color: '#FF9800' },
        { name: 'Artificial Intelligence', attendanceRate: 94, studentsCount: 32, color: '#E91E63' }
      ],
      timeDistribution: {
        teaching: 40,
        preparation: 20,
        grading: 20,
        administrative: 15,
        research: 5
      },
      sessionsByDayOfWeek: [
        { day: 'Monday', count: 32 },
        { day: 'Tuesday', count: 24 },
        { day: 'Wednesday', count: 32 },
        { day: 'Thursday', count: 24 },
        { day: 'Friday', count: 16 },
        { day: 'Saturday', count: 0 },
        { day: 'Sunday', count: 0 }
      ],
      studentPerformance: {
        excellent: 125,
        good: 140,
        average: 85,
        poor: 48
      },
      totalSessions: 128,
      averageAttendance: 90.5,
      studentsSupervised: 152
    }
  };

  useEffect(() => {
    // Simulate API call to get statistics data
    setTimeout(() => {
      setStatsData(mockStatsData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  const currentStats = statsData[timeRange];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Performance Statistics</h1>
        
        <div className="time-range-selector">
          <button 
            className={`time-range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange('month')}
          >
            Last Month
          </button>
          <button 
            className={`time-range-btn ${timeRange === 'semester' ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange('semester')}
          >
            Semester
          </button>
        </div>
      </div>
      
      <div className="stats-overview-cards">
        <div className="stat-card">
          <div className="stat-icon sessions-icon"></div>
          <div className="stat-info">
            <h3>{currentStats.totalSessions}</h3>
            <p>Total Sessions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon attendance-icon"></div>
          <div className="stat-info">
            <h3>{currentStats.averageAttendance}%</h3>
            <p>Average Attendance</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon students-icon"></div>
          <div className="stat-info">
            <h3>{currentStats.studentsSupervised}</h3>
            <p>Students Supervised</p>
          </div>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stats-card attendance-trend-card">
          <h3>Attendance Trend</h3>
          <div className="chart-container">
            <LineChart 
              data={currentStats.attendanceRates.map(item => ({
                label: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                value: item.rate
              }))}
              height={250}
              lineColor="#3498db"
              showArea={true}
              valueFormatter={value => `${value}%`}
            />
          </div>
        </div>
        
        <div className="stats-card course-performance-card">
          <h3>Course Performance</h3>
          <div className="chart-container">
            <BarChart 
              data={currentStats.coursePerformance.map(course => ({
                label: course.name.split(' ')[0],
                value: course.attendanceRate,
                color: course.color
              }))}
              height={250}
              showValues={true}
              valueFormatter={value => `${value}%`}
            />
          </div>
        </div>
        
        <div className="stats-card time-distribution-card">
          <h3>Time Distribution</h3>
          <div className="chart-container">
            <PieChart 
              data={[
                { label: 'Teaching', value: currentStats.timeDistribution.teaching, color: '#4CAF50' },
                { label: 'Preparation', value: currentStats.timeDistribution.preparation, color: '#2196F3' },
                { label: 'Grading', value: currentStats.timeDistribution.grading, color: '#FF9800' },
                { label: 'Admin', value: currentStats.timeDistribution.administrative, color: '#9C27B0' },
                { label: 'Research', value: currentStats.timeDistribution.research, color: '#E91E63' }
              ]}
              size={220}
              showPercentage={true}
            />
          </div>
          <div className="time-legend">
            <div className="legend-item">
              <span className="color-dot" style={{ backgroundColor: '#4CAF50' }}></span>
              <span>Teaching</span>
            </div>
            <div className="legend-item">
              <span className="color-dot" style={{ backgroundColor: '#2196F3' }}></span>
              <span>Preparation</span>
            </div>
            <div className="legend-item">
              <span className="color-dot" style={{ backgroundColor: '#FF9800' }}></span>
              <span>Grading</span>
            </div>
            <div className="legend-item">
              <span className="color-dot" style={{ backgroundColor: '#9C27B0' }}></span>
              <span>Administrative</span>
            </div>
            <div className="legend-item">
              <span className="color-dot" style={{ backgroundColor: '#E91E63' }}></span>
              <span>Research</span>
            </div>
          </div>
        </div>
        
        <div className="stats-card session-days-card">
          <h3>Sessions by Day of Week</h3>
          <div className="chart-container">
            <BarChart 
              data={currentStats.sessionsByDayOfWeek.map(day => ({
                label: day.day.substring(0, 3),
                value: day.count,
                color: day.count > 0 ? '#3f51b5' : '#e0e0e0'
              }))}
              height={250}
              showValues={true}
              valueFormatter={value => `${value}`}
            />
          </div>
        </div>
        
        <div className="stats-card student-performance-card">
          <h3>Student Performance</h3>
          <div className="chart-container">
            <PieChart 
              data={[
                { label: 'Excellent', value: currentStats.studentPerformance.excellent, color: '#4CAF50' },
                { label: 'Good', value: currentStats.studentPerformance.good, color: '#2196F3' },
                { label: 'Average', value: currentStats.studentPerformance.average, color: '#FF9800' },
                { label: 'Poor', value: currentStats.studentPerformance.poor, color: '#F44336' }
              ]}
              size={220}
              showPercentage={true}
            />
          </div>
          <div className="performance-stats">
            <div className="performance-stat">
              <span className="performance-label">Excellent:</span>
              <span className="performance-value">{currentStats.studentPerformance.excellent} students</span>
            </div>
            <div className="performance-stat">
              <span className="performance-label">Good:</span>
              <span className="performance-value">{currentStats.studentPerformance.good} students</span>
            </div>
            <div className="performance-stat">
              <span className="performance-label">Average:</span>
              <span className="performance-value">{currentStats.studentPerformance.average} students</span>
            </div>
            <div className="performance-stat">
              <span className="performance-label">Poor:</span>
              <span className="performance-value">{currentStats.studentPerformance.poor} students</span>
            </div>
          </div>
        </div>
        
        <div className="stats-card course-details-card">
          <h3>Course Details</h3>
          <div className="course-stats-list">
            {currentStats.coursePerformance.map((course, index) => (
              <div key={index} className="course-stats-item">
                <div className="course-info">
                  <h4>{course.name}</h4>
                  <div className="course-meta">
                    <span>{course.studentsCount} students</span>
                    <span className="attendance-badge">{course.attendanceRate}% attendance</span>
                  </div>
                </div>
                <div className="course-progress">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${course.attendanceRate}%`,
                      backgroundColor: course.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="stats-footer">
        <p>These statistics are updated daily. Last update: {new Date().toLocaleDateString()}</p>
        <button onClick={() => navigate('/reports/generate')} className="generate-report-btn">
          Generate Detailed Report
        </button>
      </div>
    </div>
  );
};

export default StatsPage; 