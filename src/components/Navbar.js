import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { FaUser, FaSignOutAlt, FaHome, FaChartBar, FaCalendarAlt, FaUsers, FaCog, FaFileAlt } from 'react-icons/fa';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'student':
        return [
          { path: '/student/dashboard', label: 'Dashboard', icon: <FaHome /> },
          { path: '/student/attendance', label: 'Attendance', icon: <FaCalendarAlt /> },
          { path: '/profile', label: 'Profile', icon: <FaUser /> }
        ];
      case 'faculty':
        return [
          { path: '/faculty/dashboard', label: 'Dashboard', icon: <FaHome /> },
          { path: '/faculty/courses', label: 'Courses', icon: <FaChartBar /> },
          { path: '/faculty/attendance', label: 'Take Attendance', icon: <FaCalendarAlt /> },
          { path: '/reports/attendance', label: 'Reports', icon: <FaFileAlt /> },
          { path: '/profile', label: 'Profile', icon: <FaUser /> }
        ];
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: <FaHome /> },
          { path: '/admin/users', label: 'Users', icon: <FaUsers /> },
          { path: '/admin/settings', label: 'Settings', icon: <FaCog /> },
          { path: '/profile', label: 'Profile', icon: <FaUser /> }
        ];
      default:
        return [];
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="logo">
          <span className="logo-text">Attend-Ease</span>
        </Link>
      </div>

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
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className={`user-role ${user?.role}`}>{user?.role}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          <FaSignOutAlt className="logout-icon" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 