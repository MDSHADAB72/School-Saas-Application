import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, LinearProgress, Collapse, IconButton, MenuItem, Pagination } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PrintIcon from '@mui/icons-material/Print';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAuth } from '../hooks/useAuth.js';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';
import { studentService, feeService, attendanceService, examinationService } from '../services/api.js';
import { useNotification } from '../components/common/Notification.jsx';
import { BulkStudentUpload } from '../components/BulkStudentUpload.jsx';
import { StudentDetailsModal } from '../components/StudentDetailsModal.jsx';
import { LoadingBar } from '../components/common/LoadingBar.jsx';

export function StudentsPage() {
  const { user, token, loading: authLoading } = useAuth();
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
  const [studentPages, setStudentPages] = useState({});
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
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
    if (!authLoading && user && token) {
      fetchClasses();
    } else if (!authLoading && (!user || !token)) {
      setLoading(false);
      showNotification('Please log in to access this page', 'error');
    }
  }, [authLoading, user, token]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudentsByClass();
      const classesData = response.data.classes || [];
      setClasses(classesData);
      
      // Extract unique classes and sections
      const uniqueClasses = [...new Set(classesData.map(c => c.class))].sort();
      const uniqueSections = [...new Set(classesData.map(c => c.section))].sort();
      setAvailableClasses(uniqueClasses);
      setAvailableSections(uniqueSections);
    } catch (error) {
      showNotification('Error fetching classes', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsPage = async (classItem, page = 1) => {
    const key = `${classItem.class}-${classItem.section}`;
    try {
      const response = await studentService.getAllStudents({ 
        class: classItem.class, 
        section: classItem.section,
        page,
        limit: 9
      });
      
      console.log(`Loading students for class ${classItem.class}-${classItem.section}, page ${page}:`, {
        studentsCount: response.data.students?.length || 0,
        totalCount: response.data.totalCount,
        page: page
      });
      
      const studentsReceived = response.data.students || [];
      let totalCount = response.data.totalCount;
      
      // If totalCount is undefined, get actual count from API
      if (totalCount === undefined || totalCount === null) {
        try {
          // Get all students to count them properly
          const allStudentsResponse = await studentService.getAllStudents({ 
            class: classItem.class, 
            section: classItem.section,
            page: 1,
            limit: 1000 // Large limit to get all students
          });
          totalCount = allStudentsResponse.data.students?.length || studentsReceived.length;
        } catch (error) {
          // Fallback to current page logic
          const existingData = classStudents[key];
          if (page === 1 && studentsReceived.length === 9) {
            totalCount = 10;
          } else if (page > 1 && existingData?.totalCount) {
            totalCount = existingData.totalCount;
          } else {
            totalCount = studentsReceived.length;
          }
        }
      }
      
      const enrichedStudents = await Promise.all(
        studentsReceived.map(async (student) => {
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
      
      setClassStudents(prev => ({ 
        ...prev, 
        [key]: {
          students: enrichedStudents,
          totalCount: totalCount,
          currentPage: page
        }
      }));
    } catch (error) {
      showNotification('Error fetching students', 'error');
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
      await loadStudentsPage(classItem, 1);
    }
  };

  const handlePageChange = async (classItem, page) => {
    const key = `${classItem.class}-${classItem.section}`;
    setStudentPages(prev => ({ ...prev, [key]: page }));
    await loadStudentsPage(classItem, page);
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

  if (authLoading || loading) return <LoadingBar />;

  if (!user || !token) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <Box sx={{ flex: 1 }}>
          <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography variant="h5" color="error" gutterBottom>
                Authentication Required
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Please log in to access the Students page.
              </Typography>
            </Box>
            <NotificationComponent />
          </Container>
        </Box>
      </Box>
    );
  }

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
            {user?.role !== 'teacher' && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setOpenBulkUpload(true)}>
                  Bulk Upload
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                  Add Student
                </Button>
              </Box>
            )}
          </Box>

          {/* Filter Section */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon color="primary" />
              Filter Students
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Search Student"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <TextField
                label="Class"
                select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                sx={{ minWidth: 120 }}
                size="small"
              >
                <MenuItem value="">All Classes</MenuItem>
                {availableClasses.map((cls) => (
                  <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Section"
                select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                sx={{ minWidth: 120 }}
                size="small"
              >
                <MenuItem value="">All Sections</MenuItem>
                {availableSections.map((section) => (
                  <MenuItem key={section} value={section}>{section}</MenuItem>
                ))}
              </TextField>
              <Button 
                variant="outlined" 
                onClick={() => { setFilterClass(''); setFilterSection(''); setSearchTerm(''); }}
                size="small"
              >
                Clear Filters
              </Button>
            </Box>
          </Paper>

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
                {(() => {
                  const filteredClasses = classes.filter(classItem => {
                    if (filterClass && classItem.class !== filterClass) return false;
                    if (filterSection && classItem.section !== filterSection) return false;
                    if (searchTerm) {
                      const students = classStudents[`${classItem.class}-${classItem.section}`] || [];
                      const hasMatchingStudent = students.some(student => 
                        `${student.userId?.firstName} ${student.userId?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.rollNumber?.toString().includes(searchTerm) ||
                        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      if (!hasMatchingStudent) return false;
                    }
                    return true;
                  });
                  
                  return filteredClasses.map((classItem) => {
                    const key = `${classItem.class}-${classItem.section}`;
                    const isExpanded = expandedClass === key;
                    const students = classStudents[key] || [];
                    
                    return (
                      <React.Fragment key={key}>
                        <TableRow hover sx={{ cursor: 'pointer' }}>
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
                              
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                                {(() => {
                                  const classData = classStudents[key];
                                  if (!classData || !classData.students) return [];
                                  
                                  let displayStudents = classData.students;
                                  if (searchTerm) {
                                    displayStudents = classData.students.filter(student => 
                                      `${student.userId?.firstName} ${student.userId?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      student.rollNumber?.toString().includes(searchTerm) ||
                                      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
                                    );
                                  }
                                  
                                  const sortedStudents = displayStudents.sort((a, b) => {
                                    const rollA = parseInt(a.rollNumber) || 0;
                                    const rollB = parseInt(b.rollNumber) || 0;
                                    return rollA - rollB;
                                  });
                                  
                                  return sortedStudents.map((student) => (
                                    <Box key={student._id} sx={{ 
                                      p: 2, 
                                      bgcolor: student.feeStatus === 'Paid' ? '#f0f8f0' : '#fff8f0',
                                      borderRadius: 1, 
                                      border: '1px solid', 
                                      borderColor: student.feeStatus === 'Paid' ? '#4caf50' : '#ff9800',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 1
                                    }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', cursor: 'pointer', color: '#1976d2' }}
                                            onClick={() => {
                                              setSelectedStudentId(student._id);
                                              setDetailsModalOpen(true);
                                            }}
                                          >
                                            {student.userId?.firstName} {student.userId?.lastName}
                                          </Typography>
                                          <Typography variant="caption" color="textSecondary">
                                            Roll: {student.rollNumber} | ID: {student.studentId || 'N/A'}
                                          </Typography>
                                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                            {student.gender}
                                          </Typography>
                                        </Box>
                                        <Chip 
                                          label={student.feeStatus || 'Unknown'} 
                                          size="small"
                                          color={student.feeStatus === 'Paid' ? 'success' : 'warning'}
                                        />
                                      </Box>
                                      
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography variant="caption">Attendance:</Typography>
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
                                        
                                        {student.performance === 'up' && (
                                          <Chip icon={<TrendingUpIcon />} label="Up" size="small" color="success" />
                                        )}
                                        {student.performance === 'down' && (
                                          <Chip icon={<TrendingDownIcon />} label="Down" size="small" color="error" />
                                        )}
                                        {student.performance === 'stable' && (
                                          <Chip label="Stable" size="small" color="primary" />
                                        )}
                                      </Box>
                                      
                                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                        <Button size="small" startIcon={<PrintIcon />} onClick={() => handleGenerateAdmitCard(student)} variant="outlined">
                                          Admit
                                        </Button>
                                        {user?.role !== 'teacher' && (
                                          <>
                                            <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(student)}>
                                              Edit
                                            </Button>
                                            <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={() => handleDelete(student._id)}>
                                              Delete
                                            </Button>
                                          </>
                                        )}
                                      </Box>
                                    </Box>
                                  ));
                                })()}
                              </Box>
                              
                              {(() => {
                                const classData = classStudents[key];
                                if (!classData) return null;
                                
                                const totalPages = Math.ceil(classData.totalCount / 9);
                                const currentPage = studentPages[key] || 1;
                                
                                if (totalPages > 1) return (
                                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={currentPage === 1}
                                      onClick={() => handlePageChange(classItem, Math.max(1, currentPage - 1))}
                                    >
                                      Previous
                                    </Button>
                                    <Typography variant="body2">
                                      Page {currentPage} of {totalPages}
                                    </Typography>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={currentPage >= totalPages}
                                      onClick={() => handlePageChange(classItem, Math.min(totalPages, currentPage + 1))}
                                    >
                                      Next
                                    </Button>
                                  </Box>
                                );
                                
                                return null;
                              })()}
                            </Box>
                          </Collapse>
                        </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  });
                })()}
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

          {user?.role !== 'teacher' && (
            <BulkStudentUpload open={openBulkUpload} onClose={() => setOpenBulkUpload(false)} onSuccess={fetchClasses} />
          )}
          <StudentDetailsModal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} studentId={selectedStudentId} />
          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
