import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';   // ← optional but recommended

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();   // helps with auto-redirect on invalid/expired token

  // 1. Load token from localStorage when app starts / refreshes
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);

        // Optional but strongly recommended: check if token is still valid
        if (decoded.exp * 1000 < Date.now()) {
          console.warn('Token expired → logging out');
          localStorage.removeItem('token');
          setUser(null);
          navigate('/login');
          return;
        }

        setUser(decoded);
        // Optional: auto-redirect to dashboard based on role if on /login
        // if (window.location.pathname === '/login') {
        //   navigate(`/${decoded.role}`);
        // }
      } catch (err) {
        console.error('Invalid JWT token in storage', err);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  }, [navigate]);   // navigate is stable, no infinite loop

  const login = (token) => {
    localStorage.setItem('token', token);
    try {
      const decoded = jwtDecode(token);
      setUser(decoded);

      // Optional: immediate redirect after login
      // (some people prefer doing this in Login component)
      // navigate(`/${decoded.role}`);
    } catch (err) {
      console.error('Invalid token received during login', err);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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