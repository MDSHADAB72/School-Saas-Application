import { useAuth } from '../hooks/useAuth';
import { FeesPage } from './FeesPage';
import { StudentFeesPage } from './StudentFeesPage';

export function FeesRouter() {
  const { user } = useAuth();

  // Students and parents see payment-only page
  if (user?.role === 'student' || user?.role === 'parent') {
    return <StudentFeesPage />;
  }

  // School admins see full management page
  return <FeesPage />;
}
