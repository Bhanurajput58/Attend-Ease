import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS, IS_DEVELOPMENT_MODE } from '../config/api';
import API_BASE_URL from '../config/api';

const ApiStatus = () => {
  const [status, setStatus] = useState('Checking...');
  const [error, setError] = useState(null);
  const [isDevelopment] = useState(IS_DEVELOPMENT_MODE);

  useEffect(() => {
    // If in development mode with mock data, don't attempt to connect to API
    if (isDevelopment) {
      setStatus('Mock Data Mode');
      setError(null);
      return;
    }

    const checkApi = async () => {
      try {
        console.log('Checking API connection...');
        console.log('Using API base URL:', API_BASE_URL);
        
        // First try the status endpoint
        const statusResponse = await axios.get(`${API_BASE_URL}/status`, { 
          timeout: 5000 
        });
        console.log('Status endpoint response:', statusResponse.data);
        
        if (statusResponse.data.status === 'online') {
          setStatus('Connected');
          setError(null);
        } else {
          setStatus('Disconnected');
          setError('Server returned unexpected status');
        }
      } catch (err) {
        console.error('API connection error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          config: err.config
        });
        
        // Try alternative health check endpoint
        try {
          const healthResponse = await axios.get(`${API_BASE_URL}`, { 
            timeout: 5000 
          });
          if (healthResponse.status === 200) {
            setStatus('Connected');
            setError(null);
            return;
          }
        } catch (healthErr) {
          console.error('Health check also failed');
        }
        
        // Try ping endpoint as a last resort
        try {
          const pingResponse = await axios.get(`${API_BASE_URL}/ping`, { 
            timeout: 5000 
          });
          if (pingResponse.status === 200) {
            setStatus('Connected');
            setError(null);
            return;
          }
        } catch (pingErr) {
          console.error('Ping endpoint also failed');
        }
        
        setStatus('Disconnected');
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
        } else if (err.request) {
          // The request was made but no response was received
          setError('No response from server. Is the backend running?');
        } else {
          // Something happened in setting up the request that triggered an Error
          setError(`Error: ${err.message}`);
        }
      }
    };

    // Only run the API check if not in development/mock mode
    checkApi();
    const interval = setInterval(checkApi, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [isDevelopment]);

  const styles = {
    container: {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '5px 10px',
      backgroundColor: status === 'Connected' || status === 'Mock Data Mode' ? '#e7f9e7' : '#ffecec',
      border: `1px solid ${status === 'Connected' || status === 'Mock Data Mode' ? '#a3d9a3' : '#f8cbcb'}`,
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 1000,
      display: 'block'
    },
    status: {
      fontWeight: 'bold',
      color: status === 'Connected' ? 'green' : 
             status === 'Mock Data Mode' ? '#2196F3' : 'red'
    },
    error: {
      fontSize: '10px',
      color: '#d32f2f',
      marginTop: '5px'
    },
    mockMessage: {
      fontSize: '10px',
      color: '#2196F3',
      marginTop: '5px'
    }
  };

  return (
    <div style={styles.container}>
      API Status: <span style={styles.status}>{status}</span>
      {error && <div style={styles.error}>{error}</div>}
      {status === 'Mock Data Mode' && 
        <div style={styles.mockMessage}>
          Running with mock data. No API server required.
        </div>
      }
    </div>
  );
};

export default ApiStatus; 