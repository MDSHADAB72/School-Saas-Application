import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, IconButton, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { assignmentService, getFileUrl } from '../services/api';
import { useNotification } from '../components/common/Notification';
import { LoadingBar } from '../components/common/LoadingBar';

export function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSubmissionsDialog, setOpenSubmissionsDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  const [formData, setFormData] = useState({
    title: '',
    class: '',
    section: '',
    subject: '',
    description: '',
    instructions: '',
    startDate: '',
    dueDate: '',
    totalMarks: 100
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ marksObtained: '', feedback: '' });

  const isTeacher = user?.role === 'teacher' || user?.role === 'school_admin';

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAllAssignments({ page: 1, limit: 100 });
      setAssignments(response.data.assignments);
    } catch (error) {
      showNotification('Error fetching assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      await assignmentService.createAssignment(formDataToSend);
      showNotification('Assignment created successfully', 'success');
      setOpenDialog(false);
      fetchAssignments();
      setFormData({
        title: '',
        class: '',
        section: '',
        subject: '',
        description: '',
        instructions: '',
        startDate: '',
        dueDate: '',
        totalMarks: 100
      });
      setSelectedFiles([]);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error creating assignment', 'error');
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      setSelectedAssignment(assignment);
      const response = await assignmentService.getSubmissions(assignment._id);
      console.log('Submissions:', response.data.submissions);
      setSubmissions(response.data.submissions);
      setOpenSubmissionsDialog(true);
      if (response.data.submissions.length === 0) {
        showNotification('No submissions yet', 'info');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      showNotification('Error fetching submissions', 'error');
    }
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setOpenViewDialog(true);
  };

  const handleDownload = (file) => {
    showNotification(`Downloading ${file.fileName}...`, 'info');
    const link = document.createElement('a');
    link.href = getFileUrl(file.fileUrl);
    link.download = file.fileName;
    link.target = '_blank';
    link.click();
  };

  const handleGradeSubmission = (submission) => {
    setGradingSubmission(submission);
    setGradeData({
      marksObtained: submission.marksObtained || '',
      feedback: submission.feedback || ''
    });
  };

  const handleSaveGrade = async () => {
    try {
      if (!gradeData.marksObtained || gradeData.marksObtained === '') {
        showNotification('Please enter marks', 'error');
        return;
      }
      console.log('Grading submission:', gradingSubmission._id, gradeData);
      await assignmentService.gradeSubmission(gradingSubmission._id, gradeData);
      showNotification('Grade submitted successfully', 'success');
      setGradingSubmission(null);
      setGradeData({ marksObtained: '', feedback: '' });
      await handleViewSubmissions(selectedAssignment);
    } catch (error) {
      console.error('Error submitting grade:', error);
      showNotification(error.response?.data?.message || 'Error submitting grade', 'error');
    }
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
              Assignments
            </Typography>
            {isTeacher && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
                Create Assignment
              </Button>
            )}
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Subject</strong></TableCell>
                  <TableCell><strong>Start Date</strong></TableCell>
                  <TableCell><strong>Due Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {isTeacher && <TableCell><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => {
                  const now = new Date();
                  const start = new Date(assignment.startDate);
                  const due = new Date(assignment.dueDate);
                  const status = now < start ? 'Upcoming' : now > due ? 'Closed' : 'Active';
                  
                  return (
                    <TableRow key={assignment._id} hover>
                      <TableCell>{assignment.title}</TableCell>
                      <TableCell>{assignment.class}-{assignment.section}</TableCell>
                      <TableCell>{assignment.subject}</TableCell>
                      <TableCell>{new Date(assignment.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={status} 
                          size="small"
                          color={status === 'Active' ? 'success' : status === 'Upcoming' ? 'info' : 'default'}
                        />
                      </TableCell>
                      {isTeacher && (
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(assignment)}
                              title="View Details"
                            >
                              <InfoIcon />
                            </IconButton>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleViewSubmissions(assignment)}
                            >
                              Submissions
                            </Button>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* View Assignment Details Dialog */}
          <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white' }}>
              Assignment Details: {selectedAssignment?.title}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Class</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedAssignment?.class}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Section</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedAssignment?.section}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Subject</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedAssignment?.subject}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Start Date</Typography>
                    <Typography variant="body1">{selectedAssignment?.startDate ? new Date(selectedAssignment.startDate).toLocaleDateString() : 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Due Date</Typography>
                    <Typography variant="body1" color="error">{selectedAssignment?.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString() : 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Total Marks</Typography>
                    <Typography variant="body1">{selectedAssignment?.totalMarks}</Typography>
                  </Box>
                </Box>

                <Divider />

                {selectedAssignment?.description && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Description</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body2">{selectedAssignment.description}</Typography>
                    </Paper>
                  </Box>
                )}

                {selectedAssignment?.instructions && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Instructions</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                      <Typography variant="body2">{selectedAssignment.instructions}</Typography>
                    </Paper>
                  </Box>
                )}

                {selectedAssignment?.attachments && selectedAssignment.attachments.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Attachments ({selectedAssignment.attachments.length})</Typography>
                    <List dense sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      {selectedAssignment.attachments.map((file, index) => (
                        <ListItem 
                          key={index}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              onClick={() => handleDownload(file)}
                              color="primary"
                            >
                              <DownloadIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText 
                            primary={file.fileName} 
                            secondary={file.fileType}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
              <Button 
                variant="contained" 
                startIcon={<VisibilityIcon />}
                onClick={() => {
                  setOpenViewDialog(false);
                  handleViewSubmissions(selectedAssignment);
                }}
              >
                View Submissions
              </Button>
            </DialogActions>
          </Dialog>

          {/* Create Assignment Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, pt: 2 }}>
                <TextField
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
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
                  <TextField
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </Box>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />
                <TextField
                  label="Instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  multiline
                  rows={2}
                  fullWidth
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  <TextField
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  <TextField
                    label="Total Marks"
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalMarks: e.target.value }))}
                  />
                </Box>
                
                <Box>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outlined" component="span" startIcon={<AttachFileIcon />}>
                      Attach Files
                    </Button>
                  </label>
                  {selectedFiles.length > 0 && (
                    <List dense>
                      {selectedFiles.map((file, index) => (
                        <ListItem key={index} secondaryAction={
                          <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                            <DeleteIcon />
                          </IconButton>
                        }>
                          <ListItemText primary={file.name} secondary={file.type} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} variant="contained">Create</Button>
            </DialogActions>
          </Dialog>

          {/* Submissions Dialog */}
          <Dialog open={openSubmissionsDialog} onClose={() => setOpenSubmissionsDialog(false)} maxWidth="lg" fullWidth>
            <DialogTitle>
              Submissions for: {selectedAssignment?.title}
            </DialogTitle>
            <DialogContent>
              {submissions.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No submissions yet for this assignment.
                </Alert>
              ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Student Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Roll Number</strong></TableCell>
                      <TableCell><strong>Submitted On</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Files</strong></TableCell>
                      <TableCell><strong>Marks</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub._id}>
                        <TableCell>
                          {sub.studentId?.userId?.firstName} {sub.studentId?.userId?.lastName}
                        </TableCell>
                        <TableCell>{sub.studentId?.userId?.email}</TableCell>
                        <TableCell>{sub.studentId?.rollNumber}</TableCell>
                        <TableCell>{new Date(sub.submissionDate).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={sub.status} 
                            size="small"
                            color={sub.status === 'Submitted' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          {sub.attachments?.length || 0} files
                          {sub.attachments?.map((file, idx) => (
                            <Button
                              key={idx}
                              size="small"
                              onClick={() => handleDownload(file)}
                              sx={{ display: 'block', textTransform: 'none' }}
                            >
                              {file.fileName}
                            </Button>
                          ))}
                        </TableCell>
                        <TableCell>
                          {sub.marksObtained ? `${sub.marksObtained}/${selectedAssignment?.totalMarks}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleGradeSubmission(sub)}
                          >
                            {sub.reviewed ? 'Edit Grade' : 'Grade'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenSubmissionsDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Grading Dialog */}
          <Dialog open={!!gradingSubmission} onClose={() => setGradingSubmission(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <Typography variant="body2">
                  <strong>Student:</strong> {gradingSubmission?.studentId?.userId?.firstName} {gradingSubmission?.studentId?.userId?.lastName}
                </Typography>
                <Typography variant="body2">
                  <strong>Submitted:</strong> {gradingSubmission?.submissionDate ? new Date(gradingSubmission.submissionDate).toLocaleString() : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> <Chip label={gradingSubmission?.status} size="small" />
                </Typography>
                
                {gradingSubmission?.attachments?.length > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Submitted Files:</Typography>
                    <List dense>
                      {gradingSubmission.attachments.map((file, idx) => (
                        <ListItem key={idx}>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownload(file)}
                          >
                            {file.fileName}
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {gradingSubmission?.comments && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Student Comments:</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mt: 1 }}>
                      <Typography variant="body2">{gradingSubmission.comments}</Typography>
                    </Paper>
                  </Box>
                )}

                <Divider />

                <TextField
                  label="Marks Obtained"
                  type="number"
                  value={gradeData.marksObtained}
                  onChange={(e) => setGradeData(prev => ({ ...prev, marksObtained: e.target.value }))}
                  fullWidth
                  required
                  inputProps={{ max: selectedAssignment?.totalMarks }}
                  helperText={`Out of ${selectedAssignment?.totalMarks}`}
                />
                <TextField
                  label="Feedback"
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Provide feedback to the student..."
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGradingSubmission(null)}>Cancel</Button>
              <Button onClick={handleSaveGrade} variant="contained">Submit Grade</Button>
            </DialogActions>
          </Dialog>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
