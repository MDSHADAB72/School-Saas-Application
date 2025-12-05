import { Box, Container, Paper, Typography, CircularProgress, Grid, Card, CardContent } from '@mui/material';
import { useEffect, useState } from 'react';
import { Header } from '../components/common/Header.jsx';
import { Sidebar } from '../components/common/Sidebar.jsx';

export function AnalyticsPage() {
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
            System Analytics
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ boxShadow: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Schools
                    </Typography>
                    <Typography variant="h5">2</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ boxShadow: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h5">744</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ boxShadow: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      System Revenue
                    </Typography>
                    <Typography variant="h5">₹89,374</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>📊 Detailed Analytics</Typography>
                  <Typography color="textSecondary">
                    More detailed analytics and charts coming soon!
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </Box>
  );
}
