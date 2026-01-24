import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Megaphone,
  Settings,
  DollarSign,
  Activity,
  Star,
  MapPin,
  Sparkles,
  Zap,
  Target,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import {
  format,
  subMonths,
  isAfter,
  subDays,
  startOfYear,
  getMonth,
} from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardStats {
  totalSalons: number;
  activeSalons: number;
  pendingSalons: number;
  totalUsers: number;
  totalOwners: number;
  todayBookings: number;
  weeklyBookings: number;
  monthlyRevenue: number;
  topCities: Array<{ city: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  revenueData: {
    monthly: Array<{ name: string; value: number }>;
    annual: Array<{ name: string; value: number }>;
  };
  popularTreatments: Array<{ name: string; value: number }>;
  customerStats: {
    new: number;
    existing: number;
    total: number;
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
const STATUS_COLORS = {
  new: "#00C49F",
  existing: "#0088FE",
};

export default function AdminDashboardEnhanced() {
  const { stats, refreshStats } = useSuperAdmin();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [bypassMode, setBypassMode] = useState(false);

  useEffect(() => {
    // Auto-enable bypass mode for direct admin access
    const currentUrl = window.location.href;
    if (
      currentUrl.includes("/admin") ||
      currentUrl.includes("direct-admin") ||
      localStorage.getItem("admin-bypass") === "true"
    ) {
      setBypassMode(true);
      localStorage.setItem("admin-bypass", "true");
      console.log("🚀 Auto-bypass mode enabled for direct admin access");
    }

    fetchEnhancedStats();
  }, []);

  const fetchEnhancedStats = async () => {
    try {
      setLoading(true);

      // If in bypass mode, use mock data
      if (bypassMode) {
        const mockStats: DashboardStats = {
          totalSalons: 25,
          activeSalons: 18,
          pendingSalons: 3,
          totalUsers: 150,
          totalOwners: 25,
          todayBookings: 12,
          weeklyBookings: 85,
          monthlyRevenue: 45000,
          topCities: [
            { city: "Mumbai", count: 8 },
            { city: "Delhi", count: 6 },
            { city: "Bangalore", count: 5 },
            { city: "Chennai", count: 3 },
            { city: "Pune", count: 3 },
          ],
          recentActivity: [
            {
              id: "1",
              type: "salon_registration",
              description: 'New salon "Beauty Palace" registered',
              timestamp: new Date().toISOString(),
              status: "pending",
            },
            {
              id: "2",
              type: "booking",
              description: "New booking created",
              timestamp: new Date(
                Date.now() - 2 * 60 * 60 * 1000,
              ).toISOString(),
              status: "confirmed",
            },
            {
              id: "3",
              type: "salon_registration",
              description: 'New salon "Glamour Studio" registered',
              timestamp: new Date(
                Date.now() - 4 * 60 * 60 * 1000,
              ).toISOString(),
              status: "approved",
            },
          ],
          revenueData: {
            monthly: [
              { name: "Jan", value: 4000 },
              { name: "Feb", value: 3000 },
              { name: "Mar", value: 2000 },
              { name: "Apr", value: 2780 },
              { name: "May", value: 1890 },
              { name: "Jun", value: 2390 },
              { name: "Jul", value: 3490 },
            ],
            annual: [
              { name: "2023", value: 25000 },
              { name: "2024", value: 35000 },
              { name: "2025", value: 45000 },
            ],
          },
          popularTreatments: [
            { name: "Haircut", value: 400 },
            { name: "Facial", value: 300 },
            { name: "Manicure", value: 300 },
            { name: "Massage", value: 200 },
          ],
          customerStats: {
            new: 40,
            existing: 110,
            total: 150,
          },
        };

        setDashboardStats(mockStats);
        setLoading(false);
        return;
      }

      // Fetch comprehensive statistics
      const [salonsResult, usersResult, bookingsResult, ownersResult] =
        await Promise.all([
          supabase
            .from("salons")
            .select("id, name, city, approval_status, is_active, created_at"),
          supabase.from("profiles").select("id, created_at"),
          supabase
            .from("bookings")
            .select(
              "id, booking_date, status, created_at, salon_id, services(name, price)",
            ),
          supabase
            .from("user_roles")
            .select("user_id, role")
            .eq("role", "owner"),
        ]);

      const salons = salonsResult.data || [];
      const users = usersResult.data || [];
      const bookings = bookingsResult.data || [];
      const owners = ownersResult.data || [];

      // Calculate date ranges
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfCurrentYear = startOfYear(today);

      // --- Revenue Calculation ---
      const monthlyRevenueMap = new Map<string, number>();
      const annualRevenueMap = new Map<string, number>();
      const treatmentCountMap = new Map<string, number>();

      let currentMonthRevenue = 0;

      bookings.forEach((booking: any) => {
        const date = new Date(booking.booking_date);
        const monthKey = format(date, "MMM");
        const yearKey = format(date, "yyyy");
        const price = booking.services?.price || 0;
        const serviceName = booking.services?.name || "Unknown";

        // Filter valid bookings for revenue
        if (["confirmed", "completed"].includes(booking.status)) {
          // Monthly Revenue (for current year)
          if (isAfter(date, startOfCurrentYear)) {
            monthlyRevenueMap.set(
              monthKey,
              (monthlyRevenueMap.get(monthKey) || 0) + price,
            );
          }

          // Annual Revenue
          annualRevenueMap.set(
            yearKey,
            (annualRevenueMap.get(yearKey) || 0) + price,
          );

          // Current Month Revenue
          if (format(date, "yyyy-MM") === format(today, "yyyy-MM")) {
            currentMonthRevenue += price;
          }
        }

        // Popular Treatments (All time or recent? All time for now)
        treatmentCountMap.set(
          serviceName,
          (treatmentCountMap.get(serviceName) || 0) + 1,
        );
      });

      // Format Revenue Data
      const revenueData = {
        monthly: Array.from(monthlyRevenueMap.entries()).map(
          ([name, value]) => ({ name, value }),
        ),
        annual: Array.from(annualRevenueMap.entries()).map(([name, value]) => ({
          name,
          value,
        })),
      };

      // Format Popular Treatments
      const popularTreatments = Array.from(treatmentCountMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

      // --- Customer Stats ---
      const startOfCurrentMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      const newCustomers = users.filter(
        (u) => new Date(u.created_at) >= startOfCurrentMonth,
      ).length;
      const totalCustomers = users.length;
      const existingCustomers = totalCustomers - newCustomers;

      const customerStats = {
        new: newCustomers,
        existing: existingCustomers,
        total: totalCustomers,
      };

      // Calculate statistics
      const todayBookings = bookings.filter((b) =>
        b.created_at?.startsWith(todayStr),
      ).length;

      const weeklyBookings = bookings.filter(
        (b) => new Date(b.created_at) >= weekAgo,
      ).length;

      // Calculate top cities
      const cityCount = salons.reduce(
        (acc, salon) => {
          if (salon.city) {
            acc[salon.city] = (acc[salon.city] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      const topCities = Object.entries(cityCount)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Generate recent activity
      const recentActivity = [
        ...salons.slice(-5).map((salon) => ({
          id: salon.id,
          type: "salon_registration",
          description: `New salon "${salon.name}" registered`,
          timestamp: salon.created_at,
          status: salon.approval_status,
        })),
        ...bookings.slice(-5).map((booking: any) => ({
          id: booking.id,
          type: "booking",
          description: `New booking for ${booking.services?.name || "Service"}`,
          timestamp: booking.created_at,
          status: booking.status,
        })),
        ...users.slice(-5).map((user) => ({
          id: user.id,
          type: "new_user",
          description: "New customer joined",
          timestamp: user.created_at,
          status: "active",
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 10);

      setDashboardStats({
        totalSalons: salons.length,
        activeSalons: salons.filter(
          (s) => s.is_active && s.approval_status === "approved",
        ).length,
        pendingSalons: salons.filter((s) => s.approval_status === "pending")
          .length,
        totalUsers: users.length,
        totalOwners: new Set(owners.map((o) => o.user_id)).size,
        todayBookings,
        weeklyBookings,
        monthlyRevenue: currentMonthRevenue,
        topCities,
        recentActivity,
        revenueData,
        popularTreatments,
        customerStats,
      });
    } catch (error) {
      console.error("Error fetching enhanced stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "salon_registration":
        return <Building2 className="h-4 w-4" />;
      case "booking":
        return <Calendar className="h-4 w-4" />;
      case "new_user":
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "confirmed":
      case "completed":
      case "active":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "rejected":
      case "cancelled":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-black p-10 text-white shadow-2xl border border-white/5">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/30 blur-[100px]"></div>
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/30 blur-[100px]"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-400 text-lg">
                    Overview & Performance
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={fetchEnhancedStats}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Glassmorphism Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl hover:bg-white/10 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-300">
                    Total Salons
                  </p>
                  <p className="text-4xl font-bold text-white tracking-tight">
                    {dashboardStats?.totalSalons || 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden w-24">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${((dashboardStats?.activeSalons || 0) / (dashboardStats?.totalSalons || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-blue-300">
                      {Math.round(
                        ((dashboardStats?.activeSalons || 0) /
                          (dashboardStats?.totalSalons || 1)) *
                          100,
                      )}
                      % active
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl hover:bg-white/10 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-300">
                    Total Users
                  </p>
                  <p className="text-4xl font-bold text-white tracking-tight">
                    {dashboardStats?.totalUsers || 0}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-green-300/80">
                    <Users className="h-4 w-4" />
                    <span>{dashboardStats?.totalOwners || 0} owners</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl hover:bg-white/10 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-purple-300">
                    Weekly Bookings
                  </p>
                  <p className="text-4xl font-bold text-white tracking-tight">
                    {dashboardStats?.weeklyBookings || 0}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-300/80">
                    <TrendingUp className="h-4 w-4" />
                    <span>{dashboardStats?.todayBookings || 0} today</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl hover:bg-white/10 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-300">
                    Est. Revenue
                  </p>
                  <p className="text-4xl font-bold text-white tracking-tight">
                    ₹{dashboardStats?.monthlyRevenue?.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-2">
                    {(dashboardStats?.pendingSalons || 0) > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-red-500/50 text-red-400 bg-red-500/10"
                      >
                        {dashboardStats?.pendingSalons} pending
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-green-500/50 text-green-400 bg-green-500/10"
                      >
                        All Clear
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Combined Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart - Spans 2 Columns */}
          <Card className="lg:col-span-2 border border-white/10 bg-gradient-to-b from-gray-800 to-gray-900/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <Tabs defaultValue="monthly" className="w-full">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <DollarSign className="h-5 w-5 text-blue-400" />
                      </div>
                      <CardTitle className="text-white text-xl tracking-tight">
                        Revenue Analytics
                      </CardTitle>
                    </div>
                    <CardDescription className="text-gray-400 mt-1 ml-1 flex items-center gap-2">
                      Financial performance overview
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                        <TrendingUp className="w-3 h-3 mr-1" /> +12.5% this
                        month
                      </span>
                    </CardDescription>
                  </div>
                  <TabsList className="grid w-full sm:w-[240px] grid-cols-2 bg-black/20 border border-white/5 p-1 h-auto rounded-xl">
                    <TabsTrigger
                      value="monthly"
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all duration-300 py-2 text-xs"
                    >
                      Monthly
                    </TabsTrigger>
                    <TabsTrigger
                      value="annual"
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all duration-300 py-2 text-xs"
                    >
                      Annual
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="monthly" className="mt-6 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dashboardStats?.revenueData?.monthly || []}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1f2937"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(17, 24, 39, 0.9)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "#fff",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                          backdropFilter: "blur(12px)",
                        }}
                        itemStyle={{ color: "#e5e7eb" }}
                        cursor={{
                          stroke: "rgba(59, 130, 246, 0.5)",
                          strokeWidth: 1,
                          strokeDasharray: "5 5",
                        }}
                        formatter={(value: number) => [
                          `₹${value.toLocaleString()}`,
                          "Revenue",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: "#60a5fa" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="annual" className="mt-6 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardStats?.revenueData?.annual || []}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1f2937"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(17, 24, 39, 0.9)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "#fff",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                          backdropFilter: "blur(12px)",
                        }}
                        cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                        formatter={(value: number) => [
                          `₹${value.toLocaleString()}`,
                          "Revenue",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        radius={[6, 6, 0, 0]}
                        barSize={60}
                      >
                        {dashboardStats?.revenueData?.annual.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index ===
                                dashboardStats.revenueData.annual.length - 1
                                  ? "#8b5cf6"
                                  : "#6366f1"
                              }
                              opacity={
                                index ===
                                dashboardStats.revenueData.annual.length - 1
                                  ? 1
                                  : 0.7
                              }
                            />
                          ),
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Customer Ratio - Spans 1 Column */}
          <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-xl">
                Customer Ratio
              </CardTitle>
              <CardDescription className="text-gray-400">
                New vs Returning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "New",
                          value: dashboardStats?.customerStats?.new || 0,
                        },
                        {
                          name: "Existing",
                          value: dashboardStats?.customerStats?.existing || 0,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {[
                        {
                          name: "New",
                          value: dashboardStats?.customerStats?.new || 0,
                        },
                        {
                          name: "Existing",
                          value: dashboardStats?.customerStats?.existing || 0,
                        },
                      ].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? STATUS_COLORS.new
                              : STATUS_COLORS.existing
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {dashboardStats?.customerStats?.total || 0}
                    </p>
                    <p className="text-xs text-gray-400">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS.new }}
                  ></div>
                  <div>
                    <p className="text-lg font-bold text-white leading-none">
                      {dashboardStats?.customerStats?.new || 0}
                    </p>
                    <p className="text-xs text-gray-400">New</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS.existing }}
                  ></div>
                  <div>
                    <p className="text-lg font-bold text-white leading-none">
                      {dashboardStats?.customerStats?.existing || 0}
                    </p>
                    <p className="text-xs text-gray-400">Existing</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Treatments & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Popular Treatments */}
          <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                Top Treatments
              </CardTitle>
              <CardDescription className="text-gray-400">
                Most requested services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dashboardStats?.popularTreatments?.map((treatment, index) => (
                  <div key={treatment.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${index === 0 ? "bg-yellow-500/20 text-yellow-500" : index === 1 ? "bg-gray-400/20 text-gray-400" : index === 2 ? "bg-orange-700/20 text-orange-600" : "bg-gray-800 text-gray-500"}`}
                        >
                          #{index + 1}
                        </div>
                        <span className="font-medium text-white">
                          {treatment.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400 font-mono">
                        {treatment.value}
                      </span>
                    </div>
                    <Progress
                      value={
                        (treatment.value /
                          (dashboardStats?.popularTreatments?.[0]?.value ||
                            1)) *
                        100
                      }
                      className="h-1.5 bg-gray-800"
                    />
                  </div>
                ))}
                {!dashboardStats?.popularTreatments?.length && (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-gray-600" />
                    </div>
                    <p className="text-gray-500">No data available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Activity Feed */}
          <Card className="lg:col-span-2 border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">
                      Live Activity
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Real-time platform updates
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live Updates
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {dashboardStats?.recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                    <Activity className="h-12 w-12 mb-3 opacity-20" />
                    <p>No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {dashboardStats?.recentActivity.map((activity, index) => (
                      <div
                        key={activity.id + index}
                        className="flex items-start gap-4 p-5 hover:bg-white/5 transition-colors"
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                            activity.type === "new_user"
                              ? "bg-blue-500/20 text-blue-400"
                              : activity.type === "booking"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm font-medium text-white">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(
                              new Date(activity.timestamp),
                              "MMM d, h:mm a",
                            )}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(activity.status)} border-current bg-transparent`}
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Cities */}
          <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl hover:bg-white/10 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Top Cities</CardTitle>
                  <CardDescription className="text-gray-400">
                    Highest performing locations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats?.topCities.map((city, index) => (
                  <div
                    key={city.city}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-white">
                        {city.city}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                    >
                      {city.count} salons
                    </Badge>
                  </div>
                ))}
                {(!dashboardStats?.topCities ||
                  dashboardStats.topCities.length === 0) && (
                  <div className="text-center text-gray-500 py-6">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No location data</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl hover:bg-white/10 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-400">
                    Management shortcuts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-white/5 border-white/10 hover:bg-blue-600/20 hover:border-blue-500/50 transition-all group"
                  asChild
                >
                  <Link to="/admin/salons?status=pending">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Clock className="h-4 w-4 text-blue-400 group-hover:text-white" />
                    </div>
                    <span className="text-white">Review Pending</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-white/5 border-white/10 hover:bg-purple-600/20 hover:border-purple-500/50 transition-all group"
                  asChild
                >
                  <Link to="/admin/reports">
                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <BarChart3 className="h-4 w-4 text-purple-400 group-hover:text-white" />
                    </div>
                    <span className="text-white">Analytics</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-white/5 border-white/10 hover:bg-pink-600/20 hover:border-pink-500/50 transition-all group"
                  asChild
                >
                  <Link to="/admin/marketing">
                    <div className="h-8 w-8 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-colors">
                      <Megaphone className="h-4 w-4 text-pink-400 group-hover:text-white" />
                    </div>
                    <span className="text-white">Promotions</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-white/5 border-white/10 hover:bg-gray-600/20 hover:border-gray-500/50 transition-all group"
                  asChild
                >
                  <Link to="/admin/settings">
                    <div className="h-8 w-8 rounded-full bg-gray-500/20 flex items-center justify-center group-hover:bg-gray-500 group-hover:text-white transition-colors">
                      <Settings className="h-4 w-4 text-gray-400 group-hover:text-white" />
                    </div>
                    <span className="text-white">Settings</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
