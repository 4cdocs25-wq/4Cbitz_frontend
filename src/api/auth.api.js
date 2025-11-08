import apiClient from './client';

export const authAPI = {
  // Google OAuth login/register
  googleAuth: async (idToken) => {
    const response = await apiClient.post('/auth/google', { idToken });
    return response.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

export default authAPI;
