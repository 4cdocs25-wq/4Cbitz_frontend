import apiClient from './client';

export const foldersAPI = {
  // Get folder tree (hierarchical structure)
  getTree: async () => {
    const response = await apiClient.get('/folders/tree');
    return response.data;
  },

  // Get folder by ID
  getById: async (id) => {
    const response = await apiClient.get(`/folders/${id}`);
    return response.data;
  },

  // Get folder with its documents
  getDocuments: async (id) => {
    const response = await apiClient.get(`/folders/${id}/documents`);
    return response.data;
  },

  // Get folder path (breadcrumb)
  getPath: async (id) => {
    const response = await apiClient.get(`/folders/${id}/path`);
    return response.data;
  },

  // Create new folder (admin only)
  create: async (name, parentId = null) => {
    const response = await apiClient.post('/folders', {
      name,
      parent_id: parentId
    });
    return response.data;
  },

  // Update folder name (admin only)
  update: async (id, name) => {
    const response = await apiClient.put(`/folders/${id}`, { name });
    return response.data;
  },

  // Delete folder (admin only)
  delete: async (id) => {
    const response = await apiClient.delete(`/folders/${id}`);
    return response.data;
  },

  // Move folder to new parent (admin only)
  move: async (id, parentId = null) => {
    const response = await apiClient.put(`/folders/${id}/move`, {
      parent_id: parentId
    });
    return response.data;
  }
};

export default foldersAPI;
