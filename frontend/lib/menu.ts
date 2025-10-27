import { menuApi } from './api';
import { MenuItem, Category } from './types';

export const menuService = {
  getMenuItems: async (params?: { 
    category?: string; 
    available?: boolean 
  }): Promise<MenuItem[]> => {
    const response = await menuApi.get('/api/menu/items', { params });
    return response.data;
  },

  getMenuItem: async (id: string): Promise<MenuItem> => {
    const response = await menuApi.get(`/api/menu/items/${id}`);
    return response.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await menuApi.get('/api/menu/categories');
    return response.data;
  },

  createMenuItem: async (menuItem: Omit<MenuItem, '_id' | 'created_at' | 'updated_at'>): Promise<MenuItem> => {
    const response = await menuApi.post('/api/menu/items', menuItem);
    return response.data;
  },

  updateMenuItem: async (id: string, menuItem: Partial<MenuItem>): Promise<MenuItem> => {
    const response = await menuApi.put(`/api/menu/items/${id}`, menuItem);
    return response.data;
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    await menuApi.delete(`/api/menu/items/${id}`);
  },

  createCategory: async (category: Omit<Category, '_id' | 'created_at' | 'updated_at'>): Promise<Category> => {
    const response = await menuApi.post('/api/menu/categories', category);
    return response.data;
  },
};