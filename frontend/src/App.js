import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './auth-pages/Home';
import Login from './auth-pages/Login';
import Register from './auth-pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { RoleRequired } from './components/RoleBasedAccess';
import { ReportsPage, ReportDetail, AttendanceReportsPage } from './pages/reports';
import { AttendanceListPage, AttendanceDetailPage } from './pages/attendance';
import StudentsListPage from './pages/faculty/StudentsListPage';
import StudentDetailsPage from './pages/admin/StudentDetailsPage';
import Header from './components/Header';
import Profile from './auth-pages/Profile';
import NotificationCenter from './pages/notifications/NotificationCenter';
import { NotificationProvider } from './context/NotificationContext';

// Import role-specific pages
import StudentDashboard from './pages/students/StudentDashboard';
import StudentAttendance from './pages/students/StudentAttendance';
import CourseAttendanceDetail from './pages/students/CourseAttendanceDetail';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AttendanceManager from './pages/faculty/AttendanceManager';
import LowAttendancePage from './pages/faculty/LowAttendancePage';
import LowAttendanceOverview from './pages/faculty/LowAttendanceOverview';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import CourseList from './pages/admin/CourseList';

// Define route access by role
const FACULTY_ADMIN_ROLES = ['faculty', 'admin'];
const ALL_ROLES = ['student', 'faculty', 'admin'];

const App = () => {
  useEffect(() => {
    document.title = 'Attendance Management System';
  }, []);

  return (
    <NotificationProvider>
      <Header />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Global profile page for all roles */}
          <Route path="/student/profile/:studentId" element={<Profile />} />
          <Route path="/student/profile" element={<Profile />} />
          <Route path="/faculty/profile" element={<Profile />} />
          <Route path="/admin/profile" element={<Profile />} />
          
          {/* Notification Center - All roles */}
          <Route path="/notifications" element={
            <RoleRequired roles={ALL_ROLES}>
              <NotificationCenter />
            </RoleRequired>
          } />
          
          {/* Student dashboard (own) */}
          <Route path="/student/dashboard" element={
            <RoleRequired roles={['student']}>
              <StudentDashboard />
            </RoleRequired>
          } />
          {/* Student dashboard (faculty/admin view) */}
          <Route path="/student/dashboard/:studentId" element={
            <RoleRequired roles={FACULTY_ADMIN_ROLES}>
              <StudentDashboard />
            </RoleRequired>
          } />
          {/* Student attendance (own) */}
          <Route path="/student/attendance" element={
            <RoleRequired roles={['student']}>
              <StudentAttendance />
            </RoleRequired>
          } />
          {/* Course attendance details */}
          <Route path="/course-attendance/:courseId" element={
            <RoleRequired roles={ALL_ROLES}>
              <CourseAttendanceDetail />
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
          <Route path="/faculty/low-attendance" element={
            <RoleRequired roles={['faculty']}>
              <LowAttendanceOverview />
            </RoleRequired>
          } />
          <Route path="/faculty/low-attendance/:courseId" element={
            <RoleRequired roles={['faculty']}>
              <LowAttendancePage />
            </RoleRequired>
          } />
          <Route path="/faculty/students" element={
            <RoleRequired roles={FACULTY_ADMIN_ROLES}>
              <StudentsListPage />
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
          <Route path="/admin/courses" element={
            <RoleRequired roles={['admin']}>
              <CourseList />
            </RoleRequired>
          } />
          {/* Admin student details page - restricted to admin only */}
          <Route path="/admin/students/:id" element={
            <RoleRequired roles={['admin']}>
              <StudentDetailsPage />
            </RoleRequired>
          } />

          {/* Common routes */}
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
          {/* Attendance routes - Faculty/Admin only */}
          <Route path="/attendance" element={
            <RoleRequired roles={FACULTY_ADMIN_ROLES}>
              <AttendanceListPage />
            </RoleRequired>
          } />
          <Route path="/attendance/:id" element={
            <RoleRequired roles={FACULTY_ADMIN_ROLES}>
              <AttendanceDetailPage />
            </RoleRequired>
          } />
          <Route path="/attendance/edit/:id" element={
            <RoleRequired roles={['faculty']}>
              <AttendanceManager mode="edit" />
            </RoleRequired>
          } />
        </Route>
      </Routes>
    </NotificationProvider>
  );
};

export default App;
