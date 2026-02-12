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
  Banknote,
  Clock,
  MessageSquare,
  PieChart as PieIcon,
  Loader2,
  Activity,
  Zap,
  Scissors
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = Number(payload[0].value);
    const monthStr = label.includes('-') ? format(new Date(label + '-01'), 'MMMM yyyy') : label;

    return (
      <div className="relative mb-4">
        <div className="bg-[#111827]/95 backdrop-blur-md px-5 py-3 rounded-[12px] border border-white/5 shadow-2xl min-w-[150px]">
          <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-[0.1em] mb-1">{monthStr.toUpperCase()}</p>
          <p className="text-white font-bold text-[13px] tracking-tight">
            Revenue: <span className="text-[#0ea5e9] ml-1">RM {value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toLocaleString()}</span>
          </p>
        </div>
        {/* Triangle Pointer */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#111827]/95" />
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { currentSalon, loading: salonLoading } = useSalon();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("Yearly");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!currentSalon) {
      if (!salonLoading) setLoading(false);
      return;
    }
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

  const handleDownload = () => {
    if (!analytics || !analytics.revenue_monthly) return;

    const headers = ["Month", "Revenue (RM)"];
    const csvContent = [
      headers.join(","),
      ...analytics.revenue_monthly.map((row: any) => `${row.month},${row.revenue}`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `revenue_report_${format(new Date(), 'yyyy_MM_dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Adaptive data pipeline: Determine start date from analytics or default to 12 months ago
  const chartData = [];
  const now = new Date();

  // Find earliest month with data
  let start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  if (analytics.revenue_monthly.length > 0) {
    const earliest = new Date(analytics.revenue_monthly[0].month + '-01');
    if (earliest < start) start = earliest;
  }

  // Generate continuous timeline from start to now
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  while (current <= end) {
    const key = format(current, 'yyyy-MM');
    const existing = analytics.revenue_monthly.find((r: any) => r.month === key);
    chartData.push({
      month: key,
      revenue: existing ? Number(existing.revenue) : 0
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Handle Time Range Grouping
  let displayData = [...chartData];
  if (timeRange === 'Quarterly') {
    const quarters: any = {};
    chartData.forEach(d => {
      const date = new Date(d.month + '-01');
      const q = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      quarters[q] = (quarters[q] || 0) + Number(d.revenue);
    });
    displayData = Object.entries(quarters).map(([q, rev]) => ({ month: q, revenue: rev }));
  } else if (timeRange === 'Yearly') {
    const years: any = {};
    chartData.forEach(d => {
      const date = new Date(d.month + '-01');
      const year = date.getFullYear().toString();
      years[year] = (years[year] || 0) + Number(d.revenue);
    });
    displayData = Object.entries(years).map(([y, rev]) => ({ month: y, revenue: rev }));
  }

  const lifetimeRevenue = analytics.revenue_monthly.reduce((sum: number, r: any) => sum + Number(r.revenue), 0);

  // Dynamic Period Totals
  const getPeriodStats = () => {
    const now = new Date();
    const currentMonthStr = format(now, 'yyyy-MM');
    const currentYearStr = now.getFullYear().toString();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    if (timeRange === 'Monthly') {
      const mData = chartData.find(d => d.month === currentMonthStr);
      return { total: mData ? Number(mData.revenue) : 0, label: "This Month" };
    } else if (timeRange === 'Quarterly') {
      const qTotal = chartData
        .filter(d => {
          const dt = new Date(d.month + '-01');
          return dt.getFullYear() === now.getFullYear() && (Math.floor(dt.getMonth() / 3) + 1) === currentQuarter;
        })
        .reduce((sum, d) => sum + Number(d.revenue), 0);
      return { total: qTotal, label: "This Quarter" };
    } else {
      const yTotal = chartData
        .filter(d => d.month.startsWith(currentYearStr))
        .reduce((sum, d) => sum + Number(d.revenue), 0);
      return { total: yTotal, label: "This Year" };
    }
  };

  const { total: periodTotal, label: periodLabel } = getPeriodStats();

  const totalBookings = analytics.popular_treatments.reduce((sum: number, s: any) => sum + Number(s.count), 0);
  const totalCustomers = analytics.customer_ratio.reduce((sum: number, r: any) => sum + Number(r.customer_count), 0);

  // Dynamic axis calculation
  const maxVal = Math.max(...displayData.map((d: any) => Number(d.revenue)), 100);
  let yAxisMax, tickInterval;

  if (maxVal < 1000) {
    yAxisMax = Math.ceil(maxVal / 100) * 100 || 500;
    tickInterval = yAxisMax / 4;
  } else {
    yAxisMax = Math.ceil(maxVal / 2000) * 2000 || 8000;
    tickInterval = yAxisMax / 4;
  }

  const dynamicTicks = [0, tickInterval, tickInterval * 2, tickInterval * 3, yAxisMax];

  // Dynamic Growth Calculation (Current vs Previous recorded point)
  let growth = 0;
  const activeMonths = analytics.revenue_monthly.filter((r: any) => Number(r.revenue) > 0);
  if (activeMonths.length >= 2) {
    const latest = Number(activeMonths[activeMonths.length - 1].revenue);
    const previous = Number(activeMonths[activeMonths.length - 2].revenue);
    growth = ((latest - previous) / previous) * 100;
  } else if (activeMonths.length === 1) {
    growth = 100;
  }

  return (
    <ResponsiveDashboardLayout showBackButton={true}>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-[#F2A93B] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 blur-[120px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-white">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Intelligence Hub</h1>
                <p className="text-white font-bold uppercase tracking-widest text-[10px]">Data-Driven Salon Optimization</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button onClick={fetchAnalytics} variant="outline" className="bg-white/10 border-white/10 text-white font-bold h-12 rounded-xl">
                <Calendar className="w-4 h-4 mr-2" /> REFRESH FEED
              </Button>
            </div>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Gross Volume", value: `RM ${lifetimeRevenue.toLocaleString()}`, icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Successful Visits", value: totalBookings, icon: Scissors, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Top Performer", value: analytics.popular_treatments[0]?.name || 'N/A', icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Total Reach", value: totalCustomers, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
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
              <Card className="lg:col-span-2 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-[#F2A93B] rounded-[2.5rem] overflow-hidden relative border border-white/10">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 relative z-10 px-10 pt-10 gap-6">
                  <div className="space-y-1.5">
                    <CardTitle className="text-[1.5rem] font-black text-white tracking-tighter">Revenue Trajectory</CardTitle>
                    <CardDescription className="text-white/60 font-bold uppercase tracking-widest text-[11px]">Historical Performance Flow</CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                    {['Monthly', 'Quarterly', 'Yearly'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-5 py-2 text-[11px] font-black uppercase transition-all tracking-wider rounded-xl ${timeRange === range
                          ? "text-[#F2A93B] bg-white shadow-lg tracking-widest"
                          : "text-white/60 hover:text-white"
                          }`}
                      >
                        {range}
                      </button>
                    ))}
                    <div className="w-px h-5 bg-white/5 mx-2" />
                    <div className="flex gap-1 pr-1">
                      <button
                        onClick={handleDownload}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <div className="h-[400px] w-full px-6 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={displayData.length > 0 ? displayData : [
                        { month: format(new Date(), 'MMM'), revenue: 0 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="electricBlueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fff" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="#fff"
                        strokeOpacity={0.15}
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}
                        dy={20}
                        interval={timeRange === 'Monthly' ? 1 : 0}
                        tickFormatter={(val) => {
                          if (val.includes('-')) {
                            const date = new Date(val + '-01');
                            return format(date, 'MMM');
                          }
                          return val;
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}
                        dx={-15}
                        ticks={dynamicTicks}
                        domain={[0, yAxisMax]}
                        tickFormatter={(val) => {
                          const num = Number(val);
                          if (num >= 100000) return `RM ${(num / 100000).toFixed(1)}L`;
                          if (num >= 1000) return `RM ${(num / 1000).toFixed(1)}k`;
                          return `RM ${num}`;
                        }}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#3b82f6', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                        animationDuration={200}
                        offset={-20}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#fff"
                        strokeWidth={4}
                        fill="url(#electricBlueGradient)"
                        filter="url(#glow)"
                        activeDot={{
                          r: 9,
                          fill: "#F2A93B",
                          stroke: "#fff",
                          strokeWidth: 4,
                          className: "shadow-[0_0_25px_rgba(255,255,255,0.9)]"
                        }}
                        dot={{
                          r: 6,
                          fill: "#F2A93B",
                          stroke: "#fff",
                          strokeWidth: 3,
                          strokeOpacity: 0.9
                        }}
                        animationDuration={3000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="px-12 pb-14 pt-8 flex items-center justify-between mt-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-[0_0_30px_rgba(16,185,129,0.2)] ${growth >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                      }`}>
                      {growth >= 0 ? (
                        <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[11px] border-b-emerald-500 mb-0.5" />
                      ) : (
                        <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[11px] border-t-red-500 mt-0.5" />
                      )}
                      <span className={`font-bold text-2xl tracking-tighter ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <p className="text-white text-[23px] font-black tracking-tighter leading-none">
                      RM {periodTotal >= 1000 ? `${(periodTotal / 1000).toFixed(1)}k` : periodTotal.toLocaleString()}
                    </p>
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {periodLabel}
                    </span>
                  </div>
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
                        contentStyle={{ borderRadius: '20px', border: 'none', background: '#b07d62', color: '#fff' }}
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
                        <p className="font-black text-slate-900">RM {Number(service.total_earned).toLocaleString()}</p>
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
