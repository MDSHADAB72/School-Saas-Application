import { AppBar, Toolbar, Typography, Button, Avatar, Menu, MenuItem, Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../context/ThemeContext';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export function Header({ onMobileMenuToggle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2', zIndex: (theme) => theme.zIndex.appBar }}>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {onMobileMenuToggle && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMobileMenuToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography 
          variant="h6" 
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }} 
          onClick={() => navigate('/')}
        >
          📚 School Management SaaS
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
          <IconButton 
            onClick={toggleTheme} 
            color="inherit" 
            title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
            sx={{ p: { xs: 1, sm: 1.5 } }}
          >
            {mode === 'dark' ? <Brightness7Icon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} /> : <Brightness4Icon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />}
          </IconButton>
          <Typography 
            variant="body2" 
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontSize: { sm: '0.875rem', md: '1rem' }
            }}
          >
            {user?.firstName} {user?.lastName}
          </Typography>
          <Avatar
            onClick={handleMenuOpen}
            sx={{ 
              cursor: 'pointer', 
              width: { xs: 36, sm: 40 }, 
              height: { xs: 36, sm: 40 },
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
            src={user?.profilePhoto}
          >
            {user?.firstName?.[0]}
          </Avatar>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}