import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, loading, error, setError } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRole, setSelectedRole] = useState('student');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            console.log('Attempting login with:', formData.email);
            const loginResponse = await login(formData.email, formData.password);
            console.log('Login successful', loginResponse);

            if (loginResponse) {
                const role = loginResponse.role || selectedRole;
                switch (role) {
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
                        navigate('/dashboard');
                }
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-left">
                    <div className="illustration-section">
                        <div className="welcome-illustration">
                            <svg viewBox="0 0 400 300" className="main-illustration">
                                {/* Person 1 */}
                                <g className="person-1">
                                    <ellipse cx="90" cy="280" rx="15" ry="8" fill="#f0f0f0" />
                                    <rect x="80" y="200" width="20" height="80" fill="#2c3e50" />
                                    <rect x="75" y="180" width="30" height="40" fill="#e8e8e8" />
                                    <circle cx="90" cy="160" r="20" fill="#f4a261" />
                                    <rect x="85" y="150" width="10" height="15" fill="#2c3e50" />
                                    <rect x="100" y="190" width="8" height="30" fill="#e8e8e8" />
                                    <rect x="108" y="200" width="15" height="3" fill="#f39c12" />
                                </g>

                                {/* Person 2 in circle */}
                                <circle cx="270" cy="180" r="80" fill="white" stroke="#ddd" strokeWidth="2" />
                                <g className="person-2">
                                    <ellipse cx="270" cy="240" rx="12" ry="6" fill="#f0f0f0" />
                                    <rect x="263" y="180" width="14" height="60" fill="#2c3e50" />
                                    <rect x="260" y="165" width="20" height="30" fill="#333" />
                                    <circle cx="270" cy="145" r="15" fill="#8b4513" />
                                    <rect x="266" y="138" width="8" height="12" fill="#2c3e50" />
                                    <rect x="280" y="170" width="6" height="25" fill="#333" />
                                </g>

                                {/* Icons around the circle */}
                                <g className="icons">
                                    <rect x="320" y="100" width="15" height="15" fill="#3498db" opacity="0.7" />
                                    <circle cx="350" cy="140" r="8" fill="#e74c3c" opacity="0.7" />
                                    <polygon points="340,200 355,210 340,220" fill="#f39c12" opacity="0.7" />
                                    <rect x="320" y="240" width="12" height="12" fill="#2ecc71" opacity="0.7" />
                                    <circle cx="220" cy="100" r="6" fill="#9b59b6" opacity="0.7" />
                                    <rect x="190" y="120" width="10" height="10" fill="#1abc9c" opacity="0.7" />
                                    <polygon points="200,240 210,250 200,260" fill="#e67e22" opacity="0.7" />
                                </g>

                                {/* Connecting lines */}
                                <path d="M150 200 Q200 150 250 180" stroke="#3498db" strokeWidth="2" fill="none" opacity="0.3" />
                                <path d="M120 220 Q180 200 240 210" stroke="#e74c3c" strokeWidth="2" fill="none" opacity="0.3" />
                            </svg>
                        </div>
                        <div className="welcome-text">
                            <h1>Welcome Back!</h1>
                            <p>Sign in to access your attendance dashboard and manage your records efficiently.</p>
                        </div>
                    </div>
                </div>

                <div className="login-right">
                    <div className="login-form-container">
                        <div className="login-header">
                            <h2>
                                {selectedRole === 'student' && 'Student Login'}
                                {selectedRole === 'educator' && 'Educator Login'}
                                {selectedRole === 'admin' && 'Admin Login'}
                            </h2>
                            <p>
                                {selectedRole === 'student' && 'Access your classes, attendance, and more.'}
                                {selectedRole === 'educator' && 'Manage your courses and student attendance.'}
                                {selectedRole === 'admin' && 'Administer users and oversee attendance records.'}
                            </p>
                        </div>

                        <div className="role-selector">
                            <button
                                className={`role-btn ${selectedRole === 'student' ? 'active' : ''}`}
                                onClick={() => handleRoleSelect('student')}
                            >
                                Student
                            </button>
                            <button
                                className={`role-btn ${selectedRole === 'educator' ? 'active' : ''}`}
                                onClick={() => handleRoleSelect('educator')}
                            >
                                Educator
                            </button>
                            <button
                                className={`role-btn ${selectedRole === 'admin' ? 'active' : ''}`}
                                onClick={() => handleRoleSelect('admin')}
                            >
                                Admin
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email *"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting || loading}
                                />
                            </div>

                            <div className="form-group">
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password *"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting || loading}
                                />
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <button
                                type="submit"
                                disabled={isSubmitting || loading}
                                className="login-button"
                            >
                                {isSubmitting || loading ? 'LOGGING IN...' : `LOGIN AS ${selectedRole.toUpperCase()}`}
                            </button>
                        </form>

                        <div className="signup-link">
                            <span>Don't have an account? </span>
                            <Link to="/register">Register</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;   