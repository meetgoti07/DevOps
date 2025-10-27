"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ChefHat,
  Users,
  Timer,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { orderService } from "@/lib/orders";
import { queueService } from "@/lib/queue";
import { Order, QueueItem, QueueStats } from "@/lib/types";
import { toast } from "sonner";

const getStatusColor = (status: string) => {
  switch (status) {
    case "placed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "confirmed":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "preparing":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "ready":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "completed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function StaffDashboard() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [queue, stats] = await Promise.all([
          queueService.getActiveQueue(),
          queueService.getQueueStats(),
        ]);

        setQueueItems(queue || []);
        setQueueStats(stats);

        // For now, we'll simulate active orders since we don't have a staff-specific endpoint
        // In a real application, you'd have proper staff endpoints
        setActiveOrders([]);
      } catch (error) {
        toast.error("Failed to load staff dashboard data");
        console.error("Error fetching staff data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 15 seconds for real-time updates
    const interval = setInterval(fetchData, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);

      // Update local state
      setActiveOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        )
      );

      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status");
      console.error("Error updating order status:", error);
    }
  };

  const handleUpdateQueueStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    try {
      await queueService.updateQueueStatus(orderId, newStatus);

      // Update local state
      setQueueItems((prev) =>
        (prev || []).map((item) =>
          item.order_id === orderId
            ? { ...item, status: newStatus as any }
            : item
        )
      );

      toast.success(`Queue item #${orderId} status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update queue status");
      console.error("Error updating queue status:", error);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
        <div className="page-container">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage orders and queue efficiently
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Orders in Queue
                  </p>
                  <p className="text-2xl font-bold">
                    {queueStats?.active_orders_count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                  <p className="text-2xl font-bold">
                    {queueStats?.average_wait_time || 0}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Today's Orders
                  </p>
                  <p className="text-2xl font-bold">
                    {queueStats?.total_orders_today || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="queue">Active Queue</TabsTrigger>
            <TabsTrigger value="orders">Order Management</TabsTrigger>
            <TabsTrigger value="kitchen">Kitchen Display</TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <CardTitle>
                  Active Queue ({(queueItems || []).length} orders)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(queueItems || []).length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders in queue</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(queueItems || []).slice(0, 10).map((item) => (
                      <div
                        key={item.order_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              #{item.queue_number}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Queue
                            </div>
                          </div>

                          <div>
                            <p className="font-medium">
                              Order #{item.order_id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              User ID: {item.user_id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Wait: {item.estimated_wait_time}m
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.charAt(0).toUpperCase() +
                              item.status.slice(1)}
                          </Badge>

                          <div className="flex gap-2">
                            {item.status === "waiting" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateQueueStatus(
                                    item.order_id,
                                    "preparing"
                                  )
                                }
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            )}

                            {item.status === "preparing" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateQueueStatus(
                                    item.order_id,
                                    "ready"
                                  )
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Ready
                              </Button>
                            )}

                            {item.status === "ready" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  handleUpdateQueueStatus(
                                    item.order_id,
                                    "completed"
                                  )
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Order management tools
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Advanced order management features will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kitchen">
            <Card>
              <CardHeader>
                <CardTitle>Kitchen Display System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(queueItems || [])
                    .filter((item) => item.status === "preparing")
                    .map((item) => (
                      <Card
                        key={item.order_id}
                        className="border-l-4 border-l-yellow-500"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Order #{item.order_id}
                            </CardTitle>
                            <Badge variant="secondary">Preparing</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Queue Position: #{item.queue_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Started:{" "}
                              {new Date(item.created_at).toLocaleTimeString()}
                            </p>
                            <Button
                              className="w-full mt-4"
                              onClick={() =>
                                handleUpdateQueueStatus(item.order_id, "ready")
                              }
                            >
                              Mark as Ready
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {(queueItems || []).filter(
                  (item) => item.status === "preparing"
                ).length === 0 && (
                  <div className="text-center py-8">
                    <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No orders currently being prepared
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
