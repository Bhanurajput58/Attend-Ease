import React from 'react';
import useAuth from '../hooks/useAuth';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="page-container"><h2>Loading...</h2></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
      </div>
      <div className="profile-container">
        <div className="profile-card">
          <img
            src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
            alt={user.name}
            className="profile-image"
          />
          <h2>{user.name}</h2>
          <p className="user-role">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          <div className="profile-info">
            <div><strong>Email:</strong> {user.email}</div>
            {user.phone && <div><strong>Phone:</strong> {user.phone}</div>}
            {user.department && <div><strong>Department:</strong> {user.department}</div>}
            {user.designation && <div><strong>Designation:</strong> {user.designation}</div>}
          </div>
        </div>
        <div className="profile-details">
          {user.role === 'student' && (
            <>
              <h2>Student Details</h2>
              <div><strong>Roll Number:</strong> {user.rollNumber || 'N/A'}</div>
              <div><strong>Program:</strong> {user.program || 'N/A'}</div>
              <div><strong>Semester:</strong> {user.semester || 'N/A'}</div>
              <div><strong>GPA:</strong> {user.gpa || 'N/A'}</div>
              {/* Add more student-specific sections here */}
            </>
          )}
          {user.role === 'faculty' && (
            <>
              <h2>Faculty Details</h2>
              <div><strong>Courses Taught:</strong> {user.courses ? user.courses.join(', ') : 'N/A'}</div>
              <div><strong>Research/Interests:</strong> {user.research || 'N/A'}</div>
              {/* Add more faculty-specific sections here */}
            </>
          )}
          {user.role === 'admin' && (
            <>
              <h2>Admin Details</h2>
              <div><strong>System Roles:</strong> {user.systemRoles ? user.systemRoles.join(', ') : 'Admin'}</div>
              {/* Add more admin-specific sections here */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 