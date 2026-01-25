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
  DollarSign,
  Clock,
  Star,
  FileText,
  PieChart,
  Loader2
} from "lucide-react";
import { useSalon } from "@/hooks/useSalon";
import api from "@/services/api";
import { format } from "date-fns";

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
    revenueChange: "+12%",
    appointmentsChange: "+5%",
  });

  const [topServices, setTopServices] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const fetchReports = useCallback(async () => {
    if (!currentSalon) return;
    setLoading(true);

    try {
      const now = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case "7days": startDate.setDate(now.getDate() - 7); break;
        case "30days": startDate.setDate(now.getDate() - 30); break;
        case "90days": startDate.setDate(now.getDate() - 90); break;
        case "1year": startDate.setFullYear(now.getFullYear() - 1); break;
        default: startDate.setDate(now.getDate() - 30);
      }

      // Fetch all bookings for reports from the local API
      const bookings = await api.bookings.getAll({
        salon_id: currentSalon.id,
        start_date: format(startDate, "yyyy-MM-dd")
      });

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
      const completedBookings = bookings.filter((b: any) => b.status === "completed" || b.status === "confirmed");
      const totalRevenue = completedBookings.reduce((sum: number, b: any) => sum + Number(b.price || 0), 0);
      const totalAppointments = bookings.length;

      // Calculate Avg Service Time
      const totalTime = completedBookings.reduce((sum: number, b: any) => sum + Number(b.duration_minutes || 30), 0);
      const avgServiceTime = completedBookings.length > 0 ? Math.round(totalTime / completedBookings.length) : 0;

      // Unique Customers
      const uniqueCustomers = new Set(bookings.map((b: any) => b.user_id)).size;

      // Top Services
      const serviceCount: Record<string, { count: number; revenue: number }> = {};
      completedBookings.forEach((b: any) => {
        const name = b.service_name || "Unknown";
        if (!serviceCount[name]) serviceCount[name] = { count: 0, revenue: 0 };
        serviceCount[name].count++;
        serviceCount[name].revenue += Number(b.price || 0);
      });

      const sortedServices = Object.entries(serviceCount)
        .map(([name, data]) => ({ name, bookings: data.count, revenue: data.revenue }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      setTopServices(sortedServices);

      setStats({
        totalRevenue,
        totalAppointments,
        newCustomers: uniqueCustomers,
        avgServiceTime,
        revenueChange: "+12%",
        appointmentsChange: "+5%",
      });

      // Mock Payment Methods locally
      setPaymentMethods([
        { method: "UPI", percentage: 45, amount: Math.round(totalRevenue * 0.45) },
        { method: "Cash", percentage: 35, amount: Math.round(totalRevenue * 0.35) },
        { method: "Card", percentage: 20, amount: Math.round(totalRevenue * 0.20) },
      ]);

    } catch (error) {
      console.error("Error fetching report data locally:", error);
    } finally {
      setLoading(false);
    }
  }, [currentSalon, dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const revenueStats = [
    {
      title: "Local Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: stats.revenueChange,
      icon: DollarSign
    },
    {
      title: "Total Bookings",
      value: stats.totalAppointments.toString(),
      change: stats.appointmentsChange,
      icon: Calendar
    },
    {
      title: "Total Clients",
      value: stats.newCustomers.toString(),
      change: "Active",
      icon: Users
    },
    {
      title: "Efficiency",
      value: `${stats.avgServiceTime}m avg`,
      change: "Time",
      icon: Clock
    }
  ];

  if (loading) {
    return (
      <ResponsiveDashboardLayout showBackButton={true}>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <p className="text-muted-foreground font-bold">Synthesizing local insights...</p>
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
            <h1 className="text-3xl font-black text-foreground tracking-tight">Analytics Center</h1>
            <p className="text-muted-foreground font-medium">
              Performance metrics fetched from your local <span className="text-foreground font-bold">XAMPP</span> database.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-44 bg-white border-none shadow-sm rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7days">Past Week</SelectItem>
                <SelectItem value="30days">Past Month</SelectItem>
                <SelectItem value="90days">Past Quarter</SelectItem>
                <SelectItem value="1year">Past Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 bg-white border-none shadow-sm rounded-xl font-bold">
              <Download className="w-4 h-4" />
              CSV Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {revenueStats.map((stat, index) => (
            <Card key={index} className="border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50 p-1 rounded-2xl">
            <TabsTrigger value="revenue" className="rounded-xl h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 font-bold">Financials</TabsTrigger>
            <TabsTrigger value="services" className="rounded-xl h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 font-bold">Service Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <BarChart3 className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="text-slate-500 font-bold">Chart visualization is coming soon.</p>
                    <p className="text-xs text-slate-400 mt-1">Collecting data from your local records.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-accent" />
                    Payment Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {paymentMethods.map((method, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-slate-700">{method.method}</span>
                          <span className="font-black text-accent text-sm">{method.percentage}% (${method.amount.toLocaleString()})</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-700 rounded-full"
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
            <Card className="border-none shadow-sm bg-white rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Most Profitable Services</CardTitle>
                <CardDescription className="font-medium">Ranked by volume and earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topServices.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">No local service logs yet.</div>
                  ) : topServices.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-slate-900 text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg leading-tight">{service.name}</p>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                            {service.bookings} Complete Appointments
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-accent text-xl">${service.revenue.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Earnings</p>
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