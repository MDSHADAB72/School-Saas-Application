import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, List, ListItem, ListItemText, IconButton, Divider, Alert } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { assignmentService, getFileUrl } from '../services/api';
import { useNotification } from '../components/common/Notification';
import { LoadingBar } from '../components/common/LoadingBar';

export function StudentAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  const [submissionData, setSubmissionData] = useState({
    comments: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mySubmissions, setMySubmissions] = useState({});

  useEffect(() => {
    fetchAssignments();
    fetchMySubmissions();
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

  const fetchMySubmissions = async () => {
    try {
      const response = await assignmentService.getMySubmissions();
      const submissionsMap = {};
      response.data.submissions.forEach(sub => {
        submissionsMap[sub.assignmentId._id || sub.assignmentId] = sub;
      });
      setMySubmissions(submissionsMap);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownload = (file) => {
    showNotification(`Downloading ${file.fileName}...`, 'info');
    const link = document.createElement('a');
    link.href = getFileUrl(file.fileUrl);
    link.download = file.fileName;
    link.target = '_blank';
    link.click();
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id);
      formData.append('comments', submissionData.comments);
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      await assignmentService.submitAssignment(formData);
      showNotification('Assignment submitted successfully!', 'success');
      setOpenDialog(false);
      setSubmissionData({ comments: '' });
      setSelectedFiles([]);
      fetchAssignments();
      fetchMySubmissions();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error submitting assignment', 'error');
    }
  };

  const openSubmitDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionData({ comments: '' });
    setSelectedFiles([]);
    setOpenDialog(true);
  };

  const getSubmissionStatus = (assignmentId) => {
    return mySubmissions[assignmentId];
  };

  const openViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setOpenViewDialog(true);
  };

  if (loading) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
            My Assignments
          </Typography>

          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Subject</strong></TableCell>
                  <TableCell><strong>Due Date</strong></TableCell>
                  <TableCell><strong>Marks</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Submission</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No assignments available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => {
                    const now = new Date();
                    const start = new Date(assignment.startDate);
                    const due = new Date(assignment.dueDate);
                    const status = now < start ? 'Upcoming' : now > due ? 'Closed' : 'Active';
                    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                    const submission = getSubmissionStatus(assignment._id);

                    return (
                      <TableRow 
                        key={assignment._id} 
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => openViewAssignment(assignment)}
                      >
                        <TableCell>{assignment.title}</TableCell>
                        <TableCell>{assignment.subject}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </Typography>
                          {status === 'Active' && daysLeft >= 0 && (
                            <Typography variant="caption" color={daysLeft <= 2 ? 'error' : 'primary'}>
                              {daysLeft} days left
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{assignment.totalMarks}</TableCell>
                        <TableCell>
                          <Chip 
                            label={status} 
                            size="small"
                            color={status === 'Active' ? 'success' : status === 'Upcoming' ? 'info' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {submission ? (
                            <Chip 
                              label={submission.reviewed ? `Graded: ${submission.marksObtained}/${assignment.totalMarks}` : 'Submitted'}
                              size="small"
                              color={submission.reviewed ? 'success' : 'warning'}
                            />
                          ) : (
                            <Chip label="Not Submitted" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="small"
                            variant="contained" 
                            startIcon={<SendIcon />}
                            onClick={() => openSubmitDialog(assignment)}
                            disabled={status === 'Closed' || status === 'Upcoming' || !!submission}
                          >
                            Submit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* View Assignment Details Dialog */}
          <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white' }}>
              {selectedAssignment?.title}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Subject</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedAssignment?.subject}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Class & Section</Typography>
                  <Typography variant="body1">{selectedAssignment?.class}-{selectedAssignment?.section}</Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Start Date</Typography>
                    <Typography variant="body1">{selectedAssignment?.startDate ? new Date(selectedAssignment.startDate).toLocaleDateString() : 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Due Date</Typography>
                    <Typography variant="body1" color="error">{selectedAssignment?.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString() : 'N/A'}</Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Total Marks</Typography>
                  <Typography variant="body1">{selectedAssignment?.totalMarks}</Typography>
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
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Teacher's Attachments</Typography>
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
                startIcon={<SendIcon />}
                onClick={() => {
                  setOpenViewDialog(false);
                  openSubmitDialog(selectedAssignment);
                }}
              >
                Submit Assignment
              </Button>
            </DialogActions>
          </Dialog>

          {/* Submit Assignment Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Submit Assignment: {selectedAssignment?.title}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField
                  label="Comments (Optional)"
                  value={submissionData.comments}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, comments: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Add any comments or notes about your submission..."
                />

                <Box>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="submission-file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                  <label htmlFor="submission-file-upload">
                    <Button 
                      variant="outlined" 
                      component="span" 
                      startIcon={<AttachFileIcon />}
                      fullWidth
                    >
                      Attach Your Files
                    </Button>
                  </label>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                    Supported: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
                  </Typography>
                </Box>

                {selectedFiles.length > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Attached Files:
                    </Typography>
                    <List dense>
                      {selectedFiles.map((file, index) => (
                        <ListItem 
                          key={index}
                          sx={{ bgcolor: '#f5f5f5', borderRadius: 1, mb: 0.5 }}
                          secondaryAction={
                            <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText 
                            primary={file.name} 
                            secondary={file.type}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained" 
                disabled={selectedFiles.length === 0}
                startIcon={<SendIcon />}
              >
                Submit
              </Button>
            </DialogActions>
          </Dialog>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
