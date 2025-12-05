import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PrintIcon from '@mui/icons-material/Print';
import { useAuth } from '../hooks/useAuth.js';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';
import { feeService } from '../services/api.js';
import templateService from '../services/templateService.js';
import { useNotification } from '../components/common/Notification.jsx';
import { LoadingBar } from '../components/common/LoadingBar.jsx';

export function FeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  const [formData, setFormData] = useState({
    studentId: '',
    class: '',
    section: '',
    feeMonth: '',
    amount: '',
    feeType: 'Tuition',
    dueDate: '',
    notes: ''
  });
  const [bulkFormData, setBulkFormData] = useState({
    feeMonth: '',
    feeType: 'Tuition',
    dueDate: ''
  });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await feeService.getAllFees({ page: 1, limit: 100 });
      setFees(response.data.fees);
    } catch (error) {
      showNotification('Error fetching fees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setFormData({
      studentId: '',
      class: '',
      section: '',
      feeMonth: '',
      amount: '',
      feeType: 'Tuition',
      dueDate: '',
      notes: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (!editingId && (!formData.studentId || formData.studentId.trim() === '')) {
        showNotification('Student ID is required', 'error');
        return;
      }
      
      if (editingId) {
        await feeService.updateFee(editingId, formData);
        showNotification('Fee updated successfully', 'success');
      } else {
        await feeService.createFee(formData);
        showNotification('Fee created successfully', 'success');
      }
      handleCloseDialog();
      fetchFees();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error saving fee', 'error');
    }
  };

  const handleEdit = (fee) => {
    setEditingId(fee._id);
    setFormData({
      studentId: fee.studentId?.studentId || '',
      class: fee.class,
      section: fee.section,
      feeMonth: fee.feeMonth,
      amount: fee.amount,
      feeType: fee.feeType,
      dueDate: fee.dueDate?.split('T')[0] || '',
      notes: fee.notes || ''
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee?')) {
      try {
        await feeService.deleteFee(id);
        showNotification('Fee deleted successfully', 'success');
        fetchFees();
      } catch (error) {
        showNotification('Error deleting fee', 'error');
      }
    }
  };

  const handleBulkGenerate = async () => {
    try {
      if (!bulkFormData.feeMonth || !bulkFormData.dueDate) {
        showNotification('Please fill all fields', 'error');
        return;
      }
      
      await feeService.generateFeesForAll(bulkFormData);
      showNotification('Fees generated for all students successfully', 'success');
      setOpenBulkDialog(false);
      fetchFees();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error generating fees', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'success.light';
      case 'Pending':
        return 'warning.light';
      case 'Overdue':
        return 'error.light';
      default:
        return 'action.hover';
    }
  };

  const handlePrintReceipt = async (fee) => {
    try {
      showNotification('Generating receipt...', 'info');
      
      const response = await feeService.printReceipt(fee._id);
      
      if (response.data.success) {
        // Create download link
        const pdfBlob = new Blob([
          Uint8Array.from(atob(response.data.data.pdf), c => c.charCodeAt(0))
        ], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Fee_Receipt_${fee.studentId?.studentId || 'Unknown'}_${fee.feeMonth}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showNotification('Receipt downloaded successfully!', 'success');
      } else {
        showNotification('Failed to generate receipt', 'error');
      }
    } catch (error) {
      console.error('Print receipt error:', error);
      showNotification(error.response?.data?.message || 'Failed to generate receipt. Please try again.', 'error');
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
              Fee Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<AutorenewIcon />} onClick={() => setOpenBulkDialog(true)}>
                Generate for All
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
                Add Fee
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Student ID</strong></TableCell>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Month</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Due Date</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee._id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', fontFamily: 'monospace' }}>
                      {fee.studentId?.studentId || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {fee.studentId?.userId?.firstName} {fee.studentId?.userId?.lastName}
                      <Typography variant="caption" display="block" color="textSecondary">
                        Roll: {fee.studentId?.rollNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{fee.class}-{fee.section}</TableCell>
                    <TableCell>{fee.feeMonth}</TableCell>
                    <TableCell>₹{fee.amount}</TableCell>
                    <TableCell>
                      <Box sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: getStatusColor(fee.status),
                        color: fee.status === 'Paid' ? 'success.dark' : fee.status === 'Pending' ? 'warning.dark' : 'error.dark',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}>
                        {fee.status}
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {fee.status === 'Paid' && (
                        <Tooltip title="Print Receipt">
                          <IconButton size="small" color="primary" onClick={() => handlePrintReceipt(fee)}>
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(fee)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(fee._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>{editingId ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, pt: 2 }}>
                <TextField
                  label="Student ID"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  disabled={!!editingId}
                  helperText={editingId ? 'Cannot change student for existing fee' : 'Enter Student ID (e.g., STU00001) from the student table'}
                  placeholder="e.g., STU00001"
                />
                <TextField
                  label="Class"
                  name="class"
                  value={formData.class}
                  onChange={handleFormChange}
                  fullWidth
                />
                <TextField
                  label="Section"
                  name="section"
                  value={formData.section}
                  onChange={handleFormChange}
                  fullWidth
                />
                <TextField
                  label="Fee Month"
                  name="feeMonth"
                  value={formData.feeMonth}
                  onChange={handleFormChange}
                  fullWidth
                  placeholder="December 2024"
                />
                <TextField
                  label="Amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleFormChange}
                  fullWidth
                />
                <TextField
                  label="Fee Type"
                  name="feeType"
                  select
                  value={formData.feeType}
                  onChange={handleFormChange}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="Tuition">Tuition</option>
                  <option value="Transport">Transport</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Activity">Activity</option>
                  <option value="Other">Other</option>
                </TextField>
                <TextField
                  label="Due Date"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleFormChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSave} variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Generate Fees for All Students</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, pt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  This will create fees for all students based on their class. Amount will be auto-calculated (Class × ₹1000).
                  <br />Class 1 = ₹1000, Class 2 = ₹2000, ..., Class 12 = ₹12000
                </Typography>
                <TextField
                  label="Fee Month"
                  name="feeMonth"
                  value={bulkFormData.feeMonth}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, feeMonth: e.target.value }))}
                  fullWidth
                  placeholder="December 2024"
                />
                <TextField
                  label="Fee Type"
                  name="feeType"
                  select
                  value={bulkFormData.feeType}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, feeType: e.target.value }))}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="Tuition">Tuition</option>
                  <option value="Transport">Transport</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Activity">Activity</option>
                  <option value="Other">Other</option>
                </TextField>
                <TextField
                  label="Due Date"
                  name="dueDate"
                  type="date"
                  value={bulkFormData.dueDate}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkGenerate} variant="contained" color="primary">
                Generate
              </Button>
            </DialogActions>
          </Dialog>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
