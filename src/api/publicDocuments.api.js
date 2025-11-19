import apiClient from './client';

const publicDocumentsAPI = {
  // Upload new public document (admin only)
  upload: async (formData) => {
    const response = await apiClient.post('/public-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get all public documents (admin only)
  getAll: async () => {
    const response = await apiClient.get('/public-documents');
    return response.data;
  },

  // Get public document by token (no auth required)
  getByToken: async (token) => {
    const response = await apiClient.get(`/public/${token}`);
    return response.data;
  },

  // Delete public document (admin only)
  delete: async (id) => {
    const response = await apiClient.delete(`/public-documents/${id}`);
    return response.data;
  },

  // Toggle document status (admin only)
  toggleStatus: async (id, isActive) => {
    const response = await apiClient.patch(`/public-documents/${id}/status`, {
      is_active: isActive
    });
    return response.data;
  }
};

export default publicDocumentsAPI;
