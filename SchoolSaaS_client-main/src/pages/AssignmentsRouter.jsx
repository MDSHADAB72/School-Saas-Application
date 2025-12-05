import { useAuth } from '../hooks/useAuth';
import { AssignmentsPage } from './AssignmentsPage';
import { StudentAssignmentsPage } from './StudentAssignmentsPage';

export function AssignmentsRouter() {
  const { user } = useAuth();
  
  // Teachers and school admins see the teacher view
  if (user?.role === 'teacher' || user?.role === 'school_admin') {
    return <AssignmentsPage />;
  }
  
  // Students and parents see the student view
  return <StudentAssignmentsPage />;
}
