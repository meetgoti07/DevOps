import { queueApi } from './api';
import { QueueItem, QueueStats } from './types';

export const queueService = {
  addToQueue: async (orderData: { order_id: number; user_id: number }): Promise<QueueItem> => {
    const response = await queueApi.post('/api/queue/', orderData);
    return response.data;
  },

  getQueueItem: async (orderId: number): Promise<QueueItem> => {
    const response = await queueApi.get(`/api/queue/order/${orderId}`);
    return response.data;
  },

  getActiveQueue: async (): Promise<QueueItem[]> => {
    const response = await queueApi.get('/api/queue/active');
    return response.data;
  },

  updateQueueStatus: async (orderId: number, status: string): Promise<QueueItem> => {
    const response = await queueApi.put(`/api/queue/order/${orderId}`, { status });
    return response.data;
  },

  removeFromQueue: async (orderId: number): Promise<void> => {
    await queueApi.delete(`/api/queue/order/${orderId}`);
  },

  getQueueStats: async (): Promise<QueueStats> => {
    const response = await queueApi.get('/api/queue/stats');
    return response.data;
  },
};