import { Grid, Paper, Typography, Box, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { QuickActions } from '../../components/common/QuickActions';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GroupIcon from '@mui/icons-material/Group';
import { LoadingBar } from '../../components/common/LoadingBar';

export function ExamControllerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    scheduledExams: 0, 
    totalExams: 0, 
    invigilators: 0, 
    halls: 0 
  });
  const [loading, setLoading] = useState(false);

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

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Scheduled Exams" value={stats.scheduledExams} icon={CalendarTodayIcon} color="#667eea" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Exams" value={stats.totalExams} icon={AssignmentIcon} color="#764ba2" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Invigilators" value={stats.invigilators} icon={PersonIcon} color="#f093fb" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Exam Halls" value={stats.halls} icon={EventIcon} color="#4facfe" />
        </Grid>
      </Grid>



      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Upcoming Exams
            </Typography>
            <Typography color="text.secondary">
              No upcoming exams scheduled.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="contained" fullWidth>
                Schedule New Exam
              </Button>
              <Button variant="outlined" fullWidth>
                View All Exams
              </Button>
              <Button variant="outlined" fullWidth>
                Manage Invigilators
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}