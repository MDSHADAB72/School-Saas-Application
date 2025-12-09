import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Collapse, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { examinationService, studentService, teacherService } from '../services/api';
import { useNotification } from '../components/common/Notification';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingBar } from '../components/common/LoadingBar';

export function TeacherResultsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [examinations, setExaminations] = useState([]);
  const [teacherSubject, setTeacherSubject] = useState('');
  const [openRows, setOpenRows] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user, location.key]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      console.log('Current user:', user);
      
      // Get teacher details to find their subject
      const teacherResponse = await teacherService.getAllTeachers({ limit: 1000 });
      console.log('Teacher API response:', teacherResponse.data);
      const teachers = teacherResponse.data.teachers || [];
      console.log('All teachers:', teachers);
      console.log('Looking for userId:', user.userId, 'or id:', user.id);
      const currentTeacher = teachers.find(t => {
        const teacherUserId = t.userId?._id || t.userId;
        console.log('Comparing:', teacherUserId, 'with', user.userId, 'or', user.id);
        return teacherUserId === user.userId || teacherUserId === user.id;
      });
      console.log('Current teacher found:', currentTeacher);
      
      if (currentTeacher?.subject) {
        setTeacherSubject(currentTeacher.subject);
        
        // Fetch all students
        const studentsResponse = await studentService.getAllStudents({ limit: 1000 });
        console.log('Students API response:', studentsResponse.data);
        const students = studentsResponse.data.students || [];
        
        // Fetch examinations that have teacher's subject (only public exams)
        const examsResponse = await examinationService.getAllExaminations({ page: 1, limit: 100, status: 'public' });
        console.log('Exams API response:', examsResponse.data);
        console.log('Teacher subject:', currentTeacher.subject);
        console.log('Public exams:', examsResponse.data.examinations);
        
        const filteredExams = examsResponse.data.examinations.filter(exam => {
          const hasSubject = exam.subjects?.some(sub => 
            sub.subjectName?.toLowerCase().trim() === currentTeacher.subject?.toLowerCase().trim()
          );
          const examEnded = new Date(exam.examEndDate) < new Date();
          if (hasSubject && examEnded) {
            console.log('Exam matched:', exam.examName, exam.subjects);
          }
          return hasSubject && examEnded;
        });
        
        console.log('Filtered exams:', filteredExams);
        setExaminations(filteredExams);
        
        // Group students by class-section
        const grouped = students.reduce((acc, student) => {
          const key = `${student.class}-${student.section}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(student);
          return acc;
        }, {});
        
        // Add class-sections from filtered exams even if no students exist
        filteredExams.forEach(exam => {
          const key = `${exam.class}-${exam.section}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
        });
        
        setStudentsByClass(grouped);
      } else {
        console.log('No subject found for teacher');
        showNotification('No subject assigned to your account', 'warning');
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      showNotification('Error fetching data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRowToggle = (classKey) => {
    setOpenRows(prev => ({ ...prev, [classKey]: !prev[classKey] }));
  };

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjectMarks, setSubjectMarks] = useState([]);
  const [remarks, setRemarks] = useState('');

  const handleSubmitMarks = async (student, exam) => {
    setSelectedExam(exam);
    setSelectedStudent(student);
    
    // Get teacher's subject
    const teacherResponse = await teacherService.getAllTeachers({ limit: 1000 });
    const teachers = teacherResponse.data.teachers || [];
    const currentTeacher = teachers.find(t => {
      const teacherUserId = t.userId?._id || t.userId;
      return teacherUserId === user.userId || teacherUserId === user.id;
    });
    
    const subjectsToShow = exam.subjects.filter(sub => 
      (sub.subjectName || sub.name)?.toLowerCase().trim() === currentTeacher.subject?.toLowerCase().trim()
    );
    
    // Fetch existing result
    try {
      const resultsRes = await examinationService.getExaminationResults(exam._id);
      const existingResult = resultsRes.data.results?.find(r => r.studentId?._id === student._id);
      
      if (existingResult) {
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
        setSubjectMarks(subjectsToShow.map(sub => ({
          subjectName: sub.subjectName || sub.name,
          maxMarks: sub.totalMarks || sub.maxMarks,
          passingMarks: sub.passingMarks,
          marksObtained: 0
        })));
        setRemarks('');
      }
    } catch (error) {
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
      const resultsRes = await examinationService.getExaminationResults(selectedExam._id);
      const existingResult = resultsRes.data.results?.find(r => r.studentId?._id === selectedStudent._id);
      
      let finalSubjectMarks = subjectMarks;
      if (existingResult?.subjectResults) {
        const teacherSubjectNames = subjectMarks.map(s => s.subjectName);
        const otherSubjectMarks = existingResult.subjectResults.filter(
          s => !teacherSubjectNames.includes(s.subjectName)
        );
        finalSubjectMarks = [...otherSubjectMarks, ...subjectMarks];
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
      fetchTeacherData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error submitting result', 'error');
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

  const [results, setResults] = useState({});

  useEffect(() => {
    const fetchResults = async () => {
      if (examinations.length > 0) {
        const resultsMap = {};
        for (const exam of examinations) {
          try {
            const resultsRes = await examinationService.getExaminationResults(exam._id);
            const examResults = resultsRes.data.results || [];
            console.log(`Results for exam ${exam.examName}:`, examResults);
            resultsMap[exam._id] = examResults;
          } catch (error) {
            console.error(`Error fetching results for exam ${exam._id}:`, error);
          }
        }
        setResults(resultsMap);
      }
    };
    fetchResults();
  }, [examinations]);

  if (loading) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Results - {teacherSubject || 'Loading...'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {Object.keys(studentsByClass).length} classes | {examinations.length} exams with your subject
            </Typography>
          </Box>

          {!teacherSubject && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light' }}>
              <Typography>No subject assigned to your teacher account. Please contact admin.</Typography>
            </Paper>
          )}

          {teacherSubject && examinations.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No examinations found with subject: {teacherSubject}
              </Typography>
            </Paper>
          )}

          {teacherSubject && examinations.length > 0 && (
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell width="50px" />
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Section</strong></TableCell>
                  <TableCell><strong>Total Students</strong></TableCell>
                  <TableCell><strong>Exams Available</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(studentsByClass).sort().map((classKey) => {
                  const [className, section] = classKey.split('-');
                  const examsForClass = getExamsForClass(classKey);
                  
                  // Don't show classes without exams that have teacher's subject
                  if (examsForClass.length === 0) return null;
                  
                  // Calculate status
                  const totalStudents = studentsByClass[classKey].length;
                  let totalCompleted = 0;
                  let totalPending = 0;
                  
                  examsForClass.forEach(exam => {
                    const examResults = results[exam._id] || [];
                    console.log(`Checking exam ${exam.examName} for class ${classKey}`);
                    studentsByClass[classKey].forEach(student => {
                      const result = examResults.find(r => r.studentId?._id === student._id);
                      if (result) {
                        console.log(`Full result object for ${student.userId?.firstName}:`, result);
                        const subjectsArray = result.subjects || result.subjectResults || [];
                        console.log(`Subjects array:`, subjectsArray);
                        const hasTeacherSubject = subjectsArray.some(s => {
                          const match = s.subjectName === teacherSubject && s.marksObtained !== undefined && s.marksObtained !== null;
                          console.log(`Subject ${s.subjectName} === ${teacherSubject}? Marks: ${s.marksObtained}, Match: ${match}`);
                          return match;
                        });
                        if (hasTeacherSubject) {
                          totalCompleted++;
                        } else {
                          totalPending++;
                        }
                      } else {
                        totalPending++;
                      }
                    });
                  });
                  console.log(`Class ${classKey}: Completed=${totalCompleted}, Pending=${totalPending}`);
                  
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
                                  No examinations with {teacherSubject} for this class
                                </Typography>
                              ) : (
                                examsForClass.map((exam) => {
                                  const subjectInfo = exam.subjects.find(s => s.subjectName === teacherSubject);
                                  return (
                                    <Box key={exam._id} sx={{ mb: 3 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                        <Box>
                                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {exam.examName}
                                          </Typography>
                                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                            {new Date(exam.examStartDate).toLocaleDateString()} - {new Date(exam.examEndDate).toLocaleDateString()} | Max Marks: {subjectInfo?.maxMarks || 'N/A'}
                                          </Typography>
                                          {exam.marksEntryDeadline && (
                                            <Typography variant="caption" sx={{ 
                                              display: 'block',
                                              color: new Date(exam.marksEntryDeadline) < new Date() ? 'error.main' : 
                                                     new Date(exam.marksEntryDeadline) < new Date(Date.now() + 2*24*60*60*1000) ? 'warning.main' : 'text.secondary'
                                            }}>
                                              Deadline: {new Date(exam.marksEntryDeadline).toLocaleDateString()}
                                              {new Date(exam.marksEntryDeadline) < new Date() && ' (Expired)'}
                                            </Typography>
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
                                            <TableCell><strong>Actions</strong></TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {studentsByClass[classKey].map((student) => {
                                            const deadlineExpired = exam.marksEntryDeadline && new Date(exam.marksEntryDeadline) < new Date();
                                            return (
                                              <TableRow key={student._id}>
                                                <TableCell>{student.rollNumber}</TableCell>
                                                <TableCell>
                                                  {student.userId?.firstName} {student.userId?.lastName}
                                                </TableCell>
                                                <TableCell>
                                                  <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => handleSubmitMarks(student, exam)}
                                                    disabled={deadlineExpired}
                                                  >
                                                    {deadlineExpired ? 'Deadline Expired' : 'Enter Marks'}
                                                  </Button>
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

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
