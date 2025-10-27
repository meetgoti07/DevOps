import { orderService } from "./orders";
import { queueService } from "./queue";
import { Order, QueueItem } from "./types";

export class OrderStatusSync {
  /**
   * Sync order status from queue to order service
   */
  static async syncOrderStatusFromQueue(
    orderId: number
  ): Promise<Order | null> {
    try {
      // Get queue item status
      const queueItem = await queueService.getQueueItem(orderId);

      // Get current order
      const order = await orderService.getOrder(orderId);

      // Map queue status to order status if they differ
      const queueToOrderStatusMap: Record<string, string> = {
        waiting: "confirmed",
        preparing: "preparing",
        ready: "ready",
        completed: "completed",
      };

      const expectedOrderStatus = queueToOrderStatusMap[queueItem.status];

      if (expectedOrderStatus && order.status !== expectedOrderStatus) {
        console.log(
          `Syncing order ${orderId} status: ${order.status} -> ${expectedOrderStatus}`
        );
        return await orderService.updateOrderStatus(
          orderId,
          expectedOrderStatus
        );
      }

      return order;
    } catch (error) {
      console.error(`Failed to sync order ${orderId} status:`, error);
      return null;
    }
  }

  /**
   * Sync multiple orders with their queue status
   */
  static async syncMultipleOrdersFromQueue(
    orderIds: number[]
  ): Promise<Order[]> {
    const syncPromises = orderIds.map((id) =>
      this.syncOrderStatusFromQueue(id)
    );
    const results = await Promise.all(syncPromises);
    return results.filter((order) => order !== null) as Order[];
  }

  /**
   * Get the most up-to-date order information by checking both services
   */
  static async getOrderWithLatestStatus(
    orderId: number
  ): Promise<Order | null> {
    try {
      // Try to sync first
      const syncedOrder = await this.syncOrderStatusFromQueue(orderId);

      if (syncedOrder) {
        return syncedOrder;
      }

      // Fallback to just getting the order
      return await orderService.getOrder(orderId);
    } catch (error) {
      console.error(
        `Failed to get order ${orderId} with latest status:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if an order is truly active by checking both services
   */
  static async isOrderActive(orderId: number): Promise<boolean> {
    try {
      const [order, queueItem] = await Promise.all([
        orderService.getOrder(orderId).catch(() => null),
        queueService.getQueueItem(orderId).catch(() => null),
      ]);

      // If order exists and is in active status
      const activeOrderStatuses = ["placed", "confirmed", "preparing", "ready"];
      const orderIsActive = order && activeOrderStatuses.includes(order.status);

      // If queue item exists and is not completed
      const queueIsActive = queueItem && queueItem.status !== "completed";

      // Order is active if either service considers it active
      return !!(orderIsActive || queueIsActive);
    } catch (error) {
      console.error(`Failed to check if order ${orderId} is active:`, error);
      return false;
    }
  }

  /**
   * Get all truly active orders for a user by cross-referencing both services
   */
  static async getUserActiveOrdersWithSync(userId: number): Promise<Order[]> {
    try {
      // Get orders from order service
      const ordersFromService = await orderService
        .getUserActiveOrders(userId)
        .catch(() => []);

      // Get all user orders as fallback
      const allOrders = await orderService
        .getUserOrders(userId)
        .catch(() => []);

      // Filter locally for active orders
      const activeOrdersLocal = allOrders.filter((order) =>
        ["placed", "confirmed", "preparing", "ready"].includes(order.status)
      );

      // Combine and deduplicate
      const allPotentialActive = [...ordersFromService, ...activeOrdersLocal];
      const uniqueOrders = allPotentialActive.reduce((acc, order) => {
        if (!acc.find((existing) => existing.id === order.id)) {
          acc.push(order);
        }
        return acc;
      }, [] as Order[]);

      // Sync each order with queue status
      const syncPromises = uniqueOrders.map(async (order) => {
        const syncedOrder = await this.syncOrderStatusFromQueue(order.id);
        return syncedOrder || order;
      });

      const syncedOrders = await Promise.all(syncPromises);

      // Final filter for truly active orders
      return syncedOrders.filter((order) =>
        ["placed", "confirmed", "preparing", "ready"].includes(order.status)
      );
    } catch (error) {
      console.error("Failed to get user active orders with sync:", error);
      // Fallback to basic method
      return await orderService.getUserActiveOrders(userId).catch(() => []);
    }
  }
}

export const orderStatusSync = OrderStatusSync;
