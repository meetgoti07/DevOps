"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { orderService } from "@/lib/orders";
import { queueService } from "@/lib/queue";
import { orderStatusSync } from "@/lib/orderStatusSync";
import { Order, QueueItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  MapPin,
  Receipt,
  Eye,
  ShoppingBag,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Coffee,
  Timer,
  RefreshCw,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const getStatusColor = (status: string) => {
  switch (status) {
    case "placed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200";
    case "confirmed":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200";
    case "preparing":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200";
    case "ready":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200";
    case "completed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-200";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "placed":
      return <Receipt className="h-4 w-4" />;
    case "confirmed":
      return <CheckCircle className="h-4 w-4" />;
    case "preparing":
      return <Coffee className="h-4 w-4" />;
    case "ready":
      return <AlertCircle className="h-4 w-4" />;
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "cancelled":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export function OrdersList() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [queuePositions, setQueuePositions] = useState<
    Record<number, QueueItem>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setRefreshing(true);

      // Use the new sync service to get accurate active orders
      const [syncedActiveOrders, allOrders] = await Promise.all([
        orderStatusSync.getUserActiveOrdersWithSync(user.id),
        orderService.getUserOrders(user.id),
      ]);

      setActiveOrders(syncedActiveOrders);
      setAllOrders(allOrders);

      // Fetch queue positions for active orders
      const queuePromises = (syncedActiveOrders || []).map(async (order) => {
        try {
          const queueItem = await queueService.getQueueItem(order.id);
          return { orderId: order.id, queueItem };
        } catch (error) {
          return { orderId: order.id, queueItem: null };
        }
      });

      const queueResults = await Promise.all(queuePromises);
      const queueMap = queueResults.reduce((acc, { orderId, queueItem }) => {
        if (queueItem) {
          acc[orderId] = queueItem;
        }
        return acc;
      }, {} as Record<number, QueueItem>);

      setQueuePositions(queueMap);
    } catch (error) {
      toast.error("Failed to load orders");
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-refresh every 30 seconds for active orders
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const calculateProgress = (order: Order, queueItem?: QueueItem) => {
    const statusOrder = [
      "placed",
      "confirmed",
      "preparing",
      "ready",
      "completed",
    ];
    const currentIndex = statusOrder.indexOf(order.status);
    return Math.max(0, (currentIndex / (statusOrder.length - 1)) * 100);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - orderDate.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const filteredOrders = (orders: Order[]) => {
    return (orders || []).filter((order) => {
      const matchesSearch =
        order.id.toString().includes(searchTerm) ||
        order.items.some((item) =>
          item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const OrderCard = ({ order, index }: { order: Order; index: number }) => {
    const queueItem = queuePositions[order.id];
    const progress = calculateProgress(order, queueItem);
    const isActive = ["placed", "confirmed", "preparing", "ready"].includes(
      order.status
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card
          className={`shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm ${
            isActive ? "border-l-4 border-l-blue-500" : ""
          }`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">
                    Order #{order.id}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="h-4 w-4" />
                    <span>{getTimeAgo(order.created_at)}</span>
                    <span>•</span>
                    <span>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <Badge
                className={`${getStatusColor(
                  order.status
                )} flex items-center gap-1 px-3 py-1`}
              >
                {getStatusIcon(order.status)}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>

            {/* Progress Bar for Active Orders */}
            {isActive && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Order Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Items Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4 text-gray-600" />
                <h4 className="font-semibold">
                  Items ({(order.items || []).length})
                </h4>
              </div>
              <div className="space-y-2">
                {(order.items || []).slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-bold">
                        {item.quantity}
                      </span>
                      <span className="font-medium">{item.item_name}</span>
                    </div>
                    <span className="font-semibold">
                      ₹{item.total_price.toFixed(2)}
                    </span>
                  </div>
                ))}
                {(order.items || []).length > 3 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    +{(order.items || []).length - 3} more items
                  </div>
                )}
              </div>
            </div>

            {/* Queue Position for Active Orders */}
            {queueItem && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      Queue Position
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-lg font-bold text-blue-600 border-blue-300"
                  >
                    #{queueItem.queue_number}
                  </Badge>
                </div>
                {queueItem.estimated_wait_time > 0 && (
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Timer className="h-4 w-4" />
                    <span>
                      Estimated wait: {queueItem.estimated_wait_time} minutes
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Order Total and Special Instructions */}
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Total</span>
                </div>
                <span className="font-bold text-green-600">
                  ₹{order.total_amount.toFixed(2)}
                </span>
              </div>

              {order.special_instructions && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Special Instructions:
                      </span>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        {order.special_instructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/orders/${order.id}`)}
                className="flex-1 bg-white/50 hover:bg-white/80"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>

              {/* Show Track Order button for trackable statuses */}
              {["placed", "confirmed", "preparing", "ready"].includes(
                order.status
              ) && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push("/queue")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Track Order
                </Button>
              )}

              {/* Show different button for completed orders */}
              {order.status === "completed" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.success("Order completed successfully!")}
                  className="bg-green-100 hover:bg-green-200 text-green-800"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </Button>
              )}

              {/* Show different button for cancelled orders */}
              {order.status === "cancelled" && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  className="bg-red-100 text-red-800"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Cancelled
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
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

          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
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
              My Orders
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track and manage your orders
            </p>
          </div>
          <Button
            onClick={() => fetchOrders()}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Active Orders
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {(activeOrders || []).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Orders
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {(allOrders || []).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Spent
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    $
                    {allOrders
                      .reduce((sum, order) => sum + order.total_amount, 0)
                      .toFixed(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Section */}
        <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Order History</CardTitle>
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="placed">Placed</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="active" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Active Orders ({filteredOrders(activeOrders).length})
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  All Orders ({filteredOrders(allOrders).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-6">
                {filteredOrders(activeOrders).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <Coffee className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      No Active Orders
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                      You don't have any active orders at the moment. Browse our
                      delicious menu to place your first order!
                    </p>
                    <Button
                      onClick={() => router.push("/menu")}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Browse Menu
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {filteredOrders(activeOrders).map((order, index) => (
                      <OrderCard key={order.id} order={order} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-6">
                {filteredOrders(allOrders).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <Receipt className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      {searchTerm || statusFilter !== "all"
                        ? "No Orders Found"
                        : "No Orders Yet"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "Start by placing your first order from our delicious menu."}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <Button
                        onClick={() => router.push("/menu")}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        Browse Menu
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {filteredOrders(allOrders).map((order, index) => (
                      <OrderCard key={order.id} order={order} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
