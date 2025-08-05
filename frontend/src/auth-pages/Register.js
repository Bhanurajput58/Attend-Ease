import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './Register.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
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
    
    if (!agreeToTerms) {
      showErrorMessageFn('Please agree to the Terms of Service and Privacy Policy');
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
        designation: role === 'faculty' ? designation : undefined
      };
      
      const success = await register(userData);
      
      if (success) {
        setSuccessMessage(`Registration successful as ${role}! Please log in to continue.`);
        setTimeout(() => {
          setSuccessMessage('');
          navigate('/login');
        }, 2500);
        return;
      }
    } catch (error) {
      console.error('Registration error:', error);
      showErrorMessageFn(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Helper to check if the form is valid
  const isFormValid = () => {
    if (!name || !email || !password || !confirmPassword || !role) return false;
    if (role === 'student' || role === 'faculty') {
      if (!department) return false;
    }
    if (role === 'faculty' && !designation) return false;
    if (!agreeToTerms) return false;
    return true;
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-content">
          {/* Left side - Illustration */}
          <div className="register-illustration-section">
            <div className="illustration-content">
              <div className="illustration-graphic">
                <svg viewBox="0 0 400 300" className="register-main-illustration">
                  {/* Person with laptop */}
                  <circle cx="140" cy="120" r="25" fill="#ffa726"/>
                  <rect x="115" y="145" width="50" height="80" fill="#424242"/>
                  <rect x="120" y="150" width="40" height="60" fill="#fff" stroke="#e0e0e0" strokeWidth="2"/>
                  {/* Laptop screen with elements */}
                  <rect x="125" y="155" width="30" height="20" fill="#2196f3"/>
                  <rect x="125" y="178" width="15" height="4" fill="#4caf50"/>
                  <rect x="125" y="185" width="20" height="4" fill="#ff9800"/>
                  <rect x="125" y="192" width="25" height="4" fill="#9c27b0"/>
                  {/* Circular tech elements */}
                  <circle cx="320" cy="80" r="40" fill="#e8f5e8" stroke="#4caf50" strokeWidth="2"/>
                  <path d="M300 80 L320 60 L340 80 L320 100 Z" fill="#4caf50"/>
                  <circle cx="80" cy="200" r="35" fill="#fff3e0" stroke="#ff9800" strokeWidth="2"/>
                  <rect x="65" y="185" width="30" height="30" fill="#ff9800" opacity="0.3"/>
                  <circle cx="300" cy="200" r="30" fill="#f3e5f5" stroke="#9c27b0" strokeWidth="2"/>
                  <circle cx="300" cy="200" r="15" fill="#9c27b0"/>
                  {/* Connecting lines */}
                  <path d="M140 120 Q200 80 280 80" stroke="#e0e0e0" strokeWidth="2" fill="none"/>
                  <path d="M140 180 Q200 200 270 200" stroke="#e0e0e0" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div className="illustration-text">
                <h2>Join AttendEase!</h2>
                <p>Streamline your attendance<br/>management with our<br/>smart tracking system</p>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="form-section">
            <div className="form-content">
              <div className="form-header">
                <h1>Create Your Account</h1>
              </div>

              {/* Role Selection */}
              <div className="role-selection">
                <button 
                  className={`register-role-btn ${role === 'student' ? 'active' : ''}`}
                  onClick={() => setRole('student')}
                  type="button"
                >
                  <span className="role-icon">🎓</span>
                  Student
                </button>
                <button 
                  className={`register-role-btn ${role === 'faculty' ? 'active' : ''}`}
                  onClick={() => setRole('faculty')}
                  type="button"
                >
                  <span className="role-icon">👨‍🏫</span>
                  Educator
                </button>
                <button 
                  className={`register-role-btn ${role === 'admin' ? 'active' : ''}`}
                  onClick={() => setRole('admin')}
                  type="button"
                >
                  <span className="role-icon">🤝</span>
                  Admin
                </button>
              </div>

              {showError && (
                <div className="register-error-message">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="register-toast-success">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="register-form">
                <div className="register-form-group">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting || loading}
                  />
                </div>

                <div className="register-form-group">
                  <input
                    type="email"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting || loading}
                  />
                </div>

                <div className="register-form-group">
                  <input
                    type="password"
                    placeholder="Password *"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting || loading}
                  />
                </div>

                <div className="register-form-group">
                  <input
                    type="password"
                    placeholder="Confirm Password *"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting || loading}
                  />
                </div>

                {/* Role-specific fields */}
                {(role === 'student' || role === 'faculty') && (
                  <div className="register-form-group">
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      disabled={isSubmitting || loading}
                    >
                      <option value="" disabled hidden>Select Department *</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {role === 'faculty' && (
                  <div className="register-form-group">
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      required
                      disabled={isSubmitting || loading}
                    >
                      <option value="" disabled hidden>Select Designation *</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="HOD">Head of Department</option>
                    </select>
                  </div>
                )}

                <div className="terms-checkbox">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    required
                  />
                  <label htmlFor="terms">
                    I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="create-account-btn"
                  disabled={isSubmitting || loading || !isFormValid()}
                >
                  {isSubmitting || loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                </button>
              </form>

              <div className="signin-link">
                <p>Already have an account? <Link to="/login">Sign in</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;