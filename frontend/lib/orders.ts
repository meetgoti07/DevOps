import { orderApi } from "./api";
import { Order, CreateOrderRequest } from "./types";

export const orderService = {
  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    const response = await orderApi.post("/api/orders/", orderData);
    return response.data;
  },

  getOrder: async (orderId: number): Promise<Order> => {
    const response = await orderApi.get(`/api/orders/${orderId}`);
    return response.data;
  },

  getUserOrders: async (userId: number, status?: string): Promise<Order[]> => {
    const params = status ? { status } : {};
    const response = await orderApi.get(`/api/orders/user/${userId}`, {
      params,
    });
    return response.data;
  },

  getUserActiveOrders: async (userId: number): Promise<Order[]> => {
    // Get all orders and filter for active statuses to ensure consistency
    try {
      const response = await orderApi.get(`/api/orders/user/${userId}/active`);
      return response.data;
    } catch (error) {
      // Fallback: get all orders and filter locally
      console.warn(
        "Active orders endpoint failed, falling back to filtering all orders"
      );
      const allOrders = await orderService.getUserOrders(userId);
      return allOrders.filter((order) =>
        ["placed", "confirmed", "preparing", "ready"].includes(order.status)
      );
    }
  },

  getAllUserActiveOrders: async (userId: number): Promise<Order[]> => {
    // Alternative method to get active orders by filtering locally
    const allOrders = await orderService.getUserOrders(userId);
    return allOrders.filter((order) =>
      ["placed", "confirmed", "preparing", "ready"].includes(order.status)
    );
  },

  updateOrderStatus: async (
    orderId: number,
    status: string
  ): Promise<Order> => {
    const response = await orderApi.put(`/api/orders/${orderId}/status/`, {
      status,
    });
    return response.data;
  },

  refreshOrderStatus: async (orderId: number): Promise<Order> => {
    // Force refresh a specific order to get latest status
    const response = await orderApi.get(`/api/orders/${orderId}?refresh=true`);
    return response.data;
  },
};
