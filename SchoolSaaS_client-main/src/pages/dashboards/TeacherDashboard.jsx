import { Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { QuickActions } from '../../components/common/QuickActions';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import GradeIcon from '@mui/icons-material/Grade';
import AddIcon from '@mui/icons-material/Add';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { studentService, assignmentService, attendanceService } from '../../services/api.js';
import { ExportData } from '../../components/common/ExportData';
import { LoadingBar } from '../../components/common/LoadingBar';


export function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, assignments: 0, attendance: 0, grades: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, assignmentsRes, attendanceRes] = await Promise.all([
          studentService.getAllStudents({ page: 1, limit: 5 }),
          assignmentService.getAllAssignments({ page: 1, limit: 5 }),
          attendanceService.getAllAttendance({ page: 1, limit: 1 })
        ]);
        
        setRecentActivities(assignmentsRes.data.assignments?.slice(0, 5).map((a, i) => ({
          id: a._id,
          activity: `Assignment: ${a.title}`,
          time: new Date(a.createdAt).toLocaleDateString()
        })) || []);
        
        setStats({
          students: studentsRes.data.pagination?.total || 0,
          assignments: assignmentsRes.data.pagination?.total || 0,
          attendance: attendanceRes.data.pagination?.total || 0,
          grades: assignmentsRes.data.assignments?.filter(a => a.submissions?.length > 0).length || 0
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

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="My Students" value={stats.students} icon={GroupIcon} color="#667eea" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Assignments" value={stats.assignments} icon={AssignmentIcon} color="#764ba2" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Attendance Records" value={stats.attendance} icon={EventIcon} color="#f093fb" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Grades Given" value={stats.grades} icon={GradeIcon} color="#4facfe" />
        </Grid>
      </Grid>

      <QuickActions 
        title="Teacher Actions"
        actions={[
          { label: 'Mark Attendance', icon: EventIcon, path: '/attendance', color: '#e3f2fd' },
          { label: 'Create Assignment', icon: AddIcon, path: '/assignments', color: '#f3e5f5' },
          { label: 'Grade Papers', icon: GradeIcon, path: '/examinations', color: '#e8f5e8' },
          { label: 'View Students', icon: GroupIcon, path: '/students', color: '#fff3e0' },
          { label: 'Send Announcement', icon: AnnouncementIcon, path: '/announcements', color: '#fce4ec' }
        ]}
      />

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} lg={8}>
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
                Recent Activities
              </Typography>
              <ExportData 
                data={recentActivities.map(a => ({
                  Activity: a.activity,
                  Time: a.time
                }))}
                filename="activities"
                title="Activities Report"
                dateField="time"
              />
            </Box>
            
            <Box sx={{ overflow: 'auto' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        <strong>Activity</strong>
                      </TableCell>
                      <TableCell sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        display: { xs: 'none', sm: 'table-cell' }
                      }}>
                        <strong>Time</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.map((activity) => (
                      <TableRow key={activity.id} hover>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {activity.activity}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: { xs: 'block', sm: 'none' },
                              color: 'text.secondary',
                              fontSize: '0.7rem'
                            }}
                          >
                            {activity.time}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', sm: 'table-cell' }
                        }}>
                          {activity.time}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ 
            p: { xs: 2, sm: 3 }, 
            boxShadow: 2
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              Quick Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" 
                fullWidth
                sx={{ 
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Mark Attendance
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ 
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Create Assignment
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ 
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Grade Papers
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ 
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Send Announcement
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}