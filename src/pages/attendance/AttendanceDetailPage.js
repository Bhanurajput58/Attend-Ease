import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { PieChart } from '../../components/charts';
import { useHasRole } from '../../components/RoleBasedAccess';
import '../../styles/DashboardPage.css';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

const AttendanceDetailPage = ({ mode = 'view' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);
  
  // Check if user is faculty or admin
  const isFacultyOrAdmin = useHasRole(['faculty', 'admin']);
  const isStudent = useHasRole(['student']);
  
  // Check if we're in edit mode
  const isEditMode = mode === 'edit';
  
  // Check if we're on the faculty attendance route
  const isFacultyRoute = location.pathname.includes('/faculty/attendance/');

  // Mock data for a single attendance record (faculty/admin view)
  const mockAttendanceDetail = {
    id: parseInt(id),
    date: '2023-10-15',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    course: {
      id: 'CS101',
      name: 'Computer Science 101',
      faculty: 'Dr. Alan Turing',
      facultyId: 'FAC1001'
    },
    students: [
      { id: 1, name: 'John Doe', studentId: 'S2312345', status: 'present', time: '09:05 AM', notes: '' },
      { id: 2, name: 'Jane Smith', studentId: 'S2312346', status: 'present', time: '09:02 AM', notes: '' },
      { id: 3, name: 'Bob Johnson', studentId: 'S2312347', status: 'absent', time: '-', notes: 'Informed about illness' },
      { id: 4, name: 'Alice Williams', studentId: 'S2312348', status: 'late', time: '09:25 AM', notes: 'Traffic delay' },
      { id: 5, name: 'Charlie Brown', studentId: 'S2312349', status: 'present', time: '09:01 AM', notes: '' },
      { id: 6, name: 'David Wilson', studentId: 'S2312350', status: 'absent', time: '-', notes: 'No notification' },
      { id: 7, name: 'Eva Martinez', studentId: 'S2312351', status: 'present', time: '09:04 AM', notes: '' },
      { id: 8, name: 'Frank Thomas', studentId: 'S2312352', status: 'present', time: '09:07 AM', notes: '' },
      { id: 9, name: 'Grace Lee', studentId: 'S2312353', status: 'present', time: '09:03 AM', notes: '' },
      { id: 10, name: 'Henry Clark', studentId: 'S2312354', status: 'late', time: '09:18 AM', notes: 'Bus delay' }
    ],
    createdBy: 'Dr. Alan Turing',
    createdAt: '2023-10-15T09:35:00',
    lastModified: '2023-10-15T10:45:00',
    topic: 'Introduction to Algorithms',
    notes: 'Covered basic algorithm concepts, time complexity, and big O notation. Students seemed to grasp the material well, though some struggled with complexity analysis.',
    statistics: {
      total: 10,
      present: 7,
      absent: 2,
      late: 1,
      attendanceRate: 70
    }
  };

  // Mock data for student view (their own attendance)
  const mockStudentData = {
    studentId: 'S2312345',
    name: 'John Doe',
    course: {
      id: 'CS101',
      name: 'Computer Science 101',
      faculty: 'Dr. Alan Turing'
    },
    attendance: {
      currentClass: {
        date: '2023-10-15',
        startTime: '09:00 AM',
        endTime: '10:30 AM',
        status: 'present',
        checkInTime: '09:05 AM',
        topic: 'Introduction to Algorithms',
        notes: ''
      },
      courseStats: {
        totalClasses: 20,
        attended: 19,
        absent: 1,
        late: 0,
        attendanceRate: 95
      },
      history: [
        { date: '2023-10-15', status: 'present', topic: 'Introduction to Algorithms' },
        { date: '2023-10-12', status: 'present', topic: 'Data Types in Python' },
        { date: '2023-10-08', status: 'present', topic: 'Control Structures' },
        { date: '2023-10-05', status: 'present', topic: 'Functions and Modules' },
        { date: '2023-10-01', status: 'absent', topic: 'Error Handling' }
      ]
    }
  };

  // Fetch attendance data function with useCallback
  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      
      // For both faculty route and regular attendance route, fetch the real attendance data
      if ((isFacultyRoute && isFacultyOrAdmin) || (!isFacultyRoute && isFacultyOrAdmin)) {
        try {
          console.log(`Fetching attendance data for ID: ${id}, Mode: ${mode}`);
          const response = await axios.get(`${API_ENDPOINTS.GET_ATTENDANCE_BY_ID(id)}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true
          });
          
          if (response.data && response.data.success) {
            // Calculate attendance statistics based on the fetched data
            const studentRecords = response.data.data.students || [];
            const presentCount = studentRecords.filter(student => student.status === 'present').length;
            const absentCount = studentRecords.filter(student => student.status === 'absent').length;
            const lateCount = studentRecords.filter(student => student.status === 'late').length;
            const totalCount = studentRecords.length;
            const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
            
            // Create a complete attendance record with statistics
            const fullAttendanceData = {
              ...response.data.data,
              statistics: {
                total: totalCount,
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                attendanceRate: attendanceRate
              }
            };
            
            setAttendanceData(fullAttendanceData);
            console.log("Attendance data loaded successfully:", fullAttendanceData);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.error('Error fetching attendance data from API:', apiError);
          // Fall back to mock data if API fails
        }
        
        // If API call fails, use mock data but log a warning
        console.warn('Using mock data as API call failed or returned incomplete data');
        setAttendanceData(mockAttendanceDetail);
      } else if (isStudent) {
        // For student view, try to fetch the student's own attendance data
        try {
          const response = await axios.get(`${API_ENDPOINTS.GET_STUDENT_ATTENDANCE}?classId=${id}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true
          });
          
          if (response.data && response.data.success) {
            setStudentData(response.data.data);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.error('Error fetching student attendance data from API:', apiError);
          // Fall back to mock student data
        }
        
        setStudentData(mockStudentData);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
      setLoading(false);
    }
  }, [id, isFacultyOrAdmin, isStudent, isFacultyRoute, mode]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

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
          <p>Loading attendance details...</p>
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
          <button 
            className="back-button" 
            onClick={() => isFacultyRoute ? navigate('/faculty/dashboard') : navigate('/attendance')}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Faculty/Admin View - Regular view mode
  if (isFacultyOrAdmin && attendanceData && !isEditMode) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">{attendanceData.course.name}</h1>
            <p className="page-subtitle">{formatDate(attendanceData.date)}</p>
          </div>
          
          <div className="page-actions">
            <Link to={`/attendance/edit/${attendanceData.id}`} className="edit-button">
              Edit Attendance
            </Link>
            <button className="print-button" onClick={() => window.print()}>
              Print / Export
            </button>
            <button className="export-button" onClick={() => {
              // Create CSV content
              const headers = ['Student ID', 'Roll No.', 'Name', 'Status', 'Check-in Time', 'Notes'];
              const rows = attendanceData.students.map(student => [
                student.studentId,
                student.rollNo || '',
                student.name,
                student.status,
                student.time || '',
                student.notes || ''
              ]);
              
              // Convert to CSV
              const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
              ].join('\n');
              
              // Create and download the file
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', `attendance_${attendanceData.course.id}_${attendanceData.date}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>
              Export CSV
            </button>
            <button className="back-button" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
        
        <div className="detail-container">
          <div className="detail-header">
            <div className="detail-card">
              <div className="detail-card-content">
                <div className="detail-meta">
                  <div className="meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{formatDate(attendanceData.date)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Time:</span>
                    <span className="meta-value">{attendanceData.startTime} - {attendanceData.endTime}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Faculty:</span>
                    <span className="meta-value">{attendanceData.course.faculty}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Topic:</span>
                    <span className="meta-value">{attendanceData.topic}</span>
                  </div>
                </div>
                
                <div className="divider"></div>
                
                <div className="detail-notes">
                  <h3>Session Notes</h3>
                  <p>{attendanceData.notes}</p>
                </div>
              </div>
            </div>
            
            <div className="statistics-card">
              <h3>Attendance Summary</h3>
              <div className="statistics-content">
                <div className="statistics-chart">
                  <PieChart 
                    data={[
                      { label: 'Present', value: attendanceData.statistics.present, color: '#4CAF50' },
                      { label: 'Absent', value: attendanceData.statistics.absent, color: '#F44336' },
                      { label: 'Late', value: attendanceData.statistics.late, color: '#FF9800' }
                    ]}
                    size={180}
                    showPercentage={true}
                  />
                </div>
                <div className="statistics-details">
                  <div className="stat-item">
                    <span className="stat-label">Attendance Rate:</span>
                    <span className="stat-value">{attendanceData.statistics.attendanceRate}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Present:</span>
                    <span className="stat-value present-count">{attendanceData.statistics.present}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Absent:</span>
                    <span className="stat-value absent-count">{attendanceData.statistics.absent}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Late:</span>
                    <span className="stat-value late-count">{attendanceData.statistics.late}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{attendanceData.statistics.total}</span>
                  </div>
                </div>
                <button 
                  className="refresh-button" 
                  onClick={() => {
                    setLoading(true);
                    fetchAttendanceData();
                  }}
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
          
          <div className="students-container">
            <h3>Student Attendance</h3>
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Roll No.</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Check-in Time</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.students.map(student => (
                    <tr key={student.id}>
                      <td>{student.studentId}</td>
                      <td>{student.rollNo || '-'}</td>
                      <td>{student.name}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(student.status)}`}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </td>
                      <td>{student.time || '-'}</td>
                      <td>{student.notes || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/students/${student.id}`} className="view-button">
                            View Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="7">
                      <div className="attendance-summary">
                        <span className="summary-item">
                          <strong>Total Students:</strong> {attendanceData.statistics.total}
                        </span>
                        <span className="summary-item present-count">
                          <strong>Present:</strong> {attendanceData.statistics.present}
                        </span>
                        <span className="summary-item absent-count">
                          <strong>Absent:</strong> {attendanceData.statistics.absent}
                        </span>
                        <span className="summary-item late-count">
                          <strong>Late:</strong> {attendanceData.statistics.late}
                        </span>
                        <span className="summary-item">
                          <strong>Attendance Rate:</strong> {attendanceData.statistics.attendanceRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <div className="detail-footer">
            <div className="detail-meta-info">
              <p>Created by: {attendanceData.createdBy} on {new Date(attendanceData.createdAt).toLocaleString()}</p>
              <p>Last modified: {new Date(attendanceData.lastModified).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Faculty/Admin View - Edit mode
  if (isFacultyOrAdmin && attendanceData && isEditMode) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">Edit Attendance</h1>
            <p className="page-subtitle">{attendanceData.course.name} - {formatDate(attendanceData.date)}</p>
          </div>
          
          <div className="page-actions">
            <button className="save-button">
              Save Changes
            </button>
            <button className="cancel-button" onClick={() => navigate(`/attendance/${id}`)}>
              Cancel
            </button>
          </div>
        </div>
        
        <div className="edit-attendance-container">
          <p>Edit attendance form would go here. For now, please return to the view page.</p>
          <button className="back-button" onClick={() => navigate(`/attendance/${id}`)}>
            Back to View
          </button>
        </div>
      </div>
    );
  }
  
  // Student View
  if (isStudent && studentData) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">{studentData.course.name}</h1>
            <p className="page-subtitle">Your Attendance Details</p>
          </div>
          
          <div className="page-actions">
            <button className="back-button" onClick={() => navigate('/attendance')}>
              Back to Overview
            </button>
          </div>
        </div>
        
        <div className="student-detail-container">
          <div className="current-class-card">
            <h3>Current Class: {formatDate(studentData.attendance.currentClass.date)}</h3>
            <div className="class-details">
              <div className="class-meta">
                <div className="meta-item">
                  <span className="meta-label">Topic:</span>
                  <span className="meta-value">{studentData.attendance.currentClass.topic}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Time:</span>
                  <span className="meta-value">{studentData.attendance.currentClass.startTime} - {studentData.attendance.currentClass.endTime}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Faculty:</span>
                  <span className="meta-value">{studentData.course.faculty}</span>
                </div>
              </div>
              
              <div className="class-status">
                <div className="status-container">
                  <span className="status-label">Your Status:</span>
                  <span className={`status-badge large ${getStatusClass(studentData.attendance.currentClass.status)}`}>
                    {studentData.attendance.currentClass.status.charAt(0).toUpperCase() + studentData.attendance.currentClass.status.slice(1)}
                  </span>
                </div>
                {studentData.attendance.currentClass.status !== 'absent' && (
                  <div className="checkin-time">
                    <span className="checkin-label">Check-in Time:</span>
                    <span className="checkin-value">{studentData.attendance.currentClass.checkInTime}</span>
                  </div>
                )}
                {studentData.attendance.currentClass.notes && (
                  <div className="status-notes">
                    <span className="notes-label">Notes:</span>
                    <span className="notes-value">{studentData.attendance.currentClass.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="attendance-stats-card">
            <h3>Your Attendance Statistics</h3>
            <div className="stats-content">
              <div className="stats-chart">
                <PieChart 
                  data={[
                    { label: 'Present', value: studentData.attendance.courseStats.attended, color: '#4CAF50' },
                    { label: 'Absent', value: studentData.attendance.courseStats.absent, color: '#F44336' },
                    { label: 'Late', value: studentData.attendance.courseStats.late, color: '#FF9800' }
                  ]}
                  size={180}
                  showPercentage={true}
                />
              </div>
              <div className="stats-details">
                <div className="attendance-percentage">
                  <span className="percentage-value">{studentData.attendance.courseStats.attendanceRate}%</span>
                  <span className="percentage-label">Attendance Rate</span>
                </div>
                <div className="attendance-counts">
                  <div className="count-item">
                    <span className="count-value present-count">{studentData.attendance.courseStats.attended}</span>
                    <span className="count-label">Present</span>
                  </div>
                  <div className="count-item">
                    <span className="count-value absent-count">{studentData.attendance.courseStats.absent}</span>
                    <span className="count-label">Absent</span>
                  </div>
                  <div className="count-item">
                    <span className="count-value late-count">{studentData.attendance.courseStats.late}</span>
                    <span className="count-label">Late</span>
                  </div>
                  <div className="count-item">
                    <span className="count-value">{studentData.attendance.courseStats.totalClasses}</span>
                    <span className="count-label">Total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="attendance-history-card">
            <h3>Attendance History</h3>
            <div className="history-list">
              {studentData.attendance.history.map((session, index) => (
                <div key={index} className="history-item">
                  <div className="history-date">{formatDate(session.date)}</div>
                  <div className="history-topic">{session.topic}</div>
                  <div className={`history-status ${getStatusClass(session.status)}`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="attendance-policy-card">
            <h3>Attendance Policy</h3>
            <div className="policy-content">
              <p>Attendance is mandatory for all scheduled classes. A minimum of 75% attendance is required to be eligible for examinations.</p>
              <ul>
                <li>Each class counts towards your attendance percentage.</li>
                <li>Late arrivals (more than 10 minutes) will be marked accordingly.</li>
                <li>Medical absences require documentation submitted within 7 days.</li>
                <li>Three consecutive absences without notice may trigger academic review.</li>
              </ul>
              <p>For any questions or special circumstances, please contact your course instructor or academic advisor.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="unauthorized-message">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this attendance record.</p>
        <button className="back-button" onClick={() => navigate('/attendance')}>
          Back to Attendance
        </button>
      </div>
    </div>
  );
};

export default AttendanceDetailPage; 