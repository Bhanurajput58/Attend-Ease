import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { LineChart, PieChart } from '../../components/charts';
import '../../styles/ProfilePage.css';
// Import icons from react-icons library
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaBriefcase, FaGraduationCap, FaIdCard, FaCalendarAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    bio: '',
    address: '',
    profileImage: ''
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Basic profile data based on user role
  const basicProfileData = {
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    joinDate: new Date().toISOString().split('T')[0],
    phone: '',
    department: '',
    designation: '',
    bio: '',
    address: '',
    profileImage: '',
    // Role-specific data
    ...(user?.role === 'faculty' && {
      coursesCount: 0,
      studentsCount: 0,
      publications: [],
      education: [],
      skills: [],
      attendanceHistory: [],
      courseDistribution: []
    }),
    ...(user?.role === 'student' && {
      enrollmentDate: new Date().toISOString().split('T')[0],
      currentSemester: '',
      major: '',
      gpa: '',
      attendanceHistory: [],
      enrolledCourses: []
    }),
    ...(user?.role === 'admin' && {
      department: 'Administration',
      designation: 'Administrator',
      responsibilities: [],
      systemAccess: []
    })
  };

  useEffect(() => {
    // Set basic profile data
    setProfileData(basicProfileData);
    setFormData({
      name: basicProfileData.name,
      email: basicProfileData.email,
      phone: basicProfileData.phone,
      department: basicProfileData.department,
      designation: basicProfileData.designation,
      bio: basicProfileData.bio,
      address: basicProfileData.address,
      profileImage: basicProfileData.profileImage
    });
    setLoading(false);
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (editing && formDataChanged()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        resetForm();
        setEditing(false);
      }
    } else {
      setEditing(!editing);
    }
  };

  const resetForm = () => {
    setFormData({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      department: profileData.department,
      designation: profileData.designation,
      bio: profileData.bio,
      address: profileData.address,
      profileImage: profileData.profileImage
    });
  };

  const formDataChanged = () => {
    return formData.name !== profileData.name ||
      formData.email !== profileData.email ||
      formData.phone !== profileData.phone ||
      formData.department !== profileData.department ||
      formData.designation !== profileData.designation ||
      formData.bio !== profileData.bio ||
      formData.address !== profileData.address ||
      formData.profileImage !== profileData.profileImage;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    // Simulate API call to update profile
    setTimeout(() => {
      // Update local profile data with form data
      setProfileData(prev => ({
        ...prev,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        bio: formData.bio,
        address: formData.address,
        profileImage: formData.profileImage
      }));

      setSaving(false);
      setEditing(false);
      setSuccessMessage('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <button
          className={`edit-button ${editing ? 'cancel' : ''}`}
          onClick={handleEditToggle}
        >
          {editing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit Profile</>}
        </button>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-image-container">
            <img
              src={profileData.profileImage || 'https://via.placeholder.com/150'}
              alt={profileData.name}
              className="profile-image"
            />
            {editing && (
              <div className="image-upload-controls">
                <label htmlFor="profileImage">Change Image</label>
                <input
                  type="text"
                  id="profileImage"
                  name="profileImage"
                  value={formData.profileImage}
                  onChange={handleInputChange}
                  placeholder="Image URL"
                  className="form-control"
                />
              </div>
            )}
          </div>

          <div className="profile-meta">
            <div className="profile-id"><FaIdCard style={{ marginRight: '8px' }} /> ID: {profileData.id}</div>
            <div className={`profile-role ${profileData.role}`}>{profileData.role}</div>
            <div className="profile-join-date"><FaCalendarAlt style={{ marginRight: '8px' }} /> Joined: {new Date(profileData.joinDate).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="profile-main">
          {editing ? (
            <form onSubmit={handleSubmit} className="profile-edit-form">
              <div className="form-section">
                <h3>Personal Informa</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name"><FaUser style={{ marginRight: '6px' }} />Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email"><FaEnvelope style={{ marginRight: '6px' }} />Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone"><FaPhone style={{ marginRight: '6px' }} />Phone</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address"><FaMapMarkerAlt style={{ marginRight: '6px' }} />Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Professional Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="department"><FaBuilding style={{ marginRight: '6px' }} />Department</label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="designation"><FaBriefcase style={{ marginRight: '6px' }} />Designation</label>
                    <input
                      type="text"
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    className="form-control"
                  ></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={saving || !formDataChanged()}
                >
                  {saving ? 'Saving...' : <><FaSave style={{ marginRight: '8px' }} /> Save Changes</>}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label"><FaUser style={{ marginRight: '6px' }} />Full Name</span>
                    <span className="detail-value">{profileData.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><FaEnvelope style={{ marginRight: '6px' }} />Email</span>
                    <span className="detail-value">{profileData.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><FaPhone style={{ marginRight: '6px' }} />Phone</span>
                    <span className="detail-value">{profileData.phone || 'Not set'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><FaMapMarkerAlt style={{ marginRight: '6px' }} />Address</span>
                    <span className="detail-value">{profileData.address || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Professional Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label"><FaBuilding style={{ marginRight: '6px' }} />Department</span>
                    <span className="detail-value">{profileData.department || 'Not set'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><FaBriefcase style={{ marginRight: '6px' }} />Designation</span>
                    <span className="detail-value">{profileData.designation || 'Not set'}</span>
                  </div>
                </div>

                {profileData.bio && (
                  <div className="bio-container">
                    <h4>Bio</h4>
                    <p className="bio-text">{profileData.bio}</p>
                  </div>
                )}
              </div>

              {/* Role-specific sections */}
              {user?.role === 'faculty' && (
                <div className="detail-section">
                  <h3>Faculty Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label"><FaGraduationCap style={{ marginRight: '6px' }} />Courses</span>
                      <span className="detail-value">{profileData.coursesCount || 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label"><FaUser style={{ marginRight: '6px' }} />Students</span>
                      <span className="detail-value">{profileData.studentsCount || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {user?.role === 'student' && (
                <div className="detail-section">
                  <h3>Student Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label"><FaCalendarAlt style={{ marginRight: '6px' }} />Enrollment Date</span>
                      <span className="detail-value">{profileData.enrollmentDate || 'Not set'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label"><FaGraduationCap style={{ marginRight: '6px' }} />Current Semester</span>
                      <span className="detail-value">{profileData.currentSemester || 'Not set'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label"><FaGraduationCap style={{ marginRight: '6px' }} />Major</span>
                      <span className="detail-value">{profileData.major || 'Not set'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label"><FaGraduationCap style={{ marginRight: '6px' }} />GPA</span>
                      <span className="detail-value">{profileData.gpa || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              )}

              {user?.role === 'admin' && (
                <div className="detail-section">
                  <h3>Administrator Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label"><FaBuilding style={{ marginRight: '6px' }} />Department</span>
                      <span className="detail-value">{profileData.department || 'Administration'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label"><FaBriefcase style={{ marginRight: '6px' }} />Designation</span>
                      <span className="detail-value">{profileData.designation || 'Administrator'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 