import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
  useTheme,
  InputAdornment
} from '@mui/material';
import { ArrowBack, School, Person, LocationOn, Payment, Brightness4, Brightness7, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../services/api';
import { useThemeMode } from '../context/ThemeContext';

const steps = ['School Details', 'Admin Details', 'Contact Information', 'Subscription'];

export function SchoolRegistrationPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    schoolName: '',
    schoolType: '',
    establishedYear: '',
    board: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    adminPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    plan: 'starter'
  });

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.schoolName && formData.schoolType && formData.establishedYear && formData.board;
      case 1:
        return formData.adminName && formData.adminEmail && formData.adminPassword && 
               formData.confirmPassword && formData.adminPassword === formData.confirmPassword;
      case 2:
        return formData.address && formData.city && formData.state && formData.pincode;
      case 3:
        return formData.plan;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    } else {
      setError('Please fill all required fields correctly');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register-school', formData);
      
      if (response.data.success) {
        setSuccess(true);
        localStorage.setItem('token', response.data.token);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <School sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  School Information
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="School Name"
                value={formData.schoolName}
                onChange={handleInputChange('schoolName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>School Type</InputLabel>
                <Select
                  value={formData.schoolType}
                  onChange={handleInputChange('schoolType')}
                  label="School Type"
                >
                  <MenuItem value="public">Public School</MenuItem>
                  <MenuItem value="private">Private School</MenuItem>
                  <MenuItem value="international">International School</MenuItem>
                  <MenuItem value="boarding">Boarding School</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Established Year"
                type="number"
                value={formData.establishedYear}
                onChange={handleInputChange('establishedYear')}
                required
                inputProps={{ min: 1800, max: new Date().getFullYear() }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Education Board</InputLabel>
                <Select
                  value={formData.board}
                  onChange={handleInputChange('board')}
                  label="Education Board"
                >
                  <MenuItem value="cbse">CBSE</MenuItem>
                  <MenuItem value="icse">ICSE</MenuItem>
                  <MenuItem value="state">State Board</MenuItem>
                  <MenuItem value="ib">International Baccalaureate</MenuItem>
                  <MenuItem value="cambridge">Cambridge</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Person sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Administrator Details
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Administrator Name"
                value={formData.adminName}
                onChange={handleInputChange('adminName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.adminPhone}
                onChange={handleInputChange('adminPhone')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.adminEmail}
                onChange={handleInputChange('adminEmail')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.adminPassword}
                onChange={handleInputChange('adminPassword')}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                required
                error={formData.confirmPassword && formData.adminPassword !== formData.confirmPassword}
                helperText={
                  formData.confirmPassword && formData.adminPassword !== formData.confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LocationOn sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Contact Information
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="School Address"
                multiline
                rows={3}
                value={formData.address}
                onChange={handleInputChange('address')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={handleInputChange('city')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={handleInputChange('state')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PIN Code"
                value={formData.pincode}
                onChange={handleInputChange('pincode')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={handleInputChange('country')}
                required
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Payment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Choose Your Plan
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  border: (theme) => formData.plan === 'starter' ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer'
                }}
                onClick={() => setFormData(prev => ({ ...prev, plan: 'starter' }))}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Starter
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  $29
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  per month
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Up to 100 students
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  border: (theme) => formData.plan === 'professional' ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer'
                }}
                onClick={() => setFormData(prev => ({ ...prev, plan: 'professional' }))}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Professional
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  $79
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  per month
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Up to 500 students
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  border: (theme) => formData.plan === 'enterprise' ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer'
                }}
                onClick={() => setFormData(prev => ({ ...prev, plan: 'enterprise' }))}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Enterprise
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  $199
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  per month
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Unlimited students
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2
        }}
      >
        <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 500, width: '100%' }}>
          <School sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            Registration Successful!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Your school has been registered successfully. Redirecting to dashboard...
          </Typography>
          <CircularProgress />
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" sx={{ bgcolor: 'background.paper', boxShadow: 2 }}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/')}
            sx={{ mr: 2, color: 'primary.main' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              color: 'primary.main', 
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.5rem' }
            }}
          >
            EduManage SaaS - School Registration
          </Typography>
          <IconButton onClick={toggleTheme} sx={{ color: 'primary.main' }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
        <Paper sx={{ p: { xs: 2, md: 4 } }}>
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 4,
              '& .MuiStepLabel-label': { 
                fontSize: { xs: '0.75rem', sm: '1rem' },
                display: { xs: 'none', sm: 'block' }
              }
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 4 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ 
                fontSize: '1rem',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ 
                  fontSize: '1rem', 
                  px: 4,
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Complete Registration'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ 
                  fontSize: '1rem', 
                  px: 4,
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}