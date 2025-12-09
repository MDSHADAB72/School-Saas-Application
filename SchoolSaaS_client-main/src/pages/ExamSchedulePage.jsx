import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { examinationService } from '../services/api';
import { useNotification } from '../components/common/Notification';

export function ExamSchedulePage() {
  const { user } = useAuth();
  const [examinations, setExaminations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admitCard, setAdmitCard] = useState(null);
  const [openAdmitCard, setOpenAdmitCard] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();

  useEffect(() => {
    fetchExamSchedule();
  }, []);

  const fetchExamSchedule = async () => {
    try {
      setLoading(true);
      const response = await examinationService.getMyExamSchedule();
      setExaminations(response.data.examinations);
    } catch (error) {
      showNotification('Error fetching exam schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (examDate) => {
    const now = new Date();
    const exam = new Date(examDate);
    const diffDays = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Completed', color: 'default' };
    if (diffDays === 0) return { label: 'Today', color: 'error' };
    if (diffDays <= 7) return { label: `${diffDays} days left`, color: 'warning' };
    return { label: 'Upcoming', color: 'info' };
  };

  const handleDownloadAdmitCard = async (examId) => {
    try {
      const response = await examinationService.generateAdmitCard(examId);
      setAdmitCard(response.data.admitCard);
      setOpenAdmitCard(true);
    } catch (error) {
      if (error.response?.status === 403) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Error generating admit card', 'error');
      }
    }
  };

  const handlePrintAdmitCard = () => {
    window.print();
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Sidebar />
      <Box sx={{ flex: 1 }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
            Examination Schedule
          </Typography>

          {examinations.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No examinations scheduled
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>Exam Title</strong></TableCell>
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Time</strong></TableCell>
                    <TableCell><strong>Duration</strong></TableCell>
                    <TableCell><strong>Venue</strong></TableCell>
                    <TableCell><strong>Subjects</strong></TableCell>
                    <TableCell><strong>Total Marks</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Admit Card</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examinations.map((exam) => {
                    const examDate = new Date(exam.date);
                    const startTime = exam.startAt ? new Date(exam.startAt) : examDate;
                    const status = getExamStatus(exam.date);
                    
                    return (
                      <TableRow key={exam._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {exam.title}
                          </Typography>
                        </TableCell>
                        <TableCell>{exam.examCode || '-'}</TableCell>
                        <TableCell>
                          <Chip label={exam.type} size="small" />
                        </TableCell>
                        <TableCell>{examDate.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>{exam.durationMinutes} min</TableCell>
                        <TableCell>{exam.venue || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ maxWidth: 200 }}>
                            {exam.subjects?.map((sub, idx) => (
                              <Chip 
                                key={idx} 
                                label={sub.name} 
                                size="small" 
                                sx={{ m: 0.25 }}
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {exam.totalMarks}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={status.label} 
                            color={status.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {status.label !== 'Completed' && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownloadAdmitCard(exam._id)}
                            >
                              Download
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Subject-wise Details
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
              {examinations.map((exam) => (
                <Card key={exam._id} sx={{ boxShadow: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {exam.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                      {new Date(exam.date).toLocaleDateString()} | {exam.venue || 'TBD'}
                    </Typography>
                    {exam.subjects?.map((subject, idx) => (
                      <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {subject.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Max Marks: {subject.maxMarks} | Passing: {subject.passingMarks}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Admit Card Dialog */}
          <Dialog open={openAdmitCard} onClose={() => setOpenAdmitCard(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Admit Card</Typography>
              <Button
                startIcon={<PrintIcon />}
                onClick={handlePrintAdmitCard}
                sx={{ color: 'white' }}
              >
                Print
              </Button>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              {admitCard && (
                <Box id="admit-card-content">
                  {/* Header */}
                  <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #1976d2', pb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {admitCard.school.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {admitCard.school.address}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Phone: {admitCard.school.phone} | Email: {admitCard.school.email}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
                      EXAMINATION ADMIT CARD
                    </Typography>
                  </Box>

                  {/* Admit Card Number */}
                  <Box sx={{ textAlign: 'right', mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Admit Card No: {admitCard.admitCardNumber}
                    </Typography>
                  </Box>

                  {/* Student Details */}
                  <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Student Details
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <Typography variant="body2"><strong>Name:</strong> {admitCard.student.name}</Typography>
                      <Typography variant="body2"><strong>Roll Number:</strong> {admitCard.student.rollNumber}</Typography>
                      <Typography variant="body2"><strong>Class:</strong> {admitCard.student.class}-{admitCard.student.section}</Typography>
                      <Typography variant="body2"><strong>Admission No:</strong> {admitCard.student.admissionNumber}</Typography>
                    </Box>
                  </Paper>

                  {/* Examination Details */}
                  <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Examination Details
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      <Typography variant="body2"><strong>Exam:</strong> {admitCard.examination.title}</Typography>
                      <Typography variant="body2"><strong>Code:</strong> {admitCard.examination.code}</Typography>
                      <Typography variant="body2"><strong>Type:</strong> {admitCard.examination.type}</Typography>
                      <Typography variant="body2"><strong>Date:</strong> {new Date(admitCard.examination.date).toLocaleDateString()}</Typography>
                      <Typography variant="body2"><strong>Time:</strong> {new Date(admitCard.examination.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Typography>
                      <Typography variant="body2"><strong>Duration:</strong> {admitCard.examination.durationMinutes} minutes</Typography>
                      <Typography variant="body2"><strong>Venue:</strong> {admitCard.examination.venue || 'TBD'}</Typography>
                      <Typography variant="body2"><strong>Total Marks:</strong> {admitCard.examination.totalMarks}</Typography>
                    </Box>
                  </Paper>

                  {/* Subjects */}
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Subjects
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Subject</strong></TableCell>
                          <TableCell align="center"><strong>Max Marks</strong></TableCell>
                          <TableCell align="center"><strong>Passing Marks</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {admitCard.examination.subjects.map((subject, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell align="center">{subject.maxMarks}</TableCell>
                            <TableCell align="center">{subject.passingMarks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>

                  {/* Instructions */}
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Instructions:</Typography>
                    <Typography variant="caption" component="div">1. Bring this admit card to the examination hall</Typography>
                    <Typography variant="caption" component="div">2. Reach the venue 30 minutes before the exam</Typography>
                    <Typography variant="caption" component="div">3. Carry a valid ID proof</Typography>
                    <Typography variant="caption" component="div">4. Mobile phones are not allowed in the examination hall</Typography>
                  </Alert>

                  {/* Footer */}
                  <Box sx={{ textAlign: 'right', mt: 3, pt: 2, borderTop: '1px solid #ddd' }}>
                    <Typography variant="caption" color="textSecondary">
                      Generated on: {new Date(admitCard.generatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAdmitCard(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
