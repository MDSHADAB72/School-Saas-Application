import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, CircularProgress, TextField, Button, Paper, Chip } from '@mui/material';
import { Close, CalendarMonth } from '@mui/icons-material';
import { attendanceService } from '../services/api';

export function AttendanceDetailsModal({ open, onClose, studentId, studentName }) {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
  const [dateRange, setDateRange] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (open && studentId) {
      fetchAttendance();
    }
  }, [open, studentId, dateRange]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let end = new Date();
      let start = new Date();
      
      if (dateRange === 'week') {
        start.setDate(start.getDate() - 7);
      } else if (dateRange === 'month') {
        start.setMonth(start.getMonth() - 1);
      } else if (dateRange === 'custom' && startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      }

      const res = await attendanceService.getAttendanceReport(studentId, {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });

      const data = res.data.report;
      setAttendance(data.attendance || []);
      
      const late = data.attendance?.filter(a => a.status === 'late').length || 0;
      setStats({
        total: data.total || 0,
        present: data.present || 0,
        absent: data.absent || 0,
        late,
        percentage: data.percentage || 0
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Attendance Report - {studentName}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant={dateRange === 'week' ? 'contained' : 'outlined'} 
            onClick={() => setDateRange('week')}
          >
            Last Week
          </Button>
          <Button 
            variant={dateRange === 'month' ? 'contained' : 'outlined'} 
            onClick={() => setDateRange('month')}
          >
            Last Month
          </Button>
          <Button 
            variant={dateRange === 'custom' ? 'contained' : 'outlined'} 
            onClick={() => setDateRange('custom')}
          >
            Custom Range
          </Button>
        </Box>

        {dateRange === 'custom' && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={fetchAttendance}>Apply</Button>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="caption">Total</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">{stats.present}</Typography>
                  <Typography variant="caption">Present</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">{stats.absent}</Typography>
                  <Typography variant="caption">Absent</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">{stats.late}</Typography>
                  <Typography variant="caption">Late</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">{stats.percentage}%</Typography>
                  <Typography variant="caption">Percentage</Typography>
                </Box>
              </Box>
            </Paper>

            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {attendance.map((record, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, mb: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                  <Typography variant="body2">
                    {new Date(record.date).toLocaleDateString()}
                  </Typography>
                  <Chip 
                    label={record.status} 
                    size="small"
                    color={
                      record.status === 'present' ? 'success' : 
                      record.status === 'late' ? 'warning' : 'error'
                    }
                  />
                </Box>
              ))}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
