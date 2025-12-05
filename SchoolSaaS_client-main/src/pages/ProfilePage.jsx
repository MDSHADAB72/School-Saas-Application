import { Box, Container, Paper, Typography, TextField, Button, Grid, Avatar, Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { authService } from '../services/api.js';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

export function ProfilePage() {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || ''
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Update user profile (you'll need to create this API endpoint)
      const response = await authService.updateProfile(formData);
      
      // Update the auth context with new user data
      login(response.data.user, localStorage.getItem('token'));
      
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 3, fontSize: '2rem' }}
                src={user?.profilePhoto}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="h6" color="textSecondary" sx={{ textTransform: 'capitalize' }}>
                  {user?.role?.replace('_', ' ')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {error && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
                <Typography color="error">{error}</Typography>
              </Paper>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!editing}
                  variant={editing ? 'outlined' : 'filled'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!editing}
                  variant={editing ? 'outlined' : 'filled'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!editing}
                  variant={editing ? 'outlined' : 'filled'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  disabled={!editing}
                  variant={editing ? 'outlined' : 'filled'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role"
                  value={user?.role?.replace('_', ' ').toUpperCase()}
                  disabled
                  variant="filled"
                />
              </Grid>
              {user?.schoolId && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="School ID"
                    value={user.schoolId}
                    disabled
                    variant="filled"
                  />
                </Grid>
              )}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              {editing ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}