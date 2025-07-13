import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { PieChart } from '../../components/charts';
import { useHasRole } from '../../components/RoleBasedAccess';
import '../../styles/DashboardPage.css';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

const AttendanceDetailPage = () => {
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
      { id: 4, name: 'Alice Williams', studentId: 'S2312348', status: 'present', time: '09:25 AM', notes: 'Traffic delay' },
      { id: 5, name: 'Charlie Brown', studentId: 'S2312349', status: 'present', time: '09:01 AM', notes: '' },
      { id: 6, name: 'David Wilson', studentId: 'S2312350', status: 'absent', time: '-', notes: 'No notification' },
      { id: 7, name: 'Eva Martinez', studentId: 'S2312351', status: 'present', time: '09:04 AM', notes: '' },
      { id: 8, name: 'Frank Thomas', studentId: 'S2312352', status: 'present', time: '09:07 AM', notes: '' },
      { id: 9, name: 'Grace Lee', studentId: 'S2312353', status: 'present', time: '09:03 AM', notes: '' },
      { id: 10, name: 'Henry Clark', studentId: 'S2312354', status: 'present', time: '09:18 AM', notes: 'Bus delay' }
    ],
    createdBy: 'Dr. Alan Turing',
    createdAt: '2023-10-15T09:35:00',
    lastModified: '2023-10-15T10:45:00',
    topic: 'Introduction to Algorithms',
    notes: 'Covered basic algorithm concepts, time complexity, and big O notation. Students seemed to grasp the material well, though some struggled with complexity analysis.',
    statistics: {
      total: 10,
      present: 8,
      absent: 2,
      attendanceRate: 80
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
      
      if ((isFacultyRoute && isFacultyOrAdmin) || (!isFacultyRoute && isFacultyOrAdmin)) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.GET_ATTENDANCE_BY_ID(id)}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true
          });
          
          if (response.data && response.data.success) {
            const studentRecords = response.data.data.students || [];
            const presentCount = studentRecords.filter(student => student.status?.toLowerCase() === 'present').length;
            const absentCount = studentRecords.filter(student => student.status?.toLowerCase() === 'absent').length;
            const totalCount = studentRecords.length;
            const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
            
            const attendanceWithStats = {
              ...response.data.data,
              statistics: {
                total: totalCount,
                present: presentCount,
                absent: absentCount,
                attendanceRate: attendanceRate
              }
            };
            
            if (attendanceWithStats.students) {
              attendanceWithStats.students = attendanceWithStats.students.map(student => ({
                ...student,
                name: student.fullName || student.name || 'Unknown Student',
                status: student.status?.toLowerCase() || 'absent'
              }));
            }
            
            setAttendanceData(attendanceWithStats);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.error('Error fetching attendance data from API:', apiError);
        }
        
        // Fall back to mock data if API fails
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
  }, [id, isFacultyOrAdmin, isStudent, isFacultyRoute]);

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

  // Faculty/Admin View
  if (isFacultyOrAdmin && attendanceData) {
    return (
      <div className="page-container" style={{ 
        width: '100%', 
        maxWidth: '100%', 
        padding: '0 20px',
        boxSizing: 'border-box',
        marginTop:'30px',
      }}>
        <div className="detail-container" style={{ width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '15px', 
            marginBottom: '15px' 
          }}>
            <button 
              className="back-button" 
              onClick={() => navigate(-1)}
              style={{ 
                padding: '8px 15px', 
                backgroundColor: '#3498db', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                width: 'fit-content'
              }}
            >
              <span style={{ marginRight: '5px' }}>←</span> Back
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="print-button" 
                onClick={() => window.print()}
                style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#2ecc71', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Print / Export
              </button>
              <button 
                className="export-button" 
                onClick={() => {
                  // Create CSV content
                  const headers = ['Roll No.', 'Name', 'Status'];
                  const rows = attendanceData.students.map(student => [
                    student.rollNumber || '',
                    student.name,
                    student.status
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
                }}
                style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#f39c12', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Export CSV
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '30px',
            width: '100%'
          }}>
            {/* Attendance Summary Section - Left Side */}
            <div style={{ flex: '3', minWidth: '350px', maxWidth: '60%' }}>
              <div className="detail-header" style={{ height: '100%' }}>
                <div className="statistics-card" style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'calc(100vh - 150px)'
                }}><h2 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: '600', 
                  color: '#2c3e50', 
                  margin: '0 0 2px 0' 
                }}>Attendance Summary</h2>
                
                  {/* Course Info Header */}
                  <div style={{ 
                    padding: '12px 10px', 
                    borderBottom: '1px solid #eee', 
                    backgroundColor: '#f8f9fa' 
                  }}>
                    
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: '2', minWidth: '170px' }}>
                        <div style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: 'bold', 
                          color: '#34495e',
                          marginBottom: '3px' 
                        }}>
                          {attendanceData?.course?.name}
                        </div>
                        <div style={{ 
                          display: 'inline-block', 
                          padding: '2px ', 
                          backgroundColor: '#e9ecef', 
                          borderRadius: '12px', 
                          fontSize: '0.8rem', 
                          color: '#495057', 
                          marginBottom: '5px' 
                        }}>
                          {attendanceData?.course?.id}
                        </div>
                      </div>
                      
                      <div style={{ flex: '1', minWidth: '170px', textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#6c757d', 
                          marginBottom: '3px' 
                        }}>
                          {attendanceData?.startTime} - {attendanceData?.endTime}
                        </div>
                        <div style={{ 
                          fontSize: '0.95rem', 
                          fontWeight: '500', 
                          color: '#343a40' 
                        }}>
                          {formatDate(attendanceData?.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Statistics Section */}
                  <div style={{ 
                    padding: '15px 20px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '5px', 
                    overflow: 'auto',
                    flex: '1'
                  }}>
                    {/* Chart and Statistics in horizontal layout */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      {/* Chart */}
                      <div style={{ flex: '1', minWidth: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ 
                          position: 'relative',
                          width: '130px',
                          height: '130px',
                          borderRadius: '50%',
                          background: `conic-gradient(
                            #4CAF50 0% ${attendanceData.statistics.attendanceRate}%, 
                            #F44336 ${attendanceData.statistics.attendanceRate}% 100%
                          )`,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            bottom: '5px',
                            left: '5px',
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'column'
                          }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>
                              {attendanceData.statistics.attendanceRate}%
                            </div>
                          </div>
                        </div>
                        <div style={{ marginLeft: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#4CAF50', borderRadius: '2px', marginRight: '5px' }}></div>
                            <span style={{ fontSize: '0.85rem' }}>Present ({attendanceData.statistics.present})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#F44336', borderRadius: '2px', marginRight: '5px' }}></div>
                            <span style={{ fontSize: '0.85rem' }}>Absent ({attendanceData.statistics.absent})</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Statistics */}
                      <div style={{ flex: '1', minWidth: '150px' }}>
                        <div style={{ 
                          fontSize: '1.6rem', 
                          fontWeight: 'bold', 
                          marginBottom: '10px', 
                          color: '#3498db',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <span>{attendanceData.statistics.attendanceRate}%</span>
                          <span style={{ fontSize: '0.85rem', color: '#6c757d', marginLeft: '8px' }}>Attendance Rate</span>
                        </div>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px',
                          marginBottom: '15px'
                        }}>
                          <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#e3f7e8', borderRadius: '6px' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2e8540' }}>
                              {attendanceData.statistics.present}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#2e8540' }}>Present</div>
                          </div>
                          
                          <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#ffe0e0', borderRadius: '6px' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#d73a49' }}>
                              {attendanceData.statistics.absent}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#d73a49' }}>Absent</div>
                          </div>
                          
                          <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#343a40' }}>
                              {attendanceData.statistics.total}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Total</div>
                            
                          </div>
                          
                        </div>
                        <button 
                      onClick={() => {
                        setLoading(true);
                        fetchAttendanceData();
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem' }}>↻</span> Refresh Data
                    </button>
                      </div>
                      
                    </div>
                    
             
                  </div>
                </div>
              </div>
            </div>
            
            {/* Student Attendance Records Section - Right Side */}
            <div style={{ flex: '2', minWidth: '350px', maxWidth: '40%' }}>
              <div className="students-section" style={{ 
                height: 'calc(100vh - 150px)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <h3 style={{ 
                  marginBottom: '15px', 
                  borderBottom: '1px solid #eee', 
                  paddingBottom: '10px',
                  position: 'sticky',
                  top: 0,
                  backgroundColor: 'white',
                  zIndex: 2
                }}>
                  Student Attendance Records
                </h3>
                <div className="table-responsive" style={{ 
                  overflow: 'auto',
                  height: 'calc(100% - 56px)',
                  borderRadius: '0 0 5px 5px'
                }}>
                  <table className="attendance-table" style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    overflow: 'hidden'
                  }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '2px 5px', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '2px 5px', textAlign: 'left' }}>Roll No.</th>
                        <th style={{ padding: '2px 5px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.students?.map((student, index) => (
                        <tr key={student.id || index} style={{ 
                          borderBottom: '1px solid #eee',
                          backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
                        }}>
                          <td style={{ padding: '5px 7px' }}>{student.name}</td>
                          <td style={{ padding: '5px 7px' }}>{student.rollNumber || student.studentId}</td>
                          <td style={{ padding: '5px 7px', textAlign: 'center' }}>
                            <span className={`status-badge ${getStatusClass(student.status)}`} style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              borderRadius: '12px',
                              fontWeight: '500',
                              textTransform: 'capitalize',
                              backgroundColor: student.status === 'present' ? '#e3f7e8' : 
                                                      student.status === 'absent' ? '#ffe0e0' : '#f0f0f0',
                              color: student.status === 'present' ? '#2e8540' : 
                                     student.status === 'absent' ? '#d73a49' : '#666'
                            }}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="detail-footer" style={{
            borderTop: '1px solid #eee',
            padding: '10px 0',
            fontSize: '0.85rem',
            color: '#6c757d',
            textAlign: 'center',
            marginTop: '10px',
            width: '100%'
          }}>
            <div className="detail-meta-info">
              <p>Created on:{new Date(attendanceData.createdAt).toLocaleString()}</p>
            </div>
          </div>
              </div>
              
            </div>
            
          </div>
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
                <div style={{ 
                  position: 'relative',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    #4CAF50 0% ${studentData.attendance.courseStats.attendanceRate}%, 
                    #F44336 ${studentData.attendance.courseStats.attendanceRate}% 100%
                  )`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '0 auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    bottom: '5px',
                    left: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column'
                  }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3498db' }}>
                      {studentData.attendance.courseStats.attendanceRate}%
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#4CAF50', borderRadius: '2px', marginRight: '5px' }}></div>
                    <span>Present ({studentData.attendance.courseStats.attended})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#F44336', borderRadius: '2px', marginRight: '5px' }}></div>
                    <span>Absent ({studentData.attendance.courseStats.absent})</span>
                  </div>
                </div>
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