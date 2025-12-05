import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Grid, Paper, CircularProgress, Chip, LinearProgress, Divider, Tooltip } from '@mui/material';
import { Close, CheckCircle, Cancel, TrendingUp, TrendingDown, ContentCopy, Print, Download } from '@mui/icons-material';
import { studentService, attendanceService, feeService, examinationService } from '../services/api';

export function StudentDetailsModal({ open, onClose, studentId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && studentId) {
      fetchStudentDetails();
    }
  }, [open, studentId]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      const [studentRes, attendanceRes, feesRes, resultsRes] = await Promise.all([
        studentService.getStudentById(studentId),
        attendanceService.getAttendanceReport(studentId),
        feeService.getAllFees({ studentId, page: 1, limit: 100 }),
        examinationService.getStudentResults(studentId)
      ]);

      const studentData = studentRes.data.student;
      
      const student = {
        ...studentData,
        firstName: studentData.userId?.firstName || 'N/A',
        lastName: studentData.userId?.lastName || 'N/A',
        email: studentData.userId?.email || 'N/A',
        phoneNumber: studentData.userId?.phoneNumber || 'N/A'
      };
      
      const attendance = attendanceRes.data.report;
      const fees = feesRes.data.fees || [];
      const results = resultsRes.data.results || [];

      const totalFees = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
      const paidFees = fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (f.paidAmount || 0), 0);
      const pendingFees = totalFees - paidFees;

      const avgMarks = results.length > 0 
        ? (results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length).toFixed(2)
        : 0;

      setData({
        student,
        attendance: {
          total: attendance.total || 0,
          present: attendance.present || 0,
          absent: attendance.absent || 0,
          percentage: attendance.percentage || 0
        },
        fees: {
          total: totalFees,
          paid: paidFees,
          pending: pendingFees,
          records: fees
        },
        performance: {
          avgMarks,
          totalExams: results.length,
          results
        }
      });
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyStudentId = () => {
    if (data?.student?.studentId) {
      navigator.clipboard.writeText(data.student.studentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const content = generatePrintContent();
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const content = generatePrintContent();
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const generatePrintContent = () => {
    if (!data) return '';
    
    return `
      <html>
        <head>
          <title>Student Details - ${data.student.firstName} ${data.student.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { color: #1976d2; margin: 0; }
            .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; page-break-inside: avoid; }
            .section-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; color: #333; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { margin-bottom: 8px; }
            .info-label { color: #666; font-size: 12px; }
            .info-value { font-weight: 500; font-size: 14px; }
            .student-id-box { background: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
            .stats-box { text-align: center; padding: 10px; background: #f5f5f5; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Details Report</h1>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <div class="section-title">Personal Information</div>
            <h2 style="margin: 0 0 15px 0; fontSize: 20px">${data.student.firstName} ${data.student.lastName}</h2>
            
            <div class="student-id-box">
              <span class="info-label">Student ID:</span>
              <span style="fontWeight: bold; color: #1976d2; fontFamily: monospace; fontSize: 16px; marginLeft: 10px">
                ${data.student.studentId || 'N/A'}
              </span>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Roll Number</div>
                <div class="info-value">${data.student.rollNumber || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Admission Number</div>
                <div class="info-value">${data.student.admissionNumber || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Class</div>
                <div class="info-value">${data.student.class} - ${data.student.section}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Gender</div>
                <div class="info-value">${data.student.gender || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${data.student.email}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone Number</div>
                <div class="info-value">${data.student.phoneNumber}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date of Birth</div>
                <div class="info-value">${data.student.dateOfBirth ? new Date(data.student.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Blood Group</div>
                <div class="info-value">${data.student.bloodGroup || 'N/A'}</div>
              </div>
              <div class="info-item" style="grid-column: 1 / -1">
                <div class="info-label">Address</div>
                <div class="info-value">${data.student.address || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Attendance</div>
            <div style="margin-bottom: 15px">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px">
                <span>Attendance Rate</span>
                <strong>${data.attendance.percentage}%</strong>
              </div>
              <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden">
                <div style="background: #1976d2; height: 100%; width: ${data.attendance.percentage}%"></div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px">
              <div class="stats-box">
                <div style="font-size: 24px; font-weight: bold; color: #1976d2">${data.attendance.total}</div>
                <div style="font-size: 12px; color: #666">Total Days</div>
              </div>
              <div class="stats-box">
                <div style="font-size: 24px; font-weight: bold; color: #4caf50">${data.attendance.present}</div>
                <div style="font-size: 12px; color: #666">Present</div>
              </div>
              <div class="stats-box">
                <div style="font-size: 24px; font-weight: bold; color: #f44336">${data.attendance.absent}</div>
                <div style="font-size: 12px; color: #666">Absent</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Fee Status</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px">
              <div class="stats-box" style="background: #e3f2fd">
                <div style="font-size: 20px; font-weight: bold">₹${data.fees.total}</div>
                <div style="font-size: 12px; color: #666">Total Fees</div>
              </div>
              <div class="stats-box" style="background: #e8f5e9">
                <div style="font-size: 20px; font-weight: bold; color: #4caf50">₹${data.fees.paid}</div>
                <div style="font-size: 12px; color: #666">Paid</div>
              </div>
              <div class="stats-box" style="background: #ffebee">
                <div style="font-size: 20px; font-weight: bold; color: #f44336">₹${data.fees.pending}</div>
                <div style="font-size: 12px; color: #666">Pending</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.fees.records.map(fee => `
                  <tr>
                    <td>${fee.feeType || 'Fee'}</td>
                    <td>₹${fee.amount}</td>
                    <td><span style="color: ${fee.status === 'Paid' ? '#4caf50' : '#f44336'}; font-weight: bold">${fee.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Academic Performance</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px">
              <div class="stats-box" style="background: #f3e5f5">
                <div style="font-size: 24px; font-weight: bold">${data.performance.avgMarks}%</div>
                <div style="font-size: 12px; color: #666">Average Percentage</div>
              </div>
              <div class="stats-box" style="background: #fff3e0">
                <div style="font-size: 24px; font-weight: bold">${data.performance.totalExams}</div>
                <div style="font-size: 12px; color: #666">Total Exams</div>
              </div>
            </div>
            <div style="font-weight: bold; margin-bottom: 10px">Recent Results</div>
            <table>
              <thead>
                <tr>
                  <th>Examination</th>
                  <th>Percentage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.performance.results.slice(0, 5).map(result => `
                  <tr>
                    <td>${result.examinationId?.title || 'Exam'}</td>
                    <td><span style="color: ${(result.percentage || 0) >= 60 ? '#4caf50' : '#f44336'}; font-weight: bold">${result.percentage || 0}%</span></td>
                    <td>${result.overallStatus || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Student Details</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Print">
              <IconButton onClick={handlePrint} size="small">
                <Print />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as PDF">
              <IconButton onClick={handleDownloadPDF} size="small">
                <Download />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <Box>
            <Paper sx={{ p: 3, mb: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                {data.student.firstName} {data.student.lastName}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ minWidth: 80 }}>Student ID:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2', fontFamily: 'monospace' }}>
                  {data.student.studentId || 'N/A'}
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy Student ID'}>
                  <IconButton size="small" onClick={handleCopyStudentId}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Roll Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{data.student.rollNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Admission Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{data.student.admissionNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Class</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{data.student.class} - {data.student.section}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Gender</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{data.student.gender || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Email</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{data.student.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Phone Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{data.student.phoneNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Date of Birth</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {data.student.dateOfBirth ? new Date(data.student.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Blood Group</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{data.student.bloodGroup || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Address</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{data.student.address || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Attendance</Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Attendance Rate</Typography>
                  <Typography variant="body2" fontWeight="bold">{data.attendance.percentage}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={parseFloat(data.attendance.percentage)} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="primary">{data.attendance.total}</Typography>
                    <Typography variant="caption">Total Days</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="success.main">{data.attendance.present}</Typography>
                    <Typography variant="caption">Present</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="error.main">{data.attendance.absent}</Typography>
                    <Typography variant="caption">Absent</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Fee Status</Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="h6">₹{data.fees.total}</Typography>
                    <Typography variant="caption">Total Fees</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                    <Typography variant="h6" color="success.main">₹{data.fees.paid}</Typography>
                    <Typography variant="caption">Paid</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>
                    <Typography variant="h6" color="error.main">₹{data.fees.pending}</Typography>
                    <Typography variant="caption">Pending</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                {data.fees.records.map((fee, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{fee.feeType || 'Fee'}</Typography>
                    <Chip 
                      label={fee.status} 
                      size="small"
                      color={fee.status === 'Paid' ? 'success' : 'error'}
                      icon={fee.status === 'Paid' ? <CheckCircle /> : <Cancel />}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Academic Performance</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 1 }}>
                    <Typography variant="h5">{data.performance.avgMarks}%</Typography>
                    <Typography variant="caption">Average Percentage</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                    <Typography variant="h5">{data.performance.totalExams}</Typography>
                    <Typography variant="caption">Total Exams</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Recent Results</Typography>
              <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                {data.performance.results.slice(0, 5).map((result, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                    <Typography variant="body2">{result.examinationId?.title || 'Exam'}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {result.percentage || 0}%
                      </Typography>
                      {(result.percentage || 0) >= 60 ? 
                        <TrendingUp color="success" fontSize="small" /> : 
                        <TrendingDown color="error" fontSize="small" />
                      }
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        ) : (
          <Typography>No data available</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
