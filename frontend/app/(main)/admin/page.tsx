"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Users,
  ShoppingBag,
  Clock,
  TrendingUp,
  DollarSign,
  ChefHat,
  AlertCircle,
} from "lucide-react";
import { orderService } from "@/lib/orders";
import { queueService } from "@/lib/queue";
import { menuService } from "@/lib/menu";
import { Order, QueueStats, MenuItem } from "@/lib/types";
import { toast } from "sonner";

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageWaitTime: number;
  totalMenuItems: number;
  availableMenuItems: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // This is a simplified approach since we don't have dedicated admin endpoints
        // In a real application, you'd have proper admin API endpoints
        const [menuItems, queueData] = await Promise.all([
          menuService.getMenuItems(),
          queueService.getQueueStats(),
        ]);

        // Calculate basic stats from available data
        const dashboardStats: DashboardStats = {
          totalOrders: 0, // Would come from admin endpoint
          todayOrders: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          activeOrders: queueData.active_orders_count || 0,
          completedOrders: 0,
          cancelledOrders: 0,
          averageWaitTime: queueData.average_wait_time || 0,
          totalMenuItems: (menuItems || []).length,
          availableMenuItems: (menuItems || []).filter((item) => item.available)
            .length,
        };

        setStats(dashboardStats);
        setQueueStats(queueData);
        setRecentOrders([]); // Would fetch recent orders from admin endpoint
      } catch (error) {
        toast.error("Failed to load dashboard data");
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: "up" | "down";
    trendValue?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && trendValue && (
              <div
                className={`flex items-center text-sm ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp
                  className={`h-4 w-4 mr-1 ${
                    trend === "down" ? "rotate-180" : ""
                  }`}
                />
                {trendValue}
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <div className="page-container">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
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
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your canteen operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Active Orders"
            value={stats?.activeOrders || 0}
            icon={ShoppingBag}
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Today's Orders"
            value={stats?.todayOrders || 0}
            icon={Clock}
            trend="up"
            trendValue="+8%"
          />
          <StatCard
            title="Average Wait Time"
            value={`${stats?.averageWaitTime || 0}m`}
            icon={Clock}
            trend="down"
            trendValue="-5%"
          />
          <StatCard
            title="Menu Items"
            value={`${stats?.availableMenuItems}/${stats?.totalMenuItems}`}
            icon={ChefHat}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="queue">Queue Management</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Order Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Orders</span>
                      <Badge variant="default">
                        {stats?.activeOrders || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completed Today</span>
                      <Badge variant="secondary">
                        {stats?.completedOrders || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cancelled</span>
                      <Badge variant="destructive">
                        {stats?.cancelledOrders || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Queue Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Queue Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Orders in Queue</span>
                      <span className="font-semibold">
                        {queueStats?.active_orders_count || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Wait Time</span>
                      <span className="font-semibold">
                        {queueStats?.average_wait_time || 0} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Today's Total</span>
                      <span className="font-semibold">
                        {queueStats?.total_orders_today || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {(recentOrders || []).length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No recent orders available
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Order data will appear here as they come in
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(recentOrders || []).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {(order.items || []).length} items • $
                            {order.total_amount}
                          </p>
                        </div>
                        <Badge>{order.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <CardTitle>Queue Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current Queue Length</span>
                      <span className="font-semibold">
                        {queueStats?.active_orders_count || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Wait Time</span>
                      <span className="font-semibold">
                        {queueStats?.average_wait_time || 0} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Orders Processed Today</span>
                      <span className="font-semibold">
                        {queueStats?.total_orders_today || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button asChild size="lg" className="w-full">
                      <a href="/staff/queue">Go to Queue Management</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {queueStats && queueStats.average_wait_time > 30 && (
                    <div className="flex items-start space-x-3 p-4 border-l-4 border-yellow-500 bg-yellow-50">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">
                          High Wait Time
                        </p>
                        <p className="text-sm text-yellow-700">
                          Current average wait time is{" "}
                          {queueStats.average_wait_time} minutes
                        </p>
                      </div>
                    </div>
                  )}

                  {stats &&
                    stats.availableMenuItems < stats.totalMenuItems * 0.8 && (
                      <div className="flex items-start space-x-3 p-4 border-l-4 border-red-500 bg-red-50">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-800">
                            Low Menu Availability
                          </p>
                          <p className="text-sm text-red-700">
                            Only {stats.availableMenuItems} out of{" "}
                            {stats.totalMenuItems} menu items are available
                          </p>
                        </div>
                      </div>
                    )}

                  {(!queueStats || queueStats.active_orders_count === 0) && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No active alerts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
