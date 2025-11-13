import apiClient from './client';

const settingsAPI = {
  // Get public setting by key (no auth required)
  getPublicByKey: async (key) => {
    const response = await apiClient.get(`/settings/public/${key}`);
    return response.data;
  },

  // Get all settings (admin only)
  getAll: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  // Get setting by key (admin only)
  getByKey: async (key) => {
    const response = await apiClient.get(`/settings/${key}`);
    return response.data;
  },

  // Update setting
  update: async (key, value) => {
    const response = await apiClient.put(`/settings/${key}`, { value });
    return response.data;
  },

  // Create new setting
  create: async (key, value, description = null) => {
    const response = await apiClient.post('/settings', {
      key,
      value,
      description
    });
    return response.data;
  }
};

export default settingsAPI;
