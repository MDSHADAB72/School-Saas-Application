import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, Chip, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';
import { attendanceService, studentService, activityService } from '../services/api.js';
import { useNotification } from '../components/common/Notification.jsx';
import { LoadingBar } from '../components/common/LoadingBar.jsx';
import * as XLSX from 'xlsx';

export function StudentAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState('today');
  const [student, setStudent] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overallAttendance, setOverallAttendance] = useState([]);
  const { showNotification, NotificationComponent } = useNotification();

  useEffect(() => {
    fetchStudentAndAttendance();
    fetchOverallAttendance();
  }, [selectedDate, dateRange]);

  const fetchOverallAttendance = async () => {
    try {
      const response = await attendanceService.getAllAttendance({ 
        page: 1,
        limit: 10000
      });
      setOverallAttendance(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching overall attendance:', error);
    }
  };

  const fetchStudentAndAttendance = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      let startDate, endDate;
      
      if (dateRange === 'today') {
        startDate = endDate = selectedDate.toISOString().split('T')[0];
      } else if (dateRange === 'week') {
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = weekEnd.toISOString().split('T')[0];
      } else if (dateRange === 'month') {
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = monthEnd.toISOString().split('T')[0];
      }

      // Fetch attendance - backend automatically filters by logged-in student
      const response = await attendanceService.getAllAttendance({ 
        startDate,
        endDate,
        page: 1,
        limit: 100
      });
      
      const attendanceData = response.data.attendance || [];
      setAttendance(attendanceData);
      
      // Get student info from first attendance record or fetch separately
      if (attendanceData.length > 0 && attendanceData[0].studentId) {
        setStudent(attendanceData[0].studentId);
      } else if (!student) {
        // Fetch student record if no attendance yet
        const studentsRes = await studentService.getAllStudents({ page: 1, limit: 1 });
        setStudent(studentsRes.data.students[0]);
      }
      
      // Log activity
      await activityService.logActivity({
        type: 'attendance_view',
        message: `Viewed attendance for ${dateRange}`,
        metadata: { dateRange, startDate, endDate }
      }).catch(() => {});

    } catch (error) {
      console.error('Error fetching attendance:', error);
      showNotification('Error fetching attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data = attendance) => {
    const total = data.length;
    const present = data.filter(a => a.status?.toLowerCase() === 'present').length;
    const absent = data.filter(a => a.status?.toLowerCase() === 'absent').length;
    const late = data.filter(a => a.status?.toLowerCase() === 'late').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
    
    return { total, present, absent, late, percentage };
  };

  const handleDownload = () => {
    if (attendance.length === 0) {
      showNotification('No attendance data to download', 'warning');
      return;
    }

    const data = attendance.map(a => ({
      Date: new Date(a.date).toLocaleDateString(),
      Status: a.status,
      'Check In': a.checkInTime || 'N/A',
      'Check Out': a.checkOutTime || 'N/A',
      Remarks: a.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    
    const fileName = `Attendance_${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    showNotification('Attendance downloaded successfully', 'success');
  };

  const getStatusColor = (status) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      default:
        return 'default';
    }
  };

  const stats = calculateStats();
  const overallStats = calculateStats(overallAttendance);

  if (loading) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
            My Attendance
          </Typography>

          {/* Student Info */}
          {student && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {student.userId?.firstName} {student.userId?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Class: {student.class}-{student.section} | Roll No: {student.rollNumber} | Student ID: {student.studentId}
              </Typography>
            </Paper>
          )}

          {/* Overall Stats */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Overall Attendance Statistics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(5, 1fr)' }, gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {overallStats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total Days</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {overallStats.present}
                </Typography>
                <Typography variant="body2" color="text.secondary">Present</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  {overallStats.absent}
                </Typography>
                <Typography variant="body2" color="text.secondary">Absent</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {overallStats.late}
                </Typography>
                <Typography variant="body2" color="text.secondary">Late</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                  {overallStats.percentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">Attendance</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Filtered Stats Cards */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month'} Statistics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Days</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {stats.present}
              </Typography>
              <Typography variant="body2" color="text.secondary">Present</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {stats.absent}
              </Typography>
              <Typography variant="body2" color="text.secondary">Absent</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {stats.late}
              </Typography>
              <Typography variant="body2" color="text.secondary">Late</Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                {stats.percentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Attendance</Typography>
            </Paper>
          </Box>

          {/* Filters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                select
                label="Date Range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </TextField>

              <TextField
                type="date"
                label="Select Date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />

              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                disabled={attendance.length === 0}
              >
                Download
              </Button>
            </Box>
          </Paper>

          {/* Attendance Table */}
          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Day</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Check In</strong></TableCell>
                  <TableCell><strong>Check Out</strong></TableCell>
                  <TableCell><strong>Remarks</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No attendance records found for selected period
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((record) => (
                    <TableRow key={record._id} hover>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</TableCell>
                      <TableCell>
                        <Chip 
                          label={record.status?.charAt(0).toUpperCase() + record.status?.slice(1).toLowerCase() || 'N/A'} 
                          color={getStatusColor(record.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.checkInTime || 'N/A'}</TableCell>
                      <TableCell>{record.checkOutTime || 'N/A'}</TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
