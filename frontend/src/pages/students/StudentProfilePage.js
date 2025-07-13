import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useHasRole } from '../../components/RoleBasedAccess';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/ProfilePage.css';
// Import icons from react-icons library
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaBriefcase, FaGraduationCap, FaIdCard, FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { PieChart, BarChart } from '../../components/charts';

const StudentProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [overallAttendance, setOverallAttendance] = useState(0);
  
  // Check if user is faculty or admin
  const isFacultyOrAdmin = useHasRole(['faculty', 'admin']);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Attempt to get student data from API
        const response = await api.get(`${API_ENDPOINTS.GET_STUDENT}/${id}`);
        
        if (response.data && response.data.success) {
          const student = response.data.data;
          
          // Format the data for display
          setStudentData({
            id: student._id,
            rollNumber: student.rollNumber || 'N/A',
            name: student.name || 'Unknown Student',
            fullName: student.name || 'Unknown Student',
            email: student.email || `${student.rollNumber}@example.com`,
            department: student.discipline || student.department || 'Not Specified',
            semester: student.semester || 'Not Specified',
            program: student.program || 'B.Tech',
            enrollmentDate: new Date(student.createdAt || Date.now()).toLocaleDateString(),
            attendanceStats: student.attendanceStats || [],
            gpa: student.gpa || 'N/A',
            profileImage: student.profileImage || 'https://via.placeholder.com/150'
          });
          
          // Calculate overall attendance from stats
          if (student.attendanceStats && student.attendanceStats.length > 0) {
            const totalAttendance = student.attendanceStats.reduce((acc, stat) => {
              return acc + (stat.percentage || 0);
            }, 0);
            setOverallAttendance(Math.round(totalAttendance / student.attendanceStats.length));
          }
          
          // Try to fetch courses data for this student
          try {
            const attendanceResponse = await api.get(`${API_ENDPOINTS.GET_STUDENT_ATTENDANCE}/${student._id}`);
            if (attendanceResponse.data && attendanceResponse.data.success) {
              const courseData = [];
              
              // Process courses with attendance data
              if (attendanceResponse.data.data && attendanceResponse.data.data.stats) {
                attendanceResponse.data.data.stats.forEach(stat => {
                  courseData.push({
                    id: stat.course,
                    name: stat.courseName || `Course ${stat.course}`,
                    attendanceStats: {
                      total: stat.total || 0,
                      present: stat.present || 0,
                      absent: stat.total ? stat.total - stat.present : 0,
                      late: 0,
                      attendanceRate: stat.percentage || 0
                    },
                    attendanceHistory: stat.history || []
                  });
                });
              }
              
              setCourses(courseData);
            }
          } catch (attendanceError) {
            console.error('Error fetching attendance data:', attendanceError);
            
            // Use mock course data if API call fails
            // Using the attendanceStats from student data to create courses
            if (student.attendanceStats && student.attendanceStats.length > 0) {
              const mockCourses = student.attendanceStats.map((stat, index) => ({
                id: stat.course || `course-${index}`,
                name: stat.courseName || `Course ${index + 1}`,
                faculty: 'Faculty Member',
                attendanceStats: {
                  total: stat.total || 0,
                  present: stat.present || 0,
                  absent: stat.absent || (stat.total ? stat.total - stat.present : 0),
                  late: 0,
                  attendanceRate: stat.percentage || 0
                },
                attendanceHistory: Array(5).fill(0).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - i * 3);
                  return {
                    date: date.toISOString().split('T')[0],
                    status: Math.random() > 0.2 ? 'present' : 'absent',
                    topic: `Topic ${i + 1}`
                  };
                })
              }));
              setCourses(mockCourses);
            }
          }
          
        } else {
          throw new Error('Failed to fetch student data');
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
        setError('Could not load student profile');
        
        // For demo purposes, set mock data
        setStudentData({
          id: id,
          rollNumber: id,
          name: 'Unknown Student',
          fullName: 'Unknown Student',
          email: `${id}@example.com`,
          department: 'Computer Science',
          semester: '4',
          program: 'B.Tech',
          enrollmentDate: new Date().toLocaleDateString(),
          attendanceStats: [],
          gpa: '8.5',
          profileImage: 'https://via.placeholder.com/150'
        });
        
        // Create mock courses
        const mockCourses = [
          {
            id: 'cs101',
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
            id: 'cs201',
            name: 'Data Structures',
            faculty: 'Dr. Emily Watson',
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
          }
        ];
        setCourses(mockCourses);
        setOverallAttendance(89);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentProfile();
  }, [id]);
  
  // Handle navigation back
  const handleBack = () => {
    navigate(-1);
  };
  
  // Helper functions for formatting
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
          <p>Loading student profile...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="back-button" onClick={handleBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Only faculty or admin can view other student profiles
  if (!isFacultyOrAdmin && (!user || user.id !== id)) {
    return (
      <div className="page-container">
        <div className="unauthorized-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to view this student's profile.</p>
          <button className="back-button" onClick={handleBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="back-arrow" onClick={handleBack}>
            &#8592;
          </span>
          Student Details
        </h1>
      </div>
      
      {/* Personal Information Section */}
      <div className="student-profile-container">
        <div className="profile-sidebar">
          <div className="profile-image-container">
            <img
              src={studentData.profileImage}
              alt={studentData.name}
              className="profile-image"
            />
          </div>
          <div className="profile-identity">
            <h2>{studentData.fullName}</h2>
            <p className="user-role">Student</p>
          </div>
          <div className="quick-info">
            
            
            <div className="info-item">
              <FaCalendarAlt className="info-icon" />
              <span>Enrolled: {studentData.enrollmentDate}</span>
            </div>
          </div>
        </div>

        <div className="student-detail-container" style={{marginTop: '5px'}}>
          {/* Personal Information Section */}
          <div className="detail-section">
            <div className="section-header">
              <h2>Personal Information</h2>
            </div>
            <div className="student-profile-card">
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">Roll No:</span>
                  <span className="profile-value">{studentData?.rollNumber || ''}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email:</span>
                  <span className="profile-value">{studentData?.email || '@example.com'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Discipline:</span>
                  <span className="profile-value">{studentData?.department || 'CSE'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Program:</span>
                  <span className="profile-value">{studentData?.discipline || 'B.tech'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Semester:</span>
                  <span className="profile-value">{studentData?.semester || '4'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">GPA:</span>
                  <span className="profile-value">{studentData?.gpa || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Overall Attendance Section */}
          <div className="detail-section">
            <div className="section-header">
              <h2>Overall Attendance</h2>
            </div>
            <div className="student-stats-card">
              <div className="stats-content">
                <div className="overall-attendance">
                  <div className="attendance-percentage">{overallAttendance || 0}%</div>
                  <div className="attendance-label">Overall Attendance</div>
                </div>
                
                <div className="course-chart" style={{flex: 1, marginLeft: '20px'}}>
                  {console.log("All courses data:", courses)}
                  {courses.forEach((course, i) => {
                    console.log(`Course ${i} (${course?.name || 'unknown'}):`, 
                      course?.attendanceStats?.attendanceRate, 
                      course?.attendanceStats);
                  })}
                  <BarChart 
                    data={[
                      {
                        label: 'OS',
                        value: courses[0]?.attendanceStats?.attendanceRate || 0,
                        color: '#2196F3',
                        width: '25%'
                      },
                      {
                        label: 'DAA', 
                        value: courses[1]?.attendanceStats?.attendanceRate || 0,
                        color: '#4CAF50',
                        width: '25%'
                      },
                      {
                        label: 'CN',
                        value: courses[2]?.attendanceStats?.attendanceRate || 0,
                        color: '#FF9800',
                        width: '25%'
                      },
                      {
                        label: 'IoT',
                        value: courses[3]?.attendanceStats?.attendanceRate || 0,
                        color: '#2196F3',
                        width: '25%'
                      }
                    ]}
                    height={200}
                    showValues={true}
                    valueFormatter={value => `${value.toFixed(2)}%`}
                    barWidth="25%"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Course Attendance Details Section */}
          <div className="detail-section">
            <div className="section-header">
              <h2>Course Attendance Details</h2>
            </div>
            {courses.length > 0 ? (
              <div className="course-attendance-cards">
                {courses.map((course, index) => (
                  <div key={index} className="course-attendance-card">
                    <div className="course-header">
                      <h3>{course.name || ''}</h3>
                      <div className="course-meta">
                        <div className="faculty">Faculty: {course.faculty || 'Not Specified'}</div>
                        <div className="attendance-badge" style={{
                          backgroundColor: (course.attendanceStats?.attendanceRate || 0) >= 90 ? '#4CAF50' : 
                                          (course.attendanceStats?.attendanceRate || 0) >= 80 ? '#2196F3' : 
                                          (course.attendanceStats?.attendanceRate || 0) >= 70 ? '#FF9800' : '#F44336'
                        }}>
                          {course.attendanceStats?.attendanceRate || 0}% Attendance
                        </div>
                      </div>
                    </div>
                    
                    <div className="attendance-stats">
                      <div className="stats-chart">
                        <PieChart 
                          data={[
                            { label: 'Present', value: course.attendanceStats?.present || 0, color: '#4CAF50' },
                            { label: 'Absent', value: course.attendanceStats?.absent || 0, color: '#F44336' },
                          ]}
                          size={150}
                          showPercentage={true}
                        />
                      </div>
                      <div className="attendance-counts">
                        <div className="count-item">
                          <span className="count">{course.attendanceStats?.present || 0}</span>
                          <span className="label">Present</span>
                        </div>
                        <div className="count-item">
                          <span className="count">{course.attendanceStats?.absent || 0}</span>
                          <span className="label">Absent</span>
                        </div>
                        
                        <div className="count-item">
                          <span className="count">{course.attendanceStats?.total || 0}</span>
                          <span className="label">Total</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent Attendance History Section */}
                    <div className="attendance-history-section">
                      <h4>Recent Attendance History</h4>
                      {course.attendanceHistory && course.attendanceHistory.length > 0 ? (
                        <div className="session-items">
                          {course.attendanceHistory.map((session, idx) => (
                            <div key={idx} className="session-item">
                              <div className="session-date">{session.date ? formatDate(session.date) : ''}</div>
                              <div className="session-topic">{session.topic || ''}</div>
                              <div className={`session-status ${getStatusClass(session.status)}`}>
                                {session.status ? (session.status.charAt(0).toUpperCase() + session.status.slice(1)) : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-data-message">No attendance history available</div>
                      )}
                    </div>
                    
                    <div className="card-actions">
                      <Link to={`/courses/${course.id}`} className="view-button">
                        View Course Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-container">
                <p className="no-data-message">No course data available for this student</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add some styling to improve the visual appearance of the sections */}
      <style>{`
        .student-profile-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          grid-gap: 20px;
          
          min-height: 100vh; /* Full viewport height */
        }
        
        @media (max-width: 768px) {
          .student-profile-container {
            grid-template-columns: 1fr;
          }
        }
        
        .detail-section {
          margin-bottom: 10px;
          
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: box-shadow 0.3s ease;
          min-height: 10vh;
        }
        
        .detail-section:hover {
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }
        
        .section-header {
          background: linear-gradient(to right, #2c3e50, #3498db);
          padding: 15px 20px;
          border-bottom: 1px solid #eaeaea;
          color: white;
        }
        
        .section-header h2 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
          color: #fff;
        }
        
        .student-profile-card,
        .student-stats-card,
        .attendance-history-section {
          padding: 20px;
        }
        
        .profile-details {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }
        
        .profile-item {
          display: flex;
          padding: 10px;
          background-color: #f9f9f9;
          border-radius: 6px;
          border-left: 4px solid #3498db;
        }
        
        .profile-label {
          font-weight: 600;
          width: 120px;
          color: #555;
        }
        
        .profile-value {
          flex-grow: 1;
          color: #333;
        }
        
        .course-attendance-card {
          margin-bottom: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .course-attendance-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .course-header {
          background-color: #f0f5fa;
          padding: 15px 20px;
          border-bottom: 1px solid #e3e9f0;
        }
        
        .course-header h3 {
          margin: 0 0 10px 0;
          color: #2c3e50;
        }
        
        .course-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }
        
        .faculty {
          color: #555;
        }
        
        .attendance-badge {
          padding: 4px 12px;
          border-radius: 15px;
          color: white;
          font-weight: 600;
        }
        
        .attendance-stats {
          display: flex;
          flex-wrap: wrap;
          padding: 20px;
          justify-content: space-around;
          align-items: center;
          background-color: #fff;
        }
        
        .stats-chart {
          min-width: 200px;
        }
        
        .attendance-counts {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .count-item {
          background-color: #f7f9fc;
          padding: 10px 15px;
          border-radius: 8px;
          min-width: 80px;
          text-align: center;
          border: 1px solid #e3e9f0;
        }
        
        .count {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .label {
          display: block;
          font-size: 0.8rem;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .attendance-history-section {
          border-top: 1px solid #eaeaea;
          background-color: #f8f9fa;
          padding: 20px;
        }
        
        .attendance-history-section h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #34495e;
          font-size: 1.1rem;
        }
        
        .session-items {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 10px;
        }
        
        .session-item {
          background-color: white;
          border-radius: 6px;
          padding: 10px 15px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          transition: transform 0.1s ease;
        }
        
        .session-item:hover {
          transform: translateY(-2px);
        }
        
        .session-date {
          font-size: 0.85rem;
          color: #7f8c8d;
          margin-bottom: 5px;
        }
        
        .session-topic {
          font-weight: 600;
          margin-bottom: 5px;
          color: #2c3e50;
        }
        
        .session-status {
          align-self: flex-start;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .status-present {
          background-color: rgba(76, 175, 80, 0.2);
          color: #2e7d32;
        }
        
        .status-absent {
          background-color: rgba(244, 67, 54, 0.2);
          color: #c62828;
        }
        
        .status-late {
          background-color: rgba(255, 152, 0, 0.2);
          color: #ef6c00;
        }
        
        .card-actions {
          padding: 15px 20px;
          display: flex;
          gap: 10px;
          border-top: 1px solid #eaeaea;
          background-color: #f9f9f9;
        }
        
        .view-button {
          padding: 8px 15px;
          background-color: #3498db;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-size: 0.9rem;
          transition: background-color 0.2s ease;
        }
        
        .view-button:hover {
          background-color: #2980b9;
        }
        
        .overall-attendance {
          text-align: center;
          padding: 20px;
        }
        
        .attendance-percentage {
          font-size: 3rem;
          font-weight: 700;
          color: ${overallAttendance >= 80 ? '#27ae60' : 
                   overallAttendance >= 70 ? '#f39c12' : '#e74c3c'};
        }
        
        .attendance-label {
          font-size: 1rem;
          color: #7f8c8d;
          margin-top: 5px;
        }
        
        .no-data-message {
          padding: 20px;
          text-align: center;
          color: #7f8c8d;
          font-style: italic;
          background-color: #f9f9f9;
          border-radius: 6px;
          margin: 10px 0;
        }
        
        .no-data-container {
          padding: 30px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default StudentProfilePage; 