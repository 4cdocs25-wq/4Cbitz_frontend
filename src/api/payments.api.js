import apiClient from './client';

export const paymentsAPI = {
  // Create Stripe checkout session
  createCheckout: async (documentId) => {
    const response = await apiClient.post('/payments/create-checkout', {
      documentId,
    });
    return response.data;
  },

  // Verify payment after successful checkout
  verifyPayment: async (sessionId) => {
    const response = await apiClient.post('/payments/verify-payment', {
      sessionId,
    });
    return response.data;
  },

  // Get payment status
  getPaymentStatus: async (sessionId) => {
    const response = await apiClient.get(`/payments/status/${sessionId}`);
    return response.data;
  },

  // Admin: Get all transactions with pagination and filters
  getTransactions: async (params = {}) => {
    const { limit = 20, offset = 0, status, search, startDate, endDate } = params;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status }),
      ...(search && { search }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const response = await apiClient.get(`/payments/admin/transactions?${queryParams}`);
    return response.data;
  },

  // Admin: Get transaction statistics
  getTransactionStats: async () => {
    const response = await apiClient.get('/payments/admin/stats');
    return response.data;
  },

  // Admin: Export transactions for date range
  exportTransactions: async (startDate, endDate) => {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
    });
    const response = await apiClient.get(`/payments/admin/export?${queryParams}`);
    return response.data;
  },
};

export default paymentsAPI;
