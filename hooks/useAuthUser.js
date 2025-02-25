import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuthUser = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthUser must be used within an AuthProvider');
  }
  return context;
};
