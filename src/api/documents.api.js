import apiClient from './client';

export const documentsAPI = {
  // Get all documents (public - for browsing)
  getAll: async () => {
    const response = await apiClient.get('/documents');
    return response.data;
  },

  // Get single document by ID (with access check)
  getById: async (id) => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  // Check if user has access to a document
  checkAccess: async (id) => {
    const response = await apiClient.get(`/documents/${id}/access`);
    return response.data;
  },

  // Upload document (admin only)
  upload: async (formData) => {
    const response = await apiClient.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update document (admin only)
  update: async (id, data) => {
    const response = await apiClient.put(`/documents/${id}`, data);
    return response.data;
  },

  // Delete document (admin only)
  delete: async (id) => {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },
};

export default documentsAPI;
