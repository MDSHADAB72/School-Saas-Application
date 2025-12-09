import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Paper, Alert, AppBar, Toolbar, IconButton, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@mui/material';
import { ArrowBack, Brightness4, Brightness7, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [formData, setFormData] = useState({ role: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'school_admin', label: 'School Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' },
    { value: 'exam_controller', label: 'Exam Controller' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.role || !formData.email || !formData.password) {
      setError('Please fill all fields');
      return;
    }
    
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      const { token, user } = response.data;
      
      // Verify role matches
      if (user.role !== formData.role) {
        setError('Selected role does not match your account');
        setLoading(false);
        return;
      }
      
      console.log('Login successful, token:', token);
      console.log('User data:', user);
      login(user, token);
      console.log('Token after login:', localStorage.getItem('token'));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" sx={{ bgcolor: 'background.paper', boxShadow: 2 }}>
        <Toolbar>
          <IconButton
            edge="start"
            component={Link}
            to="/"
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
              fontSize: '1.5rem'
            }}
          >
            EduManage SaaS - Login
          </Typography>
          <IconButton onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', borderRadius: 2 }}>
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 2, fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
              Multi-Tenant Management Platform
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Select Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Select Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
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
              <Button
                fullWidth
                variant="contained"
                color="primary"
                sx={{ 
                  mt: 3, 
                  py: 1.5, 
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Don't have a school account?
                </Typography>
                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  Register Your School
                </Button>
              </Box>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
                Demo Credentials (Password: password123)
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                Super Admin: superadmin@saas.com
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                School Admin: admin@dps.com
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                Teacher: amit@dps.com
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                Student: arjun@student.com
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.8rem' }}>
                Parent: vikram@parent.com
              </Typography>

            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}