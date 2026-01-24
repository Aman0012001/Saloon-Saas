import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Building2,
  Users,
  Download,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DailyBooking {
  date: string;
  count: number;
}

interface TopSalon {
  id: string;
  name: string;
  bookings: number;
}

interface TopService {
  name: string;
  bookings: number;
}

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [dailyBookings, setDailyBookings] = useState<DailyBooking[]>([]);
  const [topSalons, setTopSalons] = useState<TopSalon[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    avgBookingsPerDay: 0,
  });

  const fetchReportData = async () => {
    setLoading(true);
    const days = parseInt(dateRange);
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    try {
      // Fetch bookings for the period
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, booking_date, status, salon_id, service_id, created_at')
        .gte('created_at', startDate);

      if (!bookingsData) {
        setLoading(false);
        return;
      }

      // Calculate daily bookings
      const dailyCounts = new Map<string, number>();
      const interval = eachDayOfInterval({
        start: subDays(new Date(), days),
        end: new Date(),
      });
      
      interval.forEach(date => {
        dailyCounts.set(format(date, 'yyyy-MM-dd'), 0);
      });

      bookingsData.forEach(b => {
        const date = format(new Date(b.created_at), 'yyyy-MM-dd');
        if (dailyCounts.has(date)) {
          dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
        }
      });

      setDailyBookings(
        Array.from(dailyCounts.entries()).map(([date, count]) => ({
          date: format(new Date(date), 'MMM d'),
          count,
        }))
      );

      // Calculate stats
      const completed = bookingsData.filter(b => b.status === 'completed').length;
      const cancelled = bookingsData.filter(b => b.status === 'cancelled').length;

      setStats({
        totalBookings: bookingsData.length,
        completedBookings: completed,
        cancelledBookings: cancelled,
        avgBookingsPerDay: Math.round(bookingsData.length / days),
      });

      // Top salons
      const salonCounts = new Map<string, number>();
      bookingsData.forEach(b => {
        if (b.salon_id) {
          salonCounts.set(b.salon_id, (salonCounts.get(b.salon_id) || 0) + 1);
        }
      });

      const topSalonIds = Array.from(salonCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (topSalonIds.length > 0) {
        const { data: salonsData } = await supabase
          .from('salons')
          .select('id, name')
          .in('id', topSalonIds.map(s => s[0]));

        const salonsMap = new Map((salonsData || []).map(s => [s.id, s.name]));
        setTopSalons(
          topSalonIds.map(([id, count]) => ({
            id,
            name: salonsMap.get(id) || 'Unknown',
            bookings: count,
          }))
        );
      }

      // Top services
      const serviceCounts = new Map<string, number>();
      bookingsData.forEach(b => {
        serviceCounts.set(b.service_id, (serviceCounts.get(b.service_id) || 0) + 1);
      });

      const topServiceIds = Array.from(serviceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (topServiceIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name')
          .in('id', topServiceIds.map(s => s[0]));

        const servicesMap = new Map((servicesData || []).map(s => [s.id, s.name]));
        setTopServices(
          topServiceIds.map(([id, count]) => ({
            name: servicesMap.get(id) || 'Unknown',
            bookings: count,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <AdminLayout>
      <div className="space-y-6 bg-gray-900 text-white min-h-screen">
        {/* Header - Dark Theme */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-700 to-black p-8 text-white">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Reports & Analytics</h1>
                  <p className="text-gray-300 text-lg">Platform performance insights</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="7" className="text-white hover:bg-gray-700 focus:bg-gray-700">Last 7 days</SelectItem>
                  <SelectItem value="30" className="text-white hover:bg-gray-700 focus:bg-gray-700">Last 30 days</SelectItem>
                  <SelectItem value="90" className="text-white hover:bg-gray-700 focus:bg-gray-700">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl"></div>
        </div>

        {/* Stats - Dark Theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Bookings</p>
                  <p className="text-3xl font-bold text-white">{stats.totalBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-3xl font-bold text-white">{stats.completedBookings}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Cancelled</p>
                  <p className="text-3xl font-bold text-white">{stats.cancelledBookings}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg/Day</p>
                  <p className="text-3xl font-bold text-white">{stats.avgBookingsPerDay}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Bookings Chart - Dark Theme */}
            <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
              <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
                <CardTitle className="text-white">Booking Trends</CardTitle>
                <CardDescription className="text-gray-400">Daily booking volume over the selected period</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyBookings}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-600" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: '#9ca3af' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: '#9ca3af' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers - Dark Theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Salons */}
              <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
                <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
                  <CardTitle className="text-white">Top Performing Salons</CardTitle>
                  <CardDescription className="text-gray-400">By booking volume</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {topSalons.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No data available</p>
                  ) : (
                    <div className="space-y-4">
                      {topSalons.map((salon, i) => (
                        <div key={salon.id} className="flex items-center gap-4">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          >
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{salon.name}</p>
                            <p className="text-sm text-gray-400">{salon.bookings} bookings</p>
                          </div>
                          <div className="w-24 h-2 rounded-full bg-gray-700 overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${(salon.bookings / (topSalons[0]?.bookings || 1)) * 100}%`,
                                backgroundColor: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Services */}
              <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
                <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
                  <CardTitle className="text-white">Most Booked Services</CardTitle>
                  <CardDescription className="text-gray-400">Popular services across the platform</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {topServices.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No data available</p>
                  ) : (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topServices}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="bookings"
                          >
                            {topServices.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#f9fafb'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="mt-4 space-y-2">
                    {topServices.map((service, i) => (
                      <div key={service.name} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="flex-1 text-white">{service.name}</span>
                        <span className="text-gray-400">{service.bookings}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}