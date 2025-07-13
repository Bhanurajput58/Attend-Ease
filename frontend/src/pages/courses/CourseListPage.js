import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import '../../styles/DashboardPage.css';

const CourseListPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    department: 'all',
    semester: 'all',
    status: 'all'
  });
  
  // Mock data
  const mockCourses = [
    {
      id: 'CS101',
      name: 'Computer Science 101',
      description: 'Introduction to computer science and programming fundamentals.',
      department: 'Computer Science',
      semester: 'Fall 2023',
      credits: 3,
      faculty: 'Dr. Alan Turing',
      facultyId: 'FAC1001',
      schedule: 'MWF 9:00 AM - 10:30 AM',
      location: 'Science Building, Room 301',
      enrolledStudents: 45,
      capacity: 50,
      status: 'active',
      attendanceRate: 92
    },
    {
      id: 'DB202',
      name: 'Database Systems',
      description: 'Design and implementation of database management systems.',
      department: 'Computer Science',
      semester: 'Fall 2023',
      credits: 4,
      faculty: 'Dr. Grace Hopper',
      facultyId: 'FAC1002',
      schedule: 'TTh 10:00 AM - 11:30 AM',
      location: 'Engineering Building, Room 105',
      enrolledStudents: 38,
      capacity: 40,
      status: 'active',
      attendanceRate: 88
    },
    {
      id: 'SE303',
      name: 'Software Engineering',
      description: 'Principles and practices of software development and project management.',
      department: 'Software Engineering',
      semester: 'Fall 2023',
      credits: 4,
      faculty: 'Dr. Linus Torvalds',
      facultyId: 'FAC1003',
      schedule: 'MWF 1:00 PM - 2:30 PM',
      location: 'Tech Building, Room 205',
      enrolledStudents: 35,
      capacity: 40,
      status: 'active',
      attendanceRate: 85
    },
    {
      id: 'DS205',
      name: 'Data Structures',
      description: 'Advanced data structures and algorithms for efficient programming.',
      department: 'Computer Science',
      semester: 'Spring 2023',
      credits: 3,
      faculty: 'Dr. Ada Lovelace',
      facultyId: 'FAC1004',
      schedule: 'TTh 11:00 AM - 12:30 PM',
      location: 'Science Building, Room 201',
      enrolledStudents: 32,
      capacity: 35,
      status: 'completed',
      attendanceRate: 91
    },
    {
      id: 'AI404',
      name: 'Artificial Intelligence',
      description: 'Fundamentals of AI, machine learning, and neural networks.',
      department: 'Computer Science',
      semester: 'Winter 2023',
      credits: 4,
      faculty: 'Dr. Geoffrey Hinton',
      facultyId: 'FAC1005',
      schedule: 'MWF 3:00 PM - 4:30 PM',
      location: 'Innovation Building, Room 405',
      enrolledStudents: 25,
      capacity: 30,
      status: 'upcoming',
      attendanceRate: null
    },
    {
      id: 'NW304',
      name: 'Computer Networks',
      description: 'Principles of computer networking and protocol design.',
      department: 'Computer Engineering',
      semester: 'Fall 2023',
      credits: 3,
      faculty: 'Dr. Vint Cerf',
      facultyId: 'FAC1006',
      schedule: 'TTh 1:00 PM - 2:30 PM',
      location: 'Engineering Building, Room 308',
      enrolledStudents: 28,
      capacity: 35,
      status: 'active',
      attendanceRate: 86
    },
    {
      id: 'ML505',
      name: 'Machine Learning',
      description: 'Advanced techniques in machine learning and data science.',
      department: 'Data Science',
      semester: 'Winter 2023',
      credits: 4,
      faculty: 'Dr. Andrew Ng',
      facultyId: 'FAC1007',
      schedule: 'MWF 10:00 AM - 11:30 AM',
      location: 'Data Center, Room 105',
      enrolledStudents: 20,
      capacity: 25,
      status: 'upcoming',
      attendanceRate: null
    },
    {
      id: 'CS203',
      name: 'Computer Architecture',
      description: 'Study of computer organization and architecture.',
      department: 'Computer Engineering',
      semester: 'Spring 2023',
      credits: 3,
      faculty: 'Dr. John von Neumann',
      facultyId: 'FAC1008',
      schedule: 'TTh 3:00 PM - 4:30 PM',
      location: 'Engineering Building, Room 201',
      enrolledStudents: 30,
      capacity: 35,
      status: 'completed',
      attendanceRate: 89
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCourses(mockCourses);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  // Filter and search courses
  const filteredCourses = courses.filter(course => {
    // Apply search term filter
    if (searchTerm && !course.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !course.id.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !course.faculty.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply dropdown filters
    if (filter.department !== 'all' && course.department !== filter.department) {
      return false;
    }
    
    if (filter.semester !== 'all' && course.semester !== filter.semester) {
      return false;
    }
    
    if (filter.status !== 'all' && course.status !== filter.status) {
      return false;
    }
    
    return true;
  });

  // Get unique values for filter dropdowns
  const departments = [...new Set(courses.map(course => course.department))];
  const semesters = [...new Set(courses.map(course => course.semester))];
  const statuses = [...new Set(courses.map(course => course.status))];
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'upcoming': return 'status-upcoming';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Courses</h1>
        <Link to="/courses/new" className="add-button">
          Add New Course
        </Link>
      </div>
      
      <div className="filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="filter-dropdowns">
          <div className="filter-item">
            <label htmlFor="department">Department:</label>
            <select
              id="department"
              name="department"
              value={filter.department}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Departments</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="semester">Semester:</label>
            <select
              id="semester"
              name="semester"
              value={filter.semester}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Semesters</option>
              {semesters.map((sem, index) => (
                <option key={index} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status, index) => (
                <option key={index} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="results-info">
        <p>Showing {filteredCourses.length} of {courses.length} courses</p>
      </div>
      
      <div className="courses-grid">
        {filteredCourses.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-header">
              <h3 className="course-title">{course.name}</h3>
              <span className={`status-badge ${getStatusBadgeClass(course.status)}`}>
                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              </span>
            </div>
            
            <div className="course-id">{course.id}</div>
            
            <p className="course-description">{course.description}</p>
            
            <div className="course-details">
              <div className="detail-item">
                <span className="detail-label">Faculty:</span>
                <span className="detail-value">{course.faculty}</span>
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
              <div className="detail-item">
                <span className="detail-label">Credits:</span>
                <span className="detail-value">{course.credits}</span>
              </div>
            </div>
            
            <div className="enrollment-bar">
              <div 
                className="enrollment-progress" 
                style={{ width: `${(course.enrolledStudents / course.capacity) * 100}%` }}
              ></div>
              <span className="enrollment-text">
                {course.enrolledStudents}/{course.capacity} Students
              </span>
            </div>
            
            {course.attendanceRate !== null && (
              <div className="attendance-info">
                <span className="attendance-label">Attendance Rate:</span>
                <span className="attendance-value">{course.attendanceRate}%</span>
              </div>
            )}
            
            <div className="course-actions">
              <Link to={`/courses/${course.id}`} className="view-button">
                View Details
              </Link>
              <Link to={`/attendance/course/${course.id}`} className="attendance-button">
                Attendance
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {filteredCourses.length === 0 && (
        <div className="empty-state">
          <p>No courses found matching your filters.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilter({ department: 'all', semester: 'all', status: 'all' });
            }}
            className="reset-filters-button"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseListPage; 