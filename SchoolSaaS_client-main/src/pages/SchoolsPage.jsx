import { Box, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';
import AddIcon from '@mui/icons-material/Add';
import { schoolService } from '../services/api.js';

export function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        const res = await schoolService.getAllSchools(1, 100);
        setSchools(res.data.schools || []);
      } catch (err) {
        console.error('Error fetching schools:', err);
        setError('Failed to load schools');
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Manage Schools
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ backgroundColor: '#1976d2' }}>
              Add New School
            </Button>
          </Box>

          {error && (
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffebee' }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : schools.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">No schools found. Create one to get started!</Typography>
            </Paper>
          ) : (
            <Paper sx={{ boxShadow: 2 }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell><strong>School Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Phone</strong></TableCell>
                      <TableCell><strong>Location</strong></TableCell>
                      <TableCell><strong>Tier</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Students</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school._id} hover>
                        <TableCell><strong>{school.name}</strong></TableCell>
                        <TableCell>{school.email}</TableCell>
                        <TableCell>{school.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>{school.location || 'N/A'}</TableCell>
                        <TableCell>
                          <Box sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: school.subscriptionTier === 'premium' ? '#c8e6c9' : '#fff9c4',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}>
                            {school.subscriptionTier}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: school.subscriptionStatus === 'active' ? '#c8e6c9' : '#ffccbc',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}>
                            {school.subscriptionStatus}
                          </Box>
                        </TableCell>
                        <TableCell>{school.totalStudents || 0}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
}
