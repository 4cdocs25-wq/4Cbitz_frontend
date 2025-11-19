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

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },

  // Admin: Get all users with subscription information
  getAllUsers: async (params = {}) => {
    const { limit = 20, offset = 0, search, startDate, endDate } = params;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(search && { search }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const response = await apiClient.get(`/users/admin/all?${queryParams}`);
    return response.data;
  },
};

export default usersAPI;
