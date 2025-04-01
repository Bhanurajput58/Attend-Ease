import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/AuthPages.css';

// Register component
const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState('1');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, isAuthenticated, error, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        switch (user.role) {
          case 'student':
            navigate('/student/dashboard');
            break;
          case 'faculty':
            navigate('/faculty/dashboard');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    }
  }, [isAuthenticated, navigate]);

  // Display auth context errors
  useEffect(() => {
    if (error) {
      showErrorMessageFn(error);
    }
  }, [error]);

  const showErrorMessageFn = (message) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!name || !email || !password || !confirmPassword || !role) {
      showErrorMessageFn('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }
    
    if (password !== confirmPassword) {
      showErrorMessageFn('Passwords do not match');
      setIsSubmitting(false);
      return;
    }
    
    if (password.length < 6) {
      showErrorMessageFn('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const userData = {
        name,
        email,
        password,
        role,
        department: role === 'student' || role === 'faculty' ? department : undefined,
        semester: role === 'student' ? semester : undefined,
        designation: role === 'faculty' ? designation : undefined
      };
      
      const success = await register(userData);
      
      if (success) {
        // Show success message
        alert(`Registration successful as ${role}! Please log in to continue.`);
        
        // Navigate to login page
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showErrorMessageFn(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Departments list
  const departments = [
    'Computer Science',
    'Information Technology',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electronics & Communication',
    'Chemical Engineering',
    'Biotechnology'
  ];

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Attendance System</h1>
            <p>Create New Account</p>
          </div>
          
          {showError && (
            <div className="auth-error">
              {errorMessage}
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting || loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting || loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                disabled={isSubmitting || loading}
              />
              <small style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px', display: 'block' }}>
                Password must be at least 6 characters. Your password will be securely encrypted.
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting || loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="role">Register as</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="role-select"
                disabled={isSubmitting || loading}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              <div className={`role-badge ${role}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </div>
            </div>
            
            {/* Role-specific fields */}
            {(role === 'student' || role === 'faculty') && (
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  disabled={isSubmitting || loading}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
            
            {role === 'student' && (
              <div className="form-group">
                <label htmlFor="semester">Semester</label>
                <select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  required
                  disabled={isSubmitting || loading}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem.toString()}>{sem}</option>
                  ))}
                </select>
              </div>
            )}
            
            {role === 'faculty' && (
              <div className="form-group">
                <label htmlFor="designation">Designation</label>
                <select
                  id="designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                  disabled={isSubmitting || loading}
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="HOD">Head of Department</option>
                </select>
              </div>
            )}
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account?
            <Link to="/login" className="auth-link">Login Here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 