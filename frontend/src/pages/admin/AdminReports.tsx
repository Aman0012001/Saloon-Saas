import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Building2,
  Users,
  Download,
  Activity,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminLayout } from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { format } from "date-fns";
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
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [reportData, setReportData] = useState<any>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getReports(dateRange);
      setReportData(data);
    } catch (error) {
      console.error('Local report sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  if (loading || !reportData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <Activity className="w-12 h-12 text-accent animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 blur-[120px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-accent">
                <BarChart3 className="h-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Intelligence Nexus</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aggregated Local Performance Data</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48 bg-white/10 border-white/10 text-white font-bold h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 168 Hours</SelectItem>
                  <SelectItem value="30">Lunar Cycle (30d)</SelectItem>
                  <SelectItem value="90">Quarterly View</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-accent text-white font-black rounded-xl h-12 px-8 shadow-lg shadow-accent/20">
                <Download className="w-4 h-4 mr-2" /> DATA EXPORT
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Gross Volume", value: reportData.total_revenue ?? 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Successful Bookings", value: reportData.total_bookings ?? 0, icon: Zap, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Cancellation Rate", value: (reportData.cancellation_rate ?? 0) + "%", icon: Activity, color: "text-red-500", bg: "bg-red-50" },
            { label: "New Clients", value: reportData.new_users ?? 0, icon: Users, color: "text-amber-500", bg: "bg-amber-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm bg-white rounded-3xl p-6 group hover:shadow-xl transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-3">{stat.label === "Gross Volume" ? `RM ${stat.value}` : stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2.5rem] p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Revenue Trajectory</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Historical income data</p>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData.revenue_history || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dx={-15} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Market Share</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 mb-8">Saloon Distribution</p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reportData.top_salons || []} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8}>
                    {(reportData.top_salons || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-4">
              {(reportData.top_salons || []).map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <p className="text-sm font-bold text-slate-700">{s.name}</p>
                  </div>
                  <p className="text-xs font-black text-slate-400">{s.count ?? 0} Transactions</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}