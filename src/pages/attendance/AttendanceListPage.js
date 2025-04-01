import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useHasRole } from '../../components/RoleBasedAccess';
import { BarChart } from '../../components/charts';
import '../../styles/DashboardPage.css';

const AttendanceListPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Check if user is faculty or admin
  const isFacultyOrAdmin = useHasRole(['faculty', 'admin']);
  const isStudent = useHasRole(['student']);
  
  useEffect(() => {
    // Fetch data based on user role
    if (isFacultyOrAdmin) {
      fetchFacultyAttendanceData();
    } else if (isStudent) {
      fetchStudentAttendanceData();
    }
  }, [isFacultyOrAdmin, isStudent, user]);
  
  // Mock data for faculty view
  const fetchFacultyAttendanceData = () => {
    // Simulating API call to get attendance records for faculty
    setTimeout(() => {
      setAttendanceRecords([
        {
          id: 1,
          course: { id: 'CS101', name: 'Computer Science 101' },
          date: '2023-11-10',
          time: '09:00 AM - 10:30 AM',
          present: 42,
          absent: 2,
          late: 1,
          total: 45,
          attendanceRate: 94,
          topic: 'Object-Oriented Programming: Inheritance'
        },
        {
          id: 2,
          course: { id: 'CS101', name: 'Computer Science 101' },
          date: '2023-11-08',
          time: '09:00 AM - 10:30 AM',
          present: 41,
          absent: 3,
          late: 1,
          total: 45,
          attendanceRate: 91,
          topic: 'Object-Oriented Programming: Classes and Objects'
        },
        {
          id: 3,
          course: { id: 'DB202', name: 'Database Systems' },
          date: '2023-11-09',
          time: '01:00 PM - 02:30 PM',
          present: 35,
          absent: 3,
          late: 0,
          total: 38,
          attendanceRate: 92,
          topic: 'SQL Joins and Subqueries'
        },
        {
          id: 4,
          course: { id: 'SE303', name: 'Software Engineering' },
          date: '2023-11-07',
          time: '03:00 PM - 04:30 PM',
          present: 34,
          absent: 2,
          late: 1,
          total: 37,
          attendanceRate: 92,
          topic: 'Agile Development Methodologies'
        },
        {
          id: 5,
          course: { id: 'DB202', name: 'Database Systems' },
          date: '2023-11-02',
          time: '01:00 PM - 02:30 PM',
          present: 33,
          absent: 4,
          late: 1,
          total: 38,
          attendanceRate: 87,
          topic: 'Database Normalization'
        }
      ]);
      setLoading(false);
    }, 1000);
  };
  
  // Mock data for student view
  const fetchStudentAttendanceData = () => {
    // Simulating API call to get attendance records for a student
    setTimeout(() => {
      setStudentAttendance({
        studentId: 'S2312345',
        name: 'John Doe',
        overallAttendance: 92,
        courses: [
          {
            id: 'CS101',
            name: 'Computer Science 101',
            faculty: 'Dr. Alan Turing',
            attendanceRate: 95,
            present: 19,
            absent: 1,
            late: 0,
            total: 20,
            sessions: [
              { date: '2023-11-10', status: 'present', topic: 'Object-Oriented Programming: Inheritance' },
              { date: '2023-11-08', status: 'present', topic: 'Object-Oriented Programming: Classes and Objects' },
              { date: '2023-11-06', status: 'present', topic: 'File I/O and Exception Handling' },
              { date: '2023-11-03', status: 'absent', topic: 'Dictionaries and JSON' },
              { date: '2023-11-01', status: 'present', topic: 'Lists and Tuples' }
            ]
          },
          {
            id: 'DB202',
            name: 'Database Systems',
            faculty: 'Dr. Grace Hopper',
            attendanceRate: 88,
            present: 14,
            absent: 1,
            late: 1,
            total: 16,
            sessions: [
              { date: '2023-11-09', status: 'present', topic: 'SQL Joins and Subqueries' },
              { date: '2023-11-02', status: 'late', topic: 'Database Normalization' },
              { date: '2023-10-26', status: 'present', topic: 'SQL Basics' },
              { date: '2023-10-19', status: 'present', topic: 'ER Diagrams' }
            ]
          },
          {
            id: 'SE303',
            name: 'Software Engineering',
            faculty: 'Dr. Linus Torvalds',
            attendanceRate: 92,
            present: 11,
            absent: 1,
            late: 0,
            total: 12,
            sessions: [
              { date: '2023-11-07', status: 'present', topic: 'Agile Development Methodologies' },
              { date: '2023-10-31', status: 'present', topic: 'Software Testing' },
              { date: '2023-10-24', status: 'present', topic: 'Requirements Engineering' }
            ]
          }
        ]
      });
      setLoading(false);
    }, 1000);
  };
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
        record.topic.toLowerCase().includes(query) ||
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
  
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Attendance Management</h1>
        
        {isFacultyOrAdmin && (
          <div className="page-actions">
            <Link to="/attendance/take" className="take-attendance-btn">
              Take Attendance
            </Link>
          </div>
        )}
      </div>
      
      {/* Faculty/Admin View */}
      {isFacultyOrAdmin && (
        <div className="attendance-content">
          <div className="filters-section">
            <div className="filter-group">
              <label htmlFor="courseFilter">Course:</label>
              <select 
                id="courseFilter" 
                value={filter}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">All Courses</option>
                {getCourseOptions().map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
            
            <div className="search-group">
              <input
                type="text"
                placeholder="Search by course, topic, or date"
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="attendance-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Course</th>
                  <th>Topic</th>
                  <th>Attendance</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredRecords().map(record => (
                  <tr key={record.id}>
                    <td>
                      <div className="date-time-cell">
                        <div className="date">{formatDate(record.date)}</div>
                        <div className="time">{record.time}</div>
                      </div>
                    </td>
                    <td>{record.course.name}</td>
                    <td>{record.topic}</td>
                    <td>
                      <div className="attendance-indicator">
                        <div 
                          className={`attendance-bar ${
                            record.attendanceRate >= 90 ? 'status-excellent' :
                            record.attendanceRate >= 80 ? 'status-good' :
                            record.attendanceRate >= 70 ? 'status-average' : 'status-poor'
                          }`} 
                          style={{ width: `${record.attendanceRate}%` }}
                        ></div>
                        <span className="attendance-value">{record.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="count-cell present-count">{record.present}</td>
                    <td className="count-cell absent-count">{record.absent}</td>
                    <td className="count-cell late-count">{record.late}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/attendance/session/${record.id}`} className="view-button">
                          View Details
                        </Link>
                        <Link to={`/attendance/edit/${record.id}`} className="edit-button">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Student View */}
      {isStudent && studentAttendance && (
        <div className="student-attendance-content">
          <div className="overall-stats-card">
            <div className="student-stats-header">
              <h2>Your Attendance Overview</h2>
              <div className="overall-attendance">
                <div className="attendance-percentage">{studentAttendance.overallAttendance}%</div>
                <div className="attendance-label">Overall Attendance</div>
              </div>
            </div>
            
            <div className="course-attendance-summary">
              <h3>Course Attendance</h3>
              <div className="course-chart">
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
          
          <div className="course-attendance-cards">
            {studentAttendance.courses.map(course => (
              <div key={course.id} className="course-attendance-card">
                <div className="course-header">
                  <h3>{course.name}</h3>
                  <div className="course-meta">
                    <div className="faculty">Faculty: {course.faculty}</div>
                    <div className="attendance-badge" style={{
                      backgroundColor: course.attendanceRate >= 90 ? '#4CAF50' : 
                                      course.attendanceRate >= 80 ? '#2196F3' : 
                                      course.attendanceRate >= 70 ? '#FF9800' : '#F44336'
                    }}>
                      {course.attendanceRate}% Attendance
                    </div>
                  </div>
                </div>
                
                <div className="attendance-counts">
                  <div className="count-item">
                    <span className="count">{course.present}</span>
                    <span className="label">Present</span>
                  </div>
                  <div className="count-item">
                    <span className="count">{course.absent}</span>
                    <span className="label">Absent</span>
                  </div>
                  <div className="count-item">
                    <span className="count">{course.late}</span>
                    <span className="label">Late</span>
                  </div>
                  <div className="count-item">
                    <span className="count">{course.total}</span>
                    <span className="label">Total</span>
                  </div>
                </div>
                
                <div className="session-list">
                  <h4>Recent Sessions</h4>
                  <div className="session-items">
                    {course.sessions.map((session, index) => (
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceListPage; 