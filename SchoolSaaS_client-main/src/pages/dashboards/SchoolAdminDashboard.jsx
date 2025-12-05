import { Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Button, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { QuickActions } from '../../components/common/QuickActions';
import { BulkStudentUpload } from '../../components/BulkStudentUpload';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import PaymentIcon from '@mui/icons-material/Payment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UploadIcon from '@mui/icons-material/Upload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { studentService, teacherService, attendanceService, feeService, examinationService, announcementService } from '../../services/api.js';
import { ExportData } from '../../components/common/ExportData';
import { StudentDetailsModal } from '../../components/StudentDetailsModal';
import { LoadingBar } from '../../components/common/LoadingBar';

export function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0, attendance: 0, feesCollected: 0, feesPending: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, teachersRes, attendanceRes, feeRes, examsRes, announcementsRes] = await Promise.all([
          studentService.getAllStudents({ page: 1, limit: 5 }),
          teacherService.getAllTeachers({ page: 1, limit: 1 }),
          attendanceService.getAllAttendance({ page: 1, limit: 1 }),
          feeService.getFeeReport(),
          examinationService.getAllExaminations({ page: 1, limit: 5 }).catch(() => ({ data: { examinations: [] } })),
          announcementService.getAllAnnouncements({ page: 1, limit: 5 }).catch(() => ({ data: { announcements: [] } }))
        ]);
        
        // Build recent activities
        const activities = [];
        
        // Recent students
        studentsRes.data.students.slice(0, 3).forEach(s => {
          activities.push({
            type: 'student',
            message: `New student ${s.userId?.firstName} ${s.userId?.lastName} added`,
            time: new Date(s.createdAt).toLocaleString(),
            icon: GroupIcon,
            color: '#667eea'
          });
        });
        
        setRecentActivities(activities.slice(0, 5));
        
        // Set upcoming exams
        const upcomingExaminations = examsRes.data.examinations?.filter(e => new Date(e.date) >= new Date()).slice(0, 5) || [];
        setUpcomingExams(upcomingExaminations);
        
        // Set announcements
        setAnnouncements(announcementsRes.data.announcements || []);
        
        setStats({
          students: studentsRes.data.pagination?.total || 0,
          teachers: teachersRes.data.pagination?.total || 0,
          attendance: attendanceRes.data.pagination?.total || 0,
          feesCollected: feeRes.data.report?.totalCollected || 0,
          feesPending: (feeRes.data.report?.totalAmount || 0) - (feeRes.data.report?.totalCollected || 0)
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingBar />;

  return (
    <DashboardLayout>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: { xs: 2, sm: 3, md: 4 }, 
          fontWeight: 'bold',
          fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem', lg: '2.125rem' },
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        School Admin Dashboard
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 2, md: 3, lg: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <StatCard title="Total Students" value={stats.students} icon={GroupIcon} color="#667eea" />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <StatCard title="Total Teachers" value={stats.teachers} icon={AssignmentIcon} color="#764ba2" />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <StatCard title="Attendance Records" value={stats.attendance} icon={EventIcon} color="#f093fb" />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <Paper sx={{ p: 2, boxShadow: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PaymentIcon sx={{ fontSize: 40, color: '#4facfe', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Fee Status</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="textSecondary">Collected</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                ₹{stats.feesCollected}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="textSecondary">Pending</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                ₹{stats.feesPending}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <QuickActions 
        title="Quick Actions"
        actions={[
          { label: 'Add Student', icon: PersonAddIcon, path: '/students', color: '#e3f2fd' },
          { label: 'Add Teacher', icon: PersonAddIcon, path: '/teachers', color: '#f3e5f5' },
          { label: 'Mark Attendance', icon: EventIcon, path: '/attendance', color: '#e8f5e8' },
          { label: 'Create Exam', icon: AssignmentIcon, path: '/examinations', color: '#fff3e0' },
          { label: 'Manage Fees', icon: PaymentIcon, path: '/fees', color: '#e0f2f1' },
          { label: 'Send Announcement', icon: AnnouncementIcon, path: '/announcements', color: '#fce4ec' }
        ]}
      />

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Recent Activity
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {recentActivities.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No recent activities
                </Typography>
              ) : (
                recentActivities.map((activity, idx) => (
                  <Box key={idx} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ 
                      p: 0.5, 
                      borderRadius: 1, 
                      bgcolor: activity.color + '20',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <activity.icon sx={{ fontSize: 16, color: activity.color }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {activity.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Upcoming Examinations
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {upcomingExams.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No upcoming examinations
                </Typography>
              ) : (
                upcomingExams.map((exam) => (
                  <Paper key={exam._id} sx={{ 
                    p: 2, 
                    mb: 2, 
                    bgcolor: 'action.hover', 
                    borderLeft: (theme) => `4px solid ${theme.palette.primary.main}` 
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {exam.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {exam.code} | {exam.type}
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 1, fontSize: '0.85rem' }}>
                      📅 {new Date(exam.date).toLocaleDateString()} | ⏱️ {exam.durationMinutes} min | 📚 {exam.totalMarks} marks
                    </Typography>
                  </Paper>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Recent Announcements
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {announcements.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No announcements
                </Typography>
              ) : (
                announcements.map((announcement) => (
                  <Box key={announcement._id} sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: 'action.hover', 
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.palette.divider}`
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {announcement.title}
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
                      {announcement.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setBulkUploadOpen(true)}
                fullWidth
              >
                Bulk Upload Students
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => window.location.href = '/students'}
                fullWidth
              >
                Manage Students
              </Button>
              <Button
                variant="outlined"
                startIcon={<AnnouncementIcon />}
                onClick={() => window.location.href = '/announcements'}
                fullWidth
              >
                Create Announcement
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <BulkStudentUpload
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </DashboardLayout>
  );
}