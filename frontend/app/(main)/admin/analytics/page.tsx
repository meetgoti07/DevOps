"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  Clock,
  DollarSign,
  Calendar,
  Target,
} from "lucide-react";
import { queueService } from "@/lib/queue";
import { menuService } from "@/lib/menu";
import { QueueStats, MenuItem } from "@/lib/types";
import { toast } from "sonner";

interface AnalyticsData {
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  peakHours: { hour: number; orders: number }[];
  topItems: { item: string; orders: number }[];
  customerSatisfaction: number;
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);

        const [queueData, items] = await Promise.all([
          queueService.getQueueStats(),
          menuService.getMenuItems(),
        ]);

        setQueueStats(queueData);
        setMenuItems(items || []);

        // Calculate analytics from available data
        const mockAnalytics: AnalyticsData = {
          todayOrders: queueData.total_orders_today || 0,
          weekOrders: 156,
          monthOrders: 742,
          totalRevenue: 15240.5,
          avgOrderValue: 20.54,
          peakHours: [
            { hour: 12, orders: 45 },
            { hour: 13, orders: 52 },
            { hour: 18, orders: 38 },
            { hour: 19, orders: 41 },
          ],
          topItems: [
            { item: "Coffee", orders: 234 },
            { item: "Burger", orders: 187 },
            { item: "Pizza", orders: 156 },
            { item: "Sandwich", orders: 142 },
            { item: "Salad", orders: 98 },
          ],
          customerSatisfaction: 4.7,
        };

        setAnalyticsData(mockAnalytics);
      } catch (error) {
        toast.error("Failed to load analytics data");
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: "up" | "down";
    trendValue?: string;
    subtitle?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
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
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Insights and metrics for your canteen operations
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Today's Orders"
            value={analyticsData?.todayOrders || 0}
            icon={ShoppingBag}
            trend="up"
            trendValue="+12% from yesterday"
          />
          <StatCard
            title="This Week"
            value={analyticsData?.weekOrders || 0}
            icon={Calendar}
            trend="up"
            trendValue="+8% from last week"
          />
          <StatCard
            title="Average Order Value"
            value={`₹${analyticsData?.avgOrderValue?.toFixed(2) || "0.00"}`}
            icon={DollarSign}
            trend="up"
            trendValue="+3.2%"
          />
          <StatCard
            title="Customer Rating"
            value={`${analyticsData?.customerSatisfaction || 0}/5`}
            icon={Target}
            trend="up"
            trendValue="+0.2 from last month"
          />
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Order Analytics</TabsTrigger>
            <TabsTrigger value="menu">Menu Performance</TabsTrigger>
            <TabsTrigger value="queue">Queue Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Revenue Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Revenue</span>
                      <span className="font-bold text-lg">
                        ₹{analyticsData?.totalRevenue?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">This Month</span>
                      <span className="font-semibold">₹3,240</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">This Week</span>
                      <span className="font-semibold">₹1,120</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Today</span>
                      <span className="font-semibold">₹340</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Peak Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData?.peakHours.map((hour) => (
                      <div
                        key={hour.hour}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">
                          {hour.hour}:00 - {hour.hour + 1}:00
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(hour.orders / 60) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {hour.orders}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Order Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completed Orders</span>
                      <Badge variant="secondary">1,234</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Orders</span>
                      <Badge variant="default">
                        {queueStats?.active_orders_count || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cancelled Orders</span>
                      <Badge variant="destructive">45</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Completion Time</span>
                      <span className="font-semibold">
                        {queueStats?.average_wait_time || 0} min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monday</span>
                      <span className="font-semibold">142 orders</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tuesday</span>
                      <span className="font-semibold">156 orders</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Wednesday</span>
                      <span className="font-semibold">167 orders</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Thursday</span>
                      <span className="font-semibold">189 orders</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Friday</span>
                      <span className="font-semibold">203 orders</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="menu">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Top Performing Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData?.topItems.map((item, index) => (
                      <div
                        key={item.item}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-sm">{item.item}</span>
                        </div>
                        <span className="font-semibold">
                          {item.orders} orders
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Menu Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Menu Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Menu Items</span>
                      <span className="font-semibold">
                        {(menuItems || []).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Available Items</span>
                      <span className="font-semibold">
                        {
                          (menuItems || []).filter((item) => item.available)
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Unavailable Items</span>
                      <span className="font-semibold">
                        {
                          (menuItems || []).filter((item) => !item.available)
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Item Price</span>
                      <span className="font-semibold">
                        ₹
                        {(menuItems || []).length > 0
                          ? (
                              (menuItems || []).reduce(
                                (sum, item) => sum + item.price,
                                0
                              ) / (menuItems || []).length
                            ).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queue">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Queue Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Queue Performance</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Peak Queue Length</span>
                      <span className="font-semibold">34 orders</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Efficiency Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Efficiency Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Order Fulfillment Rate</span>
                      <Badge variant="default">96.5%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">On-time Delivery</span>
                      <Badge variant="default">94.2%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Customer Satisfaction</span>
                      <Badge variant="default">4.7/5</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Staff Efficiency</span>
                      <Badge variant="default">89%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
