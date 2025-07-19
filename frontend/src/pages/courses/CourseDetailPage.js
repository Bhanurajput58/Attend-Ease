import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { BarChart, PieChart } from '../../components/charts';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);

  // Mock data for a course
  const mockCourseDetail = {
    id: 'CS101',
    name: 'Computer Science 101',
    description: 'Introduction to computer science and programming fundamentals. This course covers basic algorithms, data structures, and programming concepts using Python. Students will learn about variables, control structures, functions, and object-oriented programming through hands-on coding exercises and projects.',
    department: 'Computer Science',
    semester: 'Fall 2023',
    credits: 3,
    faculty: 'Dr. Alan Turing',
    facultyId: 'FAC1001',
    facultyEmail: 'turing@university.edu',
    facultyPhone: '(555) 123-4567',
    schedule: 'MWF 9:00 AM - 10:30 AM',
    location: 'Science Building, Room 301',
    enrolledStudents: 45,
    capacity: 50,
    status: 'active',
    attendanceRate: 92,
    startDate: '2023-09-05',
    endDate: '2023-12-20',
    syllabus: 'https://university.edu/courses/cs101/syllabus.pdf',
    prerequisites: ['High School Algebra', 'Basic Computer Skills'],
    textbooks: [
      { title: 'Introduction to Python Programming', author: 'John Smith', isbn: '978-1234567890' },
      { title: 'Algorithms Explained', author: 'Jane Doe', isbn: '978-0987654321' }
    ],
    topics: [
      'Introduction to Programming Concepts',
      'Variables and Data Types',
      'Control Structures',
      'Functions and Modules',
      'Lists and Dictionaries',
      'File I/O',
      'Object-Oriented Programming',
      'Basic Algorithms',
      'Error Handling'
    ]
  };

  // Mock attendance statistics
  const mockAttendanceStats = {
    overallRate: 92,
    sessionsCount: 24,
    presentCount: 985,
    absentCount: 64,
    lateCount: 31,
    bestAttendance: 'Monday, September 18, 2023 (100%)',
    worstAttendance: 'Friday, November 3, 2023 (78%)',
    rateByWeekday: [
      { day: 'Monday', rate: 94 },
      { day: 'Wednesday', rate: 91 },
      { day: 'Friday', rate: 88 }
    ],
    trend: 'increasing'
  };

  // Mock recent sessions
  const mockRecentSessions = [
    {
      id: 101,
      date: '2023-11-10',
      topic: 'Object-Oriented Programming: Inheritance',
      attendanceRate: 94,
      present: 42,
      absent: 2,
      late: 1
    },
    {
      id: 102,
      date: '2023-11-08',
      topic: 'Object-Oriented Programming: Classes and Objects',
      attendanceRate: 91,
      present: 41,
      absent: 3,
      late: 1
    },
    {
      id: 103,
      date: '2023-11-06',
      topic: 'File I/O and Exception Handling',
      attendanceRate: 89,
      present: 40,
      absent: 3,
      late: 2
    },
    {
      id: 104,
      date: '2023-11-03',
      topic: 'Dictionaries and JSON',
      attendanceRate: 78,
      present: 35,
      absent: 9,
      late: 1
    },
    {
      id: 105,
      date: '2023-11-01',
      topic: 'Lists and Tuples',
      attendanceRate: 93,
      present: 42,
      absent: 2,
      late: 1
    }
  ];

  // Mock enrolled students
  const mockEnrolledStudents = [
    { id: 1, name: 'John Doe', studentId: 'S2312345', department: 'Computer Science', attendanceRate: 96, status: 'active' },
    { id: 2, name: 'Jane Smith', studentId: 'S2312346', department: 'Computer Science', attendanceRate: 100, status: 'active' },
    { id: 3, name: 'Bob Johnson', studentId: 'S2312347', department: 'Electrical Engineering', attendanceRate: 83, status: 'active' },
    { id: 4, name: 'Alice Williams', studentId: 'S2312348', department: 'Computer Science', attendanceRate: 92, status: 'active' },
    { id: 5, name: 'Charlie Brown', studentId: 'S2312349', department: 'Mathematics', attendanceRate: 88, status: 'active' },
    { id: 6, name: 'David Wilson', studentId: 'S2312350', department: 'Physics', attendanceRate: 96, status: 'active' },
    { id: 7, name: 'Eva Martinez', studentId: 'S2312351', department: 'Computer Science', attendanceRate: 100, status: 'active' },
    { id: 8, name: 'Frank Thomas', studentId: 'S2312352', department: 'Information Systems', attendanceRate: 79, status: 'active' },
    { id: 9, name: 'Grace Lee', studentId: 'S2312353', department: 'Computer Science', attendanceRate: 96, status: 'active' },
    { id: 10, name: 'Henry Clark', studentId: 'S2312354', department: 'Mathematics', attendanceRate: 71, status: 'at risk' }
  ];

  useEffect(() => {
    // Simulate API calls to fetch course data
    setTimeout(() => {
      if (id === 'CS101') { // In a real app, we would fetch the specific course by ID from API
        setCourse(mockCourseDetail);
        setAttendanceStats(mockAttendanceStats);
        setRecentSessions(mockRecentSessions);
        setEnrolledStudents(mockEnrolledStudents);
        setLoading(false);
      } else {
        // Redirect to courses page if course not found
        navigate('/courses');
      }
    }, 1000);
  }, [id, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getAttendanceStatusClass = (rate) => {
    if (rate >= 90) return 'status-excellent';
    if (rate >= 80) return 'status-good';
    if (rate >= 70) return 'status-average';
    return 'status-poor';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">{course.name}</h1>
          <p className="page-subtitle">{course.id} • {course.department}</p>
        </div>
        
        <div className="page-actions">
          <Link to={`/courses/edit/${course.id}`} className="edit-button">
            Edit Course
          </Link>
          <Link to={`/attendance/course/${course.id}`} className="attendance-button">
            View Attendance
          </Link>
          <button className="back-button" onClick={() => navigate('/courses')}>
            Back to Courses
          </button>
        </div>
      </div>
      
      <div className="course-status-header">
        <div className="status-indicator">
          <span className={`status-badge status-${course.status}`}>
            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
          </span>
          <div className="date-range">
            {formatDate(course.startDate)} - {formatDate(course.endDate)}
          </div>
        </div>
        
        <div className="enrollment-summary">
          <div className="enrollment-bar">
            <div 
              className="enrollment-progress" 
              style={{ width: `${(course.enrolledStudents / course.capacity) * 100}%` }}
            ></div>
          </div>
          <div className="enrollment-text">
            <span className="enrollment-count">{course.enrolledStudents}/{course.capacity}</span>
            <span className="enrollment-label">Students Enrolled</span>
          </div>
        </div>
        
        <div className="attendance-summary">
          <div className="attendance-circle">
            <span className="attendance-percentage">{course.attendanceRate}%</span>
          </div>
          <span className="attendance-label">Attendance Rate</span>
        </div>
      </div>
      
      <div className="course-tabs">
        <button 
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => handleTabChange('details')}
        >
          Details
        </button>
        <button 
          className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => handleTabChange('attendance')}
        >
          Attendance
        </button>
        <button 
          className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => handleTabChange('students')}
        >
          Students
        </button>
        <button 
          className={`tab-button ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => handleTabChange('sessions')}
        >
          Sessions
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'details' && (
          <div className="details-tab">
            <div className="course-details-grid">
              <div className="detail-card description-card">
                <h3>Description</h3>
                <p>{course.description}</p>
              </div>
              
              <div className="detail-card info-card">
                <h3>Course Information</h3>
                <div className="detail-items">
                  <div className="detail-item">
                    <span className="detail-label">Faculty:</span>
                    <span className="detail-value">{course.faculty}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact:</span>
                    <span className="detail-value">{course.facultyEmail}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{course.facultyPhone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Credits:</span>
                    <span className="detail-value">{course.credits}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Schedule:</span>
                    <span className="detail-value">{course.schedule}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{course.location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{course.department}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Semester:</span>
                    <span className="detail-value">{course.semester}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-card prerequisites-card">
                <h3>Prerequisites</h3>
                <ul className="prerequisites-list">
                  {course.prerequisites.map((prereq, index) => (
                    <li key={index}>{prereq}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-card textbooks-card">
                <h3>Textbooks</h3>
                <div className="textbooks-list">
                  {course.textbooks.map((book, index) => (
                    <div key={index} className="textbook-item">
                      <div className="textbook-title">{book.title}</div>
                      <div className="textbook-author">by {book.author}</div>
                      <div className="textbook-isbn">ISBN: {book.isbn}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="detail-card topics-card">
                <h3>Course Topics</h3>
                <ol className="topics-list">
                  {course.topics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ol>
              </div>
              
              <div className="detail-card links-card">
                <h3>Course Materials</h3>
                <div className="course-links">
                  <a href={course.syllabus} className="course-link" target="_blank" rel="noopener noreferrer">
                    Download Syllabus
                  </a>
                  <a href="#" className="course-link">
                    View Lecture Notes
                  </a>
                  <a href="#" className="course-link">
                    Assignment Repository
                  </a>
                  <a href="#" className="course-link">
                    Discussion Forum
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'attendance' && (
          <div className="attendance-tab">
            <div className="attendance-stats-grid">
              <div className="stats-card overview-card">
                <h3>Attendance Overview</h3>
                <div className="overview-stats">
                  <div className="stat-item">
                    <span className="stat-value">{attendanceStats.overallRate}%</span>
                    <span className="stat-label">Overall Rate</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{attendanceStats.sessionsCount}</span>
                    <span className="stat-label">Sessions</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{attendanceStats.presentCount}</span>
                    <span className="stat-label">Present</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{attendanceStats.absentCount}</span>
                    <span className="stat-label">Absent</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{attendanceStats.lateCount}</span>
                    <span className="stat-label">Late</span>
                  </div>
                </div>
                <div className="attendance-distribution-chart">
                  <PieChart 
                    data={[
                      { label: 'Present', value: attendanceStats.presentCount, color: '#4CAF50' },
                      { label: 'Absent', value: attendanceStats.absentCount, color: '#F44336' },
                      { label: 'Late', value: attendanceStats.lateCount, color: '#FF9800' }
                    ]}
                    size={150}
                    showPercentage={true}
                  />
                </div>
              </div>
              
              <div className="stats-card highlights-card">
                <h3>Attendance Highlights</h3>
                <div className="attendance-highlights">
                  <div className="highlight-item">
                    <span className="highlight-label">Best Attendance:</span>
                    <span className="highlight-value">{attendanceStats.bestAttendance}</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Worst Attendance:</span>
                    <span className="highlight-value">{attendanceStats.worstAttendance}</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Trend:</span>
                    <span className="highlight-value trend-value">
                      {attendanceStats.trend === 'increasing' ? '↗ Increasing' : 
                       attendanceStats.trend === 'decreasing' ? '↘ Decreasing' : '→ Stable'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="stats-card weekday-card">
                <h3>Attendance by Weekday</h3>
                <BarChart 
                  data={attendanceStats.rateByWeekday.map(day => ({
                    label: day.day,
                    value: day.rate,
                    color: day.rate >= 90 ? '#4CAF50' : day.rate >= 80 ? '#2196F3' : day.rate >= 70 ? '#FF9800' : '#F44336'
                  }))}
                  height={180}
                  showValues={true}
                  valueFormatter={value => `${value}%`}
                />
              </div>
              
              <div className="stats-card actions-card">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <Link to={`/attendance/take?courseId=${course.id}`} className="action-button primary">
                    Take Attendance
                  </Link>
                  <Link to={`/reports/generate?courseId=${course.id}`} className="action-button">
                    Generate Report
                  </Link>
                  <button className="action-button">
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'students' && (
          <div className="students-tab">
            <div className="students-header">
              <h3>Enrolled Students ({enrolledStudents.length})</h3>
              <div className="students-actions">
                <input type="text" placeholder="Search students..." className="student-search" />
                <button className="add-student-btn">Add Student</button>
              </div>
            </div>
            
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Attendance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map(student => (
                    <tr key={student.id} className={student.status === 'at risk' ? 'at-risk-row' : ''}>
                      <td>{student.studentId}</td>
                      <td>{student.name}</td>
                      <td>{student.department}</td>
                      <td>
                        <div className="attendance-indicator">
                          <div 
                            className={`attendance-bar ${getAttendanceStatusClass(student.attendanceRate)}`} 
                            style={{ width: `${student.attendanceRate}%` }}
                          ></div>
                          <span className="attendance-value">{student.attendanceRate}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`student-status ${student.status.replace(' ', '-')}`}>
                          {student.status === 'at risk' ? 'At Risk' : 
                           student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="student-actions">
                          <button className="student-action-btn view-btn">View</button>
                          <button className="student-action-btn message-btn">Message</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'sessions' && (
          <div className="sessions-tab">
            <div className="sessions-header">
              <h3>Recent Sessions</h3>
              <Link to={`/attendance/schedule/${course.id}`} className="schedule-session-btn">
                Schedule New Session
              </Link>
            </div>
            
            <div className="sessions-table-container">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Attendance</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map(session => (
                    <tr key={session.id}>
                      <td>{formatDate(session.date)}</td>
                      <td>{session.topic}</td>
                      <td>
                        <div className="session-attendance">
                          <div 
                            className={`session-attendance-bar ${getAttendanceStatusClass(session.attendanceRate)}`} 
                            style={{ width: `${session.attendanceRate}%` }}
                          ></div>
                          <span className="session-attendance-value">{session.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="status-count present-count">{session.present}</td>
                      <td className="status-count absent-count">{session.absent}</td>
                      <td className="status-count late-count">{session.late}</td>
                      <td>
                        <div className="session-actions">
                          <Link to={`/attendance/${session.id}`} className="session-action-btn view-btn">
                            View
                          </Link>
                          <Link to={`/attendance/edit/${session.id}`} className="session-action-btn edit-btn">
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="view-more-container">
              <Link to={`/attendance/course/${course.id}`} className="view-all-link">
                View All Sessions
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage; 