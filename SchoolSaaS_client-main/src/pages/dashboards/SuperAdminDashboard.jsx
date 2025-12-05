import { Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { QuickActions } from '../../components/common/QuickActions';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import { schoolService, studentService, teacherService, feeService } from '../../services/api.js';
import { ExportData } from '../../components/common/ExportData';
import { LoadingBar } from '../../components/common/LoadingBar';


export function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ schools: 0, students: 0, teachers: 0, revenue: 0 });
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolsRes, studentsRes, teachersRes, feeRes] = await Promise.all([
          schoolService.getAllSchools(1, 5),
          studentService.getAllStudents({ page: 1, limit: 1 }),
          teacherService.getAllTeachers({ page: 1, limit: 1 }),
          feeService.getFeeReport()
        ]);
        setSchools(schoolsRes.data.schools);
        setStats({
          schools: schoolsRes.data.pagination?.total || 0,
          students: studentsRes.data.pagination?.total || 0,
          teachers: teachersRes.data.pagination?.total || 0,
          revenue: feeRes.data.totalCollected || 0
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
        Super Admin Dashboard
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Schools" value={stats.schools} icon={SchoolIcon} color="#667eea" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Students" value={stats.students} icon={GroupIcon} color="#764ba2" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Teachers" value={stats.teachers} icon={AssignmentIcon} color="#f093fb" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Revenue" value={`₹${stats.revenue}`} icon={PaymentIcon} color="#4facfe" />
        </Grid>
      </Grid>

      <QuickActions 
        title="Admin Actions"
        actions={[
          { label: 'Manage Schools', icon: SchoolIcon, path: '/schools', color: '#e3f2fd' },
          { label: 'View Users', icon: GroupIcon, path: '/users', color: '#f3e5f5' },
          { label: 'Analytics', icon: AnalyticsIcon, path: '/analytics', color: '#e8f5e8' },
          { label: 'System Settings', icon: SettingsIcon, path: '/settings', color: '#fff3e0' }
        ]}
      />

      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        boxShadow: 2,
        overflow: 'hidden'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            Recent Schools
          </Typography>
          <ExportData 
            data={schools.map(s => ({
              'School Name': s.name,
              Email: s.email,
              Plan: s.subscription?.plan || 'starter',
              Status: s.subscription?.status || 'trial',
              Students: s.totalStudents || 0
            }))}
            filename="schools"
            title="Schools Report"
            dateField="createdAt"
          />
        </Box>
        
        <Box sx={{ overflow: 'auto' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <strong>School Name</strong>
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', sm: 'table-cell' }
                  }}>
                    <strong>Email</strong>
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <strong>Plan</strong>
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', md: 'table-cell' }
                  }}>
                    <strong>Students</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school._id} hover>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {String(school.name || 'N/A')}
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', sm: 'table-cell' }
                    }}>
                      {String(school.email || 'N/A')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{
                        display: 'inline-block',
                        px: { xs: 1, sm: 2 },
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: school.subscription?.plan === 'professional' ? '#c8e6c9' : '#fff9c4',
                        fontSize: { xs: '0.7rem', sm: '0.85rem' },
                        fontWeight: 'bold'
                      }}>
                        {String(school.subscription?.plan || 'starter')}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{
                        display: 'inline-block',
                        px: { xs: 1, sm: 2 },
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: school.subscription?.status === 'active' ? '#c8e6c9' : '#ffccbc',
                        fontSize: { xs: '0.7rem', sm: '0.85rem' },
                        fontWeight: 'bold'
                      }}>
                        {String(school.subscription?.status || 'trial')}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', md: 'table-cell' }
                    }}>
                      {String(school.totalStudents || '0')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </DashboardLayout>
  );
}