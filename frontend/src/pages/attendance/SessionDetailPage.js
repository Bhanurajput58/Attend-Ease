import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useHasRole } from '../../components/RoleBasedAccess';
import { BarChart, PieChart, LineChart } from '../../components/charts';

const SessionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFacultyOrAdmin = useHasRole(['faculty', 'admin']);
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [timeStats, setTimeStats] = useState(null);

  // Mock data for a session
  const mockSessionData = {
    id: 101,
    date: '2023-11-10',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    topic: 'Object-Oriented Programming: Inheritance',
    course: {
      id: 'CS101',
      name: 'Computer Science 101',
      faculty: 'Dr. Alan Turing',
      facultyId: 'FAC1001'
    },
    attendance: {
      total: 45,
      present: 42,
      absent: 2,
      late: 1,
      rate: 94
    },
    students: [
      { id: 1, name: 'John Doe', studentId: 'S2312345', status: 'present', time: '09:05 AM', notes: '' },
      { id: 2, name: 'Jane Smith', studentId: 'S2312346', status: 'present', time: '09:02 AM', notes: '' },
      { id: 3, name: 'Bob Johnson', studentId: 'S2312347', status: 'absent', time: '-', notes: 'Informed about illness' },
      { id: 4, name: 'Alice Williams', studentId: 'S2312348', status: 'late', time: '09:25 AM', notes: 'Traffic delay' },
      { id: 5, name: 'Charlie Brown', studentId: 'S2312349', status: 'present', time: '09:01 AM', notes: '' },
      { id: 6, name: 'David Wilson', studentId: 'S2312350', status: 'absent', time: '-', notes: 'No notification' },
      { id: 7, name: 'Eva Martinez', studentId: 'S2312351', status: 'present', time: '09:04 AM', notes: '' }
      // More students would be here in a real scenario
    ],
    notes: 'Covered inheritance concepts, method overriding, and polymorphism. Students engaged well with the practical examples.',
    createdBy: 'Dr. Alan Turing',
    createdAt: '2023-11-10T10:35:00',
    lastModified: '2023-11-10T11:45:00'
  };

  // Mock comparison data for this session vs. previous sessions
  const mockComparisonData = {
    previous5Sessions: [
      { date: '2023-11-06', rate: 89, topic: 'File I/O and Exception Handling' },
      { date: '2023-11-03', rate: 78, topic: 'Dictionaries and JSON' },
      { date: '2023-11-01', rate: 93, topic: 'Lists and Tuples' },
      { date: '2023-10-30', rate: 91, topic: 'Functions and Modules' },
      { date: '2023-10-27', rate: 88, topic: 'Control Structures' }
    ],
    averageRate: 87.8,
    trend: 'increasing'
  };

  // Mock time analysis data
  const mockTimeStats = {
    earliestArrival: '08:50 AM',
    latestArrival: '09:25 AM',
    averageArrivalTime: '09:04 AM',
    timeDistribution: [
      { timeRange: '08:50-09:00', count: 5 },
      { timeRange: '09:00-09:05', count: 30 },
      { timeRange: '09:05-09:10', count: 5 },
      { timeRange: '09:10-09:15', count: 2 },
      { timeRange: '09:15-09:25', count: 1 }
    ]
  };

  useEffect(() => {
    // Simulate API call to fetch session data
    setTimeout(() => {
      setSessionData(mockSessionData);
      setComparisonData(mockComparisonData);
      setTimeStats(mockTimeStats);
      setLoading(false);
    }, 1000);
  }, [id]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'present': return 'status-present';
      case 'absent': return 'status-absent';
      case 'late': return 'status-late';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!isFacultyOrAdmin) {
    return (
      <div className="page-container">
        <div className="unauthorized-message">
          <h2>Access Denied</h2>
          <p>Only faculty and administrators can view detailed session analytics.</p>
          <button className="back-button" onClick={() => navigate('/attendance')}>
            Back to Attendance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">{sessionData.course.name}</h1>
          <p className="page-subtitle">Session: {formatDate(sessionData.date)}</p>
        </div>
        
        <div className="page-actions">
          <Link to={`/attendance/edit/${sessionData.id}`} className="edit-button">
            Edit Session
          </Link>
          <button className="print-button" onClick={() => window.print()}>
            Print / Export
          </button>
          <button className="back-button" onClick={() => navigate('/attendance')}>
            Back to List
          </button>
        </div>
      </div>
      
      <div className="session-details-grid">
        <div className="detail-card session-info-card">
          <h3>Session Information</h3>
          <div className="info-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Topic:</span>
                <span className="info-value">{sessionData.topic}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date:</span>
                <span className="info-value">{formatDate(sessionData.date)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Time:</span>
                <span className="info-value">{sessionData.startTime} - {sessionData.endTime}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Faculty:</span>
                <span className="info-value">{sessionData.course.faculty}</span>
              </div>
            </div>
            <div className="session-notes">
              <h4>Session Notes</h4>
              <p>{sessionData.notes}</p>
            </div>
          </div>
        </div>
        
        <div className="detail-card attendance-summary-card">
          <h3>Attendance Summary</h3>
          <div className="attendance-summary">
            <div className="attendance-stats">
              <div className="attendance-stat-item">
                <span className="stat-value">{sessionData.attendance.rate}%</span>
                <span className="stat-label">Attendance Rate</span>
              </div>
              <div className="attendance-stat-details">
                <div className="stat-detail present">
                  <span className="detail-count">{sessionData.attendance.present}</span>
                  <span className="detail-label">Present</span>
                </div>
                <div className="stat-detail absent">
                  <span className="detail-count">{sessionData.attendance.absent}</span>
                  <span className="detail-label">Absent</span>
                </div>
                <div className="stat-detail late">
                  <span className="detail-count">{sessionData.attendance.late}</span>
                  <span className="detail-label">Late</span>
                </div>
              </div>
            </div>
            <div className="attendance-chart">
              <PieChart 
                data={[
                  { label: 'Present', value: sessionData.attendance.present, color: '#4CAF50' },
                  { label: 'Absent', value: sessionData.attendance.absent, color: '#F44336' },
                  { label: 'Late', value: sessionData.attendance.late, color: '#FF9800' }
                ]}
                size={180}
                showPercentage={true}
              />
            </div>
          </div>
        </div>
        
        <div className="detail-card trend-card">
          <h3>Attendance Trend</h3>
          <div className="trend-content">
            <div className="trend-info">
              <div className="trend-stat">
                <span className="stat-label">Session vs Average:</span>
                <span className="stat-value">
                  {sessionData.attendance.rate > comparisonData.averageRate ? (
                    <span className="positive">+{(sessionData.attendance.rate - comparisonData.averageRate).toFixed(1)}%</span>
                  ) : (
                    <span className="negative">-{(comparisonData.averageRate - sessionData.attendance.rate).toFixed(1)}%</span>
                  )}
                </span>
              </div>
              <div className="trend-stat">
                <span className="stat-label">5-Session Average:</span>
                <span className="stat-value">{comparisonData.averageRate.toFixed(1)}%</span>
              </div>
              <div className="trend-stat">
                <span className="stat-label">Trend:</span>
                <span className="stat-value">
                  {comparisonData.trend === 'increasing' ? '↗ Increasing' : 
                   comparisonData.trend === 'decreasing' ? '↘ Decreasing' : '→ Stable'}
                </span>
              </div>
            </div>
            <div className="trend-chart">
              <LineChart 
                data={[
                  ...comparisonData.previous5Sessions.map(session => ({
                    label: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    value: session.rate
                  })),
                  {
                    label: 'Current',
                    value: sessionData.attendance.rate,
                    color: '#2196F3',
                    emphasis: true
                  }
                ]}
                height={200}
                lineColor="#3498db"
                showArea={true}
                valueFormatter={value => `${value}%`}
              />
            </div>
          </div>
        </div>
        
        <div className="detail-card time-analysis-card">
          <h3>Arrival Time Analysis</h3>
          <div className="time-analysis-content">
            <div className="time-stats">
              <div className="time-stat-item">
                <span className="stat-label">Earliest:</span>
                <span className="stat-value">{timeStats.earliestArrival}</span>
              </div>
              <div className="time-stat-item">
                <span className="stat-label">Latest:</span>
                <span className="stat-value">{timeStats.latestArrival}</span>
              </div>
              <div className="time-stat-item">
                <span className="stat-label">Average:</span>
                <span className="stat-value">{timeStats.averageArrivalTime}</span>
              </div>
            </div>
            <div className="time-distribution-chart">
              <BarChart 
                data={timeStats.timeDistribution.map(item => ({
                  label: item.timeRange,
                  value: item.count,
                  color: '#9C27B0'
                }))}
                height={180}
                showValues={true}
                valueFormatter={value => `${value}`}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="student-list-section">
        <h3>Student Attendance List</h3>
        <div className="table-container">
          <table className="session-detail-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Check-in Time</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessionData.students.map(student => (
                <tr key={student.id}>
                  <td>{student.studentId}</td>
                  <td>{student.name}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(student.status)}`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td>{student.time}</td>
                  <td className="notes-cell">{student.notes || 'No notes'}</td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/student/profile/${student.id}`} 
                        className="action-btn view-btn"
                      >
                        View Profile
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="metadata-footer">
        <p>Created by: {sessionData.createdBy} on {new Date(sessionData.createdAt).toLocaleString()}</p>
        <p>Last modified: {new Date(sessionData.lastModified).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default SessionDetailPage; 