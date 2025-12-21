import { Grid, Paper, Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { LoadingBar } from '../../components/common/LoadingBar';
import { examinationService, teacherService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../components/common/Notification';

export function ExamControllerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification, NotificationComponent } = useNotification();
  const [stats, setStats] = useState({ 
    totalExams: 0, 
    upcomingExams: 0, 
    completedExams: 0, 
    pendingStudentResults: 0,
    totalTeachers: 0,
    activeExams: 0
  });
  const [loading, setLoading] = useState(true);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [examsRes, teachersRes] = await Promise.all([
        examinationService.getAllExaminations({ page: 1, limit: 100 }),
        teacherService.getAllTeachers({ limit: 1000 })
      ]);
      
      const allExams = examsRes.data.examinations || [];
      const teachers = teachersRes.data.teachers || [];
      
      const now = new Date();
      const upcoming = allExams.filter(exam => new Date(exam.examStartDate) > now);
      const completed = allExams.filter(exam => new Date(exam.examEndDate) < now);
      const active = allExams.filter(exam => {
        const start = new Date(exam.examStartDate);
        const end = new Date(exam.examEndDate);
        return start <= now && now <= end;
      });
      
      // Get pending student results count
      let pendingStudentCount = 0;
      for (const exam of allExams) {
        try {
          const resultsRes = await examinationService.getExaminationResults(exam._id);
          const results = resultsRes.data.results || [];
          pendingStudentCount += results.filter(r => 
            !r.isDraft && 
            (!r.approvalStatus || r.approvalStatus === 'pending')
          ).length;
        } catch (err) {
          console.log('Error fetching results for exam:', exam._id);
        }
      }
      
      setStats({
        totalExams: allExams.length,
        upcomingExams: upcoming.length,
        completedExams: completed.length,
        activeExams: active.length,
        pendingStudentResults: pendingStudentCount,
        totalTeachers: teachers.length
      });
      
      // Set upcoming exams (next 5)
      setUpcomingExams(upcoming.slice(0, 5).sort((a, b) => new Date(a.examStartDate) - new Date(b.examStartDate)));
      
      // Set recent completed exams (last 5)
      setRecentExams(completed.slice(-5).reverse());
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'create':
        navigate('/examinations');
        break;
      case 'view':
        navigate('/examinations');
        break;
      case 'results':
        navigate('/results');
        break;
      default:
        break;
    }
  };

  if (loading) return <LoadingBar />;

  return (
    <DashboardLayout>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: { xs: 2, sm: 3, md: 4 }, 
          fontWeight: 'bold',
          fontSize: { xs: '1.25rem', sm: '2rem', md: '2.125rem' }
        }}
      >
        Exam Controller Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/examinations')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Total Exams" value={stats.totalExams} icon={AssignmentIcon} color="#1976d2" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/examinations')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Upcoming" value={stats.upcomingExams} icon={CalendarTodayIcon} color="#2e7d32" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/examinations')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Active Now" value={stats.activeExams} icon={EventIcon} color="#ed6c02" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/examinations')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Completed" value={stats.completedExams} icon={TrendingUpIcon} color="#9c27b0" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/results')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Pending Results" value={stats.pendingStudentResults} icon={PendingActionsIcon} color="#d32f2f" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Box onClick={() => navigate('/examinations')} sx={{ cursor: 'pointer' }}>
            <StatCard title="Teachers" value={stats.totalTeachers} icon={PersonIcon} color="#0288d1" />
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
                      <TableCell sx={{ fontWeight: 600 }}>Subjects</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingExams.map((exam) => (
                      <TableRow 
                        key={exam._id} 
                        hover 
                        sx={{ cursor: 'pointer' }} 
                        onClick={() => navigate('/examinations')}
                      >
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
                        <TableCell>{exam.subjects?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary" variant="body1" sx={{ mb: 2 }}>
                  No upcoming examinations scheduled
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => handleQuickAction('create')}
                >
                  Schedule New Exam
                </Button>
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
                  startIcon={<CalendarTodayIcon />}
                  onClick={() => handleQuickAction('create')}
                >
                  Schedule New Exam
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<AssignmentIcon />}
                  onClick={() => handleQuickAction('view')}
                >
                  View All Exams
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<TrendingUpIcon />}
                  onClick={() => handleQuickAction('results')}
                >
                  Manage Results
                </Button>
              </Box>
            </Paper>

            {/* Recent Completed Exams */}
            <Paper sx={{ p: 3, boxShadow: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Completed
              </Typography>
              {recentExams.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentExams.map((exam) => (
                    <Box 
                      key={exam._id} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                      onClick={() => navigate('/results')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {exam.examName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Class {exam.class}-{exam.section} • {new Date(exam.examEndDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  No recent completed exams
                </Typography>
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <NotificationComponent />
    </DashboardLayout>
  );
}