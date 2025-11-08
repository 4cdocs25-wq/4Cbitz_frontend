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
};

export default paymentsAPI;
