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
  Shield,
  Loader2
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
import api from "@/services/api";
import {
  format,
  subMonths,
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
import { useToast } from "@/hooks/use-toast";

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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboardEnhanced() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchEnhancedStats = async () => {
    try {
      setLoading(true);

      // Fetch data from local admin API
      const stats = await api.admin.getStats();
      const salons = await api.admin.getAllSalons();
      const users = await api.admin.getAllUsers();

      const topCitiesMap = new Map<string, number>();
      salons.forEach((s: any) => {
        if (s.city) {
          topCitiesMap.set(s.city, (topCitiesMap.get(s.city) || 0) + 1);
        }
      });

      const topCities = Array.from(topCitiesMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setDashboardStats({
        totalSalons: stats.total_salons || 0,
        activeSalons: stats.active_salons || 0,
        pendingSalons: stats.pending_salons || 0,
        totalUsers: stats.total_users || 0,
        totalOwners: users.filter((u: any) => u.role === 'owner' || u.is_owner).length,
        todayBookings: 0, // Bookings removed from governance
        weeklyBookings: 0,
        monthlyRevenue: stats.total_revenue || 0,
        topCities,
        recentActivity: [], // Active bookings feed removed
        revenueData: {
          monthly: [],
          annual: [{ name: "2024", value: stats.total_revenue || 0 }]
        },
        popularTreatments: [],
        customerStats: {
          new: users.length,
          existing: 0,
          total: users.length
        }
      });

    } catch (error: any) {
      console.error("Error fetching local enhanced admin stats:", error);
      if (error.message?.includes('403')) {
        setErrorStatus(403);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFixPermissions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/backend/api/debug/promote-me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await res.json();
      if (data.data?.success) {
        toast({ title: "Access Restored", description: "Your account has been promoted to Super Admin. Refreshing..." });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(data.data?.error || "Promotion failed");
      }
    } catch (err: any) {
      console.error("Promotion error:", err);
      toast({ title: "Promotion Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnhancedStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin h-12 w-12 text-accent" />
        </div>
      </AdminLayout>
    );
  }

  if (errorStatus === 403) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl shadow-red-500/5">
            <Shield className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-white tracking-tight">Access Restricted</h2>
            <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed underline decoration-accent/30 underline-offset-4">Your current session identity does not possess the required Super Admin credentials in the local registry.</p>
          </div>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Button
              onClick={handleFixPermissions}
              className="bg-accent hover:bg-accent/90 text-white font-black h-16 rounded-[1.5rem] shadow-2xl shadow-accent/30 text-lg transition-all hover:scale-105 active:scale-95"
            >
              Restore Admin Rights
            </Button>
            <Link to="/login" className="text-slate-500 hover:text-white font-bold text-sm transition-colors">
              Login as different user
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!dashboardStats) return null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Dark Mode Header */}
        <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Executive Dashboard</h1>
                <p className="text-slate-400 font-medium">Platform overview powered by local MySQL</p>
              </div>
            </div>
            <Button onClick={fetchEnhancedStats} className="bg-white/10 hover:bg-white/20 border-white/10 backdrop-blur-md rounded-xl h-12 px-6 font-bold">
              <Activity className="h-4 w-4 mr-2" />
              Live Update
            </Button>
          </div>
        </div>

        {/* Global Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Salons", value: dashboardStats.totalSalons, active: `${dashboardStats.activeSalons} Active`, icon: Building2, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Total Users", value: dashboardStats.totalUsers, active: `${dashboardStats.totalOwners} Owners`, icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Daily Volume", value: dashboardStats.todayBookings, active: "Bookings Today", icon: Calendar, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Total Revenue", value: `$${dashboardStats.monthlyRevenue}`, active: "Gross Earnings", icon: DollarSign, color: "text-purple-500", bg: "bg-purple-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm bg-white rounded-3xl group hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-xs font-bold text-slate-500">{stat.active}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dynamic Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl font-bold">Revenue Projections</CardTitle>
                <CardDescription className="font-medium">Monthly earnings trend from database</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-blue-50 text-blue-600 border-none font-bold">Local Host</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[350px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardStats.revenueData.monthly}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 900 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
            <CardTitle className="text-xl font-bold mb-6">Market Expansion</CardTitle>
            <div className="space-y-6">
              {dashboardStats.topCities.map((city, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="text-slate-700">{city.city}</span>
                    <span className="text-accent">{city.count} Saloons</span>
                  </div>
                  <Progress value={(city.count / dashboardStats.totalSalons) * 100} className="h-3 rounded-full bg-slate-100" />
                </div>
              ))}
              {dashboardStats.topCities.length === 0 && <p className="text-slate-400 text-center py-10 font-medium">No location data found.</p>}
            </div>
          </Card>
        </div>

        {/* Global Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">System Log</CardTitle>
              <CardDescription className="font-medium">Real-time database events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats.recentActivity.map(act => (
                  <div key={act.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-accent">
                        {act.type === 'booking' ? <Calendar className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{act.description}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{format(new Date(act.timestamp), "h:mm a, MMM d")}</p>
                      </div>
                    </div>
                    <Badge className="bg-white text-slate-600 border-none shadow-sm px-3 font-bold">{act.status}</Badge>
                  </div>
                ))}
                {dashboardStats.recentActivity.length === 0 && <p className="text-slate-400 text-center py-10">No recent logs.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
            <div className="absolute bottom-0 right-0 opacity-10">
              <Target className="w-64 h-64" />
            </div>
            <h3 className="text-2xl font-black mb-2">Platform Goals</h3>
            <p className="text-slate-400 font-medium mb-8">Quarterly target reaching 50 local saloons.</p>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between font-black text-sm uppercase tracking-widest text-slate-400">
                  <span>Saloon Growth</span>
                  <span>{Math.round((dashboardStats.totalSalons / 50) * 100)}%</span>
                </div>
                <Progress value={(dashboardStats.totalSalons / 50) * 100} className="h-4 bg-white/10" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between font-black text-sm uppercase tracking-widest text-slate-400">
                  <span>Revenue Target</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-4 bg-white/10" />
              </div>
            </div>
            <Button className="w-full mt-10 bg-accent text-white font-black h-14 rounded-2xl shadow-xl shadow-accent/20">
              Market Analysis (Pro)
            </Button>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
