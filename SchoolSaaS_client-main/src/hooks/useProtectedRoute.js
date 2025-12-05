import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const useProtectedRoute = (allowedRoles = []) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      navigate('/unauthorized');
    }
  }, [token, user, navigate, allowedRoles]);

  return { user, token };
};
