import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, PieChart, LineChart } from '../../components/charts';
import '../../styles/Reports.css';

const ReportDetail = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Mock data for this example
  const mockReports = [
    {
      id: 1,
      title: 'CS101 Monthly Attendance Report - October 2023',
      type: 'attendance',
      course: 'Computer Science 101',
      courseId: 'CS101',
      timeRange: 'month',
      generatedDate: '2023-11-01T10:15:00',
      createdBy: 'Dr. Alan Turing',
      data: {
        period: 'October 2023',
        overallRate: 88,
        totalSessions: 12,
        totalStudents: 45,
        attendanceByDay: [
          { date: '2023-10-01', rate: 91, present: 41, absent: 4 },
          { date: '2023-10-03', rate: 87, present: 39, absent: 6 },
          { date: '2023-10-06', rate: 93, present: 42, absent: 3 },
          { date: '2023-10-08', rate: 84, present: 38, absent: 7 },
          { date: '2023-10-10', rate: 89, present: 40, absent: 5 },
          { date: '2023-10-13', rate: 91, present: 41, absent: 4 },
          { date: '2023-10-15', rate: 87, present: 39, absent: 6 },
          { date: '2023-10-17', rate: 82, present: 37, absent: 8 },
          { date: '2023-10-20', rate: 89, present: 40, absent: 5 },
          { date: '2023-10-22', rate: 91, present: 41, absent: 4 },
          { date: '2023-10-24', rate: 84, present: 38, absent: 7 },
          { date: '2023-10-27', rate: 89, present: 40, absent: 5 }
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
      }
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
      data: {
        period: 'Week 44, 2023',
        attendanceRate: 82,
        enrollmentRate: 90,
        completionRate: 78,
        performance: {
          excellent: 18,
          good: 12,
          average: 10,
          poor: 5
        },
        topTopics: [
          'SQL Queries',
          'Database Normalization',
          'Transaction Management'
        ]
      }
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
      data: {
        period: 'Fall 2023',
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
      }
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
      data: {
        period: 'October 15-28, 2023',
        alerts: [
          {
            type: 'Low Attendance',
            description: 'Henry Clark has missed 4 out of the last 6 sessions',
            studentId: 'S2312354',
            studentName: 'Henry Clark',
            severity: 'high'
          },
          {
            type: 'Declining Attendance',
            description: 'Attendance rate has dropped by 12% in the past two weeks',
            severity: 'high'
          },
          {
            type: 'Participation Alert',
            description: 'Multiple students showing low participation levels',
            severity: 'medium'
          }
        ]
      }
    }
  ];

  useEffect(() => {
    // Simulate fetching report from API
    setTimeout(() => {
      const foundReport = mockReports.find(r => r.id === parseInt(reportId));
      
      if (foundReport) {
        setReport(foundReport);
      } else {
        // If report not found, we could redirect to reports page
        // For now, we'll just set a dummy "not found" state
        console.error(`Report with ID ${reportId} not found`);
      }
      
      setLoading(false);
    }, 1000);
  }, [reportId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    // In a real app, this would trigger a download in the specified format
    alert(`Exporting report in ${exportFormat.toUpperCase()} format...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderAttendanceReport = (data) => {
    return (
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
    );
  };

  const renderOverviewReport = (data) => {
    return (
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
    );
  };

  const renderStudentReport = (data) => {
    return (
      <div className="student-report">
        <div className="report-section">
          <h4>Student Performance</h4>
          <table className="report-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Attendance</th>
                <th>Participation</th>
                <th>Assignments</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.studentPerformance.map((student, index) => (
                <tr key={index}>
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
    );
  };

  const renderAlertReport = (data) => {
    return (
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
    );
  };

  const renderReportContent = () => {
    if (!report || !report.data) return null;
    
    switch (report.type) {
      case 'attendance':
        return renderAttendanceReport(report.data);
      case 'overview':
        return renderOverviewReport(report.data);
      case 'student':
        return renderStudentReport(report.data);
      case 'alert':
        return renderAlertReport(report.data);
      default:
        return (
          <div className="report-error">
            <p>Unknown report type: {report.type}</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page-container">
        <div className="error-container">
          <h2>Report Not Found</h2>
          <p>The report you're looking for doesn't exist or has been deleted.</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/reports')}
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <button 
            className="back-button" 
            onClick={() => navigate('/reports')}
          >
            &larr; Back to Reports
          </button>
          <h1 className="page-title">{report.title}</h1>
        </div>
      </div>

      <div className="report-detail-container">
        <div className="report-metadata">
          <div className="metadata-row">
            <div className="metadata-item">
              <span className="metadata-label">Course:</span>
              <span className="metadata-value">{report.course}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Period:</span>
              <span className="metadata-value">{report.data.period}</span>
            </div>
          </div>
          <div className="metadata-row">
            <div className="metadata-item">
              <span className="metadata-label">Generated:</span>
              <span className="metadata-value">{formatDate(report.generatedDate)}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Created By:</span>
              <span className="metadata-value">{report.createdBy}</span>
            </div>
          </div>
        </div>

        <div className="report-actions">
          <div className="export-options">
            <label htmlFor="exportFormat">Export as:</label>
            <select 
              id="exportFormat" 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button className="btn-export" onClick={handleExport}>
              Export
            </button>
          </div>
          <button className="btn-print" onClick={handlePrint}>
            Print
          </button>
        </div>

        <div className="report-content">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportDetail; 