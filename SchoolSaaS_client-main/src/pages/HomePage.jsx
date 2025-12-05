import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box, 
  Grid, 
  Card, 
  CardContent,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  School, 
  People, 
  Assignment, 
  Analytics, 
  Security,
  Menu as MenuIcon,
  Close as CloseIcon,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext';

export function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  const navItems = [
    { label: 'Features', id: 'features' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'About', id: 'about' },
    { label: 'Mission', id: 'mission' },
    { label: 'Documentation', id: 'documentation' },
    { label: 'Contact', id: 'contact' }
  ];

  const features = [
    {
      icon: <School sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'School Management',
      description: 'Complete school administration with multi-tenant architecture'
    },
    {
      icon: <People sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'User Management',
      description: 'Role-based access for admins, teachers, students, and parents'
    },
    {
      icon: <Assignment sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Academic Tools',
      description: 'Attendance, assignments, examinations, and result management'
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Analytics & Reports',
      description: 'Comprehensive reporting and data analytics dashboard'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Secure & Scalable',
      description: 'Enterprise-grade security with JWT authentication'
    }
  ];

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.id} button onClick={() => scrollToSection(item.id)}>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        <ListItem button onClick={() => navigate('/login')}>
          <ListItemText primary="Login" />
        </ListItem>
        <ListItem button onClick={() => navigate('/register')}>
          <ListItemText primary="Register School" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
      {/* Navigation */}
      <AppBar position="fixed" sx={{ bgcolor: 'background.paper', boxShadow: 2 }}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: 'primary.main', 
              fontWeight: 700,
              fontSize: { xs: '1.2rem', md: '1.5rem' }
            }}
          >
            EduManage SaaS
          </Typography>
          
          {isMobile ? (
            <>
              <IconButton onClick={toggleTheme} sx={{ color: 'primary.main', mr: 1 }}>
                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ color: 'primary.main' }}
              >
                <MenuIcon />
              </IconButton>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  sx={{ 
                    color: 'text.primary', 
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  {item.label}
                </Button>
              ))}
              <IconButton onClick={toggleTheme} sx={{ color: 'primary.main' }}>
                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
              <Button
                onClick={() => navigate('/login')}
                sx={{ 
                  color: 'primary.main', 
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  px: 3
                }}
              >
                Register School
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {drawer}
      </Drawer>

      {/* Hero Section */}
      <Box 
        sx={{ 
          pt: { xs: 12, md: 15 }, 
          pb: { xs: 8, md: 12 },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
              mb: 3,
              lineHeight: 1.2
            }}
          >
            Modern School Management
            <br />Made Simple
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 5, 
              opacity: 0.9,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Streamline your educational institution with our comprehensive SaaS platform. 
            Manage students, teachers, attendance, and more with ease.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ 
                backgroundColor: '#fff',
                color: '#1976d2',
                fontWeight: 600,
                fontSize: '1.1rem',
                px: 4,
                py: 1.5,
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => scrollToSection('features')}
              sx={{ 
                borderColor: '#fff',
                color: '#fff',
                fontWeight: 600,
                fontSize: '1.1rem',
                px: 4,
                py: 1.5,
                '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              textAlign: 'center', 
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: 'text.primary'
            }}
          >
            Powerful Features
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    '&:hover': { transform: 'translateY(-5px)', transition: 'all 0.3s ease' }
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 600,
                        fontSize: '1.2rem',
                        color: 'text.primary'
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'text.secondary',
                        fontSize: '1rem',
                        lineHeight: 1.6
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box id="pricing" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              textAlign: 'center', 
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: 'text.primary'
            }}
          >
            Simple Pricing
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', p: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Starter
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  $29
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  per month
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                  Up to 100 students
                </Typography>
                <Button variant="outlined" fullWidth>
                  Get Started
                </Button>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', p: 4, boxShadow: 3, border: (theme) => `2px solid ${theme.palette.primary.main}` }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Professional
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  $79
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  per month
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                  Up to 500 students
                </Typography>
                <Button variant="contained" fullWidth>
                  Most Popular
                </Button>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', p: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Enterprise
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  $199
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  per month
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                  Unlimited students
                </Typography>
                <Button variant="outlined" fullWidth>
                  Contact Sales
                </Button>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* About Section */}
      <Box id="about" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h3" 
                component="h2" 
                sx={{ 
                  mb: 4,
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  color: 'text.primary'
                }}
              >
                About EduManage
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3,
                  fontSize: '1.1rem',
                  lineHeight: 1.7,
                  color: 'text.secondary'
                }}
              >
                EduManage is a comprehensive school management SaaS platform built with modern 
                technologies. We provide educational institutions with the tools they need to 
                streamline operations, improve communication, and enhance the learning experience.
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: '1.1rem',
                  lineHeight: 1.7,
                  color: 'text.secondary'
                }}
              >
                Our platform serves schools of all sizes, from small private institutions to 
                large educational networks, with multi-tenant architecture ensuring data security 
                and scalability.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  height: 300,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <School sx={{ fontSize: 100, color: 'primary.main' }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Mission Section */}
      <Box id="mission" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              textAlign: 'center', 
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: 'text.primary'
            }}
          >
            Our Mission
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              textAlign: 'center',
              maxWidth: '800px',
              mx: 'auto',
              fontSize: { xs: '1.2rem', md: '1.4rem' },
              lineHeight: 1.6,
              color: 'text.secondary',
              fontWeight: 400
            }}
          >
            To empower educational institutions with innovative technology solutions that 
            simplify administration, enhance communication, and create better learning 
            environments for students, teachers, and parents.
          </Typography>
        </Container>
      </Box>

      {/* Documentation Section */}
      <Box id="documentation" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              textAlign: 'center', 
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: 'text.primary'
            }}
          >
            Documentation
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Getting Started
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  Quick setup guide and installation instructions
                </Typography>
                <Button variant="outlined">View Guide</Button>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  API Reference
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  Complete API documentation and examples
                </Typography>
                <Button variant="outlined">View API</Button>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  User Manual
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  Comprehensive user guide for all features
                </Typography>
                <Button variant="outlined">View Manual</Button>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box id="contact" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              textAlign: 'center', 
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: 'text.primary'
            }}
          >
            Contact Us
          </Typography>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Get in Touch
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong> support@edumanage.com
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Phone:</strong> +1 (555) 123-4567
              </Typography>
              <Typography variant="body1">
                <strong>Address:</strong> 123 Education St, Learning City, LC 12345
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Send Message
                </Typography>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <input 
                    type="text" 
                    placeholder="Your Name"
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                  <input 
                    type="email" 
                    placeholder="Your Email"
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                  <textarea 
                    placeholder="Your Message"
                    rows={4}
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px',
                      resize: 'vertical'
                    }}
                  />
                  <Button variant="contained" size="large">
                    Send Message
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, bgcolor: 'grey.900', color: 'white', textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="body1" sx={{ mb: 2 }}>
            © 2024 EduManage SaaS. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Built with ❤️ for educational institutions worldwide
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}