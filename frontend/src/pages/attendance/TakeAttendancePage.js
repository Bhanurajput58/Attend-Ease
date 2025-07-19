import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useHasRole } from '../../components/RoleBasedAccess';
import { BarChart } from '../../components/charts';

const TakeAttendancePage = () => {
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFacultyOrAdmin = useHasRole(['faculty', 'admin']);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    topic: '',
    notes: ''
  });

  useEffect(() => {
    // Simulate API call to fetch course and student data
    setTimeout(() => {
      const mockCourseData = {
        id: parseInt(id),
        code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Fundamental concepts of computer science and programming.',
        faculty: 'Dr. Alan Turing',
        facultyId: 'FAC1001',
        schedule: 'Mon, Wed, Fri - 9:00 AM to 10:30 AM',
        semester: 'Fall 2023',
        department: 'Computer Science'
      };

      const mockStudentList = [
        { id: 1, name: 'John Doe', studentId: 'S2312345', status: 'present', time: '', notes: '' },
        { id: 2, name: 'Jane Smith', studentId: 'S2312346', status: 'present', time: '', notes: '' },
        { id: 3, name: 'Bob Johnson', studentId: 'S2312347', status: 'present', time: '', notes: '' },
        { id: 4, name: 'Alice Williams', studentId: 'S2312348', status: 'present', time: '', notes: '' },
        { id: 5, name: 'Charlie Brown', studentId: 'S2312349', status: 'present', time: '', notes: '' },
        { id: 6, name: 'David Wilson', studentId: 'S2312350', status: 'present', time: '', notes: '' },
        { id: 7, name: 'Eva Martinez', studentId: 'S2312351', status: 'present', time: '', notes: '' },
        { id: 8, name: 'Frank Thomas', studentId: 'S2312352', status: 'present', time: '', notes: '' },
        { id: 9, name: 'Grace Lee', studentId: 'S2312353', status: 'present', time: '', notes: '' },
        { id: 10, name: 'Henry Clark', studentId: 'S2312354', status: 'present', time: '', notes: '' }
      ];

      // Set current time as default start time
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      
      // Calculate an end time 1.5 hours from now
      const endTime = new Date(now.getTime() + 90 * 60000);
      const endHours = endTime.getHours().toString().padStart(2, '0');
      const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
      const calculatedEndTime = `${endHours}:${endMinutes}`;

      setSessionData(prev => ({
        ...prev,
        startTime: currentTime,
        endTime: calculatedEndTime
      }));

      setCourseData(mockCourseData);
      setStudentList(mockStudentList);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleSessionDataChange = (e) => {
    const { name, value } = e.target;
    setSessionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentStatusChange = (studentId, field, value) => {
    setStudentList(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { ...student, [field]: value }
          : student
      )
    );
  };

  const markAll = (status) => {
    setStudentList(prev => 
      prev.map(student => ({
        ...student,
        status,
        time: status === 'present' ? '09:00 AM' : '',
        notes: ''
      }))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call to save attendance data
    setTimeout(() => {
      console.log('Attendance data saved', {
        courseId: courseData.id,
        sessionData,
        students: studentList
      });
      setSubmitting(false);
      // Redirect to the attendance session detail page
      navigate(`/attendance/session/1`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading course data...</p>
        </div>
      </div>
    );
  }

  if (!isFacultyOrAdmin) {
    return (
      <div className="page-container">
        <div className="unauthorized-message">
          <h2>Access Denied</h2>
          <p>Only faculty and administrators can take attendance.</p>
          <button className="back-button" onClick={() => navigate('/attendance')}>
            Back to Attendance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">{courseData.name}</h1>
          <p className="page-subtitle">Taking attendance for {courseData.code}</p>
        </div>
        
        <div className="page-actions">
          <button className="back-button" onClick={() => navigate('/attendance')}>
            Cancel
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="attendance-form">
        <div className="form-section">
          <h2>Session Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={sessionData.date}
                onChange={handleSessionDataChange}
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={sessionData.startTime}
                onChange={handleSessionDataChange}
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={sessionData.endTime}
                onChange={handleSessionDataChange}
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="topic">Topic</label>
              <input
                type="text"
                id="topic"
                name="topic"
                value={sessionData.topic}
                onChange={handleSessionDataChange}
                placeholder="Enter the topic covered in this session"
                className="form-control"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Session Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={sessionData.notes}
              onChange={handleSessionDataChange}
              placeholder="Enter any notes about this session"
              className="form-control"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <div className="section-header">
            <h2>Student Attendance</h2>
            <div className="bulk-actions">
              <button 
                type="button" 
                className="action-button present" 
                onClick={() => markAll('present')}
              >
                Mark All Present
              </button>
              <button 
                type="button" 
                className="action-button absent" 
                onClick={() => markAll('absent')}
              >
                Mark All Absent
              </button>
            </div>
          </div>
          
          <div className="students-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Check-in Time</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {studentList.map(student => (
                  <tr key={student.id}>
                    <td>{student.studentId}</td>
                    <td>{student.name}</td>
                    <td>
                      <select
                        value={student.status}
                        onChange={(e) => handleStudentStatusChange(student.id, 'status', e.target.value)}
                        className={`status-select ${student.status}`}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="time"
                        value={student.time}
                        onChange={(e) => handleStudentStatusChange(student.id, 'time', e.target.value)}
                        disabled={student.status === 'absent'}
                        className="time-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={student.notes}
                        onChange={(e) => handleStudentStatusChange(student.id, 'notes', e.target.value)}
                        placeholder="Add notes"
                        className="notes-input"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="form-footer">
          <button 
            type="submit" 
            className="submit-button" 
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Attendance'}
          </button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate('/attendance')}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TakeAttendancePage; 