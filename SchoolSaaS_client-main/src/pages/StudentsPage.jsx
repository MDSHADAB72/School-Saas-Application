import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, LinearProgress, Collapse, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PrintIcon from '@mui/icons-material/Print';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useAuth } from '../hooks/useAuth.js';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';
import { studentService, feeService, attendanceService, examinationService } from '../services/api.js';
import { useNotification } from '../components/common/Notification.jsx';
import { BulkStudentUpload } from '../components/BulkStudentUpload.jsx';
import { StudentDetailsModal } from '../components/StudentDetailsModal.jsx';
import { LoadingBar } from '../components/common/LoadingBar.jsx';

export function StudentsPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [expandedClass, setExpandedClass] = useState(null);
  const [classStudents, setClassStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
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
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudentsByClass();
      setClasses(response.data.classes || []);
    } catch (error) {
      showNotification('Error fetching classes', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandClass = async (classItem) => {
    const key = `${classItem.class}-${classItem.section}`;
    
    if (expandedClass === key) {
      setExpandedClass(null);
      return;
    }
    
    setExpandedClass(key);
    
    if (!classStudents[key]) {
      try {
        const response = await studentService.getAllStudents({ 
          class: classItem.class, 
          section: classItem.section,
          limit: 100
        });
        
        const enrichedStudents = await Promise.all(
          response.data.students.map(async (student) => {
            try {
              const [feesRes, attendanceRes, resultsRes] = await Promise.all([
                feeService.getAllFees({ studentId: student._id, limit: 100 }).catch(() => ({ data: { fees: [] } })),
                attendanceService.getAttendanceReport(student._id).catch(() => ({ data: { report: { percentage: 0 } } })),
                examinationService.getStudentResults(student._id).catch(() => ({ data: { results: [] } }))
              ]);
              
              const fees = feesRes.data.fees || [];
              const feeStatus = fees.length === 0 ? 'Unpaid' : (fees.every(f => f.status === 'Paid') ? 'Paid' : 'Unpaid');
              const attendancePercentage = attendanceRes.data.report?.percentage || 0;
              
              const results = resultsRes.data.results || [];
              let performance = 'stable';
              if (results.length >= 2) {
                const latest = results[0]?.percentage || 0;
                const previous = results[1]?.percentage || 0;
                if (latest > previous + 5) performance = 'up';
                else if (latest < previous - 5) performance = 'down';
              }
              
              return { ...student, feeStatus, attendancePercentage, performance };
            } catch {
              return { ...student, feeStatus: 'Unknown', attendancePercentage: 0, performance: 'stable' };
            }
          })
        );
        
        setClassStudents(prev => ({ ...prev, [key]: enrichedStudents }));
      } catch (error) {
        showNotification('Error fetching students', 'error');
      }
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
      fetchClasses();
      setClassStudents({});
      setExpandedClass(null);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error saving student', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentService.deleteStudent(id);
        showNotification('Student deleted successfully', 'success');
        fetchClasses();
        setClassStudents({});
        setExpandedClass(null);
      } catch (error) {
        showNotification('Error deleting student', 'error');
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Students by Class
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setOpenBulkUpload(true)}>
                Bulk Upload
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Add Student
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell width="50px" />
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Section</strong></TableCell>
                  <TableCell><strong>Total Students</strong></TableCell>
                  <TableCell><strong>Fee Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((classItem) => {
                  const key = `${classItem.class}-${classItem.section}`;
                  const isExpanded = expandedClass === key;
                  const students = classStudents[key] || [];
                  
                  return (
                    <>
                      <TableRow key={key} hover sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleExpandClass(classItem)}>
                            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell onClick={() => handleExpandClass(classItem)}>
                          <strong>Class {classItem.class}</strong>
                        </TableCell>
                        <TableCell onClick={() => handleExpandClass(classItem)}>
                          {classItem.section}
                        </TableCell>
                        <TableCell onClick={() => handleExpandClass(classItem)}>
                          {classItem.totalStudents}
                        </TableCell>
                        <TableCell onClick={() => handleExpandClass(classItem)}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={`${classItem.paidFeesCount} Paid`} size="small" color="success" />
                            <Chip label={`${classItem.pendingFeesCount} Pending`} size="small" color="warning" />
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="h6" gutterBottom>
                                Students in Class {classItem.class} - {classItem.section}
                              </Typography>
                              <Table size="small">
                                <TableHead sx={{ backgroundColor: '#f9f9f9' }}>
                                  <TableRow>
                                    <TableCell>Student ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Roll No</TableCell>
                                    <TableCell>Gender</TableCell>
                                    <TableCell>Fee Status</TableCell>
                                    <TableCell>Attendance</TableCell>
                                    <TableCell>Performance</TableCell>
                                    <TableCell>Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {students.map((student) => (
                                    <TableRow key={student._id} hover>
                                      <TableCell 
                                        sx={{ fontWeight: 'bold', color: '#1976d2', cursor: 'pointer' }}
                                        onClick={() => {
                                          setSelectedStudentId(student._id);
                                          setDetailsModalOpen(true);
                                        }}
                                      >
                                        {student.studentId || 'N/A'}
                                      </TableCell>
                                      <TableCell>{student.userId?.firstName} {student.userId?.lastName}</TableCell>
                                      <TableCell>{student.rollNumber}</TableCell>
                                      <TableCell>{student.gender}</TableCell>
                                      <TableCell>
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
                                          <Chip icon={<TrendingUpIcon />} label="Up" size="small" sx={{ bgcolor: '#c8e6c9', color: '#2e7d32' }} />
                                        )}
                                        {student.performance === 'down' && (
                                          <Chip icon={<TrendingDownIcon />} label="Down" size="small" sx={{ bgcolor: '#ffccbc', color: '#d32f2f' }} />
                                        )}
                                        {student.performance === 'stable' && (
                                          <Chip label="Stable" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                          <Button size="small" startIcon={<PrintIcon />} onClick={() => handleGenerateAdmitCard(student)} variant="outlined">
                                            Admit
                                          </Button>
                                          <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(student)}>
                                            Edit
                                          </Button>
                                          <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={() => handleDelete(student._id)}>
                                            Delete
                                          </Button>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>{editingId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, pt: 2 }}>
                <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleFormChange} fullWidth required />
                <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleFormChange} fullWidth required />
                <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleFormChange} fullWidth required />
                <TextField label="Roll Number" name="rollNumber" value={formData.rollNumber} onChange={handleFormChange} fullWidth />
                <TextField label="Class" name="class" value={formData.class} onChange={handleFormChange} fullWidth />
                <TextField label="Section" name="section" value={formData.section} onChange={handleFormChange} fullWidth />
                <TextField label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Gender" name="gender" select value={formData.gender} onChange={handleFormChange} fullWidth SelectProps={{ native: true }}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </TextField>
                <TextField label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleFormChange} fullWidth />
                <TextField label="Address" name="address" value={formData.address} onChange={handleFormChange} fullWidth multiline rows={3} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
            </DialogActions>
          </Dialog>

          <BulkStudentUpload open={openBulkUpload} onClose={() => setOpenBulkUpload(false)} onSuccess={fetchClasses} />
          <StudentDetailsModal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} studentId={selectedStudentId} />
          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
