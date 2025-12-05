import { Card, CardContent, Typography, Box } from '@mui/material';

export function StatCard({ title, value, icon: Icon, color = '#1976d2' }) {
  return (
    <Card sx={{ 
      height: '100%', 
      boxShadow: 2,
      minHeight: { xs: 120, sm: 140 }
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          height: '100%'
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              color="textSecondary" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 500
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                lineHeight: 1.2
              }}
            >
              {value}
            </Typography>
          </Box>
          {Icon && (
            <Box sx={{ 
              color, 
              ml: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Icon sx={{ 
                fontSize: { xs: 32, sm: 40, md: 48 }
              }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
