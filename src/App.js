import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { RoleRequired } from './components/RoleBasedAccess';
import ApiStatus from './components/ApiStatus';
import { ReportsPage, ReportDetail, AttendanceReportsPage } from './pages/reports';
import { CourseListPage, CourseDetailPage } from './pages/courses';
import { AttendanceListPage, TakeAttendancePage, AttendanceDetailPage, SessionDetailPage } from './pages/attendance';
import { ProfilePage, StatsPage } from './pages/profile';

// Import role-specific pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AttendanceManager from './pages/faculty/AttendanceManager';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';

// Define route access by role
const FACULTY_ADMIN_ROLES = ['faculty', 'admin'];
const ALL_ROLES = ['student', 'faculty', 'admin'];

const App = () => {
  useEffect(() => {
    document.title = 'Attendance Management System';
  }, []);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Student routes */}
            <Route path="/student/dashboard" element={
              <RoleRequired roles={['student']}>
                <StudentDashboard />
              </RoleRequired>
            } />
            <Route path="/student/attendance" element={
              <RoleRequired roles={['student']}>
                <StudentAttendance />
              </RoleRequired>
            } />

            {/* Faculty routes */}
            <Route path="/faculty/dashboard" element={
              <RoleRequired roles={['faculty']}>
                <FacultyDashboard />
              </RoleRequired>
            } />
            <Route path="/faculty/attendance" element={
              <RoleRequired roles={['faculty']}>
                <AttendanceManager />
              </RoleRequired>
            } />
            <Route path="/faculty/attendance/edit/:id" element={
              <RoleRequired roles={['faculty']}>
                <AttendanceManager mode="edit" />
              </RoleRequired>
            } />
            <Route path="/faculty/attendance/:id" element={
              <RoleRequired roles={['faculty']}>
                <AttendanceDetailPage />
              </RoleRequired>
            } />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <RoleRequired roles={['admin']}>
                <AdminDashboard />
              </RoleRequired>
            } />
            <Route path="/admin/users" element={
              <RoleRequired roles={['admin']}>
                <ManageUsers />
              </RoleRequired>
            } />

            {/* Common routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/stats" element={
              <RoleRequired roles={FACULTY_ADMIN_ROLES}>
                <StatsPage />
              </RoleRequired>
            } />
            
            {/* Reports routes - Faculty/Admin only */}
            <Route path="/reports" element={
              <RoleRequired roles={FACULTY_ADMIN_ROLES}>
                <ReportsPage />
              </RoleRequired>
            } />
            <Route path="/reports/attendance" element={
              <RoleRequired roles={FACULTY_ADMIN_ROLES}>
                <AttendanceReportsPage />
              </RoleRequired>
            } />
            <Route path="/reports/:reportId" element={
              <RoleRequired roles={FACULTY_ADMIN_ROLES}>
                <ReportDetail />
              </RoleRequired>
            } />
            
            {/* Courses routes - All users but students see limited data */}
            <Route path="/courses" element={<CourseListPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            
            {/* Attendance routes */}
            <Route path="/attendance" element={<AttendanceListPage />} />
            
            {/* Take attendance - Faculty/Admin only */}
            <Route path="/attendance/take" element={
              <RoleRequired roles={FACULTY_ADMIN_ROLES}>
                <TakeAttendancePage />
              </RoleRequired>
            } />
            
            {/* More specific attendance routes first */}
            <Route path="/attendance/session/:id" element={
              <RoleRequired roles={FACULTY_ADMIN_ROLES}>
                <SessionDetailPage />
              </RoleRequired>
            } />
            
            {/* More specific routes should come before the generic one */}
            <Route path="/attendance/edit/:id" element={
              <RoleRequired roles={FACULTY_ADMIN_ROLES}>
                <AttendanceDetailPage mode="edit" />
              </RoleRequired>
            } />
            
            <Route path="/attendance/course/:courseId" element={<AttendanceListPage filter="course" />} />
            
            {/* Generic attendance detail - Must be last among attendance routes */}
            <Route path="/attendance/:id" element={<AttendanceDetailPage />} />
            
            <Route path="/settings" element={
              <div className="content-container">
                <h1>Settings</h1>
                <div className="content-card">
                  <p>Settings page coming soon...</p>
                </div>
              </div>
            } />
          </Route>
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ApiStatus />
    </>
  );
};

export default App;
