import { Grid, Paper, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function QuickActions({ title, actions }) {
  const navigate = useNavigate();

  return (
    <Paper sx={{ 
      p: { xs: 2, sm: 3 }, 
      boxShadow: 2,
      mb: { xs: 2, sm: 3 }
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}
      >
        {title}
      </Typography>
      
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {actions.map((action, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<action.icon />}
              onClick={() => navigate(action.path)}
              sx={{
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: action.color || '#f5f5f5'
                }
              }}
            >
              {action.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}