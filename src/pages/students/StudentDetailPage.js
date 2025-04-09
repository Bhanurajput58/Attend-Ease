import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { PieChart, BarChart } from '../../components/charts';
import { useHasRole } from '../../components/RoleBasedAccess';
import '../../styles/DashboardPage.css';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);
  
  // Check if user is faculty or admin
  const isFacultyOrAdmin = useHasRole(['faculty', 'admin']);
  const isStudent = useHasRole(['student']);
  
  // Mock data for now - will be replaced with API call
  const mockStudentDetails = {
    id: id,
    studentId: 'S2312345',
    rollNumber: 'CS20B001',
    name: 'John Doe',
    email: 'john.doe@example.edu',
    department: 'Computer Science',
    discipline: 'B.Tech',
    semester: '6th',
    contactNumber: '+91-9876543210',
    dateOfBirth: '2001-05-15',
    address: '123 Student Housing, University Campus',
    guardianName: 'Robert Doe',
    guardianContact: '+91-9876543211',
    courses: [
      {
        id: 'CS101',
        name: 'Introduction to Computer Science',
        faculty: 'Dr. Alan Turing',
        attendanceStats: {
          total: 25,
          present: 22,
          absent: 2,
          late: 1,
          attendanceRate: 88
        },
        attendanceHistory: [
          { date: '2023-10-15', status: 'present', topic: 'Introduction to Algorithms' },
          { date: '2023-10-12', status: 'present', topic: 'Data Types' },
          { date: '2023-10-08', status: 'present', topic: 'Control Structures' },
          { date: '2023-10-05', status: 'absent', topic: 'Functions and Modules' },
          { date: '2023-10-01', status: 'present', topic: 'Error Handling' }
        ]
      },
      {
        id: 'CS201',
        name: 'Data Structures',
        faculty: 'Dr. Jane Smith',
        attendanceStats: {
          total: 20,
          present: 18,
          absent: 1,
          late: 1,
          attendanceRate: 90
        },
        attendanceHistory: [
          { date: '2023-10-16', status: 'present', topic: 'Arrays and Linked Lists' },
          { date: '2023-10-13', status: 'present', topic: 'Stacks and Queues' },
          { date: '2023-10-09', status: 'late', topic: 'Trees' },
          { date: '2023-10-06', status: 'present', topic: 'Graphs' },
          { date: '2023-10-02', status: 'absent', topic: 'Hash Tables' }
        ]
      },
      {
        id: 'CS301',
        name: 'Database Systems',
        faculty: 'Dr. Michael Johnson',
        attendanceStats: {
          total: 18,
          present: 15,
          absent: 3,
          late: 0,
          attendanceRate: 83
        },
        attendanceHistory: [
          { date: '2023-10-14', status: 'present', topic: 'ER Modeling' },
          { date: '2023-10-11', status: 'present', topic: 'Relational Algebra' },
          { date: '2023-10-07', status: 'absent', topic: 'SQL Basics' },
          { date: '2023-10-04', status: 'present', topic: 'Normalization' },
          { date: '2023-10-03', status: 'absent', topic: 'Transaction Processing' }
        ]
      }
    ],
    overallAttendance: 87
  };

  // Fetch student data
  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isFacultyOrAdmin || (isStudent && user.id === id)) {
        try {
          console.log(`Fetching student data for ID: ${id}`);
          const response = await axios.get(`${API_ENDPOINTS.GET_USER_BY_ID(id)}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true
          });
          
          if (response.data && response.data.success) {
            // Fetch the full name if not already included
            if (!response.data.data.fullName) {
              try {
                const nameResponse = await axios.get(`${API_ENDPOINTS.GET_USER_NAME(id)}`, {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  withCredentials: true
                });
                
                if (nameResponse.data && nameResponse.data.success) {
                  response.data.data.fullName = nameResponse.data.name;
                }
              } catch (nameError) {
                console.error('Error fetching name:', nameError);
              }
            }
            
            setStudentData(response.data.data);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.error('Error fetching student data from API:', apiError);
          // Fall back to mock data if API fails
        }
      }
      
      // If API call fails or user doesn't have permission, use mock data
      console.warn('Using mock data as API call failed or user lacks permission');
      setStudentData(mockStudentDetails);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load student data. Please try again.');
      setLoading(false);
    }
  }, [id, isFacultyOrAdmin, isStudent, user]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

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
          <p>Loading student details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="page-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="back-button" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isFacultyOrAdmin && !(isStudent && user.id === id)) {
    return (
      <div className="page-container">
        <div className="unauthorized-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to view this student's details.</p>
          <button className="back-button" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Student Profile</h1>
          <p className="page-subtitle">{studentData.fullName || studentData.name} ({studentData.rollNumber})</p>
        </div>
        
        <div className="page-actions">
          {isFacultyOrAdmin && (
            <Link to={`/students/edit/${studentData.id}`} className="edit-button">
              Edit Profile
            </Link>
          )}
          <button className="back-button" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
      
      <div className="student-detail-container">
        <div className="student-profile-card">
          <h3>Personal Information</h3>
          <div className="profile-details">
            <div className="profile-item">
              <span className="profile-label">ID:</span>
              <span className="profile-value">{studentData.studentId}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Roll Number:</span>
              <span className="profile-value">{studentData.rollNumber}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{studentData.email}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Department:</span>
              <span className="profile-value">{studentData.department}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Discipline:</span>
              <span className="profile-value">{studentData.discipline}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Semester:</span>
              <span className="profile-value">{studentData.semester}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Contact:</span>
              <span className="profile-value">{studentData.contactNumber}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Date of Birth:</span>
              <span className="profile-value">{formatDate(studentData.dateOfBirth)}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Address:</span>
              <span className="profile-value">{studentData.address}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Guardian:</span>
              <span className="profile-value">{studentData.guardianName}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Guardian Contact:</span>
              <span className="profile-value">{studentData.guardianContact}</span>
            </div>
          </div>
        </div>
        
        <div className="student-stats-card">
          <h3>Overall Attendance</h3>
          <div className="stats-content">
            <div className="overall-attendance">
              <div className="attendance-percentage">{studentData.overallAttendance}%</div>
              <div className="attendance-label">Overall Attendance</div>
            </div>
            
            <div className="course-chart">
              <BarChart 
                data={studentData.courses.map(course => ({
                  label: course.name.split(' ')[0],
                  value: course.attendanceStats.attendanceRate,
                  color: course.attendanceStats.attendanceRate >= 90 ? '#4CAF50' : 
                        course.attendanceStats.attendanceRate >= 80 ? '#2196F3' : 
                        course.attendanceStats.attendanceRate >= 70 ? '#FF9800' : '#F44336'
                }))}
                height={200}
                showValues={true}
                valueFormatter={value => `${value}%`}
              />
            </div>
          </div>
        </div>
        
        <h3>Course Attendance Details</h3>
        <div className="course-attendance-cards">
          {studentData.courses.map(course => (
            <div key={course.id} className="course-attendance-card">
              <div className="course-header">
                <h3>{course.name}</h3>
                <div className="course-meta">
                  <div className="faculty">Faculty: {course.faculty}</div>
                  <div className="attendance-badge" style={{
                    backgroundColor: course.attendanceStats.attendanceRate >= 90 ? '#4CAF50' : 
                                    course.attendanceStats.attendanceRate >= 80 ? '#2196F3' : 
                                    course.attendanceStats.attendanceRate >= 70 ? '#FF9800' : '#F44336'
                  }}>
                    {course.attendanceStats.attendanceRate}% Attendance
                  </div>
                </div>
              </div>
              
              <div className="attendance-stats">
                <div className="stats-chart">
                  <PieChart 
                    data={[
                      { label: 'Present', value: course.attendanceStats.present, color: '#4CAF50' },
                      { label: 'Absent', value: course.attendanceStats.absent, color: '#F44336' },
                      { label: 'Late', value: course.attendanceStats.late, color: '#FF9800' }
                    ]}
                    size={150}
                    showPercentage={true}
                  />
                </div>
                <div className="attendance-counts">
                  <div className="count-item">
                    <span className="count">{course.attendanceStats.present}</span>
                    <span className="label">Present</span>
                  </div>
                  <div className="count-item">
                    <span className="count">{course.attendanceStats.absent}</span>
                    <span className="label">Absent</span>
                  </div>
                  <div className="count-item">
                    <span className="count">{course.attendanceStats.late}</span>
                    <span className="label">Late</span>
                  </div>
                  <div className="count-item">
                    <span className="count">{course.attendanceStats.total}</span>
                    <span className="label">Total</span>
                  </div>
                </div>
              </div>
              
              <div className="session-list">
                <h4>Recent Attendance History</h4>
                <div className="session-items">
                  {course.attendanceHistory.map((session, index) => (
                    <div key={index} className="session-item">
                      <div className="session-date">{formatDate(session.date)}</div>
                      <div className="session-topic">{session.topic}</div>
                      <div className={`session-status ${getStatusClass(session.status)}`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="card-actions">
                <Link to={`/courses/${course.id}`} className="view-button">
                  View Course Details
                </Link>
                <Link to={`/courses/${course.id}/attendance/${studentData.id}`} className="view-button">
                  Full Attendance History
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPage; 