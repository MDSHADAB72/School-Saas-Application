import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip } from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import { useAuth } from '../hooks/useAuth.js';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';
import { feeService, studentService, activityService } from '../services/api.js';
import { useNotification } from '../components/common/Notification.jsx';
import { LoadingBar } from '../components/common/LoadingBar.jsx';

export function StudentFeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  const [paymentData, setPaymentData] = useState({
    paidAmount: '',
    paymentMethod: 'Cash',
    transactionId: '',
    receiptNumber: ''
  });
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    fetchStudentAndFees();
  }, []);

  const fetchStudentAndFees = async () => {
    try {
      setLoading(true);
      // Get student record first
      const studentsRes = await studentService.getAllStudents({ page: 1, limit: 1 });
      const student = studentsRes.data.students[0];
      
      if (student) {
        setStudentId(student._id);
        // Fetch fees for this student
        const response = await feeService.getAllFees({ studentId: student._id, page: 1, limit: 100 });
        setFees(response.data.fees);
      }
    } catch (error) {
      showNotification('Error fetching fees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (fee) => {
    setSelectedFee(fee);
    setPaymentData({
      paidAmount: fee.amount - (fee.paidAmount || 0),
      paymentMethod: 'Cash',
      transactionId: '',
      receiptNumber: ''
    });
    setOpenPaymentDialog(true);
  };

  const handleClosePayment = () => {
    setOpenPaymentDialog(false);
    setSelectedFee(null);
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async () => {
    try {
      if (!paymentData.paidAmount || paymentData.paidAmount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
      }

      await feeService.recordFeePayment(selectedFee._id, paymentData);
      
      // Log activity
      await activityService.logActivity({
        type: 'fee_payment',
        message: `Paid ₹${paymentData.paidAmount} for ${selectedFee.feeType} (${selectedFee.feeMonth})`,
        metadata: { feeId: selectedFee._id, amount: paymentData.paidAmount }
      }).catch(() => {});
      
      showNotification('Payment recorded successfully', 'success');
      handleClosePayment();
      fetchStudentAndFees();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error recording payment', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Overdue':
        return 'error';
      case 'Partial':
        return 'info';
      default:
        return 'default';
    }
  };

  const calculateTotals = () => {
    const total = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paid = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
    const pending = total - paid;
    return { total, paid, pending };
  };

  const totals = calculateTotals();

  if (loading) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
            My Fees
          </Typography>

          {/* Summary Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                ₹{totals.total}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Fees
              </Typography>
            </Paper>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                ₹{totals.paid}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Paid
              </Typography>
            </Paper>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#ffebee' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                ₹{totals.pending}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pending
              </Typography>
            </Paper>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Fee Type</strong></TableCell>
                  <TableCell><strong>Month</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Paid</strong></TableCell>
                  <TableCell><strong>Balance</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Due Date</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No fees found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  fees.map((fee) => (
                    <TableRow key={fee._id} hover>
                      <TableCell>{fee.feeType}</TableCell>
                      <TableCell>{fee.feeMonth}</TableCell>
                      <TableCell>₹{fee.amount}</TableCell>
                      <TableCell>₹{fee.paidAmount || 0}</TableCell>
                      <TableCell>₹{fee.amount - (fee.paidAmount || 0)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={fee.status} 
                          color={getStatusColor(fee.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {fee.status !== 'Paid' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PaymentIcon />}
                            onClick={() => handleOpenPayment(fee)}
                          >
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openPaymentDialog} onClose={handleClosePayment} maxWidth="sm" fullWidth>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, pt: 2 }}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">Fee Type</Typography>
                  <Typography variant="h6">{selectedFee?.feeType}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Total Amount</Typography>
                  <Typography variant="h6">₹{selectedFee?.amount}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Already Paid</Typography>
                  <Typography variant="h6">₹{selectedFee?.paidAmount || 0}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Balance</Typography>
                  <Typography variant="h6" color="error">₹{selectedFee ? selectedFee.amount - (selectedFee.paidAmount || 0) : 0}</Typography>
                </Box>

                <TextField
                  label="Payment Amount"
                  name="paidAmount"
                  type="number"
                  value={paymentData.paidAmount}
                  onChange={handlePaymentChange}
                  fullWidth
                  required
                  helperText="Enter the amount you are paying"
                />

                <TextField
                  label="Payment Method"
                  name="paymentMethod"
                  select
                  value={paymentData.paymentMethod}
                  onChange={handlePaymentChange}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </TextField>

                {paymentData.paymentMethod === 'Online' && (
                  <TextField
                    label="Transaction ID"
                    name="transactionId"
                    value={paymentData.transactionId}
                    onChange={handlePaymentChange}
                    fullWidth
                    placeholder="Enter transaction ID"
                  />
                )}

                <TextField
                  label="Receipt Number (Optional)"
                  name="receiptNumber"
                  value={paymentData.receiptNumber}
                  onChange={handlePaymentChange}
                  fullWidth
                  placeholder="Enter receipt number if available"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePayment}>Cancel</Button>
              <Button onClick={handlePayment} variant="contained" color="primary">
                Submit Payment
              </Button>
            </DialogActions>
          </Dialog>

          <NotificationComponent />
        </Container>
      </Box>
    </Box>
  );
}
