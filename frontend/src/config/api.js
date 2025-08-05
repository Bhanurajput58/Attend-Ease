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
    console.log('Axios interceptor - Token from localStorage:', token ? 'exists' : 'not found');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Axios interceptor - Added Authorization header');
    }
    console.log('Axios interceptor - Request URL:', config.url);
    console.log('Axios interceptor - Request headers:', config.headers);
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor to log errors
api.interceptors.response.use(
  response => {
    console.log('Axios response interceptor - Success:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('Axios response interceptor - Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
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
    GET_COURSE_ATTENDANCE: (courseId) => `${API_BASE_URL}/api/attendance/course/${courseId}`,
    GET_COURSE_ATTENDANCE_DASHBOARD: (courseId) => `${API_BASE_URL}/api/attendance/course/${courseId}`,
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
    GET_STUDENT_BY_USER_ID: (userId) => `${API_BASE_URL}/api/students/by-user/${userId}`,
    GET_ATTENDANCE_GOAL: (studentId) => `${API_BASE_URL}/api/students/${studentId}/attendance-goal`,
    UPDATE_ATTENDANCE_GOAL: (studentId) => `${API_BASE_URL}/api/students/${studentId}/attendance-goal`,
    EXPORT_STUDENT_ATTENDANCE_REPORT: (studentId) => `${API_BASE_URL}/api/students/${studentId}/export-attendance-report`,
    
    // Faculty endpoints
    GET_FACULTY_DASHBOARD: `${API_BASE_URL}/api/faculty/dashboard`,
    GET_FACULTY_COURSES: `${API_BASE_URL}/api/faculty/courses`,
    GET_FACULTY_STUDENTS: `${API_BASE_URL}/api/faculty/students`,
    TAKE_ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    GET_LOW_ATTENDANCE: (courseId) => `${API_BASE_URL}/api/faculty/low-attendance/${courseId}`,
    SEND_LOW_ATTENDANCE_EMAILS: `${API_BASE_URL}/api/faculty/send-low-attendance-emails`,
    UPDATE_FACULTY: (id) => `${API_BASE_URL}/api/faculties/${id}`,
    
    // Notification endpoints
    SEND_NOTIFICATIONS: `${API_BASE_URL}/api/notifications/send`,
    GET_NOTIFICATION_STATS: `${API_BASE_URL}/api/notifications/stats`,
    GET_STUDENT_NOTIFICATIONS: (id) => `${API_BASE_URL}/api/notifications/student/${id}`,
    MARK_NOTIFICATION_READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
    MARK_ALL_NOTIFICATIONS_READ: (id) => `${API_BASE_URL}/api/notifications/student/${id}/read-all`,
    TEST_EMAIL_SERVICE: `${API_BASE_URL}/api/notifications/test-email`,
    GET_EMAIL_SERVICE_STATUS: `${API_BASE_URL}/api/notifications/email-status`,
    
    // Admin endpoints
    GET_ADMIN_DASHBOARD: `${API_BASE_URL}/api/admin/dashboard`,
    GET_ALL_USERS: `${API_BASE_URL}/api/admin/users`,
    
    // Statistics endpoints
    GET_HOMEPAGE_STATS: `${API_BASE_URL}/api/statistics/homepage`,
    
    // Contact endpoints
    SUBMIT_CONTACT_FORM: `${API_BASE_URL}/api/contact`,
    
    // Newsletter endpoints
    SUBSCRIBE_NEWSLETTER: `${API_BASE_URL}/api/newsletter/subscribe`,
    
    // Export endpoints
    EXPORT_USERS: `${API_BASE_URL}/api/admin/export/users`,
    EXPORT_COURSES: `${API_BASE_URL}/api/admin/export/courses`
};

export default API_BASE_URL;