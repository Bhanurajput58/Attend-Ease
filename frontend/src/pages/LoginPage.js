import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthPages.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, loading, error, setError } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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
                const role = loginResponse.role || 'student';
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

    const goToHomepage = () => {
        navigate('/');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <button 
                        className="back-button-inline" 
                        onClick={goToHomepage}
                        aria-label="Go back to homepage"
                    >
                        <ArrowBackIcon />
                    </button>
                    <h2>Login</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting || loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
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
                        className="submit-button"
                    >
                        {isSubmitting || loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register">Register</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 