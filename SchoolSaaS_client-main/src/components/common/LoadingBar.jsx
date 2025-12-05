import { Box, LinearProgress } from '@mui/material';

export function LoadingBar() {
  return (
    <Box sx={{ 
      width: '100%', 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      zIndex: 9999,
      '& .MuiLinearProgress-bar': {
        transition: 'transform 0.4s linear'
      }
    }}>
      <LinearProgress sx={{ height: 3 }} />
    </Box>
  );
}
