import { useAuth } from '../hooks/useAuth';
import { AttendancePage } from './AttendancePage';
import { StudentAttendancePage } from './StudentAttendancePage';

export function AttendanceRouter() {
  const { user } = useAuth();

  if (user?.role === 'student' || user?.role === 'parent') {
    return <StudentAttendancePage />;
  }

  return <AttendancePage />;
}
