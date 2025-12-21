import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, IconButton, Accordion, AccordionSummary, AccordionDetails, ButtonGroup, Pagination } from '@mui/material';
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
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  const [teachers, setTeachers] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [examsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [studentPages, setStudentPages] = useState({});
  const [formData, setFormData] = useState({
    examName: '',
    examCode: '',
    description: '',
    type: 'unit',
    class: '',
    section: '',
    examStartDate: '',
    examEndDate: '',
    subjects: [{
      subjectName: '',
      subjectCode: '',
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      fetchExaminations(currentPage);
      fetchTeachers();
    }
  }, [user, currentPage]);

  const fetchTeachers = async () => {
    try {
      const response = await teacherService.getAllTeachers({ limit: 1000 });
      setTeachers(response.data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchExaminations = async (page = 1) => {
    try {
      setLoading(true);
      const response = await examinationService.getAllExaminations({ page, limit: examsPerPage });
      setExaminations(response.data.examinations || []);
      
      // Handle totalCount properly
      let count = response.data.totalCount;
      if (count === undefined || count === null) {
        try {
          const allExamsResponse = await examinationService.getAllExaminations({ page: 1, limit: 1000 });
          count = allExamsResponse.data.examinations?.length || 0;
        } catch (error) {
          count = response.data.examinations?.length || 0;
        }
      }
      
      setTotalCount(count);
      
      // For filters, we still need all exams - this is a limitation we'll accept for now
      // In a real implementation, filters would be handled server-side
      if (page === 1) {
        const allResponse = await examinationService.getAllExaminations({ page: 1, limit: 1000 });
        const allExams = allResponse.data.examinations || [];
        
        // Extract unique classes and sections
        const classes = [...new Set(allExams.map(exam => exam.class).filter(Boolean))];
        const sections = [...new Set(allExams.map(exam => exam.section).filter(Boolean))];
        setAvailableClasses(classes.sort());
        setAvailableSections(sections.sort());
      }
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
        subjectCode: '',
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
    // Validate subject date is within exam period
    if (field === 'examDate' && value && formData.examStartDate && formData.examEndDate) {
      if (value < formData.examStartDate || value > formData.examEndDate) {
        showNotification('Subject exam date must be between exam start and end dates', 'error');
        return;
      }
    }

    // Check for duplicate date/time combination
    if ((field === 'examDate' || field === 'startTime') && value) {
      const updatedSubjects = formData.subjects.map((sub, i) => 
        i === index ? { ...sub, [field]: value } : sub
      );
      const currentSubject = updatedSubjects[index];
      
      if (currentSubject.examDate && currentSubject.startTime) {
        const duplicate = updatedSubjects.some((sub, i) => 
          i !== index && 
          sub.examDate === currentSubject.examDate && 
          sub.startTime === currentSubject.startTime
        );
        
        if (duplicate) {
          showNotification('Another subject already has the same date and time', 'error');
          return;
        }
      }
    }

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
      fetchExaminations(currentPage);
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
      fetchExaminations(currentPage);
    } catch (error) {
      showNotification('Error deleting examination', 'error');
    }
  };

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setOpenDetailDialog(true);
  };

  const handleEdit = () => {
    setEditMode(true);
    setFormData({
      examName: selectedExam.examName,
      examCode: selectedExam.examCode || selectedExam.code || '',
      description: selectedExam.description || '',
      type: selectedExam.type,
      class: selectedExam.class,
      section: selectedExam.section,
      examStartDate: selectedExam.examStartDate?.split('T')[0] || '',
      examEndDate: selectedExam.examEndDate?.split('T')[0] || '',
      subjects: selectedExam.subjects?.map(sub => ({
        subjectName: sub.subjectName || '',
        subjectCode: sub.subjectCode || '',
        examDate: sub.examDate?.split('T')[0] || '',
        startTime: sub.startTime || '',
        duration: sub.duration || 180,
        roomNumber: sub.roomNumber || '',
        maxMarks: sub.maxMarks || 100,
        totalMarks: sub.totalMarks || 100,
        passingMarks: sub.passingMarks || 33,
        invigilators: sub.invigilators || []
      })) || [{
        subjectName: '',
        subjectCode: '',
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
    setOpenDetailDialog(false);
    setOpenDialog(true);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic required fields
    if (!formData.examName?.trim()) {
      newErrors.examName = 'Examination name is required';
    } else if (formData.examName.length < 3 || formData.examName.length > 100) {
      newErrors.examName = 'Must be between 3-100 characters';
    }
    
    if (!formData.class?.trim()) {
      newErrors.class = 'Class is required';
    }
    
    if (!formData.section?.trim()) {
      newErrors.section = 'Section is required';
    }
    
    if (!formData.examStartDate) {
      newErrors.examStartDate = 'Start date is required';
    }
    
    if (!formData.examEndDate) {
      newErrors.examEndDate = 'End date is required';
    }

    // Date validations
    if (formData.examStartDate && formData.examEndDate) {
      const startDate = new Date(formData.examStartDate);
      const endDate = new Date(formData.examEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.examStartDate = 'Cannot be in the past';
      }
      if (endDate < startDate) {
        newErrors.examEndDate = 'Must be after start date';
      }
    }

    // Optional field validations
    if (formData.examCode && (formData.examCode.length < 2 || formData.examCode.length > 20)) {
      newErrors.examCode = 'Must be between 2-20 characters';
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Cannot exceed 500 characters';
    }

    // Subject validations
    const validSubjects = formData.subjects.filter(s => 
      s.subjectName?.trim() && s.examDate && s.startTime && s.maxMarks && s.totalMarks
    );
    
    if (validSubjects.length === 0) {
      newErrors.subjects = 'At least one valid subject required';
    }

    // Validate each subject
    formData.subjects.forEach((subject, i) => {
      if (subject.subjectName?.trim()) {
        if (subject.subjectName.length < 2 || subject.subjectName.length > 50) {
          newErrors[`subject_${i}_name`] = 'Must be 2-50 characters';
        }
        if (!subject.examDate) {
          newErrors[`subject_${i}_date`] = 'Date required';
        }
        if (!subject.startTime) {
          newErrors[`subject_${i}_time`] = 'Time required';
        }
        if (subject.duration < 30 || subject.duration > 480) {
          newErrors[`subject_${i}_duration`] = 'Must be 30-480 minutes';
        }
        if (subject.maxMarks < 1 || subject.maxMarks > 1000) {
          newErrors[`subject_${i}_maxMarks`] = 'Must be 1-1000';
        }
        if (subject.totalMarks < 1 || subject.totalMarks > 1000) {
          newErrors[`subject_${i}_totalMarks`] = 'Must be 1-1000';
        }
        if (subject.passingMarks < 0 || subject.passingMarks > subject.totalMarks) {
          newErrors[`subject_${i}_passingMarks`] = 'Must be 0 to total marks';
        }
      }
    });

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      showNotification('Please fix validation errors', 'error');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      const validSubjects = formData.subjects.filter(s => 
        s.subjectName?.trim() && s.examDate && s.startTime && s.maxMarks && s.totalMarks
      );

      const dataToSave = {
        ...formData,
        subjects: validSubjects
      };

      if (editMode) {
        await examinationService.updateExamination(selectedExam._id, dataToSave);
        showNotification('Examination updated successfully', 'success');
      } else {
        await examinationService.createExamination(dataToSave);
        showNotification('Examination created successfully', 'success');
      }
      
      setOpenDialog(false);
      setEditMode(false);
      fetchExaminations(currentPage);
      resetForm();
    } catch (error) {
      console.error('Error saving examination:', error);
      showNotification(error.response?.data?.message || 'Error saving examination', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      examName: '',
      examCode: '',
      description: '',
      type: 'unit',
      class: '',
      section: '',
      examStartDate: '',
      examEndDate: '',
      subjects: [{
        subjectName: '',
        subjectCode: '',
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
    setErrors({});
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditMode(false); resetForm(); setOpenDialog(true); }}>
              Create Examination
            </Button>
          </Box>

          {/* Filter Section */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Filter Examinations
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                onClick={() => { setFilterClass(''); setFilterSection(''); }}
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
                {examinations.map((exam) => {
                  const isExamEnded = new Date() > new Date(exam.examEndDate);
                  return (
                <TableRow 
                  key={exam._id} 
                  hover 
                  sx={{ cursor: 'pointer' }} 
                  onClick={() => handleExamClick(exam)}
                >
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ButtonGroup size="small">
                        <Button 
                          onClick={() => handleStatusChange(exam._id, 'draft')}
                          variant={exam.status === 'draft' ? 'contained' : 'outlined'}
                          disabled={isExamEnded}
                        >
                          Draft
                        </Button>
                        <Button 
                          onClick={() => handleStatusChange(exam._id, 'public')}
                          variant={exam.status === 'public' ? 'contained' : 'outlined'}
                          color="success"
                          disabled={isExamEnded}
                        >
                          Public
                        </Button>
                        <Button 
                          onClick={() => handleStatusChange(exam._id, 'private')}
                          variant={exam.status === 'private' ? 'contained' : 'outlined'}
                          color="warning"
                          disabled={isExamEnded}
                        >
                          Private
                        </Button>
                      </ButtonGroup>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={() => handleDelete(exam._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {(() => {
            const totalPages = Math.ceil(totalCount / examsPerPage);
            
            if (totalPages > 1) return (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                >
                  Next
                </Button>
              </Box>
            );
            
            return null;
          })()}

          {/* Exam Detail Dialog */}
          <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{selectedExam?.examName}</Box>
              {selectedExam && new Date() <= new Date(selectedExam.examEndDate) && (
                <Button startIcon={<AddIcon />} variant="contained" color="secondary" onClick={handleEdit}>
                  Edit
                </Button>
              )}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {selectedExam && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Basic Info Card */}
                  <Paper elevation={2} sx={{ p: 2.5, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>Basic Information</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, mb: 2 }}>
                      {(selectedExam.examCode || selectedExam.code) && (
                        <Box>
                          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>CODE</Typography>
                          <Typography variant="body1">{selectedExam.examCode || selectedExam.code}</Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>TYPE</Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{selectedExam.type}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>CLASS</Typography>
                        <Typography variant="body1">{selectedExam.class}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>SECTION</Typography>
                        <Typography variant="body1">{selectedExam.section}</Typography>
                      </Box>
                    </Box>
                    {selectedExam.description && (
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>DESCRIPTION</Typography>
                        <Typography variant="body2">{selectedExam.description}</Typography>
                      </Box>
                    )}
                  </Paper>

                  {/* Exam Period Card */}
                  <Paper elevation={2} sx={{ p: 2.5, borderLeft: '4px solid', borderColor: 'success.main' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>Exam Period</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>START DATE</Typography>
                        <Typography variant="body1">{new Date(selectedExam.examStartDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>END DATE</Typography>
                        <Typography variant="body1">{new Date(selectedExam.examEndDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Subjects Card */}
                  <Paper elevation={2} sx={{ p: 2.5, borderLeft: '4px solid', borderColor: 'warning.main' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'warning.main' }}>Subjects ({selectedExam.subjects?.length || 0})</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedExam.subjects?.map((subject, idx) => (
                        <Paper key={idx} elevation={1} sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{subject.subjectName}</Typography>
                              {subject.subjectCode && <Typography variant="caption" color="textSecondary">Code: {subject.subjectCode}</Typography>}
                            </Box>
                            <Chip label={`${subject.maxMarks} Marks`} size="small" color="primary" variant="outlined" />
                          </Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1 }}>
                            <Box>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>DATE</Typography>
                              <Typography variant="body2">{new Date(subject.examDate).toLocaleDateString()}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>TIME</Typography>
                              <Typography variant="body2">{subject.startTime} ({subject.duration} min)</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>ROOM</Typography>
                              <Typography variant="body2">{subject.roomNumber || 'Not assigned'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>PASSING MARKS</Typography>
                              <Typography variant="body2">{subject.passingMarks}</Typography>
                            </Box>
                          </Box>
                          {subject.invigilators?.length > 0 && (
                            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'grey.300' }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>INVIGILATORS</Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {subject.invigilators.map((inv, invIdx) => (
                                  <Chip key={invIdx} label={inv.teacherName || 'N/A'} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, bgcolor: 'grey.50' }}>
              <Button onClick={() => setOpenDetailDialog(false)} variant="outlined">Close</Button>
            </DialogActions>
          </Dialog>

          {/* Create/Edit Examination Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>{editMode ? 'Edit Examination' : 'Create New Examination'}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                  <TextField
                    label="Examination Name"
                    value={formData.examName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, examName: e.target.value }));
                      if (errors.examName) setErrors(prev => ({ ...prev, examName: null }));
                    }}
                    required
                    placeholder="e.g., Final Exam 2024"
                    inputProps={{ maxLength: 50 }}
                    helperText={errors.examName || `${formData.examName.length}/50 characters`}
                    error={!!errors.examName}
                  />
                  <TextField
                    label="Exam Code"
                    value={formData.examCode}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, examCode: e.target.value.toUpperCase() }));
                      if (errors.examCode) setErrors(prev => ({ ...prev, examCode: null }));
                    }}
                    placeholder="e.g., FE2024"
                    inputProps={{ maxLength: 10 }}
                    helperText={errors.examCode || "Optional - 2-10 characters"}
                    error={!!errors.examCode}
                  />
                </Box>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                    if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                  }}
                  multiline
                  rows={2}
                  inputProps={{ maxLength: 500 }}
                  helperText={errors.description || `${formData.description.length}/500 characters`}
                  error={!!errors.description}
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData(prev => ({ ...prev, class: value }));
                      if (errors.class) setErrors(prev => ({ ...prev, class: null }));
                    }}
                    required
                    inputProps={{ maxLength: 3 }}
                    helperText={errors.class || "Numbers only - e.g., 1, 10, 12"}
                    error={!!errors.class}
                  />
                  <TextField
                    label="Section"
                    value={formData.section}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                      setFormData(prev => ({ ...prev, section: value }));
                      if (errors.section) setErrors(prev => ({ ...prev, section: null }));
                    }}
                    required
                    inputProps={{ maxLength: 3 }}
                    helperText={errors.section || "Letters only - e.g., A, B, AB"}
                    error={!!errors.section}
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Exam Start Date"
                    type="date"
                    value={formData.examStartDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, examStartDate: e.target.value }));
                      if (errors.examStartDate) setErrors(prev => ({ ...prev, examStartDate: null }));
                    }}
                    InputLabelProps={{ shrink: true }}
                    required
                    helperText={errors.examStartDate}
                    error={!!errors.examStartDate}
                  />
                  <TextField
                    label="Exam End Date"
                    type="date"
                    value={formData.examEndDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, examEndDate: e.target.value }));
                      if (errors.examEndDate) setErrors(prev => ({ ...prev, examEndDate: null }));
                    }}
                    InputLabelProps={{ shrink: true }}
                    required
                    helperText={errors.examEndDate}
                    error={!!errors.examEndDate}
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
                        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                          <TextField
                            label="Subject Name"
                            value={subject.subjectName}
                            onChange={(e) => {
                              handleSubjectChange(subIdx, 'subjectName', e.target.value);
                              if (errors[`subject_${subIdx}_name`]) {
                                setErrors(prev => ({ ...prev, [`subject_${subIdx}_name`]: null }));
                              }
                            }}
                            required
                            inputProps={{ maxLength: 50 }}
                            helperText={errors[`subject_${subIdx}_name`] || "Required - 2-50 characters"}
                            error={!!errors[`subject_${subIdx}_name`]}
                          />
                          <TextField
                            label="Subject Code"
                            value={subject.subjectCode}
                            onChange={(e) => handleSubjectChange(subIdx, 'subjectCode', e.target.value.toUpperCase())}
                            placeholder="e.g., MATH101"
                            inputProps={{ maxLength: 20 }}
                            helperText="Optional - 2-20 characters"
                          />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                          <TextField
                            label="Exam Date"
                            type="date"
                            value={subject.examDate}
                            onChange={(e) => {
                              handleSubjectChange(subIdx, 'examDate', e.target.value);
                              if (errors[`subject_${subIdx}_date`]) {
                                setErrors(prev => ({ ...prev, [`subject_${subIdx}_date`]: null }));
                              }
                            }}
                            InputLabelProps={{ shrink: true }}
                            required
                            helperText={errors[`subject_${subIdx}_date`]}
                            error={!!errors[`subject_${subIdx}_date`]}
                          />
                          <TextField
                            label="Start Time"
                            type="time"
                            value={subject.startTime}
                            onChange={(e) => {
                              handleSubjectChange(subIdx, 'startTime', e.target.value);
                              if (errors[`subject_${subIdx}_time`]) {
                                setErrors(prev => ({ ...prev, [`subject_${subIdx}_time`]: null }));
                              }
                            }}
                            InputLabelProps={{ shrink: true }}
                            required
                            helperText={errors[`subject_${subIdx}_time`]}
                            error={!!errors[`subject_${subIdx}_time`]}
                          />
                          <TextField
                            label="Duration (min)"
                            type="number"
                            value={subject.duration}
                            onChange={(e) => handleSubjectChange(subIdx, 'duration', Math.max(30, Math.min(480, parseInt(e.target.value) || 30)))}
                            inputProps={{ min: 30, max: 480, step: 15 }}
                            helperText="30-480 minutes"
                          />
                        </Box>
                        <TextField
                          label="Room Number"
                          value={subject.roomNumber}
                          onChange={(e) => handleSubjectChange(subIdx, 'roomNumber', e.target.value)}
                          inputProps={{ maxLength: 20 }}
                          helperText="Optional - max 20 characters"
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                          <TextField
                            label="Max Marks"
                            type="number"
                            value={subject.maxMarks}
                            onChange={(e) => handleSubjectChange(subIdx, 'maxMarks', Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                            inputProps={{ min: 1, max: 1000 }}
                            helperText="1-1000"
                            required
                          />
                          <TextField
                            label="Total Marks"
                            type="number"
                            value={subject.totalMarks}
                            onChange={(e) => handleSubjectChange(subIdx, 'totalMarks', Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                            inputProps={{ min: 1, max: 1000 }}
                            helperText="1-1000"
                            required
                          />
                          <TextField
                            label="Passing Marks"
                            type="number"
                            value={subject.passingMarks}
                            onChange={(e) => handleSubjectChange(subIdx, 'passingMarks', Math.max(0, Math.min(subject.totalMarks, parseInt(e.target.value) || 0)))}
                            inputProps={{ min: 0, max: subject.totalMarks }}
                            helperText={`0-${subject.totalMarks}`}
                            required
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
              <Button onClick={() => { setOpenDialog(false); setEditMode(false); }}>Cancel</Button>
              <Button onClick={handleSave} variant="contained">{editMode ? 'Update' : 'Create'}</Button>
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
                    {(() => {
                      const currentPage = studentPages['results'] || 1;
                      const studentsPerPage = 10;
                      const startIndex = (currentPage - 1) * studentsPerPage;
                      const endIndex = startIndex + studentsPerPage;
                      const paginatedStudents = students.slice(startIndex, endIndex);
                      
                      return paginatedStudents.map((student) => {
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
                      });
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {students.length > 10 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(students.length / 10)}
                    page={studentPages['results'] || 1}
                    onChange={(event, value) => setStudentPages(prev => ({ ...prev, results: value }))}
                    color="primary"
                    size="medium"
                  />
                </Box>
              )}
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
