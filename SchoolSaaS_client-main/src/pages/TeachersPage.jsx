import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { teacherService } from '../services/api.js';
import { BulkTeacherUpload } from '../components/BulkTeacherUpload.jsx';

export function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    subject: '',
    qualification: '',
    experience: 0
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await teacherService.getAllTeachers({ page: 1, limit: 100 });
      setTeachers(res.data.teachers || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenDialog = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        firstName: teacher.userId?.firstName || '',
        lastName: teacher.userId?.lastName || '',
        email: teacher.userId?.email || '',
        phoneNumber: teacher.userId?.phoneNumber || '',
        employeeId: teacher.employeeId || '',
        subject: teacher.subject || '',
        qualification: teacher.qualification || '',
        experience: teacher.experience || 0
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        employeeId: '',
        subject: '',
        qualification: '',
        experience: 0
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTeacher(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingTeacher) {
        await teacherService.updateTeacher(editingTeacher._id, formData);
      } else {
        await teacherService.createTeacher(formData);
      }
      handleCloseDialog();
      fetchTeachers();
    } catch (err) {
      console.error('Error saving teacher:', err);
      setError('Failed to save teacher');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Manage Teachers
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<CloudUploadIcon />} 
                onClick={() => setOpenBulkUpload(true)}
              >
                Bulk Upload
              </Button>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add New Teacher
              </Button>
            </Box>
          </Box>

          {error && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : teachers.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">No teachers found. Add one to get started!</Typography>
            </Paper>
          ) : (
            <Paper sx={{ boxShadow: 2 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Subject</strong></TableCell>
                      <TableCell><strong>Classes</strong></TableCell>
                      <TableCell><strong>Phone</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teachers.map((teacher) => (
                      <TableRow key={teacher._id} hover>
                        <TableCell><strong>{teacher.userId?.firstName || 'N/A'} {teacher.userId?.lastName || ''}</strong></TableCell>
                        <TableCell>{teacher.userId?.email || 'N/A'}</TableCell>
                        <TableCell>{teacher.subject || 'N/A'}</TableCell>
                        <TableCell>{teacher.classesAssigned?.length || 0}</TableCell>
                        <TableCell>{teacher.userId?.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Box sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: teacher.active ? 'success.light' : 'warning.light',
                            color: teacher.active ? 'success.dark' : 'warning.dark',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}>
                            {teacher.active ? 'Active' : 'Inactive'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenDialog(teacher)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Add/Edit Teacher Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Qualification"
                    value={formData.qualification}
                    onChange={(e) => handleInputChange('qualification', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Experience (years)"
                    type="number"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained">
                {editingTeacher ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>

          <BulkTeacherUpload 
            open={openBulkUpload} 
            onClose={() => setOpenBulkUpload(false)}
            onSuccess={fetchTeachers}
          />
        </Container>
      </Box>
    </Box>
  );
}
