import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Card, CardContent, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { examinationService, studentService, teacherService } from '../services/api';
import { templateService } from '../services/templateService';
import { useNotification } from '../components/common/Notification';
import { useLocation, Navigate } from 'react-router-dom';
import { LoadingBar } from '../components/common/LoadingBar';
import { TeacherResultsPage } from './TeacherResultsPage';
import { ExamControllerResultsPage } from './ExamControllerResultsPage';

export function ResultsPage() {
  const { user } = useAuth();
  const location = useLocation();

  // Route teachers to TeacherResultsPage
  if (user?.role === 'teacher' && !location.state?.exam) {
    return <TeacherResultsPage />;
  }

  // Route exam controllers to ExamControllerResultsPage
  if (user?.role === 'exam_controller' && !location.state?.exam) {
    return <ExamControllerResultsPage />;
  }
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjectMarks, setSubjectMarks] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();

  const isStudent = user?.role === 'student' || user?.role === 'parent';
  const isTeacher = user?.role === 'teacher' || user?.role === 'school_admin' || user?.role === 'exam_controller';

  // If teacher comes with exam state (from mark entry), show mark entry dialog
  const showMarkEntry = isTeacher && location.state?.exam && location.state?.student;

  useEffect(() => {
    if (location.state?.exam && location.state?.student) {
      handleOpenDialog(location.state.exam, location.state.student);
    }
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        const response = await examinationService.getMyResults();
        setResults(response.data.results);
      }
    } catch (error) {
      showNotification('Error fetching results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (exam, student) => {
    setSelectedExam(exam);
    setSelectedStudent(student);
    
    // Filter subjects based on user role
    let subjectsToShow = exam.subjects;
    if (user?.role === 'teacher') {
      // Get teacher's subject
      try {
        const teacherResponse = await teacherService.getAllTeachers({ limit: 1000 });
        const teachers = teacherResponse.data.teachers || [];
        const currentTeacher = teachers.find(t => {
          const teacherUserId = t.userId?._id || t.userId;
          return teacherUserId === user.userId || teacherUserId === user.id;
        });
        
        if (currentTeacher?.subject) {
          // Filter to show only teacher's subject
          subjectsToShow = exam.subjects.filter(sub => 
            (sub.subjectName || sub.name)?.toLowerCase().trim() === currentTeacher.subject?.toLowerCase().trim()
          );
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      }
    }
    
    // Try to fetch existing result for this student and exam
    try {
      const resultsRes = await examinationService.getExaminationResults(exam._id);
      const existingResult = resultsRes.data.results?.find(r => r.studentId?._id === student._id);
      
      if (existingResult) {
        // Load existing marks for filtered subjects
        setSubjectMarks(subjectsToShow.map(sub => {
          const existingSubject = existingResult.subjectResults?.find(s => s.subjectName === (sub.subjectName || sub.name));
          return {
            subjectName: sub.subjectName || sub.name,
            maxMarks: sub.totalMarks || sub.maxMarks,
            passingMarks: sub.passingMarks,
            marksObtained: existingSubject?.marksObtained || 0
          };
        }));
        setRemarks(existingResult.remarks || '');
      } else {
        // No existing result, start fresh with filtered subjects
        setSubjectMarks(subjectsToShow.map(sub => ({
          subjectName: sub.subjectName || sub.name,
          maxMarks: sub.totalMarks || sub.maxMarks,
          passingMarks: sub.passingMarks,
          marksObtained: 0
        })));
        setRemarks('');
      }
    } catch (error) {
      console.error('Error fetching existing result:', error);
      // If error, start fresh with filtered subjects
      setSubjectMarks(subjectsToShow.map(sub => ({
        subjectName: sub.subjectName || sub.name,
        maxMarks: sub.totalMarks || sub.maxMarks,
        passingMarks: sub.passingMarks,
        marksObtained: 0
      })));
      setRemarks('');
    }
    
    setOpenDialog(true);
  };

  const handleSubjectMarkChange = (index, value) => {
    setSubjectMarks(prev => prev.map((mark, i) => 
      i === index ? { ...mark, marksObtained: Number(value) } : mark
    ));
  };

  const handleSubmitResult = async (isDraft) => {
    try {
      // For teachers, merge their subject marks with existing marks from other subjects
      let finalSubjectMarks = subjectMarks;
      
      if (user?.role === 'teacher') {
        // Fetch existing result to preserve marks from other subjects
        try {
          const resultsRes = await examinationService.getExaminationResults(selectedExam._id);
          const existingResult = resultsRes.data.results?.find(r => r.studentId?._id === selectedStudent._id);
          
          if (existingResult?.subjectResults) {
            // Merge: keep existing marks for other subjects, update only teacher's subject
            const teacherSubjectNames = subjectMarks.map(s => s.subjectName);
            const otherSubjectMarks = existingResult.subjectResults.filter(
              s => !teacherSubjectNames.includes(s.subjectName)
            );
            finalSubjectMarks = [...otherSubjectMarks, ...subjectMarks];
          }
        } catch (error) {
          console.error('Error fetching existing marks:', error);
        }
      }
      
      const data = {
        examinationId: selectedExam._id,
        studentId: selectedStudent._id,
        subjectResults: finalSubjectMarks,
        remarks,
        isDraft
      };
      await examinationService.submitResult(data);
      showNotification(`Result ${isDraft ? 'saved as draft' : 'published'} successfully`, 'success');
      setOpenDialog(false);
      if (isStudent) {
        fetchResults();
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error submitting result', 'error');
    }
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'success';
    if (grade === 'B+' || grade === 'B') return 'info';
    if (grade === 'C' || grade === 'D') return 'warning';
    return 'error';
  };

  const handlePrintResultCard = async (result) => {
    try {
      console.log('Frontend - Result object being sent:', JSON.stringify(result, null, 2));
      console.log('Frontend - Result ID:', result._id);
      console.log('Frontend - User object:', JSON.stringify(user, null, 2));
      
      showNotification('Generating result card...', 'info');
      
      const response = await examinationService.printResultCard(result._id);
      
      console.log('Frontend - Response from backend:', response.data);
      
      if (response.data.success) {
        const pdfBlob = new Blob([
          Uint8Array.from(atob(response.data.data.pdf), c => c.charCodeAt(0))
        ], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Result_Card_${result.studentId?.studentId || 'Unknown'}_${result.examinationId?.title?.replace(/\s+/g, '_') || 'Exam'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showNotification('Result card downloaded successfully!', 'success');
      } else {
        showNotification('Failed to generate result card', 'error');
      }
    } catch (error) {
      console.error('Print result card error:', error);
      showNotification(error.response?.data?.message || 'Failed to generate result card', 'error');
    }
  };

  if (loading && isStudent) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
            {isStudent ? 'My Results' : 'Examination Results'}
          </Typography>

          {isStudent && (
            <Grid container spacing={3}>
              {results.map((result) => (
                <Grid item xs={12} key={result._id}>
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {result.examinationId?.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {result.examinationId?.code} | {result.examinationId?.type}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Date: {new Date(result.examinationId?.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip 
                              label={result.overallStatus} 
                              color={result.overallStatus === 'Pass' ? 'success' : 'error'}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                              {result.percentage}%
                            </Typography>
                            <Chip 
                              label={`Grade: ${result.overallGrade}`} 
                              color={getGradeColor(result.overallGrade)}
                              size="small"
                            />
                          </Box>
                          <Tooltip title="Print Result Card">
                            <IconButton 
                              color="primary" 
                              onClick={() => handlePrintResultCard(result)}
                              sx={{ alignSelf: 'flex-start' }}
                            >
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Subject-wise Performance
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Subject</strong></TableCell>
                              <TableCell align="center"><strong>Marks Obtained</strong></TableCell>
                              <TableCell align="center"><strong>Max Marks</strong></TableCell>
                              <TableCell align="center"><strong>Grade</strong></TableCell>
                              <TableCell align="center"><strong>Status</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {result.subjectResults?.map((sub, index) => (
                              <TableRow key={index}>
                                <TableCell>{sub.subjectName}</TableCell>
                                <TableCell align="center">{sub.marksObtained}</TableCell>
                                <TableCell align="center">{sub.maxMarks}</TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={sub.grade} 
                                    size="small"
                                    color={getGradeColor(sub.grade)}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={sub.status} 
                                    size="small"
                                    color={sub.status === 'Pass' ? 'success' : 'error'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell><strong>Total</strong></TableCell>
                              <TableCell align="center"><strong>{result.totalMarksObtained}</strong></TableCell>
                              <TableCell align="center"><strong>{result.totalMaxMarks}</strong></TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={result.overallGrade} 
                                  color={getGradeColor(result.overallGrade)}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={result.overallStatus} 
                                  color={result.overallStatus === 'Pass' ? 'success' : 'error'}
                                />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {result.remarks && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Remarks:</Typography>
                          <Typography variant="body2">{result.remarks}</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {results.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                      No results published yet
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {/* Submit Marks Dialog */}
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)} 
            maxWidth="md" 
            fullWidth
            disableScrollLock
          >
            <DialogTitle>
              Submit Marks - {selectedStudent?.userId?.firstName} {selectedStudent?.userId?.lastName}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Examination:</strong> {selectedExam?.examName || selectedExam?.title} {selectedExam?.code && `(${selectedExam.code})`}
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  <strong>Roll Number:</strong> {selectedStudent?.rollNumber} | <strong>Class:</strong> {selectedStudent?.class}-{selectedStudent?.section}
                </Typography>

                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Enter Marks for Each Subject
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Subject</strong></TableCell>
                        <TableCell align="center"><strong>Max Marks</strong></TableCell>
                        <TableCell align="center"><strong>Passing Marks</strong></TableCell>
                        <TableCell align="center"><strong>Marks Obtained</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectMarks.map((subject, index) => (
                        <TableRow key={index}>
                          <TableCell>{subject.subjectName}</TableCell>
                          <TableCell align="center">{subject.maxMarks}</TableCell>
                          <TableCell align="center">{subject.passingMarks}</TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              value={subject.marksObtained}
                              onChange={(e) => handleSubjectMarkChange(index, e.target.value)}
                              inputProps={{ min: 0, max: subject.maxMarks }}
                              size="small"
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TextField
                  label="Remarks (Optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  sx={{ mt: 3 }}
                  placeholder="Add any remarks or feedback for the student..."
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={() => handleSubmitResult(true)} variant="outlined">
                Save as Draft
              </Button>
              <Button onClick={() => handleSubmitResult(false)} variant="contained" color="success">
                Publish Result
              </Button>
            </DialogActions>
          </Dialog>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
