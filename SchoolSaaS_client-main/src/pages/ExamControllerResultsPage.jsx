import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Collapse, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip, MenuItem, Alert, CircularProgress, Checkbox } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
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
  const [expandedExams, setExpandedExams] = useState({});
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
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedResults, setSelectedResults] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [studentPages, setStudentPages] = useState({});
  const [currentExamPage, setCurrentExamPage] = useState(1);
  const [examsPerPage] = useState(10);
  const [totalExamCount, setTotalExamCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, location.key, currentExamPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all students
      const studentsResponse = await studentService.getAllStudents({ limit: 1000 });
      const students = studentsResponse.data.students || [];
      
      // Fetch all examinations with pagination
      const examsResponse = await examinationService.getAllExaminations({ page: currentExamPage, limit: examsPerPage });
      const exams = examsResponse.data.examinations || [];
      setExaminations(exams);
      
      // Handle totalCount for examinations
      let examCount = examsResponse.data.totalCount;
      if (examCount === undefined || examCount === null) {
        try {
          const allExamsResponse = await examinationService.getAllExaminations({ page: 1, limit: 1000 });
          examCount = allExamsResponse.data.examinations?.length || 0;
        } catch (error) {
          examCount = exams.length;
        }
      }
      setTotalExamCount(examCount);
      
      // Extract unique classes and sections from exams
      const classes = [...new Set(exams.map(exam => exam.class).filter(Boolean))];
      const sections = [...new Set(exams.map(exam => exam.section).filter(Boolean))];
      setAvailableClasses(classes.sort());
      setAvailableSections(sections.sort());
      
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

  const handleExamToggle = (examId) => {
    setExpandedExams(prev => ({ ...prev, [examId]: !prev[examId] }));
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
    setSubmitting(true);
    setError('');
    
    // Validation
    const invalidMarks = subjectMarks.find(mark => 
      mark.marksObtained < 0 || mark.marksObtained > mark.maxMarks
    );
    
    if (invalidMarks) {
      setError(`Invalid marks for ${invalidMarks.subjectName}. Must be between 0 and ${invalidMarks.maxMarks}`);
      setSubmitting(false);
      return;
    }
    
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
      setError(error.response?.data?.message || 'Error submitting result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    try {
      await Promise.all(selectedResults.map(resultId => 
        examinationService.approveResult(resultId)
      ));
      showNotification(`${selectedResults.length} results approved successfully`, 'success');
      setSelectedResults([]);
      fetchData();
    } catch (error) {
      showNotification('Error approving results', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    const reason = prompt('Enter rejection reason for all selected results:');
    if (!reason) return;
    
    setBulkLoading(true);
    try {
      await Promise.all(selectedResults.map(resultId => 
        examinationService.rejectResult(resultId, reason)
      ));
      showNotification(`${selectedResults.length} results rejected successfully`, 'success');
      setSelectedResults([]);
      fetchData();
    } catch (error) {
      showNotification('Error rejecting results', 'error');
    } finally {
      setBulkLoading(false);
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

          {/* Filter Section */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Filter by Class & Section
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Search Exams"
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
              {selectedResults.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                  <Chip label={`${selectedResults.length} selected`} size="small" color="primary" />
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={handleBulkApprove}
                    disabled={bulkLoading}
                  >
                    {bulkLoading ? <CircularProgress size={20} /> : 'Approve All'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleBulkReject}
                    disabled={bulkLoading}
                  >
                    Reject All
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>

          {examinations.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No examinations found. Create an examination first.
              </Typography>
            </Paper>
          ) : (
            <Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell><strong>Exam Name</strong></TableCell>
                      <TableCell><strong>Class</strong></TableCell>
                      <TableCell><strong>Section</strong></TableCell>
                      <TableCell><strong>Students</strong></TableCell>
                      <TableCell><strong>Completed</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {examinations
                      .filter(exam => {
                        if (filterClass && exam.class !== filterClass) return false;
                        if (filterSection && exam.section !== filterSection) return false;
                        if (searchTerm && !exam.examName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                        return new Date(exam.examEndDate) < new Date(); // Only completed exams
                      })
                      .sort((a, b) => {
                        // Sort by class first (numerically)
                        const classA = parseInt(a.class) || 0;
                        const classB = parseInt(b.class) || 0;
                        if (classA !== classB) return classA - classB;
                        
                        // Then by section alphabetically
                        if (a.section !== b.section) return a.section.localeCompare(b.section);
                        
                        // Finally by creation date (newest first)
                        return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
                      })
                      .map((exam) => {
                        const classKey = `${exam.class}-${exam.section}`;
                        const studentsForClass = studentsByClass[classKey] || [];
                        const examResults = results[exam._id] || [];
                        const isExpanded = expandedExams[exam._id];
                        
                        return (
                          <>
                            <TableRow key={exam._id} sx={{ '& > *': { borderBottom: 'unset' } }}>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => handleExamToggle(exam._id)}
                                >
                                  {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                              </TableCell>
                              <TableCell>{exam.examName}</TableCell>
                              <TableCell>{exam.class}</TableCell>
                              <TableCell>{exam.section}</TableCell>
                              <TableCell>{studentsForClass.length}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${examResults.filter(r => !r.isDraft && studentsForClass.some(s => s._id === r.studentId?._id)).length}/${studentsForClass.length}`} 
                                  size="small" 
                                  color="primary" 
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={exam.status || 'draft'} 
                                  size="small"
                                  color={exam.status === 'public' ? 'success' : 'warning'}
                                />
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box sx={{ margin: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                      <Box>
                                        <Typography variant="h6" component="div">
                                          Students - {exam.examName}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                          {new Date(exam.examStartDate).toLocaleDateString()} - {new Date(exam.examEndDate).toLocaleDateString()}
                                        </Typography>
                                        {exam.marksEntryDeadline && (
                                          <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                            Deadline: {new Date(exam.marksEntryDeadline).toLocaleDateString()} 
                                            <IconButton 
                                              size="small" 
                                              onClick={() => {
                                                setSelectedExamForDeadline(exam);
                                                setDeadlineDate(exam.marksEntryDeadline ? new Date(exam.marksEntryDeadline).toISOString().split('T')[0] : '');
                                                setOpenDeadlineDialog(true);
                                              }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          </Typography>
                                        )}
                                      </Box>
                                      {!exam.marksEntryDeadline && (
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          startIcon={<EditIcon />}
                                          onClick={() => {
                                            setSelectedExamForDeadline(exam);
                                            setDeadlineDate('');
                                            setOpenDeadlineDialog(true);
                                          }}
                                        >
                                          Set Deadline
                                        </Button>
                                      )}
                                    </Box>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                                      {(() => {
                                        const currentPage = studentPages[exam._id] || 1;
                                        const studentsPerPage = 9;
                                        const startIndex = (currentPage - 1) * studentsPerPage;
                                        const endIndex = startIndex + studentsPerPage;
                                        const sortedStudents = studentsForClass
                                          .sort((a, b) => {
                                            const rollA = parseInt(a.rollNumber) || 0;
                                            const rollB = parseInt(b.rollNumber) || 0;
                                            return rollA - rollB;
                                          });
                                        const paginatedStudents = sortedStudents.slice(startIndex, endIndex);
                                        
                                        return paginatedStudents.map((student) => {
                                        const result = examResults.find(r => r.studentId?._id === student._id);
                                        const hasResult = result && !result.isDraft;
                                        return (
                                          <Box key={student._id} sx={{ 
                                            p: 2, 
                                            bgcolor: hasResult ? '#f0f8f0' : '#fff8f0',
                                            borderRadius: 1, 
                                            border: '1px solid', 
                                            borderColor: hasResult ? '#4caf50' : '#ff9800',
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
                                              {result && (
                                                <Box sx={{ mt: 0.5 }}>
                                                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: hasResult ? 'success.main' : 'warning.main' }}>
                                                    {result.totalMarksObtained}/{result.totalMaxMarks} • {result.overallGrade}
                                                    {result.isDraft && ' (Draft)'}
                                                  </Typography>
                                                </Box>
                                              )}
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                              {result && (
                                                <Chip 
                                                  label={result.isDraft ? 'Draft' : result.overallStatus} 
                                                  size="small"
                                                  color={result.isDraft ? 'warning' : result.overallStatus === 'Pass' ? 'success' : 'error'}
                                                />
                                              )}
                                              <Button
                                                size="small"
                                                variant={hasResult ? 'outlined' : 'contained'}
                                                onClick={() => handleEnterMarks(student, exam)}
                                                sx={{ minWidth: 80 }}
                                                color={hasResult ? 'primary' : 'success'}
                                              >
                                                {result ? 'Edit' : 'Enter'}
                                              </Button>
                                              {result && !result.isDraft && result.approvalStatus === 'pending' && (
                                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                  <Checkbox
                                                    size="small"
                                                    checked={selectedResults.includes(result._id)}
                                                    onChange={(e) => {
                                                      if (e.target.checked) {
                                                        setSelectedResults(prev => [...prev, result._id]);
                                                      } else {
                                                        setSelectedResults(prev => prev.filter(id => id !== result._id));
                                                      }
                                                    }}
                                                  />
                                                  <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => handleApproveResult(result._id, exam._id)}
                                                    sx={{ minWidth: 60 }}
                                                  >
                                                    ✓
                                                  </Button>
                                                  <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleRejectResult(result._id, exam._id)}
                                                    sx={{ minWidth: 60 }}
                                                  >
                                                    ✗
                                                  </Button>
                                                </Box>
                                              )}
                                            </Box>
                                          </Box>
                                        );
                                      });
                                    })()}
                                    </Box>
                                    {studentsForClass.length > 9 && (
                                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          disabled={(studentPages[exam._id] || 1) === 1}
                                          onClick={() => setStudentPages(prev => ({ ...prev, [exam._id]: Math.max(1, (prev[exam._id] || 1) - 1) }))}
                                        >
                                          Previous
                                        </Button>
                                        <Typography variant="body2">
                                          Page {studentPages[exam._id] || 1} of {Math.ceil(studentsForClass.length / 9)}
                                        </Typography>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          disabled={(studentPages[exam._id] || 1) >= Math.ceil(studentsForClass.length / 9)}
                                          onClick={() => setStudentPages(prev => ({ ...prev, [exam._id]: Math.min(Math.ceil(studentsForClass.length / 9), (prev[exam._id] || 1) + 1) }))}
                                        >
                                          Next
                                        </Button>
                                      </Box>
                                    )}
                                    {studentsForClass.length === 0 && (
                                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                                        No students found for this class and section.
                                      </Typography>
                                    )}
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </>
                        );
                      })
                    }
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Examinations Pagination */}
              {(() => {
                const totalPages = Math.ceil(totalExamCount / examsPerPage);
                
                if (totalPages > 1) return (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={currentExamPage === 1}
                      onClick={() => setCurrentExamPage(Math.max(1, currentExamPage - 1))}
                    >
                      Previous
                    </Button>
                    <Typography variant="body2">
                      Page {currentExamPage} of {totalPages}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={currentExamPage >= totalPages}
                      onClick={() => setCurrentExamPage(Math.min(totalPages, currentExamPage + 1))}
                    >
                      Next
                    </Button>
                  </Box>
                );
                
                return null;
              })()}
              
              {examinations.filter(exam => {
                if (filterClass && exam.class !== filterClass) return false;
                if (filterSection && exam.section !== filterSection) return false;
                if (searchTerm && !exam.examName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return new Date(exam.examEndDate) < new Date();
              }).length === 0 && (filterClass || filterSection || searchTerm) && (
                <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
                  <Typography variant="body1" color="textSecondary">
                    No completed examinations found for the selected class and section.
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
