import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, IconButton, Accordion, AccordionSummary, AccordionDetails, ButtonGroup } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { examinationService, teacherService, studentService } from '../services/api';
import { useNotification } from '../components/common/Notification';
import { LoadingBar } from '../components/common/LoadingBar';
import { useNavigate } from 'react-router-dom';

export function ExamControllerExaminationsPageNew() {
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
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    examName: '',
    description: '',
    type: 'unit',
    class: '',
    section: '',
    examStartDate: '',
    examEndDate: '',
    subjects: [{
      subjectName: '',
      examDate: '',
      startTime: '',
      duration: 180,
      roomNumber: '',
      maxMarks: 100,
      totalMarks: 100,
      passingMarks: 33,
      invigilators: []
    }]
  });

  useEffect(() => {
    if (user) {
      fetchExaminations();
      fetchTeachers();
    }
  }, [user]);

  const fetchTeachers = async () => {
    try {
      const response = await teacherService.getAllTeachers({ limit: 1000 });
      setTeachers(response.data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

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
      subjects: [...prev.subjects, {
        subjectName: '',
        examDate: '',
        startTime: '',
        duration: 180,
        roomNumber: '',
        maxMarks: 100,
        totalMarks: 100,
        passingMarks: 33,
        invigilators: []
      }]
    }));
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
        i === index ? { ...sub, [field]: value } : sub
      )
    }));
  };

  const handleAddInvigilator = (subjectIndex) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((sub, i) => 
        i === subjectIndex ? {
          ...sub,
          invigilators: [...sub.invigilators, { teacherId: '', teacherName: '', role: 'Invigilator' }]
        } : sub
      )
    }));
  };

  const handleRemoveInvigilator = (subjectIndex, invIndex) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((sub, i) => 
        i === subjectIndex ? {
          ...sub,
          invigilators: sub.invigilators.filter((_, idx) => idx !== invIndex)
        } : sub
      )
    }));
  };

  const handleInvigilatorChange = async (subjectIndex, invIndex, field, value) => {
    const updated = formData.subjects.map((sub, i) => {
      if (i === subjectIndex) {
        const updatedInv = sub.invigilators.map((inv, idx) => {
          if (idx === invIndex) {
            if (field === 'teacherId') {
              const teacher = teachers.find(t => t._id === value);
              return { 
                ...inv, 
                teacherId: value,
                teacherName: teacher ? `${teacher.userId?.firstName} ${teacher.userId?.lastName}` : ''
              };
            }
            return { ...inv, [field]: value };
          }
          return inv;
        });
        return { ...sub, invigilators: updatedInv };
      }
      return sub;
    });
    setFormData(prev => ({ ...prev, subjects: updated }));

    // Check conflict
    if (field === 'teacherId' && value) {
      const subject = formData.subjects[subjectIndex];
      if (subject.examDate && subject.startTime) {
        try {
          const response = await examinationService.checkInvigilatorConflict({
            teacherId: value,
            examDate: subject.examDate,
            startTime: subject.startTime,
            duration: subject.duration
          });
          if (response.data.hasConflict) {
            const teacher = teachers.find(t => t._id === value);
            const teacherName = teacher ? `${teacher.userId?.firstName} ${teacher.userId?.lastName}` : 'This teacher';
            showNotification(`⚠️ ${teacherName} has a conflict!`, 'warning');
          }
        } catch (error) {
          console.error('Error checking conflict:', error);
        }
      }
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

  const handleViewResults = async (exam) => {
    try {
      console.log('Selected exam:', exam);
      console.log('Exam subjects:', exam.subjects);
      
      if (!exam.subjects || exam.subjects.length === 0) {
        showNotification('This examination has no subjects configured', 'error');
        return;
      }
      
      setSelectedExam(exam);
      
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

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this examination? All related results will also be deleted.')) {
      return;
    }

    try {
      await examinationService.deleteExamination(examId);
      showNotification('Examination deleted successfully', 'success');
      fetchExaminations();
    } catch (error) {
      showNotification('Error deleting examination', 'error');
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.examName || !formData.class || !formData.section || !formData.examStartDate || !formData.examEndDate) {
        showNotification('Please fill all required fields', 'error');
        return;
      }

      const validSubjects = formData.subjects.filter(s => 
        s.subjectName && s.examDate && s.startTime && s.maxMarks && s.totalMarks
      );
      
      if (validSubjects.length === 0) {
        showNotification('Please add at least one valid subject with all details', 'error');
        return;
      }

      await examinationService.createExamination({
        ...formData,
        subjects: validSubjects
      });
      
      showNotification('Examination created successfully', 'success');
      setOpenDialog(false);
      fetchExaminations();
      resetForm();
    } catch (error) {
      console.error('Error creating examination:', error);
      showNotification(error.response?.data?.message || 'Error creating examination', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      examName: '',
      description: '',
      type: 'unit',
      class: '',
      section: '',
      examStartDate: '',
      examEndDate: '',
      subjects: [{
        subjectName: '',
        examDate: '',
        startTime: '',
        duration: 180,
        roomNumber: '',
        maxMarks: 100,
        totalMarks: 100,
        passingMarks: 33,
        invigilators: []
      }]
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              Create Examination
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Exam Name</strong></TableCell>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Exam Period</strong></TableCell>
                  <TableCell><strong>Subjects</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Manage Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {examinations.map((exam) => (
                  <TableRow key={exam._id} hover>
                    <TableCell>{exam.examName}</TableCell>
                    <TableCell>{exam.class}-{exam.section}</TableCell>
                    <TableCell>{exam.type}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(exam.examStartDate).toLocaleDateString()} - {new Date(exam.examEndDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{exam.subjects?.length || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={exam.status || 'draft'} 
                        size="small"
                        color={exam.status === 'public' ? 'success' : exam.status === 'private' ? 'warning' : 'default'}
                      />
                    </TableCell>
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
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewResults(exam)}
                        >
                          Results
                        </Button>
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleDelete(exam._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Create Examination Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>Create New Examination</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
                <TextField
                  label="Examination Name"
                  value={formData.examName}
                  onChange={(e) => setFormData(prev => ({ ...prev, examName: e.target.value }))}
                  fullWidth
                  required
                  placeholder="e.g., Final Exam 2024"
                />
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={2}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Type"
                    select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <MenuItem value="unit">Unit Test</MenuItem>
                    <MenuItem value="midterm">Mid Term</MenuItem>
                    <MenuItem value="final">Final</MenuItem>
                    <MenuItem value="class_test">Class Test</MenuItem>
                  </TextField>
                  <TextField
                    label="Class"
                    value={formData.class}
                    onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Section"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    required
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Exam Start Date"
                    type="date"
                    value={formData.examStartDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, examStartDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  <TextField
                    label="Exam End Date"
                    type="date"
                    value={formData.examEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, examEndDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Box>

                <Typography variant="h6" sx={{ mt: 2 }}>Subjects</Typography>
                {formData.subjects.map((subject, subIdx) => (
                  <Accordion key={subIdx}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{subject.subjectName || `Subject ${subIdx + 1}`}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'grid', gap: 2 }}>
                        <TextField
                          label="Subject Name"
                          value={subject.subjectName}
                          onChange={(e) => handleSubjectChange(subIdx, 'subjectName', e.target.value)}
                          required
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                          <TextField
                            label="Exam Date"
                            type="date"
                            value={subject.examDate}
                            onChange={(e) => handleSubjectChange(subIdx, 'examDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                          />
                          <TextField
                            label="Start Time"
                            type="time"
                            value={subject.startTime}
                            onChange={(e) => handleSubjectChange(subIdx, 'startTime', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                          />
                          <TextField
                            label="Duration (min)"
                            type="number"
                            value={subject.duration}
                            onChange={(e) => handleSubjectChange(subIdx, 'duration', e.target.value)}
                          />
                        </Box>
                        <TextField
                          label="Room Number"
                          value={subject.roomNumber}
                          onChange={(e) => handleSubjectChange(subIdx, 'roomNumber', e.target.value)}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                          <TextField
                            label="Max Marks"
                            type="number"
                            value={subject.maxMarks}
                            onChange={(e) => handleSubjectChange(subIdx, 'maxMarks', e.target.value)}
                          />
                          <TextField
                            label="Total Marks"
                            type="number"
                            value={subject.totalMarks}
                            onChange={(e) => handleSubjectChange(subIdx, 'totalMarks', e.target.value)}
                          />
                          <TextField
                            label="Passing Marks"
                            type="number"
                            value={subject.passingMarks}
                            onChange={(e) => handleSubjectChange(subIdx, 'passingMarks', e.target.value)}
                          />
                        </Box>

                        <Typography variant="subtitle2" sx={{ mt: 1 }}>Invigilators</Typography>
                        {subject.invigilators.map((inv, invIdx) => (
                          <Box key={invIdx} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 1 }}>
                            <TextField
                              label="Teacher"
                              select
                              value={inv.teacherId}
                              onChange={(e) => handleInvigilatorChange(subIdx, invIdx, 'teacherId', e.target.value)}
                              size="small"
                            >
                              <MenuItem value="">Select Teacher</MenuItem>
                              {teachers.map((teacher) => (
                                <MenuItem key={teacher._id} value={teacher._id}>
                                  {teacher.userId?.firstName} {teacher.userId?.lastName}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              label="Manual Entry"
                              value={inv.teacherName}
                              onChange={(e) => handleInvigilatorChange(subIdx, invIdx, 'teacherName', e.target.value)}
                              size="small"
                              placeholder="External invigilator"
                            />
                            <TextField
                              label="Role"
                              select
                              value={inv.role}
                              onChange={(e) => handleInvigilatorChange(subIdx, invIdx, 'role', e.target.value)}
                              size="small"
                            >
                              <MenuItem value="Chief Invigilator">Chief</MenuItem>
                              <MenuItem value="Invigilator">Invigilator</MenuItem>
                              <MenuItem value="Relief">Relief</MenuItem>
                            </TextField>
                            <IconButton onClick={() => handleRemoveInvigilator(subIdx, invIdx)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                        <Button onClick={() => handleAddInvigilator(subIdx)} variant="outlined" size="small" startIcon={<AddIcon />}>
                          Add Invigilator
                        </Button>

                        {formData.subjects.length > 1 && (
                          <Button onClick={() => handleRemoveSubject(subIdx)} color="error" variant="outlined" size="small">
                            Remove Subject
                          </Button>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
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
              Results for: {selectedExam?.examName}
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
                      <TableCell><strong>Approval</strong></TableCell>
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
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleSubmitMarks(student)}
                              >
                                {result ? 'Edit' : 'Submit'} Marks
                              </Button>
                              {result && !result.isDraft && result.approvalStatus === 'pending' && (
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
