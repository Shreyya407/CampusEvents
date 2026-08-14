import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Student Pages
import { StudentLogin } from './pages/student/Login';
import { StudentSignup } from './pages/student/Signup';
import { StudentDashboard } from './pages/student/Dashboard';
import { BrowseEvents } from './pages/student/BrowseEvents';
import { EventDetails } from './pages/student/EventDetails';
import { MyRegistrations } from './pages/student/MyRegistrations';
import { ScanQR } from './pages/student/ScanQR';
import { StudentProfile } from './pages/student/Profile';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EventManagement } from './pages/admin/EventManagement';
import { CreateEvent } from './pages/admin/CreateEvent';
import { EditEvent } from './pages/admin/EditEvent';
import { AdminEventDetails } from './pages/admin/AdminEventDetails';
import { RegistrationsList } from './pages/admin/RegistrationsList';
import { FinanceList } from './pages/admin/FinanceList';
import { WaitlistList } from './pages/admin/WaitlistList';
import { AttendanceList } from './pages/admin/AttendanceList';
import { StudentList } from './pages/admin/StudentList';
import { Analytics } from './pages/admin/Analytics';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default Root Redirects to Student Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/signup" element={<StudentSignup />} />

          {/* Protected Student Routes (Requires Login) */}
          <Route
            path="/events"
            element={
              <ProtectedRoute allowedRole="student">
                <BrowseEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute allowedRole="student">
                <EventDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-registrations"
            element={
              <ProtectedRoute allowedRole="student">
                <MyRegistrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute allowedRole="student">
                <ScanQR />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute allowedRole="admin">
                <EventManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/create"
            element={
              <ProtectedRoute allowedRole="admin">
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/:id/edit"
            element={
              <ProtectedRoute allowedRole="admin">
                <EditEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/:id"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminEventDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/registrations"
            element={
              <ProtectedRoute allowedRole="admin">
                <RegistrationsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/finance"
            element={
              <ProtectedRoute allowedRole="admin">
                <FinanceList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/waitlist"
            element={
              <ProtectedRoute allowedRole="admin">
                <WaitlistList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute allowedRole="admin">
                <AttendanceList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRole="admin">
                <StudentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRole="admin">
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-all Redirects to Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
