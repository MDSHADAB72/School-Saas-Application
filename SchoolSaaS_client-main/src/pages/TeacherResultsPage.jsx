import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Collapse, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress, Pagination } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
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
  const [examinations, setExaminations] = useState([]);
  const [teacherSubject, setTeacherSubject] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [studentPages, setStudentPages] = useState({});
  const [currentExamPage, setCurrentExamPage] = useState(1);
  const [examsPerPage] = useState(10);
  const [results, setResults] = useState({});
  const [studentData, setStudentData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [openRows, setOpenRows] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjectMarks, setSubjectMarks] = useState([]);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user, location.key]);

  const loadStudentsPage = async (exam, page = 1) => {
    const key = exam._id;
    try {
      const response = await studentService.getAllStudents({ 
        class: exam.class, 
        section: exam.section,
        page,
        limit: 9
      });
      
      console.log(`Loading students for exam ${exam.examName} (${exam.class}-${exam.section}), page ${page}:`, {
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
            class: exam.class, 
            section: exam.section,
            page: 1,
            limit: 1000 // Large limit to get all students
          });
          totalCount = allStudentsResponse.data.students?.length || studentsReceived.length;
        } catch (error) {
          // Fallback to current page logic
          const existingData = studentData[key];
          if (page === 1 && studentsReceived.length === 9) {
            totalCount = 10;
          } else if (page > 1 && existingData?.totalCount) {
            totalCount = existingData.totalCount;
          } else {
            totalCount = studentsReceived.length;
          }
        }
      }
      
      setStudentData(prev => ({ 
        ...prev, 
        [key]: {
          students: studentsReceived,
          totalCount: totalCount,
          currentPage: page
        }
      }));
    } catch (error) {
      console.error(`Error fetching students for exam ${exam._id}:`, error);
      setStudentData(prev => ({ 
        ...prev, 
        [key]: { students: [], totalCount: 0, currentPage: 1 }
      }));
    }
  };

  const handleStudentPageChange = async (exam, page) => {
    setStudentPages(prev => ({ ...prev, [exam._id]: page }));
    await loadStudentsPage(exam, page);
  };

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get teacher details to find their subject
      const teacherResponse = await teacherService.getAllTeachers({ limit: 1000 });
      const teachers = teacherResponse.data.teachers || [];
      const currentTeacher = teachers.find(t => {
        const teacherUserId = t.userId?._id || t.userId;
        return teacherUserId === user.userId || teacherUserId === user.id;
      });
      
      if (currentTeacher?.subject) {
        setTeacherSubject(currentTeacher.subject);
        
        // Fetch examinations that have teacher's subject (only public completed exams)
        const examsResponse = await examinationService.getAllExaminations({ page: 1, limit: 100 });
        const allExams = examsResponse.data.examinations || [];
        
        const filteredExams = allExams.filter(exam => {
          const hasSubject = exam.subjects?.some(sub => 
            sub.subjectName?.toLowerCase().trim() === currentTeacher.subject?.toLowerCase().trim()
          );
          const examEnded = new Date(exam.examEndDate) < new Date();
          const isPublic = exam.status === 'public';
          return hasSubject && examEnded && isPublic;
        });
        
        setExaminations(filteredExams);
        
        // Extract unique classes and sections
        const classes = [...new Set(filteredExams.map(exam => exam.class).filter(Boolean))];
        const sections = [...new Set(filteredExams.map(exam => exam.section).filter(Boolean))];
        setAvailableClasses(classes.sort());
        setAvailableSections(sections.sort());
        
        // Fetch results for all exams and load first page of students for each class-section
        const resultsMap = {};
        
        for (const exam of filteredExams) {
          try {
            const resultsRes = await examinationService.getExaminationResults(exam._id);
            resultsMap[exam._id] = resultsRes.data.results || [];
            
            // Load first page of students for each exam
            await loadStudentsPage(exam, 1);
          } catch (error) {
            console.error(`Error fetching data for exam ${exam._id}:`, error);
            resultsMap[exam._id] = [];
          }
        }
        setResults(resultsMap);
      } else {
        showNotification('No subject assigned to your account', 'warning');
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMarks = async (student, exam) => {
    setSelectedExam(exam);
    setSelectedStudent(student);
    
    // Get teacher's subject from exam
    const subjectsToShow = exam.subjects.filter(sub => 
      (sub.subjectName || sub.name)?.toLowerCase().trim() === teacherSubject?.toLowerCase().trim()
    );
    
    // Fetch existing result
    try {
      const existingResult = results[exam._id]?.find(r => r.studentId?._id === student._id);
      
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
      setSubmitting(true);
      const existingResult = results[selectedExam._id]?.find(r => r.studentId?._id === selectedStudent._id);
      
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
      
      // Refresh current page data for the exam
      const currentPage = studentPages[selectedExam._id] || 1;
      await loadStudentsPage(selectedExam, currentPage);
      
      // Refresh results
      const resultsRes = await examinationService.getExaminationResults(selectedExam._id);
      setResults(prev => ({ ...prev, [selectedExam._id]: resultsRes.data.results || [] }));
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error submitting result', 'error');
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Results Management
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Subject: <strong>{teacherSubject || 'Loading...'}</strong> | {examinations.length} examinations
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!teacherSubject && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
              <Typography color="#e65100">No subject assigned to your teacher account. Please contact admin.</Typography>
            </Paper>
          )}

          {teacherSubject && examinations.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No completed examinations found with subject: {teacherSubject}
              </Typography>
            </Paper>
          )}

          {teacherSubject && examinations.length > 0 && (
            <Box>
              {/* Filter Section */}
              <Paper sx={{ p: 3, mb: 3, boxShadow: 1 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterListIcon color="primary" />
                  Filter Examinations
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    label="Search Exam"
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

              <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell width="50px" />
                      <TableCell sx={{ fontWeight: 600 }}>Exam Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Exam Period</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Students</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const filteredExams = examinations.filter(exam => {
                        if (filterClass && exam.class !== filterClass) return false;
                        if (filterSection && exam.section !== filterSection) return false;
                        if (searchTerm && !exam.examName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                        return true;
                      });
                      
                      const sortedExams = filteredExams.sort((a, b) => {
                        const classA = parseInt(a.class) || 0;
                        const classB = parseInt(b.class) || 0;
                        if (classA !== classB) return classA - classB;
                        if (a.section !== b.section) return a.section.localeCompare(b.section);
                        return new Date(b.createdAt) - new Date(a.createdAt);
                      });
                      
                      const startIndex = (currentExamPage - 1) * examsPerPage;
                      const endIndex = startIndex + examsPerPage;
                      const paginatedExams = sortedExams.slice(startIndex, endIndex);
                      
                      return paginatedExams.map((exam) => {
                        const examResults = results[exam._id] || [];
                        const examStudentData = studentData[exam._id] || { students: [], totalCount: 0 };
                        const studentsWithMarks = examResults.filter(r => {
                          if (r.isDraft) return false;
                          const subjectResults = r.subjectResults || [];
                          const hasTeacherSubjectMarks = subjectResults.some(s => 
                            s.subjectName === teacherSubject && 
                            s.marksObtained !== undefined && 
                            s.marksObtained !== null
                          );
                          const studentInClass = examStudentData.students.some(student => student._id === r.studentId?._id);
                          return hasTeacherSubjectMarks && studentInClass;
                        });
                        
                        return (
                          <>
                            <TableRow key={exam._id} hover>
                              <TableCell>
                                <IconButton 
                                  size="small" 
                                  onClick={() => setOpenRows(prev => ({ ...prev, [exam._id]: !prev[exam._id] }))}
                                >
                                  {openRows[exam._id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{exam.examName}</TableCell>
                              <TableCell>{exam.class}-{exam.section}</TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {new Date(exam.examStartDate).toLocaleDateString()} - {new Date(exam.examEndDate).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={exam.status || 'draft'} 
                                  size="small"
                                  color={exam.status === 'public' ? 'success' : 'warning'}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Chip 
                                    label={`${studentsWithMarks.length} Completed`} 
                                    size="small" 
                                    color="success"
                                  />
                                  <Chip 
                                    label={`${examStudentData.totalCount - studentsWithMarks.length} Pending`} 
                                    size="small" 
                                    color="warning"
                                  />
                                  <Chip 
                                    label={`Total: ${examStudentData.totalCount}`} 
                                    size="small" 
                                    color="info"
                                  />
                                </Box>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                <Collapse in={openRows[exam._id]} timeout="auto" unmountOnExit>
                                  <Box sx={{ margin: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, bgcolor: '#f8f9fa', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                      <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                          {exam.examName} - {teacherSubject}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                          Max Marks: {exam.subjects?.find(s => s.subjectName === teacherSubject)?.maxMarks || 'N/A'}
                                        </Typography>
                                        {exam.marksEntryDeadline && (
                                          <Chip
                                            label={`Deadline: ${new Date(exam.marksEntryDeadline).toLocaleDateString()}`}
                                            size="small"
                                            sx={{ 
                                              mt: 0.5,
                                              bgcolor: new Date(exam.marksEntryDeadline) < new Date() ? '#ffebee' : '#e8f5e9',
                                              color: new Date(exam.marksEntryDeadline) < new Date() ? '#c62828' : '#2e7d32',
                                              fontWeight: 600
                                            }}
                                          />
                                        )}
                                      </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                                      {(() => {
                                        const examStudentData = studentData[exam._id] || { students: [], totalCount: 0 };
                                        const displayStudents = examStudentData.students.sort((a, b) => {
                                          const rollA = parseInt(a.rollNumber) || 0;
                                          const rollB = parseInt(b.rollNumber) || 0;
                                          return rollA - rollB;
                                        });
                                        
                                        return displayStudents.map((student) => {
                                          const result = examResults.find(r => r.studentId?._id === student._id);
                                          const hasTeacherMarks = result?.subjectResults?.some(s => 
                                            s.subjectName === teacherSubject && 
                                            s.marksObtained !== undefined && 
                                            s.marksObtained !== null
                                          ) && !result?.isDraft;
                                          const deadlineExpired = exam.marksEntryDeadline && new Date(exam.marksEntryDeadline) < new Date();
                                          const teacherSubjectResult = result?.subjectResults?.find(s => s.subjectName === teacherSubject);
                                          
                                          return (
                                            <Box key={student._id} sx={{ 
                                              p: 2, 
                                              bgcolor: hasTeacherMarks ? '#f0f8f0' : '#fff8f0',
                                              borderRadius: 1, 
                                              border: '1px solid', 
                                              borderColor: hasTeacherMarks ? '#4caf50' : '#ff9800',
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center'
                                            }}>
                                              <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                  {student.userId?.firstName} {student.userId?.lastName}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                  Roll: {student.rollNumber}
                                                </Typography>
                                                {teacherSubjectResult && (
                                                  <Box sx={{ mt: 0.5 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: hasTeacherMarks ? 'success.main' : 'warning.main' }}>
                                                      {teacherSubjectResult.marksObtained}/{exam.subjects?.find(s => s.subjectName === teacherSubject)?.maxMarks || 'N/A'}
                                                      {result?.isDraft && ' (Draft)'}
                                                    </Typography>
                                                  </Box>
                                                )}
                                              </Box>
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                                {result && (
                                                  <Chip 
                                                    label={result.isDraft ? 'Draft' : (hasTeacherMarks ? 'Completed' : 'Pending')} 
                                                    size="small"
                                                    color={result.isDraft ? 'warning' : hasTeacherMarks ? 'success' : 'default'}
                                                  />
                                                )}
                                                <Button
                                                  size="small"
                                                  variant={hasTeacherMarks ? 'outlined' : 'contained'}
                                                  onClick={() => handleSubmitMarks(student, exam)}
                                                  disabled={deadlineExpired}
                                                  color={deadlineExpired ? 'error' : hasTeacherMarks ? 'primary' : 'success'}
                                                  sx={{ minWidth: 80 }}
                                                >
                                                  {deadlineExpired ? 'Expired' : hasTeacherMarks ? 'Edit' : 'Enter'}
                                                </Button>
                                              </Box>
                                            </Box>
                                          );
                                        });
                                      })()}
                                    </Box>
                                    {(() => {
                                      const examStudentData = studentData[exam._id] || { students: [], totalCount: 0 };
                                      const totalPages = Math.ceil(examStudentData.totalCount / 9);
                                      const currentPage = studentPages[exam._id] || 1;
                                      
                                      if (totalPages > 1) return (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            disabled={currentPage === 1}
                                            onClick={() => handleStudentPageChange(exam, Math.max(1, currentPage - 1))}
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
                                            onClick={() => handleStudentPageChange(exam, Math.min(totalPages, currentPage + 1))}
                                          >
                                            Next
                                          </Button>
                                        </Box>
                                      );
                                      
                                      return null;
                                    })()}
                                    {(() => {
                                      const examStudentData = studentData[exam._id] || { students: [], totalCount: 0 };
                                      return examStudentData.totalCount === 0 && (
                                        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                          No students found for this examination.
                                        </Typography>
                                      );
                                    })()}
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </>
                        );
                      });
                    })()}
                    
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Examinations Pagination */}
              {(() => {
                const filteredExams = examinations.filter(exam => {
                  if (filterClass && exam.class !== filterClass) return false;
                  if (filterSection && exam.section !== filterSection) return false;
                  if (searchTerm && !exam.examName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true;
                });
                const totalPages = Math.ceil(filteredExams.length / examsPerPage);
                
                return filteredExams.length > examsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={currentExamPage}
                      onChange={(event, value) => setCurrentExamPage(value)}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                );
              })()}
              
              {examinations.filter(exam => {
                if (filterClass && exam.class !== filterClass) return false;
                if (filterSection && exam.section !== filterSection) return false;
                if (searchTerm && !exam.examName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return true;
              }).length === 0 && (filterClass || filterSection || searchTerm) && (
                <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
                  <Typography variant="body1" color="textSecondary">
                    No examinations found for the selected filters.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)} 
            maxWidth="md" 
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpenDialog(false);
              if (e.key === 'Enter' && e.ctrlKey) handleSubmitResult(false);
            }}
          >
            <DialogTitle>
              Submit Marks - {selectedStudent?.userId?.firstName} {selectedStudent?.userId?.lastName}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
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
              <Button onClick={() => setOpenDialog(false)}>Cancel (Esc)</Button>
              <Button 
                onClick={() => handleSubmitResult(true)} 
                variant="outlined"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={20} /> : 'Save as Draft'}
              </Button>
              <Button 
                onClick={() => handleSubmitResult(false)} 
                variant="contained" 
                color="success"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={20} /> : 'Publish Result (Ctrl+Enter)'}
              </Button>
            </DialogActions>
          </Dialog>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
