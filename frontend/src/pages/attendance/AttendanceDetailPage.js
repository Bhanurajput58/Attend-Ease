import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useHasRole } from '../../components/RoleBasedAccess';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import api from '../../services/api';
import './AttendanceDetailPage.css';

const AttendanceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);
  const [facultyApprovalStatus, setFacultyApprovalStatus] = useState(null);
  
  // Check if user is faculty or admin
  const isFacultyOrAdmin = useHasRole(['faculty', 'admin']);
  const isStudent = useHasRole(['student']);
  const isFacultyOnly = useHasRole(['faculty']);
  
  // Check if we're on the faculty attendance route
  const isFacultyRoute = location.pathname.includes('/faculty/attendance/');

  // Custom PDF generation function
  const generateCustomPDF = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleString();
    
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Report - ${attendanceData?.course?.name || 'Course'}</title>
        <style>
          @page {
            size: A4;
            margin: 1in;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #2c3e50;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin: 0 0 5px 0;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
            margin: 0 0 10px 0;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #666;
          }
          .course-info {
            background: #f8f9fa;
            border: 2px solid #ddd;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 8px;
          }
          .course-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .course-name {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
          }
          .course-id {
            background: #e9ecef;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            color: #495057;
          }
          .course-date {
            font-size: 16px;
            color: #666;
            text-align: right;
          }
          .stats-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border: 2px solid #ddd;
            border-radius: 8px;
          }
          .chart {
            flex: 1;
            text-align: center;
          }
          .chart-circle {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
            border: 10px solid #e9ecef;
            background: conic-gradient(
              #4CAF50 0% ${attendanceData.statistics.attendanceRate}%, 
              #F44336 ${attendanceData.statistics.attendanceRate}% 100%
            );
          }
          .stats-details {
            flex: 2;
            margin-left: 40px;
          }
          .attendance-rate {
            font-size: 32px;
            font-weight: bold;
            color: #3498db;
            margin-bottom: 20px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .stat-item {
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid;
          }
          .stat-item.present {
            background: #e3f7e8;
            border-color: #2e8540;
          }
          .stat-item.absent {
            background: #ffe0e0;
            border-color: #d73a49;
          }
          .stat-item.total {
            background: #f8f9fa;
            border-color: #6c757d;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            display: block;
          }
          .stat-value.present { color: #2e8540; }
          .stat-value.absent { color: #d73a49; }
          .stat-value.total { color: #343a40; }
          .stat-label {
            font-size: 12px;
            margin-top: 8px;
            font-weight: bold;
          }
          .students-section {
            margin-bottom: 30px;
          }
          .students-title {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 2px solid #333;
          }
          .students-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .students-table th {
            background: #f8f9fa;
            border: 2px solid #ddd;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            color: #2c3e50;
          }
          .students-table td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            font-size: 11px;
          }
          .students-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .status-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-badge.present {
            background: #e3f7e8;
            color: #2e8540;
            border: 1px solid #2e8540;
          }
          .status-badge.absent {
            background: #ffe0e0;
            color: #d73a49;
            border: 1px solid #d73a49;
          }
          .status-badge.late {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #856404;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            font-size: 11px;
            color: #666;
          }
          .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .footer-left {
            text-align: left;
          }
          .footer-right {
            text-align: right;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Attendance Management System</h1>
          <p class="subtitle">Official Attendance Report</p>
          <div class="meta">
            <span>Generated on: ${currentDate}</span>
            <span>Report ID: ${id}</span>
          </div>
        </div>
        
        <div class="course-info">
          <div class="course-header">
            <div>
              <div class="course-name">${attendanceData?.course?.name || 'Course Name Not Available'}</div>
              <div class="course-id">${attendanceData?.course?.id || 'Course ID Not Available'}</div>
            </div>
            <div class="course-date">${formatDate(attendanceData?.date)}</div>
          </div>
        </div>
        
        <div class="stats-section">
          <div class="chart">
            <div class="chart-circle">
              ${attendanceData.statistics.attendanceRate}%
            </div>
            <div style="font-size: 12px; color: #666;">Attendance Rate</div>
          </div>
          
          <div class="stats-details">
            <div class="attendance-rate">${attendanceData.statistics.attendanceRate}% Attendance Rate</div>
            
            <div class="stats-grid">
              <div class="stat-item present">
                <span class="stat-value present">${attendanceData.statistics.present}</span>
                <span class="stat-label">Present</span>
              </div>
              
              <div class="stat-item absent">
                <span class="stat-value absent">${attendanceData.statistics.absent}</span>
                <span class="stat-label">Absent</span>
              </div>
              
              <div class="stat-item total">
                <span class="stat-value total">${attendanceData.statistics.total}</span>
                <span class="stat-label">Total</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="students-section">
          <h2 class="students-title">Student Attendance Records</h2>
          <table class="students-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${attendanceData?.students?.map((student, index) => `
                <tr>
                  <td>${student.rollNumber || student.studentId || ''}</td>
                  <td>${student.name}</td>
                  <td>
                    <span class="status-badge ${getStatusClass(student.status)}">
                      ${student.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="footer-left">
              <p>Generated on: ${formatDateDDMMYYYY(attendanceData.createdAt)}</p>
              <p>Faculty: ${attendanceData?.course?.faculty || 'Unknown'}</p>
            </div>
            <div class="footer-right">
              <p>Page 1 of 1</p>
              <p>Attend-Ease System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Fetch attendance data function with useCallback
  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      
      // For faculty/admin users
      if (isFacultyOrAdmin) {
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
            course: {
              id: response.data.data.course?.courseCode || response.data.data.course?.id || 'Unknown',
              name: response.data.data.course?.courseName || response.data.data.course?.name || 'Unknown Course',
              faculty: response.data.data.course?.faculty || 'Unknown Faculty',
              facultyId: response.data.data.course?.facultyId || 'Unknown'
            },
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
              name: student.student?.name || student.fullName || student.name || 'Unknown Student',
              rollNumber: student.student?.rollNumber || student.rollNumber || '',
              status: student.status?.toLowerCase() || 'absent'
            }));
          }
          
          setAttendanceData(attendanceWithStats);
        } else {
          throw new Error(response.data.message || 'Failed to load attendance data');
        }
      } else if (isStudent) {
        // For student view, fetch the student's own attendance data
        const response = await axios.get(`${API_ENDPOINTS.GET_STUDENT_ATTENDANCE}?classId=${id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true
        });
        
        if (response.data && response.data.success) {
          setStudentData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to load student attendance data');
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
      setLoading(false);
    }
  }, [id, isFacultyOrAdmin, isStudent]);

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

  const formatDateDDMMYYYY = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="attendance-detail-page-container">
        <div className="attendance-detail-loading-indicator">
          <div className="attendance-detail-spinner"></div>
          <p>Loading attendance details...</p>
        </div>
      </div>
    );
  }
  
  // Check for unapproved faculty restriction
  if (isFacultyOnly && facultyApprovalStatus === false) {
    return (
      <div className="attendance-detail-page-container">
        <div className="attendance-detail-pending-approval">
          <h2>Attendance Details Restricted</h2>
          <p>You can't view attendance details until your account is approved by admin.</p>
          <p>Contact your administrator for approval.</p>
          <button 
            className="attendance-detail-back-button" 
            onClick={() => navigate('/faculty/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-detail-page-container">
        <div className="attendance-detail-error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            className="attendance-detail-back-button" 
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
      <div className="attendance-detail-page-container">
        <div className="attendance-detail-container">
          {/* PDF Header - Only visible when printing */}
          <div className="attendance-detail-pdf-header">
            <h1 className="attendance-detail-pdf-title">Attendance Management System</h1>
            <p className="attendance-detail-pdf-subtitle">Official Attendance Report</p>
            <div className="attendance-detail-pdf-meta">
              <span>Generated on: {new Date().toLocaleString()}</span>
              <span>Report ID: {id}</span>
            </div>
          </div>

          {/* Course Information for PDF */}
          <div className="attendance-detail-pdf-course-info">
            <div className="attendance-detail-pdf-course-header">
              <div>
                <div className="attendance-detail-pdf-course-name">
                  {attendanceData?.course?.name || 'Course Name Not Available'}
                </div>
                <div className="attendance-detail-pdf-course-id">
                  {attendanceData?.course?.id || 'Course ID Not Available'}
                </div>
              </div>
              <div className="attendance-detail-pdf-course-date">
                {formatDate(attendanceData?.date)}
              </div>
            </div>
          </div>

          {/* Statistics Section for PDF */}
          <div className="attendance-detail-pdf-stats">
            <div className="attendance-detail-pdf-chart">
              <div 
                className="attendance-detail-pdf-chart-circle"
                style={{ 
                  background: `conic-gradient(
                    #4CAF50 0% ${attendanceData.statistics.attendanceRate}%, 
                    #F44336 ${attendanceData.statistics.attendanceRate}% 100%
                  )`
                }}
              >
                {attendanceData.statistics.attendanceRate}%
              </div>
              <div style={{ fontSize: '10px', color: '#666' }}>
                Attendance Rate
              </div>
            </div>
            
            <div className="attendance-detail-pdf-stats-details">
              <div className="attendance-detail-pdf-attendance-rate">
                {attendanceData.statistics.attendanceRate}% Attendance Rate
              </div>
              
              <div className="attendance-detail-pdf-stats-grid">
                <div className="attendance-detail-pdf-stat-item present">
                  <span className="attendance-detail-pdf-stat-value present">
                    {attendanceData.statistics.present}
                  </span>
                  <span className="attendance-detail-pdf-stat-label">Present</span>
                </div>
                
                <div className="attendance-detail-pdf-stat-item absent">
                  <span className="attendance-detail-pdf-stat-value absent">
                    {attendanceData.statistics.absent}
                  </span>
                  <span className="attendance-detail-pdf-stat-label">Absent</span>
                </div>
                
                <div className="attendance-detail-pdf-stat-item total">
                  <span className="attendance-detail-pdf-stat-value total">
                    {attendanceData.statistics.total}
                  </span>
                  <span className="attendance-detail-pdf-stat-label">Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Students Table for PDF */}
          <div className="attendance-detail-pdf-students-section">
            <h2 className="attendance-detail-pdf-students-title">Student Attendance Records</h2>
            <table className="attendance-detail-pdf-table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.students?.map((student, index) => (
                  <tr key={student.id || index}>
                    <td>{student.rollNumber || student.studentId}</td>
                    <td>{student.name}</td>
                    <td>
                      <span className={`attendance-detail-pdf-status-badge ${getStatusClass(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PDF Footer */}
          <div className="attendance-detail-pdf-footer">
            <div className="attendance-detail-pdf-footer-content">
              <div className="attendance-detail-pdf-generated">
                <p>Generated on: {formatDateDDMMYYYY(attendanceData.createdAt)}</p>
                <p>Faculty: {attendanceData?.course?.faculty || 'Unknown'}</p>
              </div>
              <div className="attendance-detail-pdf-page-info">
                <p>Page 1 of 1</p>
                <p>Attend-Ease System</p>
              </div>
            </div>
          </div>

          <div className="attendance-detail-content-layout">
            {/* Attendance Summary Section - Left Side */}
            <div className="attendance-detail-summary-section">
              <div className="attendance-detail-header">
                <div className="attendance-detail-statistics-card">
                  <div className="attendance-detail-summary-header">
                    <h2>Attendance Summary</h2>
                    <div className="attendance-detail-action-buttons">
                      <button 
                        className="attendance-detail-print-button" 
                        onClick={generateCustomPDF}
                      >
                        Print / Export
                      </button>
                      <button 
                        className="attendance-detail-export-button" 
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
                      >
                        Export CSV
                      </button>
                    </div>
                  </div>
                  
                  {/* Course Info Header */}
                  <div className="attendance-detail-course-info-header">
                    <div className="attendance-detail-course-info-content">
                      <div className="attendance-detail-course-details">
                        <div className="attendance-detail-course-name">
                          {attendanceData?.course?.name || 'Course Name Not Available'}
                        </div>
                        <div className="attendance-detail-course-id">
                          {attendanceData?.course?.id || 'Course ID Not Available'}
                        </div>
                      </div>
                      
                      <div className="attendance-detail-course-time">
                        <div className="attendance-detail-course-date">
                          {formatDate(attendanceData?.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Statistics Section */}
                  <div className="attendance-detail-statistics-section">
                    {/* Chart and Statistics in horizontal layout */}
                    <div className="attendance-detail-chart-stats-layout">
                      {/* Chart */}
                      <div className="attendance-detail-chart-container">
                        <div 
                          className="attendance-detail-attendance-chart"
                          style={{ 
                            background: `conic-gradient(
                              #4CAF50 0% ${attendanceData.statistics.attendanceRate}%, 
                              #F44336 ${attendanceData.statistics.attendanceRate}% 100%
                            )`
                          }}
                        >
                          <div className="attendance-detail-chart-inner">
                            <div className="attendance-detail-attendance-percentage">
                              {attendanceData.statistics.attendanceRate}%
                            </div>
                          </div>
                        </div>
                        <div className="attendance-detail-chart-legend">
                          <div className="attendance-detail-legend-item">
                            <div className="attendance-detail-legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
                            <span className="attendance-detail-legend-text">Present ({attendanceData.statistics.present})</span>
                          </div>
                          <div className="attendance-detail-legend-item">
                            <div className="attendance-detail-legend-color" style={{ backgroundColor: '#F44336' }}></div>
                            <span className="attendance-detail-legend-text">Absent ({attendanceData.statistics.absent})</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Statistics */}
                      <div className="attendance-detail-stats-container">
                        <div className="attendance-detail-attendance-rate-display">
                          <span className="attendance-detail-rate-value">{attendanceData.statistics.attendanceRate}%</span>
                          <span className="attendance-detail-rate-label">Attendance Rate</span>
                        </div>
                        
                        <div className="attendance-detail-stats-grid">
                          <div className="attendance-detail-stat-item present">
                            <div className="attendance-detail-stat-value present">
                              {attendanceData.statistics.present}
                            </div>
                            <div className="attendance-detail-stat-label present">Present</div>
                          </div>
                          
                          <div className="attendance-detail-stat-item absent">
                            <div className="attendance-detail-stat-value absent">
                              {attendanceData.statistics.absent}
                            </div>
                            <div className="attendance-detail-stat-label absent">Absent</div>
                          </div>
                          
                          <div className="attendance-detail-stat-item total">
                            <div className="attendance-detail-stat-value total">
                              {attendanceData.statistics.total}
                            </div>
                            <div className="attendance-detail-stat-label total">Total</div>
                          </div>
                        </div>
                        <button 
                          className="attendance-detail-refresh-button"
                          onClick={() => {
                            setLoading(true);
                            fetchAttendanceData();
                          }}
                        >
                          <span className="attendance-detail-refresh-icon">↻</span> Refresh Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Student Attendance Records Section - Right Side */}
            <div className="attendance-detail-students-section">
              <div className="attendance-detail-students-container">
                <h3 className="attendance-detail-students-header">
                  Student Attendance Records
                </h3>
                <div className="attendance-detail-table-responsive">
                  <table className="attendance-detail-attendance-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Roll No.</th>
                        <th className="center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.students?.map((student, index) => (
                        <tr key={student.id || index}>
                          <td>{student.name}</td>
                          <td>{student.rollNumber || student.studentId}</td>
                          <td className="center">
                            <span className={`attendance-detail-status-badge ${getStatusClass(student.status)}`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="attendance-detail-footer">
                  <div className="attendance-detail-meta-info">
                    <p>Created on:{formatDateDDMMYYYY(attendanceData.createdAt)}</p>
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
      <div className="attendance-detail-page-container">
        <div className="attendance-detail-student-container">
          <div className="attendance-detail-current-class-card">
            <h3>Current Class: {formatDate(studentData.attendance.currentClass.date)}</h3>
            <div className="attendance-detail-class-details">
              <div className="attendance-detail-class-meta">
                <div className="attendance-detail-meta-item">
                  <span className="attendance-detail-meta-label">Topic:</span>
                  <span className="attendance-detail-meta-value">{studentData.attendance.currentClass.topic}</span>
                </div>
                <div className="attendance-detail-meta-item">
                  <span className="attendance-detail-meta-label">Time:</span>
                  <span className="attendance-detail-meta-value">{studentData.attendance.currentClass.startTime} - {studentData.attendance.currentClass.endTime}</span>
                </div>
                <div className="attendance-detail-meta-item">
                  <span className="attendance-detail-meta-label">Faculty:</span>
                  <span className="attendance-detail-meta-value">{studentData.course.faculty}</span>
                </div>
              </div>
              
              <div className="attendance-detail-class-status">
                <div className="attendance-detail-status-container">
                  <span className="attendance-detail-status-label">Your Status:</span>
                  <span className={`attendance-detail-status-badge large ${getStatusClass(studentData.attendance.currentClass.status)}`}>
                    {studentData.attendance.currentClass.status.charAt(0).toUpperCase() + studentData.attendance.currentClass.status.slice(1)}
                  </span>
                </div>
                {studentData.attendance.currentClass.status !== 'absent' && (
                  <div className="attendance-detail-checkin-time">
                    <span className="attendance-detail-checkin-label">Check-in Time:</span>
                    <span className="attendance-detail-checkin-value">{studentData.attendance.currentClass.checkInTime}</span>
                  </div>
                )}
                {studentData.attendance.currentClass.notes && (
                  <div className="attendance-detail-status-notes">
                    <span className="attendance-detail-notes-label">Notes:</span>
                    <span className="attendance-detail-notes-value">{studentData.attendance.currentClass.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="attendance-detail-attendance-stats-card">
            <h3>Your Attendance Statistics</h3>
            <div className="attendance-detail-stats-content">
              <div className="attendance-detail-stats-chart">
                <div 
                  style={{ 
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
                  }}
                >
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
              <div className="attendance-detail-stats-details">
                <div className="attendance-detail-attendance-percentage">
                  <span className="attendance-detail-percentage-value">{studentData.attendance.courseStats.attendanceRate}%</span>
                  <span className="attendance-detail-percentage-label">Attendance Rate</span>
                </div>
                <div className="attendance-detail-attendance-counts">
                  <div className="attendance-detail-count-item">
                    <span className="attendance-detail-count-value present-count">{studentData.attendance.courseStats.attended}</span>
                    <span className="attendance-detail-count-label">Present</span>
                  </div>
                  <div className="attendance-detail-count-item">
                    <span className="attendance-detail-count-value absent-count">{studentData.attendance.courseStats.absent}</span>
                    <span className="attendance-detail-count-label">Absent</span>
                  </div>
                  <div className="attendance-detail-count-item">
                    <span className="attendance-detail-count-value">{studentData.attendance.courseStats.totalClasses}</span>
                    <span className="attendance-detail-count-label">Total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="attendance-detail-attendance-history-card">
            <h3>Attendance History</h3>
            <div className="attendance-detail-history-list">
              {studentData.attendance.history.map((session, index) => (
                <div key={index} className="attendance-detail-history-item">
                  <div className="attendance-detail-history-date">{formatDate(session.date)}</div>
                  <div className="attendance-detail-history-topic">{session.topic}</div>
                  <div className={`attendance-detail-history-status ${getStatusClass(session.status)}`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="attendance-detail-attendance-policy-card">
            <h3>Attendance Policy</h3>
            <div className="attendance-detail-policy-content">
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
    <div className="attendance-detail-page-container">
      <div className="attendance-detail-unauthorized-message">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this attendance record.</p>
        <button className="attendance-detail-back-button" onClick={() => navigate('/attendance')}>
          Back to Attendance
        </button>
      </div>
    </div>
  );
};

export default AttendanceDetailPage;