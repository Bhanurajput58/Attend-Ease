import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { FaUser, FaSignOutAlt, FaHome, FaChartBar, FaCalendarAlt, FaUsers, FaCog, FaFileAlt } from 'react-icons/fa';
import '../styles/Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const avatarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    setDropdownOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'student':
        return [
          { path: '/student/dashboard', label: 'Dashboard', icon: <FaHome /> },
          { path: '/student/attendance', label: 'Attendance', icon: <FaCalendarAlt /> }
        ];
      case 'faculty':
        return [
          { path: '/faculty/dashboard', label: 'Dashboard', icon: <FaHome /> },
          { path: '/faculty/attendance', label: 'Take Attendance', icon: <FaCalendarAlt /> },
          { path: '/reports/attendance', label: 'Reports', icon: <FaFileAlt /> }
        ];
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: <FaHome /> },
          { path: '/admin/courses', label: 'Courses', icon: <FaCalendarAlt /> },
          { path: '/admin/users', label: 'Users', icon: <FaUsers /> },
          { path: '/admin/settings', label: 'Settings', icon: <FaCog /> }
        ];
      default:
        return [];
    }
  };

  // Helper to get first letter of name
  const getInitial = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="logo">
          <span className="logo-text">Attend-Ease</span>
        </Link>
      </div>

      <div className="header-right">
        {user ? (
          <>
            <div className="navbar-menu">
              {getNavLinks().map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="nav-link"
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span className="nav-label">{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="navbar-end">
              {(user.role === 'student' || user.role === 'faculty' || user.role === 'admin') ? (
                <div className="student-header-avatar-group" ref={avatarRef}>
                  <span className="student-header-hi">Hi, {user.name}</span>
                  <div className="student-header-avatar" onClick={handleAvatarClick}>
                    {getInitial(user.name)}
                  </div>
                  {dropdownOpen && (
                    <div className="student-header-dropdown">
                      <div
                        className="student-header-dropdown-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          if (user.role === 'student') navigate('/student/profile');
                          else if (user.role === 'faculty') navigate('/faculty/profile');
                          else if (user.role === 'admin') navigate('/admin/profile');
                        }}
                      >
                        <FaUser style={{ marginRight: 8 }} /> My Profile
                      </div>
                      <div
                        className="student-header-dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt style={{ marginRight: 8, color: 'red' }} />
                        <span style={{ color: 'red' }}>Logout</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="user-info">
                    <span className="user-name">{user?.name}</span>
                    <span className={`user-role ${user?.role}`}>{user?.role}</span>
                  </div>
                  <button onClick={handleLogout} className="logout-button">
                    <FaSignOutAlt className="logout-icon" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="navbar-menu">
              <a href="#about" className="nav-link">About Us</a>
              <a href="#features" className="nav-link">Features</a>
              <a href="#contact" className="nav-link">Contact</a>
            </div>
            <div className="navbar-end">
              <Link to="/login" className="btn-login nav-link">Login</Link>
              <Link to="/register" className="btn-register nav-link">Register</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header; 