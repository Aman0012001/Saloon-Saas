import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Star,
  Activity,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  RotateCcw,
  Phone,
  User,
  Bell,
  AlertCircle,
  RefreshCw,
  Scissors,
  Store,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, parseISO } from "date-fns";

interface DashboardStats {
  todayAppointments: number;
  todayRevenue: number;
  totalCustomers: number;
  pendingAppointments: number;
  newBookingsCount: number;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  user_id: string;
  service_id: string;
  salon_id: string;
  created_at: string;
  updated_at: string;
  service_name?: string;
  price?: number;
  duration_minutes?: number;
  user_name?: string;
  user_phone?: string;
  user_avatar?: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  } | null;
  customer: {
    user_id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  customerType?: 'new' | 'returning';
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentSalon, loading: salonLoading, salons } = useSalon();
  const isMobile = useMobile();
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    pendingAppointments: 0,
    newBookingsCount: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refreshBookings = useCallback(async (showToast = false) => {
    if (!currentSalon) return;

    setRefreshing(true);
    try {
      const todayDate = format(new Date(), "yyyy-MM-dd");

      // Fetch all bookings from the local PHP API
      const allBookings = await api.bookings.getAll({ salon_id: currentSalon.id });

      const enrich = (list: any[]) => list.map(b => ({
        ...b,
        service: b.service_name ? {
          id: b.service_id,
          name: b.service_name,
          price: Number(b.price || 0),
          duration_minutes: Number(b.duration_minutes || 30)
        } : null,
        customer: b.user_name ? {
          user_id: b.user_id,
          full_name: b.user_name,
          phone: b.user_phone,
          avatar_url: b.user_avatar || null
        } : null,
        customerType: 'returning' // Simplified for now
      }));

      const enrichedAll = enrich(allBookings);

      // Filtering and stats calculation
      const recent = enrichedAll.slice(0, 10);
      const today = enrichedAll.filter(b => b.booking_date === todayDate && b.status !== 'cancelled');
      const pending = enrichedAll.filter(b => b.status === "pending" || (b.status === "confirmed" && isToday(new Date(b.created_at || ''))));

      const confirmedToday = today.filter(b => b.status === "confirmed" || b.status === "completed");
      const todayRevenue = confirmedToday.reduce((sum, b) => sum + (b.price || b.service?.price || 0), 0);

      const uniqueCustomerCount = new Set(enrichedAll.map(b => b.user_id)).size;

      setRecentBookings(recent);
      setTodaysAppointments(today);
      setPendingBookings(pending);

      setStats({
        todayAppointments: today.length,
        todayRevenue,
        totalCustomers: uniqueCustomerCount,
        pendingAppointments: pending.length,
        newBookingsCount: pending.filter(b => isToday(new Date(b.created_at || ''))).length,
      });

      setLastRefresh(new Date());

      if (showToast && pending.length > 0) {
        toast({
          title: "Bookings Updated",
          description: `Found ${pending.length} pending entries.`,
        });
      }
    } catch (error) {
      console.error("Error refreshing dashboard bookings:", error);
    } finally {
      setRefreshing(false);
    }
  }, [currentSalon, toast]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (!currentSalon) return;

    try {
      await api.bookings.updateStatus(bookingId, newStatus);
      await refreshBookings();
      toast({
        title: "Status Updated",
        description: `Booking updated successfully in local DB.`,
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Removed aggressive auto-redirect to prevent navigation loops
  // Users will see the "No Saloon Found" state with a manual "Register" button instead

  useEffect(() => {
    if (!currentSalon) return;

    const fetchInitialData = async () => {
      setLoading(true);
      await refreshBookings();
      setLoading(false);
    };

    fetchInitialData();

    // Use polling instead of real-time for local backend
    const interval = setInterval(() => {
      refreshBookings();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [currentSalon, refreshBookings]);

  // Loading states
  if (authLoading || salonLoading) {
    return (
      <ResponsiveDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Initializing Station...</p>
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  if (!currentSalon) {
    return (
      <ResponsiveDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
            <Store className="w-10 h-10 text-slate-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">No Saloon Found</h2>
            <p className="text-slate-500 mt-2 font-medium">Your local node is active, but no saloon registration exists.</p>
          </div>
          <Button onClick={() => navigate("/dashboard/create-salon")} className="bg-slate-900 text-white rounded-2xl h-14 px-8 font-black shadow-xl">
            REGISTER NEW SALOON
          </Button>
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  const statCards = [
    {
      title: "Pending Bookings",
      value: stats.pendingAppointments,
      icon: AlertCircle,
      trend: stats.newBookingsCount > 0 ? `${stats.newBookingsCount} new today` : "No new today",
      trendUp: stats.newBookingsCount > 0,
      color: stats.pendingAppointments > 0 ? "from-blue-500 to-blue-600" : "from-green-500 to-green-600",
      bgColor: stats.pendingAppointments > 0 ? "bg-blue-50" : "bg-green-50",
      iconColor: stats.pendingAppointments > 0 ? "text-blue-600" : "text-green-600",
      urgent: stats.pendingAppointments > 0,
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: Calendar,
      trend: `${format(new Date(), "MMM d")}`,
      trendUp: stats.todayAppointments > 0,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      urgent: false,
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      trend: `${stats.todayAppointments} scheduled`,
      trendUp: stats.todayRevenue > 0,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      urgent: false,
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      trend: `All time Customers`,
      trendUp: true,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      urgent: false,
    },
  ];

  return (
    <ResponsiveDashboardLayout>
      <div className={`space-y-${isMobile ? '6' : '8'}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent`}>
                Booking Dashboard
              </h1>
              <Badge className="bg-gradient-to-r from-accent to-accent/80 text-white border-0">
                Active
              </Badge>
            </div>
            <p className={`text-muted-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
              Manage bookings from local records for <span className="font-medium text-foreground">{currentSalon.name}</span>
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Last updated: {format(lastRefresh, 'h:mm:ss a')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshBookings(true)}
                disabled={refreshing}
                className="h-6 px-2"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {!isMobile && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/appointments")}
                className="border-border/50 hover:bg-secondary/50 font-bold"
              >
                <Activity className="w-4 h-4 mr-2" />
                All Appointments
              </Button>
              <Button
                onClick={() => navigate("/dashboard/appointments")}
                className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-white shadow-lg shadow-accent/25 font-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 ${isMobile ? 'lg:grid-cols-4 gap-4' : 'sm:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm ${stat.urgent ? 'ring-2 ring-blue-200' : ''
                }`}
            >
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>{stat.title}</p>
                    <p className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-foreground`}>
                      {loading ? (
                        <div className={`${isMobile ? 'w-12 h-6' : 'w-16 h-8'} bg-secondary/50 rounded animate-pulse`} />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} ${stat.iconColor}`} />
                  </div>
                </div>
                <div className={`${isMobile ? 'mt-3' : 'mt-4'} flex items-center gap-2 text-xs`}>
                  <span className="font-medium">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Approval Section */}
        {pendingBookings.length > 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Bell className="w-6 h-6 text-blue-600" />
                  Action Required ({pendingBookings.length})
                </CardTitle>
                <Badge className="bg-blue-200 text-blue-800 font-bold">New Entries</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingBookings.slice(0, 3).map((booking) => (
                <Card key={booking.id} className="bg-white border-none shadow-sm group">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                          {(booking.user_name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-slate-900">{booking.user_name || "Guest"}</h4>
                        <p className="text-sm text-slate-500">{booking.service_name || "Service"}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatBookingTime(booking.booking_date, booking.booking_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-9">
                        <CheckCircle className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, 'cancelled')} className="border-red-200 text-red-600 hover:bg-red-50 font-bold h-9">
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <Card className="border-0 shadow-lg bg-white overflow-hidden rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/appointments")} className="text-accent font-bold">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentBookings.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">No recent bookings found.</div>
                ) : (
                  recentBookings.map(b => (
                    <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{b.user_name || "Guest"}</p>
                          <p className="text-xs text-slate-500">{b.service_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent">${b.price}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{format(new Date(b.booking_date), "MMM d")}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats/Links */}
          <Card className="border-0 shadow-lg bg-white rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6">Salon Operations</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "My Services", icon: Scissors, path: "/dashboard/services", color: "bg-orange-50 text-orange-600" },
                { label: "Our Staff", icon: Users, path: "/dashboard/staff", color: "bg-blue-50 text-blue-600" },
                { label: "Customers", icon: Users, path: "/dashboard/customers", color: "bg-purple-50 text-purple-600" },
                { label: "Reporting", icon: Activity, path: "/dashboard/reports", color: "bg-emerald-50 text-emerald-600" },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-accent/20 hover:bg-accent/5 transition-all flex flex-col items-center gap-3 text-center group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </ResponsiveDashboardLayout>
  );

  function formatBookingTime(date: string, time: string) {
    try {
      const bookingDate = parseISO(date);
      const bookingDateTime = new Date(bookingDate);
      const [h, m] = time.split(':');
      bookingDateTime.setHours(parseInt(h), parseInt(m));
      return isToday(bookingDate) ? `Today at ${format(bookingDateTime, 'h:mm a')}` : `${format(bookingDate, 'MMM d')} at ${format(bookingDateTime, 'h:mm a')}`;
    } catch {
      return `${date} at ${time}`;
    }
  }
}