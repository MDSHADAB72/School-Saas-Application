import { Alert, Snackbar } from '@mui/material';
import { useState, useCallback } from 'react';

export function useNotification() {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type, open: true });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => prev ? { ...prev, open: false } : null);
  }, []);

  const NotificationComponent = () => (
    <Snackbar
      open={notification?.open || false}
      autoHideDuration={6000}
      onClose={hideNotification}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={hideNotification}
        severity={notification?.type || 'success'}
        sx={{ width: '100%' }}
      >
        {notification?.message}
      </Alert>
    </Snackbar>
  );

  return { showNotification, NotificationComponent };
}
