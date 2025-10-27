"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { queueService } from "@/lib/queue";
import { orderService } from "@/lib/orders";
import { QueueItem, Order, QueueStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QueueTicker } from "./QueueTicker";
import { AnimatedQueueItem } from "./AnimatedQueueItem";
import { EmptyQueueState } from "./EmptyQueueState";
import { QueueNotification } from "./QueueNotification";
import {
  Clock,
  Users,
  Timer,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Coffee,
  User,
  Calendar,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

export function QueueDisplay() {
  const { user } = useAuth();
  const [userQueueItems, setUserQueueItems] = useState<QueueItem[]>([]);
  const [userOrders, setUserOrders] = useState<Record<number, Order>>({});
  const [activeQueue, setActiveQueue] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchQueueData = async () => {
      try {
        setIsLoading(true);

        // Fetch user's active orders with improved error handling
        let activeOrders;
        try {
          activeOrders = await orderService.getUserActiveOrders(user.id);
        } catch (error) {
          console.warn(
            "Active orders API failed, falling back to filtering all orders"
          );
          const allUserOrders = await orderService.getUserOrders(user.id);
          activeOrders = (allUserOrders || []).filter((order) =>
            ["placed", "confirmed", "preparing", "ready"].includes(order.status)
          );
        }

        // Fetch queue items for user's orders
        const userQueuePromises = (activeOrders || []).map(async (order) => {
          try {
            return await queueService.getQueueItem(order.id);
          } catch (error) {
            return null;
          }
        });

        const userQueue = (await Promise.all(userQueuePromises)).filter(
          Boolean
        ) as QueueItem[];

        // Filter out completed orders from user queue
        const activeUserQueue = (userQueue || []).filter(
          (item) => item.status !== "completed"
        );

        // Create orders map for quick lookup
        const ordersMap = activeOrders.reduce((acc, order) => {
          acc[order.id] = order;
          return acc;
        }, {} as Record<number, Order>);

        // Fetch general queue data
        const [allQueueItems, stats] = await Promise.all([
          queueService.getActiveQueue(),
          queueService.getQueueStats(),
        ]);

        // Filter out completed orders from active queue
        const filteredActiveQueue = (allQueueItems || []).filter(
          (item) => item.status !== "completed"
        );

        setUserQueueItems(activeUserQueue);
        setUserOrders(ordersMap);
        setActiveQueue(filteredActiveQueue);
        setQueueStats(stats);
        setLastUpdated(new Date());
      } catch (error) {
        toast.error("Failed to load queue data");
        console.error("Error fetching queue data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueueData();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchQueueData();
    }, 15000); // Update every 15 seconds for better real-time feel

    return () => clearInterval(interval);
  }, [user]);

  const refreshQueue = async () => {
    if (!user) return;

    try {
      // Fetch user's active orders with improved error handling
      let activeOrders;
      try {
        activeOrders = await orderService.getUserActiveOrders(user.id);
      } catch (error) {
        console.warn(
          "Active orders API failed, falling back to filtering all orders"
        );
        const allUserOrders = await orderService.getUserOrders(user.id);
        activeOrders = (allUserOrders || []).filter((order) =>
          ["placed", "confirmed", "preparing", "ready"].includes(order.status)
        );
      }

      const userQueuePromises = (activeOrders || []).map(async (order) => {
        try {
          return await queueService.getQueueItem(order.id);
        } catch (error) {
          return null;
        }
      });

      const userQueue = (await Promise.all(userQueuePromises)).filter(
        Boolean
      ) as QueueItem[];

      // Filter out completed orders from user queue
      const activeUserQueue = (userQueue || []).filter(
        (item) => item.status !== "completed"
      );

      const ordersMap = (activeOrders || []).reduce((acc, order) => {
        acc[order.id] = order;
        return acc;
      }, {} as Record<number, Order>);

      const [allQueueItems, stats] = await Promise.all([
        queueService.getActiveQueue(),
        queueService.getQueueStats(),
      ]);

      // Filter out completed orders from active queue
      const filteredActiveQueue = (allQueueItems || []).filter(
        (item) => item.status !== "completed"
      );

      setUserQueueItems(activeUserQueue);
      setUserOrders(ordersMap);
      setActiveQueue(filteredActiveQueue);
      setQueueStats(stats);
      setLastUpdated(new Date());
      toast.success("Queue updated!");
    } catch (error) {
      toast.error("Failed to refresh queue");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "preparing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "waiting":
        return <Clock className="h-4 w-4" />;
      case "preparing":
        return <Coffee className="h-4 w-4" />;
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateProgress = (queueItem: QueueItem, totalOrders: number) => {
    const position = queueItem.queue_number;
    return Math.max(
      0,
      Math.min(100, ((totalOrders - position + 1) / totalOrders) * 100)
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Queue Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time queue status and order tracking
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={refreshQueue}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <QueueNotification userQueueItems={userQueueItems} />
          </div>
        </div>

        {/* Queue Stats */}
        {queueStats && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Active Orders
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {queueStats.active_orders_count || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Avg Wait Time
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {queueStats.average_wait_time || 0}
                      <span className="text-lg font-normal">min</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Orders Today
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {queueStats.total_orders_today || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Queue Ticker - Shows rotating current orders */}
        {(activeQueue || []).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Now Processing
            </h3>
            <QueueTicker
              queueItems={activeQueue
                .filter((item) => item.status === "preparing")
                .slice(0, 5)}
              className="shadow-lg"
            />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Your Orders Section */}
          <Card
            id="user-orders"
            className="shadow-lg border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
          >
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl flex items-center gap-3">
                <User className="h-6 w-6 text-blue-600" />
                Your Orders
                {(userQueueItems || []).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {(userQueueItems || []).length}
                  </Badge>
                )}
                {(userQueueItems || []).length > 2 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                    Scroll to see all
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userQueueItems.length === 0 ? (
                <EmptyQueueState type="user" />
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {userQueueItems.map((queueItem) => {
                    const order = userOrders[queueItem.order_id];
                    const position = queueItem.queue_number;
                    const totalOrders = queueStats?.active_orders_count || 1;
                    const progress = calculateProgress(queueItem, totalOrders);

                    return (
                      <Card
                        key={queueItem.order_id}
                        className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl font-bold text-blue-600">
                                #{position}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  Order #{queueItem.order_id}
                                </h3>
                                {order && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {order.items.length} items • ₹
                                    {order.total_amount.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge
                              className={`${getStatusColor(
                                queueItem.status
                              )} flex items-center gap-1`}
                            >
                              {getStatusIcon(queueItem.status)}
                              {queueItem.status.charAt(0).toUpperCase() +
                                queueItem.status.slice(1)}
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            {queueItem.estimated_wait_time > 0 && (
                              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                <Timer className="h-4 w-4" />
                                <span>
                                  {queueItem.estimated_wait_time} min remaining
                                </span>
                              </div>
                            )}
                            {order && (
                              <div className="flex items-center gap-2 text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(
                                    order.created_at
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Queue Section */}
          <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Activity className="h-6 w-6 text-green-600" />
                Live Queue
                <Badge variant="secondary" className="ml-2">
                  {
                    activeQueue.filter((item) => item.status !== "completed")
                      .length
                  }{" "}
                  active orders
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeQueue.length === 0 ? (
                <EmptyQueueState type="general" />
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeQueue.slice(0, 20).map((queueItem, index) => (
                    <AnimatedQueueItem
                      key={queueItem.order_id}
                      queueItem={queueItem}
                      index={index}
                    />
                  ))}
                  {activeQueue.length > 20 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        And {activeQueue.length - 20} more orders...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
