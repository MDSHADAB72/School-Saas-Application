import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Pagination, Chip, LinearProgress, Checkbox, Toolbar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PrintIcon from '@mui/icons-material/Print';
import { useAuth } from '../hooks/useAuth.js';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';
import { studentService, feeService, attendanceService, examinationService } from '../services/api.js';
import { useNotification } from '../components/common/Notification.jsx';
import { BulkStudentUpload } from '../components/BulkStudentUpload.jsx';
import { StudentDetailsModal } from '../components/StudentDetailsModal.jsx';
import { ExportData } from '../components/common/ExportData.jsx';
import { LoadingBar } from '../components/common/LoadingBar.jsx';

export function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    rollNumber: '',
    class: '',
    section: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: '',
    address: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getAllStudents({ page, limit: 10 });
      
      // Enrich student data with fees, attendance, and performance
      const enrichedStudents = await Promise.all(
        response.data.students.map(async (student) => {
          try {
            const [feesRes, attendanceRes, resultsRes] = await Promise.all([
              feeService.getAllFees({ studentId: student._id, limit: 100 }).catch(() => ({ data: { fees: [] } })),
              attendanceService.getAttendanceReport(student._id).catch(() => ({ data: { report: { percentage: 0 } } })),
              examinationService.getStudentResults(student._id).catch(() => ({ data: { results: [] } }))
            ]);
            
            const fees = feesRes.data.fees || [];
            
            // If no fees exist, default to Unpaid
            if (fees.length === 0) {
              return {
                ...student,
                feeStatus: 'Unpaid',
                attendancePercentage: attendanceRes.data.report?.percentage || 0,
                performance: 'stable'
              };
            }
            
            // Check if all fees are paid
            const allPaid = fees.every(f => f.status === 'Paid');
            const pendingFees = fees.filter(f => f.status === 'Pending' || f.status === 'Overdue').length;
            const feeStatus = allPaid ? 'Paid' : 'Unpaid';
            
            const attendancePercentage = attendanceRes.data.report?.percentage || 0;
            
            const results = resultsRes.data.results || [];
            let performance = 'stable';
            if (results.length >= 2) {
              const latest = results[0]?.percentage || 0;
              const previous = results[1]?.percentage || 0;
              if (latest > previous + 5) performance = 'up';
              else if (latest < previous - 5) performance = 'down';
            }
            
            return {
              ...student,
              feeStatus,
              attendancePercentage,
              performance
            };
          } catch {
            return {
              ...student,
              feeStatus: 'Unknown',
              attendancePercentage: 0,
              performance: 'stable'
            };
          }
        })
      );
      
      setStudents(enrichedStudents);
      setTotalPages(Math.ceil(response.data.pagination.total / 10));
    } catch (error) {
      showNotification('Error fetching students', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (student = null) => {
    if (student) {
      setEditingId(student._id);
      setFormData({
        firstName: student.userId?.firstName || '',
        lastName: student.userId?.lastName || '',
        email: student.userId?.email || '',
        rollNumber: student.rollNumber,
        class: student.class,
        section: student.section,
        dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
        gender: student.gender || 'Male',
        bloodGroup: student.bloodGroup || '',
        address: student.address || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        rollNumber: '',
        class: '',
        section: '',
        dateOfBirth: '',
        gender: 'Male',
        bloodGroup: '',
        address: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await studentService.updateStudent(editingId, formData);
        showNotification('Student updated successfully', 'success');
      } else {
        await studentService.createStudent(formData);
        showNotification('Student created successfully', 'success');
      }
      handleCloseDialog();
      fetchStudents();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error saving student', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentService.deleteStudent(id);
        showNotification('Student deleted successfully', 'success');
        fetchStudents();
      } catch (error) {
        showNotification('Error deleting student', 'error');
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(students.map(s => s._id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selected.length} students?`)) {
      try {
        await Promise.all(selected.map(id => studentService.deleteStudent(id)));
        showNotification(`${selected.length} students deleted successfully`, 'success');
        setSelected([]);
        fetchStudents();
      } catch (error) {
        showNotification('Error deleting students', 'error');
      }
    }
  };

  const handleGenerateAdmitCard = async (student) => {
    try {
      showNotification('Generating admit card...', 'info');
      
      const response = await studentService.generateAdmitCard(student._id);
      
      if (response.data.success) {
        const pdfBlob = new Blob([
          Uint8Array.from(atob(response.data.data.pdf), c => c.charCodeAt(0))
        ], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Admit_Card_${student.studentId || 'Unknown'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showNotification('Admit card downloaded successfully!', 'success');
      } else {
        showNotification('Failed to generate admit card', 'error');
      }
    } catch (error) {
      console.error('Generate admit card error:', error);
      showNotification(error.response?.data?.message || 'Failed to generate admit card', 'error');
    }
  };



  if (loading) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 0 },
            mb: 2 
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' },
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              Students Management
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1, sm: 2 },
              flexWrap: 'wrap',
              width: { xs: '100%', sm: 'auto' }
            }}>
              <ExportData 
                data={students.map(s => ({
                  'Student ID': s.studentId || 'N/A',
                  Name: `${s.userId?.firstName} ${s.userId?.lastName}`,
                  'Roll Number': s.rollNumber,
                  Class: s.class,
                  Section: s.section,
                  Gender: s.gender,
                  'Fee Status': s.feeStatus,
                  'Attendance %': s.attendancePercentage,
                  Performance: s.performance,
                  Email: s.userId?.email
                }))}
                filename="students"
                title="Students Report"
                dateField="admissionDate"
              />
              <Button 
                variant="outlined" 
                startIcon={<CloudUploadIcon />} 
                onClick={() => setOpenBulkUpload(true)}
              >
                Bulk Upload
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Add Student
              </Button>
            </Box>
          </Box>

          {selected.length > 0 && (
            <Toolbar sx={{ bgcolor: '#e3f2fd', borderRadius: 1, mb: 2, px: 2 }}>
              <Typography sx={{ flex: '1 1 100%' }} color="primary" variant="subtitle1">
                {selected.length} selected
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </Toolbar>
          )}

          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < students.length}
                      checked={students.length > 0 && selected.length === students.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell><strong>Student ID</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Roll No</strong></TableCell>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Section</strong></TableCell>
                  <TableCell><strong>Gender</strong></TableCell>
                  <TableCell><strong>Fee Status</strong></TableCell>
                  <TableCell><strong>Attendance</strong></TableCell>
                  <TableCell><strong>Performance</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow 
                    key={student._id} 
                    hover
                    selected={selected.includes(student._id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.includes(student._id)}
                        onChange={() => handleSelectOne(student._id)}
                      />
                    </TableCell>
                    <TableCell 
                      sx={{ fontWeight: 'bold', color: '#1976d2' }}
                      onClick={() => {
                        setSelectedStudentId(student._id);
                        setDetailsModalOpen(true);
                      }}
                    >
                      {student.studentId || 'N/A'}
                    </TableCell>
                    <TableCell onClick={() => {
                      setSelectedStudentId(student._id);
                      setDetailsModalOpen(true);
                    }}>{student.userId?.firstName} {student.userId?.lastName}</TableCell>
                    <TableCell onClick={() => {
                      setSelectedStudentId(student._id);
                      setDetailsModalOpen(true);
                    }}>{student.rollNumber}</TableCell>
                    <TableCell onClick={() => {
                      setSelectedStudentId(student._id);
                      setDetailsModalOpen(true);
                    }}>{student.class}</TableCell>
                    <TableCell onClick={() => {
                      setSelectedStudentId(student._id);
                      setDetailsModalOpen(true);
                    }}>{student.section}</TableCell>
                    <TableCell onClick={() => {
                      setSelectedStudentId(student._id);
                      setDetailsModalOpen(true);
                    }}>{student.gender}</TableCell>
                    <TableCell onClick={() => {
                      setSelectedStudentId(student._id);
                      setDetailsModalOpen(true);
                    }}>
                      <Chip 
                        label={student.feeStatus || 'Unknown'} 
                        size="small"
                        sx={{ 
                          bgcolor: student.feeStatus === 'Paid' ? '#c8e6c9' : '#ffccbc',
                          color: student.feeStatus === 'Paid' ? '#2e7d32' : '#d32f2f',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={student.attendancePercentage || 0} 
                          sx={{ 
                            width: 60, 
                            height: 6, 
                            borderRadius: 1,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: student.attendancePercentage >= 75 ? '#4caf50' : '#ff9800'
                            }
                          }} 
                        />
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {student.attendancePercentage || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {student.performance === 'up' && (
                        <Chip 
                          icon={<TrendingUpIcon />} 
                          label="Up" 
                          size="small" 
                          sx={{ bgcolor: '#c8e6c9', color: '#2e7d32' }}
                        />
                      )}
                      {student.performance === 'down' && (
                        <Chip 
                          icon={<TrendingDownIcon />} 
                          label="Down" 
                          size="small" 
                          sx={{ bgcolor: '#ffccbc', color: '#d32f2f' }}
                        />
                      )}
                      {student.performance === 'stable' && (
                        <Chip 
                          label="Stable" 
                          size="small" 
                          sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                        />
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          startIcon={<PrintIcon />}
                          onClick={() => handleGenerateAdmitCard(student)}
                          color="primary"
                          variant="outlined"
                        >
                          Admit Card
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(student)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={() => handleDelete(student._id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(e, value) => setPage(value)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingId ? 'Edit Student' : 'Add New Student'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, pt: 2 }}>
                <TextField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Roll Number"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleFormChange}
                  fullWidth
                />
                <TextField
                  label="Class"
                  name="class"
                  value={formData.class}
                  onChange={handleFormChange}
                  fullWidth
                />
                <TextField
                  label="Section"
                  name="section"
                  value={formData.section}
                  onChange={handleFormChange}
                  fullWidth
                />
                <TextField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Gender"
                  name="gender"
                  select
                  value={formData.gender}
                  onChange={handleFormChange}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </TextField>
                <TextField
                  label="Blood Group"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleFormChange}
                  fullWidth
                />
                <TextField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSave} variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>

          <BulkStudentUpload 
            open={openBulkUpload} 
            onClose={() => setOpenBulkUpload(false)}
            onSuccess={fetchStudents}
          />

          <StudentDetailsModal
            open={detailsModalOpen}
            onClose={() => setDetailsModalOpen(false)}
            studentId={selectedStudentId}
          />

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
