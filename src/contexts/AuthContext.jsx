import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setLoading(false);
        return;
      }

      // Validate token by fetching user profile
      const response = await authAPI.getProfile();

      if (response.success && response.data) {
        setUser(response.data);
        setUserRole(response.data.role);
      } else {
        // Invalid token, clear storage
        handleLogout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token invalid or expired, clear storage
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);

      // Send Google ID token to backend
      const response = await authAPI.googleAuth(credentialResponse.credential);

      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data;

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Set user state
        setUser(userData);
        setUserRole(userData.role);

        return { success: true, user: userData };
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Google login error:', error);
      handleLogout();
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Clear state
      setUser(null);
      setUserRole(null);
    }
  };

  // Helper flags
  const isAdmin = userRole === 'admin';
  const isUser = userRole === 'user';
  const isAuthenticated = !!user;

  const value = {
    user,
    userRole,
    loading,
    isAdmin,
    isUser,
    isAuthenticated,
    handleGoogleLogin,
    handleLogout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
