import { Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, LinearProgress, Alert, AlertTitle, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { StatCard } from '../../components/common/StatCard';
import { QuickActions } from '../../components/common/QuickActions';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import GradeIcon from '@mui/icons-material/Grade';
import PaymentIcon from '@mui/icons-material/Payment';
import BookIcon from '@mui/icons-material/Book';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { assignmentService, attendanceService, examinationService, feeService, announcementService, activityService } from '../../services/api.js';
import { ExportData } from '../../components/common/ExportData';
import { useNotification } from '../../components/common/Notification';
import { LoadingBar } from '../../components/common/LoadingBar';


export function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ assignments: 0, submittedAssignments: 0, assignmentPercentage: 0, attendance: 0, presentCount: 0, attendancePercentage: 0, grades: 0, fees: 0, paidFees: 0, partialFees: 0, totalPaidAmount: 0, totalPendingAmount: 0 });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feeAlert, setFeeAlert] = useState(null);
  const [admitCard, setAdmitCard] = useState(null);
  const [openAdmitCard, setOpenAdmitCard] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Log dashboard view activity
        activityService.logActivity({
          type: 'login',
          message: 'Viewed dashboard',
          metadata: { page: 'dashboard' }
        }).catch(() => {});
        
        const [assignmentsRes, attendanceRes, examsRes, feesRes, eligibilityRes, announcementsRes, activitiesRes, submissionsRes] = await Promise.all([
          assignmentService.getAllAssignments({ page: 1, limit: 4 }),
          attendanceService.getAllAttendance({ page: 1, limit: 1000 }),
          examinationService.getUpcomingExams(),
          feeService.getAllFees({ page: 1, limit: 100 }),
          examinationService.checkAdmitCardEligibility().catch(() => ({ data: { eligible: true } })),
          announcementService.getAllAnnouncements({ page: 1, limit: 5 }).catch(() => ({ data: { announcements: [] } })),
          activityService.getActivities({ page: 1, limit: 10 }).catch(() => ({ data: { activities: [] } })),
          assignmentService.getMySubmissions().catch(() => ({ data: { submissions: [] } }))
        ]);
        
        const assignments = assignmentsRes.data.assignments || [];
        setRecentAssignments(assignments.map(a => ({
          id: a._id,
          subject: a.subject || 'N/A',
          title: a.title,
          dueDate: new Date(a.dueDate).toLocaleDateString(),
          status: a.status || 'Pending'
        })));
        
        // Set announcements
        setAnnouncements(announcementsRes.data.announcements || []);
        
        // Map activities from database
        const activityIconMap = {
          assignment_submit: { icon: AssignmentIcon, color: '#667eea' },
          fee_payment: { icon: PaymentIcon, color: '#4caf50' },
          result_view: { icon: GradeIcon, color: '#f093fb' },
          attendance_view: { icon: EventIcon, color: '#764ba2' },
          announcement_view: { icon: AnnouncementIcon, color: '#ff9800' },
          login: { icon: BookIcon, color: '#2196f3' },
          profile_update: { icon: BookIcon, color: '#9c27b0' }
        };
        
        const mappedActivities = (activitiesRes.data.activities || []).map(act => ({
          type: act.type,
          message: act.message,
          time: new Date(act.createdAt).toLocaleString(),
          icon: activityIconMap[act.type]?.icon || BookIcon,
          color: activityIconMap[act.type]?.color || '#757575'
        }));
        
        setRecentActivities(mappedActivities);
        
        setUpcomingExams(examsRes.data.examinations?.map(e => {
          const examDate = new Date(e.date);
          const startTime = e.startAt ? new Date(e.startAt) : examDate;
          return {
            id: e._id,
            title: e.title,
            code: e.code,
            type: e.type,
            subjects: e.subjects?.map(s => s.name).join(', ') || 'Multiple Subjects',
            date: examDate.toLocaleDateString(),
            time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            duration: e.durationMinutes,
            venue: e.venue,
            totalMarks: e.totalMarks
          };
        }) || []);

        // Calculate fee statistics
        const allFees = feesRes.data.fees || [];
        const paidFees = allFees.filter(f => f.status === 'Paid').length;
        const partialFees = allFees.filter(f => f.status === 'Partial').length;
        const pendingFees = allFees.filter(f => f.status === 'Pending' || f.status === 'Overdue').length;
        const totalPaidAmount = allFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const totalPendingAmount = allFees.reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0);
        
        // Calculate attendance statistics
        const allAttendance = attendanceRes.data.attendance || [];
        const totalAttendance = allAttendance.length;
        const presentCount = allAttendance.filter(a => a.status?.toLowerCase() === 'present').length;
        const attendancePercentage = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 0;
        
        // Calculate assignment statistics
        const totalAssignments = assignmentsRes.data.pagination?.total || 0;
        const submittedAssignments = submissionsRes.data.submissions?.length || 0;
        const assignmentPercentage = totalAssignments > 0 ? ((submittedAssignments / totalAssignments) * 100).toFixed(1) : 0;

        setStats({
          assignments: totalAssignments,
          submittedAssignments,
          assignmentPercentage,
          attendance: totalAttendance,
          presentCount,
          attendancePercentage,
          grades: 'N/A',
          fees: pendingFees,
          paidFees,
          partialFees,
          totalPaidAmount,
          totalPendingAmount
        });

        // Check admit card eligibility
        if (eligibilityRes.data && !eligibilityRes.data.eligible) {
          setFeeAlert({
            message: eligibilityRes.data.message,
            pendingAmount: eligibilityRes.data.pendingAmount,
            pendingFees: eligibilityRes.data.pendingFees
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownloadAdmitCard = async (examId) => {
    try {
      const response = await examinationService.generateAdmitCard(examId);
      setAdmitCard(response.data.admitCard);
      setOpenAdmitCard(true);
    } catch (error) {
      if (error.response?.status === 403) {
        showNotification(error.response.data.message || 'Cannot generate admit card. Please clear pending fees.', 'error');
      } else {
        showNotification('Error generating admit card', 'error');
      }
    }
  };

  const handlePrintAdmitCard = () => {
    window.print();
  };

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
        {user?.role === 'parent' ? 'Parent Dashboard' : 'Student Dashboard'}
      </Typography>

      {feeAlert && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle sx={{ fontWeight: 'bold' }}>⚠️ Admit Card Not Available</AlertTitle>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {feeAlert.message}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
            Pending Fees: {feeAlert.pendingFees} | Total Amount: ₹{feeAlert.pendingAmount}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Please clear all pending fees to download admit cards for examinations.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper sx={{ p: 2, boxShadow: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AssignmentIcon sx={{ fontSize: 40, color: '#667eea', mr: 1 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">Assignments</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                  {stats.submittedAssignments}/{stats.assignments}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 'bold' }}>
              {stats.assignmentPercentage}% Submitted
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper sx={{ p: 2, boxShadow: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventIcon sx={{ fontSize: 40, color: '#764ba2', mr: 1 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">Attendance</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#764ba2' }}>
                  {stats.presentCount}/{stats.attendance}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: '#764ba2', fontWeight: 'bold' }}>
              {stats.attendancePercentage}% Present
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} lg={2}>
          <Paper sx={{ p: 2, boxShadow: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PaymentIcon sx={{ fontSize: 40, color: '#4caf50', mr: 1 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">Paid</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  {stats.paidFees || 0}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
              ₹{stats.totalPaidAmount || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} lg={2}>
          <Paper sx={{ p: 2, boxShadow: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PaymentIcon sx={{ fontSize: 40, color: '#ff9800', mr: 1 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">Partial</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                  {stats.partialFees || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Paper sx={{ p: 2, boxShadow: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PaymentIcon sx={{ fontSize: 40, color: '#f44336', mr: 1 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">Pending</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                  {stats.fees || 0}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold' }}>
              ₹{stats.totalPendingAmount || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <QuickActions 
        title={user?.role === 'parent' ? 'Parent Actions' : 'Student Actions'}
        actions={[
          { label: 'View Assignments', icon: AssignmentIcon, path: '/assignments', color: '#e3f2fd' },
          { label: 'Check Results', icon: GradeIcon, path: '/results', color: '#f3e5f5' },
          { label: 'View Attendance', icon: EventIcon, path: '/attendance', color: '#e8f5e8' },
          { label: 'Pay Fees', icon: PaymentIcon, path: '/fees', color: '#fff3e0' },
          { label: 'Exam Schedule', icon: ScheduleIcon, path: '/schedule', color: '#e0f2f1' },
          { label: 'Announcements', icon: AnnouncementIcon, path: '/announcements', color: '#fce4ec' }
        ]}
      />

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ 
            p: { xs: 2, sm: 3 }, 
            boxShadow: 2,
            mb: { xs: 2, lg: 0 }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Recent Assignments
              </Typography>
            </Box>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {recentAssignments.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  No assignments
                </Typography>
              ) : (
                recentAssignments.map((assignment) => (
                  <Paper 
                    key={assignment.id}
                    sx={{ 
                      p: 2, 
                      mb: 2,
                      bgcolor: 'action.hover',
                      borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                    onClick={() => window.location.href = '/assignments'}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          color: 'primary.main'
                        }}
                      >
                        {assignment.title}
                      </Typography>
                      <Chip 
                        label={assignment.status}
                        size="small"
                        sx={{
                          bgcolor: 
                            assignment.status === 'Submitted' ? 'success.light' :
                            assignment.status === 'Graded' ? 'info.light' : 'warning.light',
                          color: 
                            assignment.status === 'Submitted' ? 'success.dark' :
                            assignment.status === 'Graded' ? 'info.dark' : 'warning.dark',
                          fontWeight: 'bold',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        color: 'text.secondary',
                        mb: 1
                      }}
                    >
                      Subject: {assignment.subject}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      📅 Due: {assignment.dueDate}
                    </Typography>
                  </Paper>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ 
            p: { xs: 2, sm: 3 }, 
            boxShadow: 2,
            mb: { xs: 2, lg: 0 }
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              Recent Announcements
            </Typography>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {announcements.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No announcements
                </Typography>
              ) : (
                announcements.map((announcement) => (
                  <Paper 
                    key={announcement._id}
                    sx={{ 
                      p: 2, 
                      mb: 2,
                      bgcolor: 'action.hover',
                      borderLeft: (theme) => `4px solid ${theme.palette.warning.main}`
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        mb: 0.5
                      }}
                    >
                      {announcement.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        mb: 1
                      }}
                    >
                      {announcement.message}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        color: 'text.secondary'
                      }}
                    >
                      {new Date(announcement.createdAt).toLocaleString()}
                    </Typography>
                  </Paper>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
        <Grid item xs={12} lg={6}>
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
              Recent Activity
            </Typography>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {recentActivities.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
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

        <Grid item xs={12} lg={6}>
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
              Upcoming Exams
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {upcomingExams.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No upcoming exams scheduled
                </Typography>
              ) : (
                upcomingExams.map((exam) => (
                  <Paper 
                    key={exam.id}
                    sx={{ 
                      p: 2, 
                      bgcolor: 'action.hover',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        color: 'primary.main',
                        mb: 0.5
                      }}
                    >
                      {exam.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        color: 'text.secondary',
                        mb: 1
                      }}
                    >
                      {exam.code} | {exam.type}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        📅 {exam.date} at {exam.time}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        ⏱️ Duration: {exam.duration} minutes
                      </Typography>
                      {exam.venue && (
                        <Typography 
                          variant="body2" 
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          📍 Venue: {exam.venue}
                        </Typography>
                      )}
                      <Typography 
                        variant="body2" 
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold', color: 'primary.main' }}
                      >
                        📚 Total Marks: {exam.totalMarks}
                      </Typography>
                    </Box>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadAdmitCard(exam.id)}
                      sx={{ mt: 1 }}
                    >
                      Download Admit Card
                    </Button>
                  </Paper>
                ))
              )}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Total Attendance Records
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main'
                }}
              >
                {stats.attendance}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Admit Card Dialog */}
      <Dialog open={openAdmitCard} onClose={() => setOpenAdmitCard(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component="span">Admit Card</Box>
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrintAdmitCard}
            sx={{ color: 'white' }}
          >
            Print
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {admitCard && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #1976d2', pb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {admitCard.school.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {typeof admitCard.school.address === 'object' 
                    ? `${admitCard.school.address.street}, ${admitCard.school.address.city}, ${admitCard.school.address.state} ${admitCard.school.address.pincode}`
                    : admitCard.school.address}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Phone: {admitCard.school.phone} | Email: {admitCard.school.email}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
                  EXAMINATION ADMIT CARD
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  Admit Card No: {admitCard.admitCardNumber}
                </Typography>
              </Box>

              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Student Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography variant="body2"><strong>Name:</strong> {admitCard.student.name}</Typography>
                  <Typography variant="body2"><strong>Roll Number:</strong> {admitCard.student.rollNumber}</Typography>
                  <Typography variant="body2"><strong>Class:</strong> {admitCard.student.class}-{admitCard.student.section}</Typography>
                  <Typography variant="body2"><strong>Admission No:</strong> {admitCard.student.admissionNumber}</Typography>
                </Box>
              </Paper>

              <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Examination Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography variant="body2"><strong>Exam:</strong> {admitCard.examination.title}</Typography>
                  <Typography variant="body2"><strong>Code:</strong> {admitCard.examination.code}</Typography>
                  <Typography variant="body2"><strong>Type:</strong> {admitCard.examination.type}</Typography>
                  <Typography variant="body2"><strong>Date:</strong> {new Date(admitCard.examination.date).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Time:</strong> {new Date(admitCard.examination.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Typography>
                  <Typography variant="body2"><strong>Duration:</strong> {admitCard.examination.durationMinutes} minutes</Typography>
                  <Typography variant="body2"><strong>Venue:</strong> {admitCard.examination.venue || 'TBD'}</Typography>
                  <Typography variant="body2"><strong>Total Marks:</strong> {admitCard.examination.totalMarks}</Typography>
                </Box>
              </Paper>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Subjects
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Subject</strong></TableCell>
                      <TableCell align="center"><strong>Max Marks</strong></TableCell>
                      <TableCell align="center"><strong>Passing Marks</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admitCard.examination.subjects.map((subject, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell align="center">{subject.maxMarks}</TableCell>
                        <TableCell align="center">{subject.passingMarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Instructions:</Typography>
                <Typography variant="caption" component="div">1. Bring this admit card to the examination hall</Typography>
                <Typography variant="caption" component="div">2. Reach the venue 30 minutes before the exam</Typography>
                <Typography variant="caption" component="div">3. Carry a valid ID proof</Typography>
                <Typography variant="caption" component="div">4. Mobile phones are not allowed in the examination hall</Typography>
              </Alert>

              <Box sx={{ textAlign: 'right', mt: 3, pt: 2, borderTop: '1px solid #ddd' }}>
                <Typography variant="caption" color="textSecondary">
                  Generated on: {new Date(admitCard.generatedAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdmitCard(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <NotificationComponent />
    </DashboardLayout>
  );
}