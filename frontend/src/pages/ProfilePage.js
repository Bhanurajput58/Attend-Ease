import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import './ProfilePage.css';
import { api } from '../config/api';

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser) return;
      setLoading(true);
      setError(null);
      let endpoint = '';
      // If we already have studentId, always use it
      if (authUser.role === 'student' && studentId) {
        endpoint = `/api/students/${studentId}`;
        try {
          const res = await api.get(endpoint);
          if (res.data.success) {
            setProfile(res.data.data);
          } else {
            setError('Profile not found');
          }
        } catch (err) {
          setError('Failed to fetch profile');
        } finally {
          setLoading(false);
        }
        return;
      }
      // If student and no studentId yet, fetch by user id using new endpoint
      if (authUser.role === 'student') {
        try {
          const res = await api.get(`/api/students/by-user/${authUser.id || authUser._id}`);
          if (res.data.success && res.data.data && res.data.data._id) {
            setStudentId(res.data.data._id);
            setProfile(res.data.data);
          } else {
            setError('Profile not found');
          }
        } catch (err) {
          setError('Failed to fetch profile');
        } finally {
          setLoading(false);
        }
        return;
      }
      // Faculty and admin logic unchanged
      if (authUser.role === 'faculty') {
        try {
          // Try to get faculty by user ID (custom endpoint)
          const resByUser = await api.get(`/api/faculties/by-user/${authUser.id || authUser._id}`);
          console.log('Faculty fetch response:', resByUser.data);
          if (resByUser.data.success && resByUser.data.data && resByUser.data.data._id) {
            console.log('Faculty profile fetched successfully:', resByUser.data.data);
            console.log('Faculty ID:', resByUser.data.data._id);
            setProfile(resByUser.data.data);
            setLoading(false);
            return;
          } else {
            console.log('Faculty profile not found in response:', resByUser.data);
            setError('Faculty profile not found');
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching faculty profile:', err);
          console.error('Error response:', err.response?.data);
          setError('Failed to fetch faculty profile');
          setLoading(false);
          return;
        }
      } else if (authUser.role === 'admin') {
        endpoint = `/api/admins/${authUser.id || authUser._id}`;
      }
      if (endpoint) {
        try {
          const res = await api.get(endpoint);
          if (res.data.success) {
            setProfile(res.data.data);
          } else {
            setError('Profile not found');
          }
        } catch (err) {
          setError('Failed to fetch profile');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
    // Only refetch if authUser or studentId changes
  }, [authUser, studentId]);

  if (loading) {
    return <div className="page-container"><h2>Loading...</h2></div>;
  }
  if (error) {
    return <div className="page-container"><h2>{error}</h2></div>;
  }
  if (!profile) {
    return <div className="page-container"><h2>No profile data found.</h2></div>;
  }

  // Modal logic (edit form) remains unchanged, but uses profile data
  const handleEditClick = () => {
    // Ensure qualifications is always an array for editing
    let editProfile = { ...profile };
    if (editProfile.qualifications && typeof editProfile.qualifications === 'string') {
      editProfile.qualifications = editProfile.qualifications.split(',').map(q => q.trim()).filter(q => q);
    } else if (!Array.isArray(editProfile.qualifications)) {
      editProfile.qualifications = [];
    }
    setFormData(editProfile);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);
  const handleChange = (e) => {
    if (e.target.name === 'qualifications') {
      setFormData({ ...formData, qualifications: e.target.value });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };
  const handleSave = async (e) => {
    e.preventDefault();
    let submitData = { ...formData };
    // Convert qualifications to array if it's a string
    if (authUser.role === 'faculty' && typeof submitData.qualifications === 'string') {
      submitData.qualifications = submitData.qualifications.split(',').map(q => q.trim()).filter(q => q);
    }
    if (authUser.role === 'student') {
      try {
        const res = await api.put(`/api/students/${profile._id}`, submitData);
        if (res.data.success) {
          setProfile(res.data.data);
          setIsModalOpen(false);
        } else {
          setError(res.data.message || 'Failed to update profile');
        }
      } catch (err) {
        setError('Failed to update profile');
      }
    } else if (authUser.role === 'faculty') {
      try {
        // Only update faculties collection
        console.log('Updating faculty with ID:', profile._id);
        console.log('Faculty profile data:', profile);
        console.log('Submit data:', submitData);
        const res = await api.put(`/api/faculties/${profile._id}`, submitData);
        if (res.data.success) {
          // Refetch from faculties collection to ensure up-to-date data
          const refetch = await api.get(`/api/faculties/by-user/${authUser.id || authUser._id}`);
          if (refetch.data.success && refetch.data.data) {
            setProfile(refetch.data.data);
          } else {
            setProfile(res.data.data);
          }
          setIsModalOpen(false);
        } else {
          setError(res.data.message || 'Failed to update profile');
        }
      } catch (err) {
        console.error('Faculty update error:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        setError('Failed to update profile');
      }
    } else {
      setIsModalOpen(false); // For other roles, just close for now
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <button className="edit-profile-btn" onClick={handleEditClick}>Edit Profile</button>
      </div>
      <div className="profile-container">
        <div className="profile-card">
          <img
            src={profile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`}
            alt={profile.name}
            className="profile-image"
          />
          <h2>{profile.name}</h2>
          <p className="user-role">{authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1)}</p>
          <div className="profile-info">
            <div><strong>Email:</strong> {profile.email}</div>
            {profile.phone && <div><strong>Phone:</strong> {profile.phone}</div>}
            {profile.department && <div><strong>Department:</strong> {profile.department}</div>}
            {profile.designation && <div><strong>Designation:</strong> {profile.designation}</div>}
          </div>
        </div>
        <div className="profile-details">
          {authUser.role === 'student' && (
            <>
              <h2>Student Details</h2>
              <div><strong>Roll Number:</strong> {profile.rollNumber || 'N/A'}</div>
              <div><strong>Name:</strong> {profile.name || 'N/A'}</div>
              <div><strong>Email:</strong> {profile.email || 'N/A'}</div>
              <div><strong>Department:</strong> {profile.department || 'N/A'}</div>
              <div><strong>Semester:</strong> {profile.semester || 'N/A'}</div>
              <div><strong>GPA:</strong> {profile.gpa || 'N/A'}</div>
            </>
          )}
          {authUser.role === 'faculty' && (
            <>
              <h2>Faculty Details</h2>
              <div><strong>Department:</strong> {profile.department || 'N/A'}</div>
              <div><strong>Designation:</strong> {profile.designation || 'N/A'}</div>
              <div><strong>Employee ID:</strong> {profile.employeeId || 'N/A'}</div>
              <div><strong>Specialization:</strong> {profile.specialization || 'N/A'}</div>
              <div><strong>Qualifications:</strong> {profile.qualifications ? profile.qualifications.join(', ') : 'N/A'}</div>
              <div><strong>Courses:</strong> {profile.courses ? profile.courses.length : 0}</div>
            </>
          )}
          {authUser.role === 'admin' && (
            <>
              <h2>Admin Details</h2>
              <div><strong>Admin ID:</strong> {profile.adminId || 'N/A'}</div>
              <div><strong>Department:</strong> {profile.department || 'N/A'}</div>
              <div><strong>Designation:</strong> {profile.designation || 'N/A'}</div>
              <div><strong>Permissions:</strong> {profile.permissions ? Object.keys(profile.permissions).filter(k => profile.permissions[k]).join(', ') : 'N/A'}</div>
              <div><strong>Last Login:</strong> {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}</div>
            </>
          )}
        </div>
      </div>
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSave} className="edit-profile-form">
              <label>
                Name:
                <input name="name" value={formData.name || ''} onChange={handleChange} />
              </label>
              <label>
                Email:
                <input name="email" value={formData.email || ''} onChange={handleChange} />
              </label>
              {/* Role-specific fields */}
              {authUser.role === 'student' && (
                <>
                  <label>
                    Roll Number:
                    <input name="rollNumber" value={formData.rollNumber || ''} onChange={handleChange} />
                  </label>
                  <label>
                    Department:
                    <input name="department" value={formData.department || ''} onChange={handleChange} />
                  </label>
                  <label>
                    Semester:
                    <input name="semester" value={formData.semester || ''} onChange={handleChange} />
                  </label>
                  
                  
                  <label>
                    GPA:
                    <input name="gpa" value={formData.gpa || ''} onChange={handleChange} />
                  </label>
                </>
              )}
              {authUser.role === 'faculty' && (
                <>
                  <label>
                    Department:
                    <input name="department" value={formData.department || ''} onChange={handleChange} />
                  </label>
                  <label>
                    Designation:
                    <input name="designation" value={formData.designation || ''} onChange={handleChange} />
                  </label>
                  <label>
                    Employee ID:
                    <input name="employeeId" value={formData.employeeId || ''} onChange={handleChange} />
                  </label>
                  <label>
                    Specialization:
                    <input name="specialization" value={formData.specialization || ''} onChange={handleChange} />
                  </label>
                  <label>
                    Qualifications:
                    <input name="qualifications" value={Array.isArray(formData.qualifications) ? formData.qualifications.join(', ') : (formData.qualifications || '')} onChange={handleChange} />
                  </label>
                </>
              )}
              {authUser.role === 'admin' && (
                <>
                  <label>
                    Admin ID:
                    <input name="adminId" value={formData.adminId || ''} onChange={handleChange} />
                  </label>
                  <label>
                    Department:
                    <input name="department" value={formData.department || ''} onChange={handleChange} />
                  </label>
                  <label>
                    Designation:
                    <input name="designation" value={formData.designation || ''} onChange={handleChange} />
                  </label>
                </>
              )}
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 