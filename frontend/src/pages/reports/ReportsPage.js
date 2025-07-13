import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { BarChart, PieChart, LineChart } from '../../components/charts';
import '../../styles/Reports.css';

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('');
  const [timeRange, setTimeRange] = useState('month');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [attendanceStatus, setAttendanceStatus] = useState({});

  // Mock data
  const mockCourses = [
    { id: 'CS101', name: 'Computer Science 101' },
    { id: 'DB202', name: 'Database Systems' },
    { id: 'SE303', name: 'Software Engineering' },
    { id: 'DS205', name: 'Data Structures' },
    { id: 'AI404', name: 'Artificial Intelligence' },
  ];

  const mockSavedReports = [
    {
      id: 1,
      title: 'CS101 Monthly Attendance Report - October 2023',
      type: 'attendance',
      course: 'Computer Science 101',
      courseId: 'CS101',
      timeRange: 'month',
      generatedDate: '2023-11-01T10:15:00',
      createdBy: 'Dr. Alan Turing',
    },
    {
      id: 2,
      title: 'Database Systems Weekly Overview - Week 44, 2023',
      type: 'overview',
      course: 'Database Systems',
      courseId: 'DB202',
      timeRange: 'week',
      generatedDate: '2023-11-05T14:30:00',
      createdBy: 'Dr. Grace Hopper',
    },
    {
      id: 3,
      title: 'Student Participation - Software Engineering (Fall 2023)',
      type: 'student',
      course: 'Software Engineering',
      courseId: 'SE303',
      timeRange: 'semester',
      generatedDate: '2023-11-02T09:45:00',
      createdBy: 'Dr. Linus Torvalds',
    },
    {
      id: 4,
      title: 'Low Attendance Alert - Data Structures',
      type: 'alert',
      course: 'Data Structures',
      courseId: 'DS205',
      timeRange: 'custom',
      generatedDate: '2023-10-28T11:20:00',
      createdBy: 'System',
    }
  ];

  // Mock report data (simplified example)
  const mockReportData = {
    attendance: {
      course: 'Computer Science 101',
      courseId: 'CS101',
      period: 'November 2023',
      overallRate: 88,
      totalSessions: 12,
      totalStudents: 45,
      attendanceByDay: [
        { date: '2023-11-01', rate: 91, present: 41, absent: 4 },
        { date: '2023-11-03', rate: 87, present: 39, absent: 6 },
        { date: '2023-11-06', rate: 93, present: 42, absent: 3 },
        { date: '2023-11-08', rate: 84, present: 38, absent: 7 },
        { date: '2023-11-10', rate: 89, present: 40, absent: 5 },
        { date: '2023-11-13', rate: 91, present: 41, absent: 4 },
        { date: '2023-11-15', rate: 87, present: 39, absent: 6 },
        { date: '2023-11-17', rate: 82, present: 37, absent: 8 },
        { date: '2023-11-20', rate: 89, present: 40, absent: 5 },
        { date: '2023-11-22', rate: 91, present: 41, absent: 4 },
        { date: '2023-11-24', rate: 84, present: 38, absent: 7 },
        { date: '2023-11-27', rate: 89, present: 40, absent: 5 }
      ],
      topAttendingStudents: [
        { name: 'Jane Smith', attendance: 100, studentId: 'S2312346' },
        { name: 'Eva Martinez', attendance: 100, studentId: 'S2312351' },
        { name: 'Grace Lee', attendance: 91.7, studentId: 'S2312353' },
        { name: 'John Doe', attendance: 91.7, studentId: 'S2312345' },
        { name: 'David Wilson', attendance: 91.7, studentId: 'S2312350' }
      ],
      lowAttendingStudents: [
        { name: 'Henry Clark', attendance: 66.7, studentId: 'S2312354' },
        { name: 'Frank Thomas', attendance: 75.0, studentId: 'S2312352' },
        { name: 'Bob Johnson', attendance: 83.3, studentId: 'S2312347' }
      ]
    },
    overview: {
      course: 'Computer Science 101',
      courseId: 'CS101',
      period: 'November 2023',
      attendanceRate: 88,
      enrollmentRate: 90,
      completionRate: 85,
      performance: {
        excellent: 20,
        good: 15,
        average: 8,
        poor: 2
      },
      topTopics: [
        'Object-Oriented Programming',
        'Algorithms',
        'Data Structures'
      ]
    },
    student: {
      course: 'Design and Analysis of Algorithms',
      courseId: 'CS2007',
      period: 'November 2023',
      studentPerformance: [
        {
          name: 'John Doe',
          studentId: 'S2312345',
          attendance: 91.7,
          participation: 85,
          assignments: 94,
          status: 'active'
        },
        {
          name: 'Jane Smith',
          studentId: 'S2312346',
          attendance: 100,
          participation: 92,
          assignments: 97,
          status: 'active'
        },
        {
          name: 'Bob Johnson',
          studentId: 'S2312347',
          attendance: 83.3,
          participation: 78,
          assignments: 85,
          status: 'active'
        },
        {
          name: 'Alice Williams',
          studentId: 'S2312348',
          attendance: 88.9,
          participation: 82,
          assignments: 90,
          status: 'active'
        },
        {
          name: 'Charlie Brown',
          studentId: 'S2312349',
          attendance: 88.9,
          participation: 75,
          assignments: 82,
          status: 'active'
        }
      ]
    },
    alert: {
      course: 'Computer Science 101',
      courseId: 'CS101',
      period: 'November 2023',
      alerts: [
        {
          type: 'Low Attendance',
          description: 'Henry Clark has missed 4 out of the last 12 sessions',
          studentId: 'S2312354',
          studentName: 'Henry Clark',
          severity: 'high'
        },
        {
          type: 'Declining Attendance',
          description: 'Attendance rate has dropped by 6% in the past week',
          severity: 'medium'
        },
        {
          type: 'Participation Alert',
          description: 'Multiple students showing low participation levels',
          severity: 'medium'
        }
      ]
    }
  };

  useEffect(() => {
    // Simulate API calls to get courses and saved reports
    setTimeout(() => {
      setCourses(mockCourses);
      setSavedReports(mockSavedReports);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reportType || !courseId) {
      alert('Please select both a report type and a course');
      return;
    }
    
    setGenerating(true);
    setGeneratedReport(null);
    
    // Simulate API call to generate report
    setTimeout(() => {
      const reportData = mockReportData[reportType];
      
      setGeneratedReport({
        title: `${courses.find(c => c.id === courseId)?.name} ${getTimeRangeLabel(timeRange)} ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        type: reportType,
        course: courses.find(c => c.id === courseId)?.name,
        courseId,
        timeRange,
        generatedDate: new Date().toISOString(),
        data: reportData
      });
      
      setGenerating(false);
    }, 2000);
  };

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'semester': return 'Semester';
      case 'year': return 'Yearly';
      case 'custom': return 'Custom';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAttendanceChange = (studentId, isPresent) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: isPresent
    }));
  };

  const handleSaveAttendance = () => {
    // Here you would typically make an API call to save the attendance
    console.log('Saving attendance:', attendanceStatus);
    alert('Attendance saved successfully!');
  };

  const renderGeneratedReport = () => {
    if (!generatedReport) return null;
    
    const { title, type, course, data, generatedDate } = generatedReport;
    
    return (
      <div className="generated-report">
        <div className="report-header">
          <h3>{title}</h3>
          <div className="report-meta">
            <span>Generated: {formatDate(generatedDate)}</span>
          </div>
        </div>
        
        <div className="report-actions">
          <button className="save-report-btn">Save Report</button>
          <button className="export-report-btn">Export ({exportFormat.toUpperCase()})</button>
          <button className="print-report-btn" onClick={() => window.print()}>Print</button>
        </div>
        
        <div className="report-content">
          {type === 'attendance' && (
            <div className="attendance-report">
              <div className="report-summary">
                <div className="summary-card">
                  <span className="summary-value">{data.overallRate}%</span>
                  <span className="summary-label">Overall Attendance</span>
                </div>
                <div className="summary-card">
                  <span className="summary-value">{data.totalSessions}</span>
                  <span className="summary-label">Total Sessions</span>
                </div>
                <div className="summary-card">
                  <span className="summary-value">{data.totalStudents}</span>
                  <span className="summary-label">Total Students</span>
                </div>
              </div>
              
              <div className="report-section">
                <h4>Attendance by Day</h4>
                <LineChart 
                  data={data.attendanceByDay.map(day => ({
                    label: new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    value: day.rate
                  }))}
                  height={250}
                  lineColor="#3498db"
                  showArea={true}
                  valueFormatter={value => `${value}%`}
                />
              </div>
              
              <div className="report-section">
                <h4>Top Attending Students</h4>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topAttendingStudents.map((student, index) => (
                      <tr key={index}>
                        <td>{student.studentId}</td>
                        <td>{student.name}</td>
                        <td>{student.attendance}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="report-section">
                <h4>Low Attending Students</h4>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lowAttendingStudents.map((student, index) => (
                      <tr key={index}>
                        <td>{student.studentId}</td>
                        <td>{student.name}</td>
                        <td>{student.attendance}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {type === 'overview' && (
            <div className="overview-report">
              <div className="report-summary">
                <div className="summary-card">
                  <span className="summary-value">{data.attendanceRate}%</span>
                  <span className="summary-label">Attendance Rate</span>
                </div>
                <div className="summary-card">
                  <span className="summary-value">{data.enrollmentRate}%</span>
                  <span className="summary-label">Enrollment Rate</span>
                </div>
                <div className="summary-card">
                  <span className="summary-value">{data.completionRate}%</span>
                  <span className="summary-label">Completion Rate</span>
                </div>
              </div>
              
              <div className="report-section">
                <h4>Performance Distribution</h4>
                <PieChart 
                  data={[
                    { label: 'Excellent', value: data.performance.excellent, color: '#2ecc71' },
                    { label: 'Good', value: data.performance.good, color: '#3498db' },
                    { label: 'Average', value: data.performance.average, color: '#f39c12' },
                    { label: 'Poor', value: data.performance.poor, color: '#e74c3c' }
                  ]}
                  size={220}
                />
              </div>
              
              <div className="report-section">
                <h4>Top Topics</h4>
                <ul className="topics-list">
                  {data.topTopics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {type === 'student' && (
            <div className="student-report">
              <div className="report-section">
                <h4>Student Performance</h4>
                <div className="attendance-controls">
                  <button 
                    className="save-attendance-btn"
                    onClick={handleSaveAttendance}
                  >
                    Save Attendance
                  </button>
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Attendance</th>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Attendance %</th>
                      <th>Participation</th>
                      <th>Assignments</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.studentPerformance.map((student, index) => (
                      <tr key={index}>
                        <td>
                          <div className="attendance-checkbox">
                            <input
                              type="checkbox"
                              id={`attendance-${student.studentId}`}
                              checked={attendanceStatus[student.studentId] || false}
                              onChange={(e) => handleAttendanceChange(student.studentId, e.target.checked)}
                            />
                            <label htmlFor={`attendance-${student.studentId}`}>
                              Present
                            </label>
                          </div>
                        </td>
                        <td>{student.studentId}</td>
                        <td>{student.name}</td>
                        <td>{student.attendance}%</td>
                        <td>{student.participation}%</td>
                        <td>{student.assignments}%</td>
                        <td>
                          <span className={`status-badge status-${student.status}`}>
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {type === 'alert' && (
            <div className="alert-report">
              <div className="report-section">
                <h4>Alerts</h4>
                <div className="alerts-list">
                  {data.alerts.map((alert, index) => (
                    <div key={index} className={`alert-item severity-${alert.severity}`}>
                      <div className="alert-header">
                        <span className="alert-type">{alert.type}</span>
                        <span className="alert-severity">{alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}</span>
                      </div>
                      <div className="alert-description">{alert.description}</div>
                      {alert.studentName && (
                        <div className="alert-student">
                          Student: {alert.studentName} ({alert.studentId})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>
      
      <div className="reports-container">
        <div className="reports-sidebar">
          <div className="report-generator">
            <h3>Generate New Report</h3>
            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-group">
                <label htmlFor="reportType">Report Type</label>
                <select 
                  id="reportType" 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)} 
                  className="form-control"
                  required
                >
                  <option value="">-- Select Report Type --</option>
                  <option value="attendance">Attendance Report</option>
                  <option value="overview">Course Overview</option>
                  <option value="student">Student Performance</option>
                  <option value="alert">Alerts & Notifications</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="courseId">Course</label>
                <select 
                  id="courseId" 
                  value={courseId} 
                  onChange={(e) => setCourseId(e.target.value)} 
                  className="form-control"
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="timeRange">Time Range</label>
                <select 
                  id="timeRange" 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)} 
                  className="form-control"
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="semester">Semester</option>
                  <option value="year">Yearly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {timeRange === 'custom' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date</label>
                    <input type="date" id="startDate" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">End Date</label>
                    <input type="date" id="endDate" className="form-control" />
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="exportFormat">Export Format</label>
                <select 
                  id="exportFormat" 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value)} 
                  className="form-control"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="generate-button"
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </form>
          </div>
          
          <div className="saved-reports">
            <h3>Saved Reports</h3>
            <div className="reports-list">
              {savedReports.map(report => (
                <div key={report.id} className="report-item">
                  <div className="report-title">{report.title}</div>
                  <div className="report-meta">
                    <span className="report-type">{report.type.charAt(0).toUpperCase() + report.type.slice(1)}</span>
                    <span className="report-date">{formatDate(report.generatedDate)}</span>
                  </div>
                  <div className="report-actions">
                    <button className="view-report-btn">View</button>
                    <button className="download-report-btn">Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="report-content-area">
          {generating ? (
            <div className="generating-report">
              <div className="spinner"></div>
              <p>Generating your report...</p>
            </div>
          ) : generatedReport ? (
            renderGeneratedReport()
          ) : (
            <div className="report-placeholder">
              <div className="placeholder-icon">📊</div>
              <h3>No Report Generated</h3>
              <p>Select a report type and course, then click "Generate Report" to create a new report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage; 