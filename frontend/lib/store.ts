'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '@/lib/types';

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (menuItem: MenuItem, quantity?: number, specialInstructions?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateSpecialInstructions: (menuItemId: string, specialInstructions: string) => void;
  clearCart: () => void;
  calculateTotal: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      addItem: (menuItem: MenuItem, quantity = 1, specialInstructions = '') => {
        const { items } = get();
        const existingItem = items.find(item => item.menuItem._id === menuItem._id);

        if (existingItem) {
          set({
            items: items.map(item =>
              item.menuItem._id === menuItem._id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [...items, { menuItem, quantity, specialInstructions }],
          });
        }

        get().calculateTotal();
      },

      removeItem: (menuItemId: string) => {
        const { items } = get();
        set({
          items: items.filter(item => item.menuItem._id !== menuItemId),
        });
        get().calculateTotal();
      },

      updateQuantity: (menuItemId: string, quantity: number) => {
        const { items } = get();
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        set({
          items: items.map(item =>
            item.menuItem._id === menuItemId
              ? { ...item, quantity }
              : item
          ),
        });
        get().calculateTotal();
      },

      updateSpecialInstructions: (menuItemId: string, specialInstructions: string) => {
        const { items } = get();
        set({
          items: items.map(item =>
            item.menuItem._id === menuItemId
              ? { ...item, specialInstructions }
              : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [], total: 0 });
      },

      calculateTotal: () => {
        const { items } = get();
        const total = items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
        set({ total });
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);