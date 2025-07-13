import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import '../../styles/SettingsService.css';

const SettingsServicePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    profile: {
      name: '',
      email: '',
      role: '',
      department: '',
      phone: ''
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    },
    security: {
      twoFactorAuth: false,
      loginNotifications: true,
      passwordExpiry: 90
    }
  });

  // Mock data
  const mockSettings = {
    profile: {
      name: 'Dr. Alan Turing',
      email: 'alan.turing@university.edu',
      role: 'Professor',
      department: 'Computer Science',
      phone: '+1 (555) 123-4567'
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    },
    security: {
      twoFactorAuth: false,
      loginNotifications: true,
      passwordExpiry: 90
    }
  };

  useEffect(() => {
    // Simulate API call to fetch settings
    setTimeout(() => {
      setSettings(mockSettings);
      setLoading(false);
    }, 1000);
  }, []);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // Simulate API call to update profile
    console.log('Updating profile:', settings.profile);
    alert('Profile updated successfully!');
  };

  const handlePreferencesUpdate = (e) => {
    e.preventDefault();
    // Simulate API call to update preferences
    console.log('Updating preferences:', settings.preferences);
    alert('Preferences updated successfully!');
  };

  const handleSecurityUpdate = (e) => {
    e.preventDefault();
    // Simulate API call to update security settings
    console.log('Updating security settings:', settings.security);
    alert('Security settings updated successfully!');
  };

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNotificationChange = (type) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [type]: !prev.preferences.notifications[type]
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="settings-service-page">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-service-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="settings-sections">
        {/* Profile Settings */}
        <section className="settings-section">
          <h2>Profile Settings</h2>
          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={settings.profile.name}
                onChange={(e) => handleChange('profile', 'name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={settings.profile.email}
                onChange={(e) => handleChange('profile', 'email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <input
                type="text"
                id="role"
                value={settings.profile.role}
                onChange={(e) => handleChange('profile', 'role', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                value={settings.profile.department}
                onChange={(e) => handleChange('profile', 'department', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={settings.profile.phone}
                onChange={(e) => handleChange('profile', 'phone', e.target.value)}
                required
              />
            </div>
            <button type="submit" className="save-button">Save Profile</button>
          </form>
        </section>

        {/* Preferences Settings */}
        <section className="settings-section">
          <h2>Preferences</h2>
          <form onSubmit={handlePreferencesUpdate}>
            <div className="form-group">
              <label>Notification Preferences</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.preferences.notifications.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                  Email Notifications
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.preferences.notifications.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                  Push Notifications
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.preferences.notifications.sms}
                    onChange={() => handleNotificationChange('sms')}
                  />
                  SMS Notifications
                </label>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={settings.preferences.theme}
                onChange={(e) => handleChange('preferences', 'theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={settings.preferences.language}
                onChange={(e) => handleChange('preferences', 'language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                value={settings.preferences.timezone}
                onChange={(e) => handleChange('preferences', 'timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <option value="GMT">GMT</option>
              </select>
            </div>
            <button type="submit" className="save-button">Save Preferences</button>
          </form>
        </section>

        {/* Security Settings */}
        <section className="settings-section">
          <h2>Security Settings</h2>
          <form onSubmit={handleSecurityUpdate}>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => handleChange('security', 'twoFactorAuth', e.target.checked)}
                />
                Enable Two-Factor Authentication
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.security.loginNotifications}
                  onChange={(e) => handleChange('security', 'loginNotifications', e.target.checked)}
                />
                Receive Login Notifications
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="passwordExpiry">Password Expiry (days)</label>
              <input
                type="number"
                id="passwordExpiry"
                value={settings.security.passwordExpiry}
                onChange={(e) => handleChange('security', 'passwordExpiry', parseInt(e.target.value))}
                min="30"
                max="365"
              />
            </div>
            <button type="submit" className="save-button">Save Security Settings</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SettingsServicePage; 