import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SchoolRegistrationPage } from './pages/SchoolRegistrationPage';
import { DashboardRouter } from './components/common/DashboardRouter';
import { SchoolsPage } from './pages/SchoolsPage';
import { UsersPage } from './pages/UsersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentsPage } from './pages/StudentsPage';
import { TeachersPage } from './pages/TeachersPage';
import { AttendanceRouter } from './pages/AttendanceRouter';
import { ExaminationsPage } from './pages/ExaminationsPage';
import { FeesRouter } from './pages/FeesRouter';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AssignmentsRouter } from './pages/AssignmentsRouter';
import { ResultsPage } from './pages/ResultsPage';
import { ExamSchedulePage } from './pages/ExamSchedulePage';
import { ProfilePage } from './pages/ProfilePage';
import { TemplatesPage } from './pages/TemplatesPage';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplatePreviewPage } from './pages/TemplatePreviewPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<SchoolRegistrationPage />} />
      
      {/* Dashboard Route - Role-based */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
      <Route path="/schools" element={<ProtectedRoute><SchoolsPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* School Admin Routes */}
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute><TeachersPage /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendanceRouter /></ProtectedRoute>} />
      <Route path="/examinations" element={<ProtectedRoute><ExaminationsPage /></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute><FeesRouter /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />

      {/* Teacher & Student Routes */}
      <Route path="/assignments" element={<ProtectedRoute><AssignmentsRouter /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><ExamSchedulePage /></ProtectedRoute>} />

      {/* Template Routes - School Admin only */}
      <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
      <Route path="/templates/editor/:id" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
      <Route path="/templates/preview/:id" element={<ProtectedRoute><TemplatePreviewPage /></ProtectedRoute>} />

      {/* Profile Route - Available to all roles */}
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;