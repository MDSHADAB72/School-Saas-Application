import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Collapse, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { examinationService, studentService } from '../services/api';
import { useNotification } from '../components/common/Notification';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingBar } from '../components/common/LoadingBar';

export function ExamControllerResultsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [examinations, setExaminations] = useState([]);
  const [results, setResults] = useState({});
  const [openRows, setOpenRows] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjectMarks, setSubjectMarks] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [openDeadlineDialog, setOpenDeadlineDialog] = useState(false);
  const [selectedExamForDeadline, setSelectedExamForDeadline] = useState(null);
  const [deadlineDate, setDeadlineDate] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, location.key]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all students
      const studentsResponse = await studentService.getAllStudents({ limit: 1000 });
      const students = studentsResponse.data.students || [];
      
      // Fetch all examinations
      const examsResponse = await examinationService.getAllExaminations({ page: 1, limit: 100 });
      const exams = examsResponse.data.examinations || [];
      setExaminations(exams);
      
      // Group students by class-section
      const grouped = students.reduce((acc, student) => {
        const key = `${student.class}-${student.section}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(student);
        return acc;
      }, {});
      
      // Add class-sections from exams even if no students exist
      exams.forEach(exam => {
        const key = `${exam.class}-${exam.section}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
      });
      
      setStudentsByClass(grouped);
      
      // Fetch results for all exams
      const resultsMap = {};
      for (const exam of exams) {
        try {
          const resultsRes = await examinationService.getExaminationResults(exam._id);
          resultsMap[exam._id] = resultsRes.data.results || [];
        } catch (error) {
          console.error(`Error fetching results for exam ${exam._id}:`, error);
        }
      }
      setResults(resultsMap);
      
    } catch (error) {
      showNotification('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRowToggle = (classKey) => {
    setOpenRows(prev => ({ ...prev, [classKey]: !prev[classKey] }));
  };

  const handleApproveResult = async (resultId, examId) => {
    try {
      await examinationService.approveResult(resultId);
      showNotification('Result approved successfully', 'success');
      // Refresh results for this exam
      const resultsRes = await examinationService.getExaminationResults(examId);
      setResults(prev => ({ ...prev, [examId]: resultsRes.data.results || [] }));
    } catch (error) {
      showNotification('Error approving result', 'error');
    }
  };

  const handleRejectResult = async (resultId, examId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await examinationService.rejectResult(resultId, reason);
      showNotification('Result rejected', 'success');
      // Refresh results for this exam
      const resultsRes = await examinationService.getExaminationResults(examId);
      setResults(prev => ({ ...prev, [examId]: resultsRes.data.results || [] }));
    } catch (error) {
      showNotification('Error rejecting result', 'error');
    }
  };

  const handleEnterMarks = async (student, exam) => {
    setSelectedExam(exam);
    setSelectedStudent(student);
    
    // Fetch existing result
    try {
      const resultsRes = await examinationService.getExaminationResults(exam._id);
      const existingResult = resultsRes.data.results?.find(r => r.studentId?._id === student._id);
      
      if (existingResult) {
        setSubjectMarks(exam.subjects.map(sub => {
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
        setSubjectMarks(exam.subjects.map(sub => ({
          subjectName: sub.subjectName || sub.name,
          maxMarks: sub.totalMarks || sub.maxMarks,
          passingMarks: sub.passingMarks,
          marksObtained: 0
        })));
        setRemarks('');
      }
    } catch (error) {
      setSubjectMarks(exam.subjects.map(sub => ({
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
      const data = {
        examinationId: selectedExam._id,
        studentId: selectedStudent._id,
        subjectResults: subjectMarks,
        remarks,
        isDraft
      };
      await examinationService.submitResult(data);
      showNotification(`Result ${isDraft ? 'saved as draft' : 'published'} successfully`, 'success');
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error submitting result', 'error');
    }
  };

  const handleUpdateDeadline = async () => {
    try {
      await examinationService.updateMarksDeadline(selectedExamForDeadline._id, deadlineDate);
      showNotification('Marks entry deadline updated successfully', 'success');
      setOpenDeadlineDialog(false);
      fetchData();
    } catch (error) {
      showNotification('Error updating deadline', 'error');
    }
  };

  const getExamsForClass = (classKey) => {
    const [className, section] = classKey.split('-');
    console.log(`Looking for class: "${className}" section: "${section}"`);
    const filtered = examinations.filter(exam => {
      console.log(`Exam: "${exam.examName}" class: "${exam.class}" section: "${exam.section}"`);
      const match = exam.class?.trim() === className.trim() && exam.section?.trim() === section.trim();
      console.log(`Match result: ${match}`);
      return match;
    });
    console.log(`Exams for ${classKey}:`, filtered);
    return filtered;
  };

  if (loading) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
            Results Management
          </Typography>

          {examinations.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No examinations found. Create an examination first.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell width="50px" />
                    <TableCell><strong>Class</strong></TableCell>
                    <TableCell><strong>Section</strong></TableCell>
                    <TableCell><strong>Total Students</strong></TableCell>
                    <TableCell><strong>Exams</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(studentsByClass).sort().map((classKey) => {
                  const [className, section] = classKey.split('-');
                  const examsForClass = getExamsForClass(classKey).filter(exam => 
                    new Date(exam.examEndDate) < new Date()
                  );
                  
                  // Don't show classes without completed exams
                  if (examsForClass.length === 0) return null;
                  
                  // Calculate status for all exams in this class
                  const totalStudents = studentsByClass[classKey].length;
                  let totalCompleted = 0;
                  let totalPending = 0;
                  
                  examsForClass.forEach(exam => {
                    const examResults = results[exam._id] || [];
                    const completedForExam = examResults.filter(r => !r.isDraft).length;
                    totalCompleted += completedForExam;
                    totalPending += (totalStudents - completedForExam);
                  });
                  
                  return (
                    <>
                      <TableRow key={classKey} hover>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleRowToggle(classKey)}>
                            {openRows[classKey] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>Class {className}</TableCell>
                        <TableCell>{section}</TableCell>
                        <TableCell>{totalStudents}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${examsForClass.length} Exam(s)`} 
                            size="small" 
                            color={examsForClass.length > 0 ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              label={`${totalCompleted} Completed`} 
                              size="small" 
                              color="success"
                            />
                            <Chip 
                              label={`${totalPending} Pending`} 
                              size="small" 
                              color="warning"
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                          <Collapse in={openRows[classKey]} timeout="auto" unmountOnExit disableStrictModeCompat>
                            <Box sx={{ margin: 2 }}>
                              {examsForClass.length === 0 ? (
                                <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                                  No examinations for this class
                                </Typography>
                              ) : (
                                examsForClass.map((exam) => {
                                  const examResults = results[exam._id] || [];
                                  return (
                                    <Box key={exam._id} sx={{ mb: 3 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                        <Box>
                                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {exam.examName}
                                          </Typography>
                                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                            {new Date(exam.examStartDate).toLocaleDateString()} - {new Date(exam.examEndDate).toLocaleDateString()}
                                          </Typography>
                                          {exam.marksEntryDeadline && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                              <Typography variant="caption" sx={{ 
                                                color: new Date(exam.marksEntryDeadline) < new Date() ? 'error.main' : 
                                                       new Date(exam.marksEntryDeadline) < new Date(Date.now() + 2*24*60*60*1000) ? 'warning.main' : 'text.secondary'
                                              }}>
                                                Deadline: {new Date(exam.marksEntryDeadline).toLocaleDateString()}
                                              </Typography>
                                              <Tooltip title="Edit Deadline">
                                                <IconButton size="small" onClick={() => {
                                                  setSelectedExamForDeadline(exam);
                                                  setDeadlineDate(exam.marksEntryDeadline?.split('T')[0] || '');
                                                  setOpenDeadlineDialog(true);
                                                }}>
                                                  <EditIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          )}
                                          {!exam.marksEntryDeadline && (
                                            <Button size="small" onClick={() => {
                                              setSelectedExamForDeadline(exam);
                                              setDeadlineDate('');
                                              setOpenDeadlineDialog(true);
                                            }} sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                                              Set Deadline
                                            </Button>
                                          )}
                                        </Box>
                                        <Chip 
                                          label={exam.status || 'draft'} 
                                          size="small"
                                          color={exam.status === 'public' ? 'success' : 'warning'}
                                        />
                                      </Box>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell><strong>Roll No</strong></TableCell>
                                            <TableCell><strong>Student Name</strong></TableCell>
                                            <TableCell><strong>Marks</strong></TableCell>
                                            <TableCell><strong>Grade</strong></TableCell>
                                            <TableCell><strong>Status</strong></TableCell>
                                            <TableCell><strong>Approval</strong></TableCell>
                                            <TableCell><strong>Actions</strong></TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {studentsByClass[classKey].map((student) => {
                                            const result = examResults.find(r => r.studentId?._id === student._id);
                                            return (
                                              <TableRow key={student._id}>
                                                <TableCell>{student.rollNumber}</TableCell>
                                                <TableCell>
                                                  {student.userId?.firstName} {student.userId?.lastName}
                                                </TableCell>
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
                                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                      size="small"
                                                      variant="contained"
                                                      onClick={() => handleEnterMarks(student, exam)}
                                                    >
                                                      {result ? 'Edit' : 'Enter'} Marks
                                                    </Button>
                                                    {result && !result.isDraft && result.approvalStatus === 'pending' && (
                                                      <>
                                                        <Button
                                                          size="small"
                                                          variant="contained"
                                                          color="success"
                                                          onClick={() => handleApproveResult(result._id, exam._id)}
                                                        >
                                                          Approve
                                                        </Button>
                                                        <Button
                                                          size="small"
                                                          variant="outlined"
                                                          color="error"
                                                          onClick={() => handleRejectResult(result._id, exam._id)}
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
                                    </Box>
                                  );
                                })
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  );
                  }).filter(Boolean)}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle>
              Submit Marks - {selectedStudent?.userId?.firstName} {selectedStudent?.userId?.lastName}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Examination:</strong> {selectedExam?.examName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  <strong>Roll Number:</strong> {selectedStudent?.rollNumber} | <strong>Class:</strong> {selectedStudent?.class}-{selectedStudent?.section}
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

          <Dialog open={openDeadlineDialog} onClose={() => setOpenDeadlineDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Set Marks Entry Deadline</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Set the last date for teachers to enter/edit marks for <strong>{selectedExamForDeadline?.examName}</strong>
                </Typography>
                <TextField
                  label="Deadline Date"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: selectedExamForDeadline?.examEndDate ? new Date(selectedExamForDeadline.examEndDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDeadlineDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdateDeadline} variant="contained">Update</Button>
            </DialogActions>
          </Dialog>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
