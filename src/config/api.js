import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Development mode flag - set to true to use mock data instead of API calls
export const IS_DEVELOPMENT_MODE = false;

export const API_ENDPOINTS = {
    // Auth endpoints
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    GET_USER: `${API_BASE_URL}/auth/me`,
    
    // User endpoints
    GET_USERS: `${API_BASE_URL}/users`,
    GET_USER_BY_ID: (id) => `${API_BASE_URL}/users/${id}`,
    GET_USER_NAME: (id) => `${API_BASE_URL}/users/${id}/name`,
    UPDATE_USER: (id) => `${API_BASE_URL}/users/${id}`,
    DELETE_USER: (id) => `${API_BASE_URL}/users/${id}`,
    
    // Course endpoints
    GET_COURSES: `${API_BASE_URL}/courses`,
    GET_COURSE_BY_ID: (id) => `${API_BASE_URL}/courses/${id}`,
    CREATE_COURSE: `${API_BASE_URL}/courses`,
    UPDATE_COURSE: (id) => `${API_BASE_URL}/courses/${id}`,
    DELETE_COURSE: (id) => `${API_BASE_URL}/courses/${id}`,
    GET_COURSE_STUDENTS: (id) => `${API_BASE_URL}/courses/${id}/students`,
    
    // Attendance endpoints
    GET_ATTENDANCE: `${API_BASE_URL}/attendance`,
    GET_ATTENDANCE_BY_ID: (id) => `${API_BASE_URL}/attendance/${id}`,
    CREATE_ATTENDANCE: `${API_BASE_URL}/attendance`,
    UPDATE_ATTENDANCE: (id) => `${API_BASE_URL}/attendance/${id}`,
    DELETE_ATTENDANCE: (id) => `${API_BASE_URL}/attendance/${id}`,
    EXPORT_ATTENDANCE: `${API_BASE_URL}/attendance/export`,
    
    // Student endpoints
    GET_STUDENT_DASHBOARD: `${API_BASE_URL}/student/dashboard`,
    GET_STUDENT_ATTENDANCE: `${API_BASE_URL}/student/attendance`,
    GET_STUDENTS_BY_COURSE: (courseId) => `${API_BASE_URL}/students/course/${courseId}`,
    GET_STUDENT_BY_ID: (id) => `${API_BASE_URL}/students/${id}`,
    
    // Faculty endpoints
    GET_FACULTY_DASHBOARD: `${API_BASE_URL}/faculty/dashboard`,
    GET_FACULTY_COURSES: `${API_BASE_URL}/faculty/courses`,
    TAKE_ATTENDANCE: `${API_BASE_URL}/faculty/attendance`,
    GET_LOW_ATTENDANCE: `${API_BASE_URL}/faculty/low-attendance`,
    
    // Admin endpoints
    GET_ADMIN_DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
    GET_ALL_USERS: `${API_BASE_URL}/admin/users`,
    GET_ALL_STUDENTS: `${API_BASE_URL}/admin/students`,
    GET_ALL_FACULTY: `${API_BASE_URL}/admin/faculty`,
    CONVERT_STUDENTS_TO_USERS: `${API_BASE_URL}/admin/convert-students-to-users`,
    
    // Common endpoints
    GET_NOTIFICATIONS: `${API_BASE_URL}/notifications`,
    UPDATE_PASSWORD: `${API_BASE_URL}/user/password`,
    UPDATE_PROFILE: `${API_BASE_URL}/user/profile`
};

export default API_BASE_URL; 