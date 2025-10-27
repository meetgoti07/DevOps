import { paymentApi } from './api';
import { Payment, CreatePaymentRequest } from './types';

export const paymentService = {
  initiatePayment: async (paymentData: CreatePaymentRequest): Promise<Payment> => {
    const response = await paymentApi.post('/api/payments/', paymentData);
    return response.data;
  },

  getPayment: async (paymentId: string): Promise<Payment> => {
    const response = await paymentApi.get(`/api/payments/${paymentId}`);
    return response.data;
  },

  getPaymentByOrder: async (orderId: number): Promise<Payment> => {
    const response = await paymentApi.get(`/api/payments/order/${orderId}`);
    return response.data;
  },

  processPayment: async (paymentId: string): Promise<Payment> => {
    const response = await paymentApi.post(`/api/payments/${paymentId}/process`);
    return response.data;
  },

  getPaymentStats: async (): Promise<any> => {
    const response = await paymentApi.get('/api/payments/stats');
    return response.data;
  },
};