import { useAuth } from '../../hooks/useAuth';
import { SuperAdminDashboard } from '../../pages/dashboards/SuperAdminDashboard';
import { SchoolAdminDashboard } from '../../pages/dashboards/SchoolAdminDashboard';
import { TeacherDashboard } from '../../pages/dashboards/TeacherDashboard';
import { StudentDashboard } from '../../pages/dashboards/StudentDashboard';
import { ExamControllerDashboard } from '../../pages/dashboards/ExamControllerDashboard';
import { LoadingBar } from './LoadingBar';
import { Navigate } from 'react-router-dom';

export function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingBar />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'school_admin':
      return <SchoolAdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
    case 'parent':
      return <StudentDashboard />;
    case 'exam_controller':
      return <Navigate to="/examcontroller/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}