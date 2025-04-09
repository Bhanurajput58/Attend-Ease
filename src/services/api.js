import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Get API_BASE_URL from the API_ENDPOINTS object
const API_BASE_URL = API_ENDPOINTS.GET_ATTENDANCE.split('/attendance')[0];

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable sending cookies with requests
});

// We no longer need to manually add token to headers since we're using HTTP-only cookies
// Just keep the error handling part
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If we get a 401 Unauthorized error, it means our cookie is invalid or expired
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data);
      // You could trigger a redirect to login page or clear user state here
      // This will be handled by the components using the Auth context
    }
    return Promise.reject(error);
  }
);

export default api; 