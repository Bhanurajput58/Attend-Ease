import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import { RoleRequired } from './components/RoleBasedAccess';
import { ReportsPage, ReportDetail, AttendanceReportsPage } from './pages/reports';
import { CourseListPage, CourseDetailPage } from './pages/courses';
import { AttendanceListPage, TakeAttendancePage, AttendanceDetailPage, SessionDetailPage } from './pages/attendance';
import StudentsListPage from './pages/faculty/StudentsListPage';
import Header from './components/Header';
import ProfilePage from './pages/ProfilePage';

// Import role-specific pages
import StudentDashboard from './pages/students/StudentDashboard';
import StudentAttendance from './pages/students/StudentAttendance';
import CourseAttendanceDetail from './pages/students/CourseAttendanceDetail';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AttendanceManager from './pages/faculty/AttendanceManager';
import LowAttendancePage from './pages/faculty/LowAttendancePage';
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
    <>
      <Header />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>  
          {/* Global profile page for all roles */}
          <Route path="/student/profile" element={<ProfilePage />} />
          <Route path="/faculty/profile" element={<ProfilePage />} />
          <Route path="/admin/profile" element={<ProfilePage />} />
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
          {/* More specific routes should come */}
          <Route path="/attendance/edit/:id" element={
            <RoleRequired roles={FACULTY_ADMIN_ROLES}>
              <AttendanceDetailPage mode="edit" />
            </RoleRequired>
          } />
          <Route path="/attendance/course/:courseId" element={<AttendanceListPage filter="course" />} />
          {/* Generic attendance detail - Must be last among attendance routes */}
          <Route path="/attendance/:id" element={<AttendanceDetailPage />} />
          {/* Redirect old student detail route to the new profile page */}
          <Route path="/students/:id" element={
            <Navigate replace to={location => `/student/profile/${location.pathname.split('/')[2]}`} />
          } />
        </Route>
        {/* Fallback route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
