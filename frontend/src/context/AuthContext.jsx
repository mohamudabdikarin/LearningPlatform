import { createContext, useState, useEffect, useContext } from 'react';
import { getProfile } from '../services/apiService';
import { tokenManager } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to validate and refresh user session
  const validateAndRefreshSession = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Check if token is valid
      if (!tokenManager.isValid()) {
        // Token exists but is invalid (likely expired)
        // Try to refresh user profile to maintain session
        try {
          const profile = await getProfile();
          const userData = { ...profile, token };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          // If profile fetch fails, clear session
          console.warn('Session validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else if (storedUser) {
        // Token is valid and we have user data
        setUser(JSON.parse(storedUser));
      } else {
        // Token is valid but no user data, fetch profile
        try {
          const profile = await getProfile();
          const userData = { ...profile, token };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.warn('Profile fetch failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // On mount, check localStorage for user/token and rehydrate if needed
  useEffect(() => {
    validateAndRefreshSession();
    
    // Listen for auth failure events
    const handleAuthFailure = () => {
      setUser(null);
    };
    
    window.addEventListener('auth-failure', handleAuthFailure);
    
    return () => {
      window.removeEventListener('auth-failure', handleAuthFailure);
    };
  }, []);

  const login = (userData) => {
    // Store token and user details in local storage
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    // Clear local storage and state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    // Update user data in state and localStorage
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context easily
export const useAuth = () => {
  return useContext(AuthContext);
};