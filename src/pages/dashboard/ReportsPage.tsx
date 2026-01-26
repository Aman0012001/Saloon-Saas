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
  MessageSquare,
  PieChart as PieIcon,
  Loader2,
  Activity,
  Zap
} from "lucide-react";
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
  AreaChart,
  Area,
  Legend
} from "recharts";
import { useSalon } from "@/hooks/useSalon";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import { format } from "date-fns";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportsPage() {
  const { currentSalon } = useSalon();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!currentSalon) return;
    setLoading(true);
    try {
      const data = await api.salons.getAnalytics(currentSalon.id);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [currentSalon]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading || !analytics) {
    return (
      <ResponsiveDashboardLayout showBackButton={true}>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <p className="text-muted-foreground font-bold text-lg">Generating Analytical Dossier...</p>
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  const totalRevenue = analytics.revenue_monthly.reduce((sum: number, r: any) => sum + Number(r.revenue), 0);
  const totalBookings = analytics.popular_treatments.reduce((sum: number, s: any) => sum + Number(s.count), 0);

  return (
    <ResponsiveDashboardLayout showBackButton={true}>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 blur-[120px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-accent">
                <BarChart3 className="h-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Intelligence Hub</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data-Driven Salon Optimization</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button onClick={fetchAnalytics} variant="outline" className="bg-white/10 border-white/10 text-white font-bold h-12 rounded-xl">
                <Calendar className="w-4 h-4 mr-2" /> REFRESH FEED
              </Button>
              <Button className="bg-accent text-white font-black rounded-xl h-12 px-8 shadow-lg shadow-accent/20">
                <Download className="w-4 h-4 mr-2" /> EXPORT REPORT
              </Button>
            </div>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Gross Volume", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Successful Visits", value: totalBookings, icon: Zap, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Top Performer", value: analytics.popular_treatments[0]?.name || 'N/A', icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Total Reach", value: analytics.recent_activity.length, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm bg-white rounded-3xl p-6 group hover:shadow-xl transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-3 truncate max-w-[150px]">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-slate-100 p-1.5 rounded-[1.5rem] w-full md:w-auto h-auto grid grid-cols-2 md:inline-flex">
            <TabsTrigger value="overview" className="rounded-2xl py-3 px-8 data-[state=active]:bg-white data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest">Performance Dashboard</TabsTrigger>
            <TabsTrigger value="customers" className="rounded-2xl py-3 px-8 data-[state=active]:bg-white data-[state=active]:shadow-lg font-black text-xs uppercase tracking-widest">Demographic Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Revenue Area Chart */}
              <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Revenue Trajectory</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Historical income metrics (12 Months)</p>
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.revenue_monthly}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dx={-15} />
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#revenueGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Popular Treatments Bar Chart */}
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Service Ranking</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Most popular treatments</p>
                <div className="space-y-6">
                  {analytics.popular_treatments.slice(0, 5).map((service: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-black">
                        <span className="text-slate-700 truncate w-32">{service.name}</span>
                        <span className="text-accent">{service.count} Times</span>
                      </div>
                      <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-1000 rounded-full"
                          style={{ width: `${(service.count / (analytics.popular_treatments[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {analytics.popular_treatments.length === 0 && <p className="text-center py-20 text-slate-300 font-bold">No sessions logged.</p>}
                </div>
              </Card>
            </div>

            {/* Customer Activity Logs */}
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
              <div className="flex items-center gap-3 mb-8">
                <Activity className="w-6 h-6 text-accent" />
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Activity Stream</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.recent_activity.map((activity: any, i: number) => (
                  <div key={i} className="p-5 rounded-3xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-900 font-black text-xs">
                        {activity.full_name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 truncate uppercase text-[11px] tracking-widest">{activity.full_name}</p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">{activity.service_name}</p>
                      </div>
                      <Badge className={`rounded-lg font-black text-[9px] uppercase ${activity.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-black text-slate-400">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(new Date(activity.booking_date), "MMM dd")}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {format(new Date(activity.created_at), "h:mm a")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* New vs Existing Pie Chart */}
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Retention Ratio</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">New vs Existing Client Base</p>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.customer_ratio}
                        dataKey="customer_count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
                        stroke="none"
                      >
                        {analytics.customer_ratio.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '20px', border: 'none', background: '#0f172a', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Service Distribution */}
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <PieIcon className="w-64 h-64" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-8">Profit Sources</h3>
                <div className="space-y-6 relative z-10">
                  {analytics.popular_treatments.map((service: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 transition-all hover:scale-[1.02]">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <p className="font-black text-slate-700">{service.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">${Number(service.total_earned).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Contribution</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDashboardLayout>
  );
}