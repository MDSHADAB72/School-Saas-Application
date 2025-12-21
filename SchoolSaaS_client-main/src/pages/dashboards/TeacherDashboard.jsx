import { Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Button, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import GradeIcon from '@mui/icons-material/Grade';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { studentService, assignmentService, attendanceService, examinationService } from '../../services/api.js';
import { LoadingBar } from '../../components/common/LoadingBar';
import { useNavigate } from 'react-router-dom';


export function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, assignments: 0, attendance: 0, grades: 0, upcomingExams: 0, pendingResults: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, assignmentsRes, attendanceRes, examsRes] = await Promise.all([
          studentService.getAllStudents({ page: 1, limit: 5 }),
          assignmentService.getAllAssignments({ page: 1, limit: 5 }),
          attendanceService.getAllAttendance({ page: 1, limit: 1 }),
          examinationService.getAllExaminations({ page: 1, limit: 100 })
        ]);
        
        const allExams = examsRes.data.examinations || [];
        const now = new Date();
        const upcoming = allExams.filter(exam => new Date(exam.examStartDate) > now);
        const completed = allExams.filter(exam => new Date(exam.examEndDate) < now);
        
        setUpcomingExams(upcoming.slice(0, 5));
        
        setRecentActivities(assignmentsRes.data.assignments?.slice(0, 5).map((a, i) => ({
          id: a._id,
          activity: `Assignment: ${a.title}`,
          time: new Date(a.createdAt).toLocaleDateString(),
          type: 'assignment'
        })) || []);
        
        setStats({
          students: studentsRes.data.pagination?.total || 0,
          assignments: assignmentsRes.data.pagination?.total || 0,
          attendance: attendanceRes.data.pagination?.total || 0,
          grades: assignmentsRes.data.assignments?.filter(a => a.submissions?.length > 0).length || 0,
          upcomingExams: upcoming.length,
          pendingResults: completed.length
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
          fontSize: { xs: '1.25rem', sm: '2rem', md: '2.125rem' },
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        Teacher Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/students')} sx={{ cursor: 'pointer' }}>
            <StatCard title="My Students" value={stats.students} icon={GroupIcon} color="#1976d2" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/assignments')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Assignments" value={stats.assignments} icon={AssignmentIcon} color="#2e7d32" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/attendance')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Attendance" value={stats.attendance} icon={EventIcon} color="#ed6c02" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/examinations')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Upcoming Exams" value={stats.upcomingExams} icon={CalendarTodayIcon} color="#9c27b0" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/teacher-results')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Pending Results" value={stats.pendingResults} icon={GradeIcon} color="#d32f2f" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/announcements')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Announcements" value={0} icon={AnnouncementIcon} color="#0288d1" />
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Upcoming Exams */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, boxShadow: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon color="primary" />
              Upcoming Examinations
            </Typography>
            {upcomingExams.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Exam Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingExams.map((exam) => (
                      <TableRow key={exam._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/examinations')}>
                        <TableCell>{exam.examName}</TableCell>
                        <TableCell>{exam.class}-{exam.section}</TableCell>
                        <TableCell>{new Date(exam.examStartDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={exam.status || 'draft'} 
                            size="small"
                            color={exam.status === 'public' ? 'success' : exam.status === 'private' ? 'warning' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalendarTodayIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary" variant="body1">
                  No upcoming examinations
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions & Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Quick Actions */}
            <Paper sx={{ p: 3, boxShadow: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<EventIcon />}
                  onClick={() => navigate('/attendance')}
                >
                  Mark Attendance
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/assignments')}
                >
                  Create Assignment
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<GradeIcon />}
                  onClick={() => navigate('/teacher-results')}
                >
                  Enter Results
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<AnnouncementIcon />}
                  onClick={() => navigate('/announcements')}
                >
                  Send Announcement
                </Button>
              </Box>
            </Paper>

            {/* Recent Activities */}
            <Paper sx={{ p: 3, boxShadow: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Activities
              </Typography>
              {recentActivities.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentActivities.map((activity) => (
                    <Box 
                      key={activity.id} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                      onClick={() => navigate('/assignments')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {activity.activity}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  No recent activities
                </Typography>
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}