import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();

  const normalizeUser = (nextUser) => ({
    ...nextUser,
    roleName: nextUser?.roleName?.toLowerCase?.().trim?.() || nextUser?.role?.toLowerCase?.().trim?.() || '',
  });

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await axios.get('/auth/me');
        setUser(normalizeUser(response.data.user));
      } catch (err) {
        if (err.response?.status !== 401) {
          console.error('Failed to restore session', err);
        }
        setUser(null);
      } finally {
        setIsAuthReady(true);
      }
    };

    loadCurrentUser();
  }, []);

  const login = (nextUser) => {
    setUser(normalizeUser(nextUser));
    setIsAuthReady(true);
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed', err);
    }

    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
