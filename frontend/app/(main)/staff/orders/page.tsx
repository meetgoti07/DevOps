"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  ChefHat,
  Users,
} from "lucide-react";
import { orderService } from "@/lib/orders";
import { Order } from "@/lib/types";
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

const orderStatuses = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        // In a real application, you'd have a staff-specific endpoint to get all orders
        // For now, we'll simulate with empty data since we don't have that endpoint
        setOrders([]);
        setFilteredOrders([]);
      } catch (error) {
        toast.error("Failed to load orders");
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    // Refresh orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = orders || [];

    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter((order) => order.status === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(searchTerm) ||
          order.user_id.toString().includes(searchTerm) ||
          (order.items || []).some((item) =>
            item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    setFilteredOrders(filtered);
  }, [orders, activeTab, searchTerm]);

  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);

      setOrders((prev) =>
        (prev || []).map((order) =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        )
      );

      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status");
      console.error("Error updating order status:", error);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = {
      placed: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
      ready: "completed",
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || null;
  };

  const getStatusCounts = () => {
    return orderStatuses.reduce((acc, status) => {
      acc[status] = (orders || []).filter(
        (order) => order.status === status
      ).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
        <div className="page-container">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all customer orders
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, user ID, or item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All ({(orders || []).length})</TabsTrigger>
            <TabsTrigger value="placed">
              Placed ({statusCounts.placed || 0})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmed ({statusCounts.confirmed || 0})
            </TabsTrigger>
            <TabsTrigger value="preparing">
              Preparing ({statusCounts.preparing || 0})
            </TabsTrigger>
            <TabsTrigger value="ready">
              Ready ({statusCounts.ready || 0})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({statusCounts.completed || 0})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({statusCounts.cancelled || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {(filteredOrders || []).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No orders found
                  </h3>
                  <p className="text-gray-500 text-center">
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : `No ${
                          activeTab === "all" ? "" : activeTab
                        } orders at the moment`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {(filteredOrders || []).map((order) => (
                  <Card
                    key={order.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <CardTitle className="text-lg">
                              Order #{order.id}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              User ID: {order.user_id} •{" "}
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </Badge>

                          <div className="text-right">
                            <p className="font-semibold">
                              ₹{order.total_amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(order.items || []).length} items
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Order Items */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Items:</h4>
                        <div className="grid gap-2">
                          {(order.items || []).map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.quantity}x {item.item_name}
                              </span>
                              <span>₹{item.total_price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {order.special_instructions && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-1">
                            Special Instructions:
                          </h4>
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            {order.special_instructions}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>

                        {getNextStatus(order.status) && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateOrderStatus(
                                order.id,
                                getNextStatus(order.status)!
                              )
                            }
                          >
                            {getNextStatus(order.status) === "confirmed" && (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            {getNextStatus(order.status) === "preparing" && (
                              <ChefHat className="h-4 w-4 mr-2" />
                            )}
                            {getNextStatus(order.status) === "ready" && (
                              <Clock className="h-4 w-4 mr-2" />
                            )}
                            {getNextStatus(order.status) === "completed" && (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Mark as {getNextStatus(order.status)}
                          </Button>
                        )}

                        {order.status !== "completed" &&
                          order.status !== "cancelled" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleUpdateOrderStatus(order.id, "cancelled")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
