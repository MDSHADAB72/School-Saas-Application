import { Box, Container, Paper, Typography, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';

export function SettingsPage() {
  const [loading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Component mounted
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
            System Settings
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>⚙️ System Settings</Typography>
              <Typography color="textSecondary">
                Configure system-wide settings and preferences. Features coming soon!
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
}
