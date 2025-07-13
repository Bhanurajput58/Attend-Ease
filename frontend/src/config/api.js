import axios from 'axios';

// Determine API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create an axios instance with consistent configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000
});

// Add an interceptor to add auth token to all requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Development mode flag - set to true to use mock data instead of API calls
export const IS_DEVELOPMENT_MODE = false;

export const API_ENDPOINTS = {
    // Auth endpoints
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    GET_USER: `${API_BASE_URL}/api/auth/me`,
    
    // User endpoints
    GET_USERS: `${API_BASE_URL}/api/users`,
    GET_USER_BY_ID: (id) => `${API_BASE_URL}/api/users/${id}`,
    GET_USER_NAME: (id) => `${API_BASE_URL}/api/users/${id}/name`,
    UPDATE_USER: (id) => `${API_BASE_URL}/api/users/${id}`,
    DELETE_USER: (id) => `${API_BASE_URL}/api/users/${id}`,
    
    // Course endpoints
    GET_COURSES: `${API_BASE_URL}/api/courses`,
    GET_COURSE: `${API_BASE_URL}/api/courses`,
    GET_COURSE_BY_ID: (id) => `${API_BASE_URL}/api/courses/${id}`,
    CREATE_COURSE: `${API_BASE_URL}/api/courses`,
    UPDATE_COURSE: (id) => `${API_BASE_URL}/api/courses/${id}`,
    DELETE_COURSE: (id) => `${API_BASE_URL}/api/courses/${id}`,
    GET_COURSE_STUDENTS: (id) => `${API_BASE_URL}/api/courses/${id}/students`,
    
    // Attendance endpoints
    GET_ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    GET_ATTENDANCE_BY_ID: (id) => `${API_BASE_URL}/api/attendance/${id}`,
    GET_STUDENT_ATTENDANCE: (id) => `${API_BASE_URL}/api/attendance/student/${id}`,
    CREATE_ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    UPDATE_ATTENDANCE: (id) => `${API_BASE_URL}/api/attendance/${id}`,
    DELETE_ATTENDANCE: (id) => `${API_BASE_URL}/api/attendance/${id}`,
    EXPORT_ATTENDANCE: `${API_BASE_URL}/api/attendance/export`,
    
    // Student endpoints
    GET_STUDENT: `${API_BASE_URL}/api/students`,
    GET_STUDENT_TIMETABLE: (id) => `${API_BASE_URL}/api/students/timetable`,
    GET_STUDENT_NOTIFICATIONS: (id) => `${API_BASE_URL}/api/students/notifications`,
    GET_STUDENT_ASSIGNMENTS: (id) => `${API_BASE_URL}/api/students/${id}/assignments`,
    GET_STUDENTS_BY_COURSE: (courseId) => `${API_BASE_URL}/api/students/course/${courseId}`,
    GET_ALL_STUDENTS: `${API_BASE_URL}/api/students`,
    
    // Faculty endpoints
    GET_FACULTY_DASHBOARD: `${API_BASE_URL}/api/faculty/dashboard`,
    GET_FACULTY_COURSES: `${API_BASE_URL}/api/faculty/courses`,
    GET_FACULTY_STUDENTS: `${API_BASE_URL}/api/faculty/students`,
    TAKE_ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    GET_LOW_ATTENDANCE: (courseId) => `${API_BASE_URL}/api/faculty/low-attendance/${courseId}`,
    
    // Admin endpoints
    GET_ADMIN_DASHBOARD: `${API_BASE_URL}/api/admin/dashboard`,
    GET_ALL_USERS: `${API_BASE_URL}/api/admin/users`
};

export default API_BASE_URL;