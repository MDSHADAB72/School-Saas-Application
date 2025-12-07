import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, ButtonGroup, IconButton, List, ListItem, ListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { examinationService, studentService } from '../services/api';
import { templateService } from '../services/templateService';
import { useNotification } from '../components/common/Notification';
import { useNavigate } from 'react-router-dom';
import { LoadingBar } from '../components/common/LoadingBar';
import api from '../services/api';

// Create Exam Controller Button Component
function CreateExamControllerButton() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const { showNotification } = useNotification();

  const handleSubmit = async () => {
    try {
      await api.post('/auth/create-exam-controller', formData);
      showNotification('Exam Controller created successfully', 'success');
      setOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '' });
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error creating exam controller', 'error');
    }
  };

  return (
    <>
      <Button 
        variant="outlined" 
        startIcon={<PersonAddIcon />} 
        onClick={() => setOpen(true)}
        color="secondary"
      >
        Create Exam Controller
      </Button>
      
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Exam Controller</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              fullWidth
              helperText=""
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              fullWidth
              helperText=""
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
              helperText=""
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              fullWidth
              helperText=""
            />
            <TextField
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              fullWidth
              helperText=""
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function ExaminationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [examinations, setExaminations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    type: 'unit',
    class: '',
    sections: '',
    date: '',
    startAt: '',
    durationMinutes: 180,
    venue: '',
    subjects: [{ name: '', maxMarks: 100, passingMarks: 33 }]
  });

  const isAdmin = false; // School admin cannot create exams
  const isTeacher = user?.role === 'teacher' || user?.role === 'school_admin';

  useEffect(() => {
    if (user) {
      fetchExaminations();
    }
  }, [user]);

  const fetchExaminations = async () => {
    try {
      setLoading(true);
      const response = await examinationService.getAllExaminations({ page: 1, limit: 100 });
      setExaminations(response.data.examinations);
    } catch (error) {
      showNotification('Error fetching examinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { name: '', maxMarks: 100, passingMarks: 33 }]
    }));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRemoveSubject = (index) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((sub, i) => 
        i === index ? { ...sub, [field]: field === 'name' ? value : Number(value) } : sub
      )
    }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.class || !formData.date) {
        showNotification('Please fill all required fields', 'error');
        return;
      }

      // Validate subjects
      const validSubjects = formData.subjects.filter(s => s.name && s.maxMarks && s.passingMarks);
      if (validSubjects.length === 0) {
        showNotification('Please add at least one valid subject', 'error');
        return;
      }

      const dataToSave = {
        ...formData,
        sections: formData.sections ? formData.sections.split(',').map(s => s.trim()).filter(s => s) : [],
        subjects: validSubjects,
        durationMinutes: Number(formData.durationMinutes)
      };

      console.log('Sending data:', dataToSave);
      await examinationService.createExamination(dataToSave);
      showNotification('Examination created successfully', 'success');
      setOpenDialog(false);
      fetchExaminations();
      resetForm();
    } catch (error) {
      console.error('Error creating examination:', error);
      showNotification(error.response?.data?.message || 'Error creating examination', 'error');
    }
  };

  const handleStatusChange = async (examId, newStatus) => {
    try {
      await examinationService.updateExaminationStatus(examId, newStatus);
      showNotification(`Status updated to ${newStatus}`, 'success');
      fetchExaminations();
    } catch (error) {
      showNotification('Error updating status', 'error');
    }
  };

  const handleApproveResult = async (resultId) => {
    try {
      await examinationService.approveResult(resultId);
      showNotification('Result approved and published successfully', 'success');
      handleViewResults(selectedExam);
    } catch (error) {
      showNotification('Error approving result', 'error');
    }
  };

  const handleRejectResult = async (resultId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await examinationService.rejectResult(resultId, reason);
      showNotification('Result rejected', 'success');
      handleViewResults(selectedExam);
    } catch (error) {
      showNotification('Error rejecting result', 'error');
    }
  };

  const handleViewResults = async (exam) => {
    try {
      console.log('Selected exam:', exam);
      console.log('Exam subjects:', exam.subjects);
      
      if (!exam.subjects || exam.subjects.length === 0) {
        showNotification('This examination has no subjects configured', 'error');
        return;
      }
      
      setSelectedExam(exam);
      
      // Fetch students - trim whitespace from class and section
      const classFilter = exam.class?.trim();
      const sectionFilter = exam.section?.trim();
      
      console.log('Fetching students for class:', classFilter, 'section:', sectionFilter);
      
      const [studentsRes, resultsRes] = await Promise.all([
        studentService.getAllStudents({ class: classFilter, section: sectionFilter, limit: 1000 }),
        examinationService.getExaminationResults(exam._id)
      ]);
      
      console.log('Students found:', studentsRes.data.students?.length);
      
      if (!studentsRes.data.students || studentsRes.data.students.length === 0) {
        showNotification(`No students found in class ${classFilter}-${sectionFilter}`, 'warning');
      }
      
      setStudents(studentsRes.data.students || []);
      setResults(resultsRes.data.results || []);
      setOpenResultDialog(true);
    } catch (error) {
      console.error('Error fetching results:', error);
      showNotification('Error fetching results', 'error');
    }
  };

  const handleSubmitMarks = (student) => {
    navigate('/results', { state: { exam: selectedExam, student } });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      description: '',
      type: 'unit',
      class: '',
      sections: '',
      date: '',
      startAt: '',
      durationMinutes: 180,
      venue: '',
      subjects: [{ name: '', maxMarks: 100, passingMarks: 33 }]
    });
  };



  if (loading) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Examinations
            </Typography>
            {user?.role === 'school_admin' && (
              <CreateExamControllerButton />
            )}
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Date & Time</strong></TableCell>
                  <TableCell><strong>Room</strong></TableCell>
                  <TableCell><strong>Subjects</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {user?.role === 'exam_controller' && <TableCell><strong>Manage Status</strong></TableCell>}
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {examinations.map((exam) => {
                  const title = exam.examName || exam.title || 'Untitled';
                  const code = exam.code || '-';
                  
                  let dateDisplay = 'Not Set';
                  if (exam.examStartDate && exam.examEndDate) {
                    try {
                      dateDisplay = `${new Date(exam.examStartDate).toLocaleDateString()} - ${new Date(exam.examEndDate).toLocaleDateString()}`;
                    } catch (e) {
                      dateDisplay = 'Invalid Date';
                    }
                  } else if (exam.date) {
                    try {
                      dateDisplay = new Date(exam.date).toLocaleDateString();
                    } catch (e) {
                      dateDisplay = 'Invalid Date';
                    }
                  }
                  
                  const room = exam.subjects?.[0]?.roomNumber || exam.roomNumber || 'Not Set';
                  
                  return (
                    <TableRow key={exam._id} hover>
                      <TableCell>{title}</TableCell>
                      <TableCell>{code}</TableCell>
                      <TableCell>{exam.class}-{exam.section}</TableCell>
                      <TableCell>{exam.type}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{dateDisplay}</Typography>
                      </TableCell>
                      <TableCell>{room}</TableCell>
                      <TableCell>{exam.subjects?.length || 0}</TableCell>
                      <TableCell>
                        <Chip 
                          label={exam.status || 'draft'} 
                          size="small"
                          color={exam.status === 'public' ? 'success' : exam.status === 'private' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      {user?.role === 'exam_controller' && (
                        <TableCell>
                          <ButtonGroup size="small">
                            <Button 
                              onClick={() => handleStatusChange(exam._id, 'draft')}
                              variant={exam.status === 'draft' ? 'contained' : 'outlined'}
                            >
                              Draft
                            </Button>
                            <Button 
                              onClick={() => handleStatusChange(exam._id, 'public')}
                              variant={exam.status === 'public' ? 'contained' : 'outlined'}
                              color="success"
                            >
                              Public
                            </Button>
                            <Button 
                              onClick={() => handleStatusChange(exam._id, 'private')}
                              variant={exam.status === 'private' ? 'contained' : 'outlined'}
                              color="warning"
                            >
                              Private
                            </Button>
                          </ButtonGroup>
                        </TableCell>
                      )}
                      <TableCell>
                        {isTeacher && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewResults(exam)}
                          >
                            Results
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Create Examination Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>Create New Examination</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, pt: 2 }}>
                <TextField
                  label="Title"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  fullWidth
                  required
                  helperText=""
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Code"
                    value={formData.code}
                    onChange={(e) => handleFormChange('code', e.target.value)}
                    helperText=""
                  />
                  <TextField
                    label="Type"
                    select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    helperText=""
                  >
                    <MenuItem value="unit">Unit Test</MenuItem>
                    <MenuItem value="midterm">Mid Term</MenuItem>
                    <MenuItem value="final">Final</MenuItem>
                    <MenuItem value="class_test">Class Test</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Class"
                    value={formData.class}
                    onChange={(e) => handleFormChange('class', e.target.value)}
                    required
                    helperText=""
                  />
                  <TextField
                    label="Sections (comma separated)"
                    value={formData.sections}
                    onChange={(e) => handleFormChange('sections', e.target.value)}
                    placeholder="A, B, C"
                    helperText=""
                  />
                </Box>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  multiline
                  rows={2}
                  helperText=""
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    helperText=""
                  />
                  <TextField
                    label="Start Time"
                    type="time"
                    value={formData.startAt}
                    onChange={(e) => handleFormChange('startAt', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText=""
                  />
                  <TextField
                    label="Duration (min)"
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => handleFormChange('durationMinutes', e.target.value)}
                    helperText=""
                  />
                </Box>
                <TextField
                  label="Venue"
                  value={formData.venue}
                  onChange={(e) => handleFormChange('venue', e.target.value)}
                  helperText=""
                />
                
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>Subjects</Typography>
                {formData.subjects.map((subject, index) => (
                  <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 1, alignItems: 'center' }}>
                    <TextField
                      label="Subject Name"
                      value={subject.name}
                      onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                      size="small"
                      helperText=""
                    />
                    <TextField
                      label="Max Marks"
                      type="number"
                      value={subject.maxMarks}
                      onChange={(e) => handleSubjectChange(index, 'maxMarks', e.target.value)}
                      size="small"
                      helperText=""
                    />
                    <TextField
                      label="Passing Marks"
                      type="number"
                      value={subject.passingMarks}
                      onChange={(e) => handleSubjectChange(index, 'passingMarks', e.target.value)}
                      size="small"
                      helperText=""
                    />
                    <IconButton onClick={() => handleRemoveSubject(index)} disabled={formData.subjects.length === 1}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button onClick={handleAddSubject} variant="outlined" startIcon={<AddIcon />}>
                  Add Subject
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} variant="contained">Create</Button>
            </DialogActions>
          </Dialog>

          {/* Results Dialog */}
          <Dialog open={openResultDialog} onClose={() => setOpenResultDialog(false)} maxWidth="lg" fullWidth>
            <DialogTitle>
              Results for: {selectedExam?.examName || selectedExam?.title}
            </DialogTitle>
            <DialogContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Roll No</strong></TableCell>
                      <TableCell><strong>Student Name</strong></TableCell>
                      <TableCell><strong>Class</strong></TableCell>
                      <TableCell><strong>Marks</strong></TableCell>
                      <TableCell><strong>Grade</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      {user?.role === 'exam_controller' && <TableCell><strong>Approval</strong></TableCell>}
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => {
                      const result = results.find(r => r.studentId?._id === student._id);
                      return (
                        <TableRow key={student._id}>
                          <TableCell>{student.rollNumber}</TableCell>
                          <TableCell>{student.userId?.firstName} {student.userId?.lastName}</TableCell>
                          <TableCell>{student.class}-{student.section}</TableCell>
                          <TableCell>
                            {result ? `${result.totalMarksObtained}/${result.totalMaxMarks}` : '-'}
                          </TableCell>
                          <TableCell>{result?.overallGrade || '-'}</TableCell>
                          <TableCell>
                            {result ? (
                              <Chip 
                                label={result.isDraft ? 'Draft' : result.overallStatus} 
                                size="small"
                                color={result.overallStatus === 'Pass' ? 'success' : 'error'}
                              />
                            ) : '-'}
                          </TableCell>
                          {user?.role === 'exam_controller' && (
                            <TableCell>
                              {result && !result.isDraft ? (
                                <Chip 
                                  label={result.approvalStatus || 'pending'} 
                                  size="small"
                                  color={
                                    result.approvalStatus === 'approved' ? 'success' : 
                                    result.approvalStatus === 'rejected' ? 'error' : 'warning'
                                  }
                                />
                              ) : '-'}
                            </TableCell>
                          )}
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {user?.role !== 'school_admin' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleSubmitMarks(student)}
                                >
                                  {result ? 'Edit' : 'Submit'} Marks
                                </Button>
                              )}
                              {user?.role === 'exam_controller' && result && !result.isDraft && result.approvalStatus === 'pending' && (
                                <>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleApproveResult(result._id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleRejectResult(result._id)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {user?.role === 'school_admin' && result && (
                                <Chip 
                                  label="View Only" 
                                  size="small"
                                  color="default"
                                />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenResultDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
