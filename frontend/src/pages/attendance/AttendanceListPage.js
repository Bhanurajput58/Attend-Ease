import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useHasRole } from '../../components/RoleBasedAccess';
import { BarChart } from '../../components/charts';
import api from '../../services/api';
import './AttendanceListPage.css';

const AttendanceListPage = ({ filter: filterProp }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const { courseId } = useParams(); // Get courseId from URL params if in course filter mode
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // Add local filter state
  const [error, setError] = useState(null);
  const [facultyApprovalStatus, setFacultyApprovalStatus] = useState(null);
  
  // Check if user is faculty or admin
  const isFacultyOrAdmin = useHasRole(['faculty', 'admin']);
  const isStudent = useHasRole(['student']);
  
  // Add specific check for faculty-only access
  const isFacultyOnly = useHasRole(['faculty']);
  
  // Add a state to track if we're in course filter mode
  const isCourseFilterMode = filterProp === 'course' && courseId;
  
  // Fetch faculty approval status if user is faculty
  useEffect(() => {
    const fetchFacultyApprovalStatus = async () => {
      if (isFacultyOnly && user) {
        try {
          const response = await api.get('/api/faculty/dashboard');
          if (response.data.success && response.data.data) {
            setFacultyApprovalStatus(response.data.data.isApproved || false);
          } else {
            setFacultyApprovalStatus(false);
          }
        } catch (error) {
          console.error('Error fetching faculty approval status:', error);
          setFacultyApprovalStatus(false);
        }
      }
    };

    fetchFacultyApprovalStatus();
  }, [isFacultyOnly, user]);
  
  useEffect(() => {
    // If we have filterProp and courseId, set the local filter
    if (isCourseFilterMode && courseId) {
      setFilter(courseId);
    }
  }, [filterProp, courseId, isCourseFilterMode]);
  
  useEffect(() => {
    // If in course filter mode, only fetch attendance for the specific course
    if (isCourseFilterMode) {
      fetchCourseAttendance(courseId);
    } else {
      fetchAllAttendance();
    }
  }, [courseId, isCourseFilterMode]);
  
  // Add debugging for user state
  useEffect(() => {
    console.log('User state changed:', {
      user: user ? { id: user._id, name: user.name, role: user.role, hasToken: !!user.token } : null,
      isAuthenticated: !!user,
      isFacultyOrAdmin,
      isStudent,
      facultyApprovalStatus
    });
  }, [user, isFacultyOrAdmin, isStudent, facultyApprovalStatus]);
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Helper function to get course name by ID
  const getCourseNameById = (courseId) => {
    // This should be replaced with actual API call or course data
    if (courseId === 'CS101') return 'Computer Science 101';
    if (courseId === 'DB202') return 'Database Systems';
    if (courseId === 'SE303') return 'Software Engineering';
    return courseId; // Fallback to ID if name not found
  };
  
  // Helper function to transform admin attendance data to match faculty format
  const transformAdminAttendanceData = (records) => {
    return records.map(record => {
      const present = record.students.filter(s => 
        s.status.toLowerCase() === 'present'
      ).length;
      const absent = record.students.filter(s => 
        s.status.toLowerCase() === 'absent'
      ).length;
      const late = record.students.filter(s => 
        s.status.toLowerCase() === 'late'
      ).length;
      const total = record.students.length;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

      // Handle date conversion - ensure it's a Date object
      const recordDate = new Date(record.date);
      const dateString = recordDate.toISOString().split('T')[0];
      
      // Calculate time range (assuming 90-minute sessions)
      const startTime = recordDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      const endTime = new Date(recordDate.getTime() + 90 * 60000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      return {
        id: record._id,
        course: {
          id: record.course._id,
          name: record.course.courseName || record.course.courseCode
        },
        date: dateString,
        time: `${startTime} - ${endTime}`,
        present,
        absent,
        late,
        total,
        attendanceRate,
        topic: record.topic || 'No topic specified'
      };
    });
  };

  const getFilteredRecords = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return [];
    }
    
    let filtered = [...attendanceRecords];
    
    // Apply course filter
    if (filter !== 'all') {
      filtered = filtered.filter(record => record.course.id === filter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.course.name.toLowerCase().includes(query) ||
        record.date.includes(query)
      );
    }
    
    return filtered;
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'present': return 'status-present';
      case 'absent': return 'status-absent';
      case 'late': return 'status-late';
      default: return '';
    }
  };
  
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getCourseOptions = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return [];
    }
    
    const courses = new Set();
    attendanceRecords.forEach(record => {
      courses.add(JSON.stringify({ id: record.course.id, name: record.course.name }));
    });
    
    return Array.from(courses).map(course => JSON.parse(course));
  };
  
  const fetchCourseAttendance = async (courseId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/attendance/course/${courseId}`);
      
      if (response.data.success) {
        if (isFacultyOrAdmin) {
          setAttendanceRecords(response.data.attendanceRecords || []);
        } else if (isStudent) {
          setStudentAttendance(response.data.studentAttendance || null);
        }
      } else {
        throw new Error(response.data.message || 'Failed to load course attendance data.');
      }
      
    } catch (error) {
      console.error('Error fetching course attendance:', error);
      setError('Failed to load course attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllAttendance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user and token exist
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      if (!user.token) {
        throw new Error('Authentication token not found');
      }
      
      // Use different endpoints based on user role
      let endpoint;
      if (isStudent) {
        endpoint = '/api/attendance/student';
      } else if (user.role === 'faculty') {
        endpoint = '/api/attendance/faculty';
      } else if (user.role === 'admin') {
        endpoint = '/api/attendance';
      } else {
        throw new Error('Invalid user role');
      }
      
      console.log('Fetching attendance from:', endpoint);
      console.log('User role:', user.role);
      console.log('Token exists:', !!user.token);
      
      const response = await api.get(endpoint);
      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      if (response.data.success) {
        if (isFacultyOrAdmin) {
          // Handle different response structures
          if (user.role === 'admin') {
            // Admin endpoint returns { success: true, count: number, data: array }
            setAttendanceRecords(transformAdminAttendanceData(response.data.data || []));
          } else if (user.role === 'faculty') {
            // Faculty endpoint returns { success: true, count: number, data: array }
            setAttendanceRecords(transformAdminAttendanceData(response.data.data || []));
          } else {
            // Other faculty endpoints return { success: true, attendanceRecords: array }
            setAttendanceRecords(response.data.attendanceRecords || []);
          }
        } else if (isStudent) {
          setStudentAttendance(response.data.studentAttendance || null);
        }
      } else {
        throw new Error(response.data.message || 'Failed to load attendance data.');
      }
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError(`Failed to load attendance data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="attendance-list-page-container">
        <div className="attendance-list-loading-indicator">
          <div className="attendance-list-spinner"></div>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }
  
  // Check for unapproved faculty restriction
  if (isFacultyOnly && facultyApprovalStatus === false) {
    return (
      <div className="attendance-list-page-container" style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="pending-approval-message" style={{
          padding: '48px',
          textAlign: 'center',
          borderRadius: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h2 style={{
            color: '#4a90e2',
            fontWeight: '600',
            marginBottom: '24px',
            fontSize: '2rem'
          }}>Attendance Records Restricted</h2>
          <p style={{
            color: '#666',
            marginBottom: '16px',
            lineHeight: '1.6'
          }}>You can't view attendance records until your account is approved by admin.</p>
          <p style={{
            color: '#4a90e2',
            fontWeight: '500'
          }}>Contact your administrator for approval.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-list-page-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="attendance-list-page-container">
      <div className="attendance-list-page-header">
        <h1 className="attendance-list-page-title">
          {isCourseFilterMode ? `Attendance for ${getCourseNameById(courseId)}` : 'Attendance Management'}
        </h1>
        
        {isFacultyOrAdmin && (
          <div className="attendance-list-page-actions">
            {isCourseFilterMode && (
              <button 
                className="attendance-list-back-button"
                onClick={() => navigate('/attendance')}
              >
                Back to All Courses
              </button>
            )}
            {isFacultyOnly && (
              <Link to="/faculty/attendance" className="attendance-list-take-attendance-btn">
                Take Attendance
              </Link>
            )}
          </div>
        )}
      </div>
      
      {/* Faculty/Admin View */}
      {isFacultyOrAdmin && (
        <div className="attendance-list-content">
          {!isCourseFilterMode && (
            <div className="attendance-list-filters-section">
              <div className="attendance-list-filter-group">
                <label htmlFor="courseFilter">Course:</label>
                <select 
                  id="courseFilter" 
                  value={filter}
                  onChange={handleFilterChange}
                  className="attendance-list-filter-select"
                >
                  <option value="all">All Courses</option>
                  {getCourseOptions().map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="attendance-list-search-group">
                <input
                  type="text"
                  placeholder="Search by course or date"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="attendance-list-search-input"
                />
              </div>
            </div>
          )}
          
          <div className="attendance-list-table-container">
            {attendanceRecords.length === 0 ? (
              <div className="no-data-message">
                <p>No attendance records found.</p>
              </div>
            ) : (
              <table className="attendance-list-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Course</th>
                    <th>Attendance</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredRecords().map(record => (
                    <tr key={record.id}>
                      <td>
                        <div className="attendance-list-date-cell">
                          <div className="attendance-list-date">{formatDate(record.date)}</div>
                        </div>
                      </td>
                      <td>{record.course.name}</td>
                      <td>
                        <div className="attendance-list-indicator">
                          <div 
                            className={`attendance-list-bar ${
                              record.attendanceRate >= 90 ? 'status-excellent' :
                              record.attendanceRate >= 80 ? 'status-good' :
                              record.attendanceRate >= 70 ? 'status-average' : 'status-poor'
                            }`} 
                            style={{ width: `${record.attendanceRate}%` }}
                          ></div>
                          <span className="attendance-list-value">{record.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="attendance-list-count-cell present-count">{record.present}</td>
                      <td className="attendance-list-count-cell absent-count">{record.absent}</td>
                      <td>
                        <div className="attendance-list-action-buttons">
                          <Link 
                            to={`/attendance/${record.id}`} 
                            className="attendance-list-view-button"
                            onClick={() => {
                              try {
                                sessionStorage.setItem('selectedActivity', JSON.stringify(record));
                                console.log('Stored record in session storage for detail view:', record);
                              } catch (error) {
                                console.error('Error storing record data:', error);
                              }
                            }}
                          >
                            View Details
                          </Link>
                          {isFacultyOnly && (
                            <Link 
                              to={`/attendance/edit/${record.id}`} 
                              className="attendance-list-edit-button"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      
      {/* Student View */}
      {isStudent && studentAttendance && (
        <div className="attendance-list-student-content">
          <div className="attendance-list-overall-stats-card">
            <div className="attendance-list-student-stats-header">
              <h2>Your Attendance Overview</h2>
              <div className="attendance-list-overall-attendance">
                <div className="attendance-list-attendance-percentage">{studentAttendance.overallAttendance}%</div>
                <div className="attendance-list-attendance-label">Overall Attendance</div>
              </div>
            </div>
            
            <div className="attendance-list-course-attendance-summary">
              <h3>Course Attendance</h3>
              <div className="attendance-list-course-chart">
                <BarChart 
                  data={studentAttendance.courses.map(course => ({
                    label: course.name.split(' ')[0],
                    value: course.attendanceRate,
                    color: course.attendanceRate >= 90 ? '#4CAF50' : 
                           course.attendanceRate >= 80 ? '#2196F3' : 
                           course.attendanceRate >= 70 ? '#FF9800' : '#F44336'
                  }))}
                  height={200}
                  showValues={true}
                  valueFormatter={value => `${value}%`}
                />
              </div>
            </div>
          </div>
          
          <div className="attendance-list-course-attendance-cards">
            {studentAttendance.courses.map(course => (
              <div key={course.id} className="attendance-list-course-attendance-card">
                <div className="attendance-list-course-header">
                  <h3>{course.name}</h3>
                  <div className="attendance-list-course-meta">
                    <div className="attendance-list-faculty">Faculty: {course.faculty}</div>
                    <div 
                      className="attendance-list-attendance-badge"
                      style={{
                        backgroundColor: course.attendanceRate >= 90 ? '#4CAF50' : 
                                        course.attendanceRate >= 80 ? '#2196F3' : 
                                        course.attendanceRate >= 70 ? '#FF9800' : '#F44336'
                      }}
                    >
                      {course.attendanceRate}% Attendance
                    </div>
                  </div>
                </div>
                
                <div className="attendance-list-attendance-counts">
                  <div className="attendance-list-count-item">
                    <span className="attendance-list-count">{course.present}</span>
                    <span className="attendance-list-label">Present</span>
                  </div>
                  <div className="attendance-list-count-item">
                    <span className="attendance-list-count">{course.absent}</span>
                    <span className="attendance-list-label">Absent</span>
                  </div>
                  <div className="attendance-list-count-item">
                    <span className="attendance-list-count">{course.late}</span>
                    <span className="attendance-list-label">Late</span>
                  </div>
                  <div className="attendance-list-count-item">
                    <span className="attendance-list-count">{course.total}</span>
                    <span className="attendance-list-label">Total</span>
                  </div>
                </div>
                
                <div className="attendance-list-session-list">
                  <h4>Recent Sessions</h4>
                  <div className="attendance-list-session-items">
                    {course.sessions.map((session, index) => (
                      <div key={index} className="attendance-list-session-item">
                        <div className="attendance-list-session-date">{formatDate(session.date)}</div>
                        <div className="attendance-list-session-topic">{session.topic}</div>
                        <div className={`attendance-list-session-status ${getStatusClass(session.status)}`}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* No data message for student view */}
      {isStudent && !studentAttendance && !loading && (
        <div className="no-data-message">
          <p>No attendance data available.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceListPage; 