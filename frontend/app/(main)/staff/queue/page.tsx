"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Search,
  RefreshCw,
  Users,
  Timer,
  TrendingUp,
} from "lucide-react";
import { queueService } from "@/lib/queue";
import { QueueItem, QueueStats } from "@/lib/types";
import { toast } from "sonner";

const getStatusColor = (status: string) => {
  switch (status) {
    case "waiting":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "preparing":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "ready":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "completed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function StaffQueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQueueData = async (showRefreshIcon = false) => {
    try {
      if (showRefreshIcon) setIsRefreshing(true);

      const [queue, stats] = await Promise.all([
        queueService.getActiveQueue(),
        queueService.getQueueStats(),
      ]);

      // Handle empty or null queue data
      const safeQueue = queue || [];
      const safeStats = stats || {
        active_orders_count: 0,
        average_wait_time: 0,
        total_orders_today: 0,
      };

      // Add position property for display
      const queueWithPositions = safeQueue.map((item, index) => ({
        ...item,
        position: item.queue_number || index + 1,
      }));

      setQueueItems(queueWithPositions);
      setQueueStats(safeStats);
    } catch (error) {
      toast.error("Failed to load queue data");
      console.error("Error fetching queue data:", error);
    } finally {
      setIsLoading(false);
      if (showRefreshIcon) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueueData();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => fetchQueueData(), 10000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateQueueStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    try {
      await queueService.updateQueueStatus(orderId, newStatus);

      setQueueItems((prev) =>
        prev.map((item) =>
          item.order_id === orderId
            ? { ...item, status: newStatus as any }
            : item
        )
      );

      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update queue status");
      console.error("Error updating queue status:", error);
    }
  };

  const handleRemoveFromQueue = async (orderId: number) => {
    try {
      await queueService.removeFromQueue(orderId);

      setQueueItems((prev) => prev.filter((item) => item.order_id !== orderId));

      toast.success(`Order #${orderId} removed from queue`);
    } catch (error) {
      toast.error("Failed to remove order from queue");
      console.error("Error removing from queue:", error);
    }
  };

  const filteredQueueItems = queueItems.filter(
    (item) =>
      item.order_id.toString().includes(searchTerm) ||
      item.user_id.toString().includes(searchTerm)
  );

  const getStatusGroups = () => {
    return {
      waiting: filteredQueueItems.filter((item) => item.status === "waiting"),
      preparing: filteredQueueItems.filter(
        (item) => item.status === "preparing"
      ),
      ready: filteredQueueItems.filter((item) => item.status === "ready"),
    };
  };

  const statusGroups = getStatusGroups();

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Queue Management</h1>
              <p className="text-muted-foreground mt-2">
                Monitor and manage the order queue in real-time
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => fetchQueueData(true)}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total in Queue
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
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Today's Total</p>
                  <p className="text-2xl font-bold">
                    {queueStats?.total_orders_today || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Queue Management Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="waiting">
              Waiting ({statusGroups.waiting.length})
            </TabsTrigger>
            <TabsTrigger value="preparing">
              Preparing ({statusGroups.preparing.length})
            </TabsTrigger>
            <TabsTrigger value="ready">
              Ready ({statusGroups.ready.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Waiting Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Waiting ({statusGroups.waiting.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {statusGroups.waiting.slice(0, 5).map((item) => (
                      <div
                        key={item.order_id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">#{item.queue_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Order {item.order_id}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateQueueStatus(item.order_id, "preparing")
                          }
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {statusGroups.waiting.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No waiting orders
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preparing Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-yellow-600" />
                    Preparing ({statusGroups.preparing.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {statusGroups.preparing.slice(0, 5).map((item) => (
                      <div
                        key={item.order_id}
                        className="flex items-center justify-between p-3 border rounded border-l-4 border-l-yellow-500"
                      >
                        <div>
                          <p className="font-medium">#{item.queue_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Order {item.order_id}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleUpdateQueueStatus(item.order_id, "ready")
                          }
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {statusGroups.preparing.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No orders being prepared
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ready Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Ready ({statusGroups.ready.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {statusGroups.ready.slice(0, 5).map((item) => (
                      <div
                        key={item.order_id}
                        className="flex items-center justify-between p-3 border rounded border-l-4 border-l-green-500"
                      >
                        <div>
                          <p className="font-medium">#{item.queue_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Order {item.order_id}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleUpdateQueueStatus(item.order_id, "completed")
                          }
                        >
                          Complete
                        </Button>
                      </div>
                    ))}
                    {statusGroups.ready.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No ready orders
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {["waiting", "preparing", "ready"].map((status) => (
            <TabsContent key={status} value={status}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{status} Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusGroups[status as keyof typeof statusGroups].length ===
                  0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No {status} orders
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {statusGroups[status as keyof typeof statusGroups].map(
                        (item) => (
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
                                  Wait: {item.estimated_wait_time}m • Added:{" "}
                                  {new Date(
                                    item.created_at
                                  ).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(item.status)}>
                                {item.status.charAt(0).toUpperCase() +
                                  item.status.slice(1)}
                              </Badge>

                              <div className="flex gap-2">
                                {status === "waiting" && (
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

                                {status === "preparing" && (
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

                                {status === "ready" && (
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
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
