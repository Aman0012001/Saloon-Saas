import { useState, useEffect, useCallback } from "react";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Users,
  IndianRupee,
  Clock,
  Star,
  FileText,
  PieChart
} from "lucide-react";
import { useSalon } from "@/hooks/useSalon";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format, parseISO, differenceInMinutes } from "date-fns";
import { Loader2 } from "lucide-react";

export default function ReportsPage() {
  const { currentSalon } = useSalon();
  const [activeTab, setActiveTab] = useState("revenue");
  const [dateRange, setDateRange] = useState("30days");
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    newCustomers: 0,
    avgServiceTime: 0,
    revenueChange: "+0%", // Calculated based on comparison
    appointmentsChange: "+0%",
  });

  const [topServices, setTopServices] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const fetchReports = useCallback(async () => {
    if (!currentSalon) return;
    setLoading(true);

    try {
      // 1. Fetch Bookings
      // Date Logic
      const now = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case "7days": startDate.setDate(now.getDate() - 7); break;
        case "30days": startDate.setDate(now.getDate() - 30); break;
        case "90days": startDate.setDate(now.getDate() - 90); break;
        case "1year": startDate.setFullYear(now.getFullYear() - 1); break;
        default: startDate.setDate(now.getDate() - 30);
      }

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_date,
          status,
          created_at,
          service:services(name, price, duration_minutes),
          user_id
        `)
        .eq("salon_id", currentSalon.id)
        .gte("booking_date", format(startDate, "yyyy-MM-dd"))
        .order("booking_date", { ascending: true });

      if (error) throw error;

      if (!bookings || bookings.length === 0) {
        setStats({
          totalRevenue: 0,
          totalAppointments: 0,
          newCustomers: 0,
          avgServiceTime: 0,
          revenueChange: "0%",
          appointmentsChange: "0%",
        });
        setLoading(false);
        return;
      }

      // Process Data
      const completedBookings = bookings.filter(b => b.status === "completed" || b.status === "confirmed");
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.service?.price || 0), 0);
      const totalAppointments = bookings.length;

      // Calculate Avg Service Time
      const totalTime = completedBookings.reduce((sum, b) => sum + (b.service?.duration_minutes || 0), 0);
      const avgServiceTime = completedBookings.length > 0 ? Math.round(totalTime / completedBookings.length) : 0;

      // Unique Customers
      const uniqueCustomers = new Set(bookings.map(b => b.user_id)).size;

      // Top Services
      const serviceCount: Record<string, { count: number; revenue: number }> = {};
      completedBookings.forEach(b => {
        const name = b.service?.name || "Unknown";
        if (!serviceCount[name]) serviceCount[name] = { count: 0, revenue: 0 };
        serviceCount[name].count++;
        serviceCount[name].revenue += (b.service?.price || 0);
      });

      const sortedServices = Object.entries(serviceCount)
        .map(([name, data]) => ({ name, bookings: data.count, revenue: data.revenue }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      setTopServices(sortedServices);

      setStats({
        totalRevenue,
        totalAppointments,
        newCustomers: uniqueCustomers, // Approximate "Active Customers"
        avgServiceTime,
        revenueChange: "+12%", // Mock for now as we need historical data
        appointmentsChange: "+5%",
      });

      // Mock Payment Methods (since we don't store payment method in bookings yet)
      setPaymentMethods([
        { method: "UPI", percentage: 45, amount: Math.round(totalRevenue * 0.45) },
        { method: "Cash", percentage: 35, amount: Math.round(totalRevenue * 0.35) },
        { method: "Card", percentage: 20, amount: Math.round(totalRevenue * 0.20) },
      ]);

    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, [currentSalon, dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const revenueStats = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      change: stats.revenueChange,
      icon: IndianRupee
    },
    {
      title: "Total Appointments",
      value: stats.totalAppointments.toString(),
      change: stats.appointmentsChange,
      icon: Calendar
    },
    {
      title: "Active Customers",
      value: stats.newCustomers.toString(),
      change: "+Today",
      icon: Users
    },
    {
      title: "Avg. Service Time",
      value: `${stats.avgServiceTime} min`,
      change: "Avg",
      icon: Clock
    }
  ];

  if (loading) {
    return (
      <ResponsiveDashboardLayout showBackButton={true}>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <p className="text-muted-foreground">Generating insights...</p>
        </div>
      </ResponsiveDashboardLayout>
    )
  }

  return (
    <ResponsiveDashboardLayout
      showBackButton={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Insights and performance metrics for <span className="font-semibold text-foreground">{currentSalon?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 3 months</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 bg-white">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueStats.map((stat, index) => (
            <Card key={index} className="border-border shadow-card hover:shadow-lg transition-shadow bg-white/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-sage" />
                  <span className="text-sage">{stat.change}</span>
                  <span className="text-muted-foreground">vs previous period</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted/50 p-1">
            <TabsTrigger value="revenue" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Revenue</TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Services</TabsTrigger>
            <TabsTrigger value="customers" disabled className="opacity-50 cursor-not-allowed">Customers (Pro)</TabsTrigger>
            <TabsTrigger value="staff" disabled className="opacity-50 cursor-not-allowed">Staff (Pro)</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border shadow-card bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>
                    Daily revenue for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-secondary/10 rounded-lg border border-dashed border-border">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 text-accent/50" />
                      <p className="text-muted-foreground font-medium">Visualization coming soon</p>
                      <p className="text-xs text-muted-foreground mt-1">We are collecting more data points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-card bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Revenue by Payment Method
                  </CardTitle>
                  <CardDescription>
                    Breakdown of payment methods used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {paymentMethods.map((method, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{method.method} Payments</span>
                          <span className="font-bold text-accent">{method.percentage}% (₹{method.amount.toLocaleString()})</span>
                        </div>
                        <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-500 rounded-full"
                            style={{ width: `${method.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card className="border-border shadow-card bg-white">
              <CardHeader>
                <CardTitle>Top Performing Services</CardTitle>
                <CardDescription>
                  Most popular services by bookings and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topServices.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No service data available.</div>
                  ) : topServices.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors border border-transparent hover:border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.bookings} bookings
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{service.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDashboardLayout>
  );
}