import apiClient from './client';

export const usersAPI = {
  // Get user's purchased documents
  getPurchases: async () => {
    const response = await apiClient.get('/users/purchases');
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },
};

export default usersAPI;
