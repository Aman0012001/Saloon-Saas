import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  IndianRupee,
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
import { supabase } from "@/integrations/supabase/client";
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
  customerType?: 'new' | 'returning'; // Track if customer is new or returning
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

  // Real-time refresh function
  const refreshBookings = useCallback(async (showToast = false) => {
    if (!currentSalon) return;

    setRefreshing(true);
    try {
      console.log("🔄 Refreshing bookings for salon:", currentSalon.id);

      const todayDate = format(new Date(), "yyyy-MM-dd");

      // 1. Fetch recent activity (Last 7 days)
      const recentQuery = supabase
        .from("bookings")
        .select(`
          id, booking_date, booking_time, status, notes, user_id, service_id, salon_id, created_at, updated_at
        `)
        .eq("salon_id", currentSalon.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      // 2. Fetch TODAY's Schedule
      const todayQuery = supabase
        .from("bookings")
        .select(`
          id, booking_date, booking_time, status, notes, user_id, service_id, salon_id, created_at, updated_at
        `)
        .eq("salon_id", currentSalon.id)
        .eq("booking_date", todayDate)
        .neq("status", "cancelled")
        .order("booking_time", { ascending: true });

      const [{ data: bookingsData }, { data: todayData }] = await Promise.all([recentQuery, todayQuery]);

      if (!bookingsData || bookingsData.length === 0) {
        setRecentBookings([]);
        setPendingBookings([]);
        setTodaysAppointments([]);
        setStats(prev => ({ ...prev, pendingAppointments: 0, newBookingsCount: 0 }));
        return;
      }

      // Consolidate unique items for enrichment
      const rawBookings = [...(bookingsData || []), ...(todayData || [])];
      const uniqueBookingsMap = new Map();
      rawBookings.forEach(b => uniqueBookingsMap.set(b.id, b));
      const uniqueBookings = Array.from(uniqueBookingsMap.values());

      // AUTO-CORRECTION: If we find any 'pending' bookings, confirm them immediately
      const pendingToAutoConfirm = uniqueBookings.filter(b => b.status === 'pending');

      if (pendingToAutoConfirm.length > 0) {
        console.log(`🔄 Auto-confirming ${pendingToAutoConfirm.length} pending bookings...`);
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ status: "confirmed" })
          .in("id", pendingToAutoConfirm.map(b => b.id));

        if (!updateError) {
          // Update local data to reflect valid state
          uniqueBookings.forEach(b => {
            if (b.status === 'pending') b.status = 'confirmed';
          });

          if (showToast) {
            toast({
              title: "System Update",
              description: `Auto-confirmed ${pendingToAutoConfirm.length} older pending bookings.`,
            });
          }
        }
      }

      // Fetch services and customer profiles
      const serviceIds = [...new Set(uniqueBookings.map(b => b.service_id))];
      const userIds = [...new Set(uniqueBookings.map(b => b.user_id))];

      const [{ data: services }, { data: profiles }] = await Promise.all([
        supabase
          .from("services")
          .select("id, name, price, duration_minutes")
          .in("id", serviceIds),
        supabase
          .from("profiles")
          .select("user_id, full_name, phone, avatar_url")
          .in("user_id", userIds)
      ]);

      // Determine if customers are new or returning by counting their total bookings
      const customerBookingCounts = new Map<string, number>();

      for (const userId of userIds) {
        const { count } = await supabase
          .from("bookings")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
          .eq("salon_id", currentSalon.id)
          .neq("status", "cancelled");

        customerBookingCounts.set(userId, count || 0);
      }

      // Enrich bookings
      const enrich = (list: any[]) => list.map(booking => {
        // Check against the MAIN unique list which might have updated statuses
        const updatedVersion = uniqueBookings.find(u => u.id === booking.id);
        const status = updatedVersion ? updatedVersion.status : booking.status;

        // Determine customer type: new (1 booking) or returning (>1 bookings)
        const bookingCount = customerBookingCounts.get(booking.user_id) || 0;
        const customerType = bookingCount <= 1 ? 'new' : 'returning';

        return {
          ...booking,
          status: status === 'pending' ? 'confirmed' : status,
          service: services?.find(s => s.id === booking.service_id) || null,
          customer: profiles?.find(p => p.user_id === booking.user_id) || null,
          customerType,
        };
      });

      const enrichedRecent = enrich(bookingsData || []);
      const enrichedToday = enrich(todayData || []);

      setRecentBookings(enrichedRecent);
      setTodaysAppointments(enrichedToday);

      // Filter new bookings (pending or recently confirmed)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const pending = enrichedRecent.filter(b =>
        (b.status === "pending" || b.status === "confirmed") &&
        new Date(b.created_at) > oneDayAgo
      );
      setPendingBookings(pending);

      // Calculate stats
      const confirmedToday = enrichedToday.filter(b => b.status === "confirmed" || b.status === "completed");
      const todayRevenue = confirmedToday.reduce((sum, b) => sum + (b.service?.price || 0), 0);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const newBookings = enrichedRecent.filter(b =>
        new Date(b.created_at) > oneHourAgo
      );

      setStats({
        todayAppointments: enrichedToday.length,
        todayRevenue,
        totalCustomers: new Set(uniqueBookings.map(b => b.user_id)).size,
        pendingAppointments: pending.length,
        newBookingsCount: newBookings.length,
      });

      setLastRefresh(new Date());

      if (showToast && pending.length > 0) {
        toast({
          title: "Bookings Updated",
          description: `Found ${pending.length} new booking${pending.length !== 1 ? 's' : ''}`,
        });
      }

      console.log("✅ Bookings refreshed:", {
        totalRecent: enrichedRecent.length,
        todayCount: enrichedToday.length,
        new: newBookings.length
      });

    } catch (error) {
      console.error("Error refreshing bookings:", error);
      if (showToast) {
        toast({
          title: "Refresh Failed",
          description: "Could not update bookings. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, [currentSalon, toast]);

  // Handle booking status updates
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (!currentSalon) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", bookingId)
        .eq("salon_id", currentSalon.id); // Security: ensure salon ownership

      if (error) throw error;

      // Refresh bookings to show updated status
      await refreshBookings();

      toast({
        title: "Status Updated",
        description: `Booking ${newStatus === "confirmed" ? "accepted" : newStatus === "cancelled" ? "rejected" : "updated"} successfully.`,
      });

    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Update Failed",
        description: "Could not update booking status. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Only redirect if both auth and salon loading is finished
    // and we truly have no salons for this authenticated user
    if (!authLoading && !salonLoading && salons.length === 0 && user) {
      console.log("Redirecting to salon creation: authenticated but no salon found");
      navigate("/dashboard/create-salon");
    }
  }, [salonLoading, authLoading, salons, user, navigate]);

  // Initial data fetch
  useEffect(() => {
    if (!currentSalon) return;

    const fetchInitialData = async () => {
      setLoading(true);
      await refreshBookings();
      setLoading(false);
    };

    fetchInitialData();
  }, [currentSalon, refreshBookings]);

  // Set up real-time polling for new bookings
  useEffect(() => {
    if (!currentSalon) return;

    // Poll every 30 seconds for new bookings
    const interval = setInterval(() => {
      refreshBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentSalon, refreshBookings]);

  // Set up Supabase real-time subscription
  useEffect(() => {
    if (!currentSalon) return;

    console.log("🔔 Setting up real-time subscription for salon:", currentSalon.id);

    const channel = supabase
      .channel(`bookings-${currentSalon.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `salon_id=eq.${currentSalon.id}`
        },
        (payload) => {
          console.log("🔔 Real-time booking update:", payload);

          // Refresh bookings when any change occurs
          refreshBookings(true);

          // Show notification for new bookings
          if (payload.eventType === 'INSERT') {
            toast({
              title: "🎉 New Booking Received!",
              description: "A new appointment has been booked. Check pending bookings below.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log("🔕 Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [currentSalon, refreshBookings, toast]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 animate-pulse">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;

    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-l-amber-500 bg-amber-50";
      case "confirmed":
        return "border-l-green-500 bg-green-50";
      case "completed":
        return "border-l-blue-500 bg-blue-50";
      case "cancelled":
        return "border-l-red-500 bg-red-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getCustomerTypeBadge = (customerType?: 'new' | 'returning') => {
    if (!customerType) return null;

    if (customerType === 'new') {
      return (
        <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 font-semibold">
          🆕 New Customer
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 font-semibold">
          🔁 Returning Customer
        </Badge>
      );
    }
  };

  const formatBookingTime = (date: string, time: string) => {
    try {
      const bookingDate = parseISO(date);
      const [hours, minutes] = time.split(':');
      const bookingDateTime = new Date(bookingDate);
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes));

      if (isToday(bookingDate)) {
        return `Today at ${format(bookingDateTime, 'h:mm a')}`;
      } else {
        return `${format(bookingDate, 'MMM d')} at ${format(bookingDateTime, 'h:mm a')}`;
      }
    } catch (error) {
      return `${date} at ${time}`;
    }
  };

  // Loading states
  if (authLoading || salonLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentSalon) {
    return null;
  }

  // Stats cards configuration
  const statCards = [
    {
      title: "New Bookings (24h)",
      value: stats.pendingAppointments,
      icon: AlertCircle,
      trend: stats.newBookingsCount > 0 ? `${stats.newBookingsCount} in last hour` : "No new bookings",
      trendUp: stats.newBookingsCount > 0,
      color: stats.pendingAppointments > 0 ? "from-blue-500 to-blue-600" : "from-green-500 to-green-600",
      bgColor: stats.pendingAppointments > 0 ? "bg-blue-50" : "bg-green-50",
      iconColor: stats.pendingAppointments > 0 ? "text-blue-600" : "text-green-600",
      urgent: stats.pendingAppointments > 0,
    },
    {
      title: "Appointments Scheduled Today",
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
      value: `₹${stats.todayRevenue.toLocaleString()}`,
      icon: IndianRupee,
      trend: `${stats.todayAppointments} completed`,
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
      trend: `All time`,
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
        {/* Header with Real-time Status */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent`}>
                Booking Dashboard
              </h1>
              <Badge className="bg-gradient-to-r from-accent to-accent/80 text-white border-0 animate-pulse">
                Live
              </Badge>
              {stats.newBookingsCount > 0 && (
                <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 animate-bounce">
                  {stats.newBookingsCount} New
                </Badge>
              )}
            </div>
            <p className={`text-muted-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
              Real-time booking management for <span className="font-medium text-foreground">{currentSalon.name}</span>
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
                className="border-border/50 hover:bg-secondary/50"
              >
                <Activity className="w-4 h-4 mr-2" />
                All Appointments
              </Button>
              <Button
                onClick={() => navigate("/dashboard/appointments")}
                className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-white shadow-lg shadow-accent/25"
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
              className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm ${stat.urgent ? 'ring-2 ring-amber-200 animate-pulse' : ''
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
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.urgent ? 'animate-bounce' : ''
                    }`}>
                    <stat.icon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} ${stat.iconColor}`} />
                  </div>
                </div>
                <div className={`${isMobile ? 'mt-3' : 'mt-4'} flex items-center gap-2`}>
                  {stat.trendUp ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <ArrowUpRight className="w-4 h-4" />
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{stat.trend}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Bell className="w-4 h-4" />
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{stat.trend}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Bookings Section */}
        {pendingBookings.length > 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  New Bookings ({pendingBookings.length})
                </CardTitle>
                <Badge className="bg-blue-200 text-blue-800">
                  Recently Added
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingBookings.map((booking) => (
                <Card key={booking.id} className={`border-l-4 ${getStatusColor(booking.status)} hover:shadow-md transition-all hover:opacity-100 bg-white`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Customer Avatar */}
                        <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                          <AvatarImage src={booking.customer?.avatar_url || ""} />
                          <AvatarFallback className="bg-accent text-white font-bold">
                            {booking.customer?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        {/* Booking Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-2">
                              <h3 className="font-semibold text-lg">
                                {booking.customer?.full_name || 'Unknown Customer'}
                              </h3>
                              {getCustomerTypeBadge(booking.customerType)}
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Star className="w-4 h-4 text-accent" />
                              <span className="font-medium">{booking.service?.name}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="font-bold text-accent">₹{booking.service?.price}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{formatBookingTime(booking.booking_date, booking.booking_time)}</span>
                              <span>•</span>
                              <Clock className="w-4 h-4" />
                              <span>{booking.service?.duration_minutes} min</span>
                            </div>

                            {booking.customer?.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <span>{booking.customer.phone}</span>
                              </div>
                            )}

                            {booking.notes && (
                              <div className="mt-2 p-2 bg-white/50 rounded text-sm">
                                <span className="font-medium">Note:</span> {booking.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/dashboard/appointments?booking=${booking.id}`)}
                          className="text-blue-600 hover:bg-blue-50 bg-white border border-blue-100"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Performance & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-accent/5 to-accent/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  Today's Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Appointments</span>
                    <span className="font-medium">{stats.todayAppointments}/12</span>
                  </div>
                  <Progress value={(stats.todayAppointments / 12) * 100} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue Goal</span>
                    <span className="font-medium">₹{stats.todayRevenue}/₹5000</span>
                  </div>
                  <Progress value={(stats.todayRevenue / 5000) * 100} className="h-2" />
                </div>
                <div className="pt-2 flex items-center gap-2 text-sm text-accent">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">Great progress today!</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard/appointments")}
                  className="w-full justify-start bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 border-0 h-auto p-4 flex-col items-start hover:bg-gradient-to-r"
                >
                  <Calendar className="w-6 h-6 mb-2" />
                  <span className="font-semibold">New Appointment</span>
                  <span className="text-xs opacity-80">Book a service</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard/customers")}
                  className="w-full justify-start bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 border-0 h-auto p-4 flex-col items-start hover:bg-gradient-to-r"
                >
                  <Users className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Add Customer</span>
                  <span className="text-xs opacity-80">Register new client</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard/services")}
                  className="w-full justify-start bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200 border-0 h-auto p-4 flex-col items-start hover:bg-gradient-to-r"
                >
                  <Star className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Manage Services</span>
                  <span className="text-xs opacity-80">Update pricing</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard/reports")}
                  className="w-full justify-start bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 hover:from-orange-100 hover:to-orange-200 border-0 h-auto p-4 flex-col items-start hover:bg-gradient-to-r"
                >
                  <TrendingUp className="w-6 h-6 mb-2" />
                  <span className="font-semibold">View Analytics</span>
                  <span className="text-xs opacity-80">Business insights</span>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Recent Bookings</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/dashboard/appointments")}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-10 h-10 bg-secondary rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-secondary rounded w-1/3"></div>
                          <div className="h-3 bg-secondary rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No recent bookings</p>
                    <p className="text-sm text-muted-foreground">New appointments will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${getStatusColor(booking.status)} hover:shadow-sm transition-all`}>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={booking.customer?.avatar_url || ""} />
                          <AvatarFallback className="bg-accent text-white text-sm">
                            {booking.customer?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <p className="font-medium">{booking.customer?.full_name || 'Unknown Customer'}</p>
                              {getCustomerTypeBadge(booking.customerType)}
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{booking.service?.name}</span>
                            <span>•</span>
                            <span>{formatBookingTime(booking.booking_date, booking.booking_time)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-accent">₹{booking.service?.price}</p>
                          <p className="text-xs text-muted-foreground">{booking.service?.duration_minutes} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Today's Schedule & Notifications */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-3">
                    {todaysAppointments.slice(0, 4).map((booking) => (
                      <div key={booking.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20">
                        <div className="w-2 h-8 bg-accent rounded-full"></div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{booking.service?.name}</p>
                            {getCustomerTypeBadge(booking.customerType)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {booking.customer?.full_name} • {booking.booking_time}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    ))}
                    {todaysAppointments.length === 0 && (
                      <div className="text-center py-6">
                        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No appointments today</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-purple-800">Quick Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">Active Customers</span>
                  </div>
                  <span className="font-bold text-purple-800">{stats.totalCustomers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">Today's Revenue</span>
                  </div>
                  <span className="font-bold text-green-800">₹{stats.todayRevenue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Appointments</span>
                  </div>
                  <span className="font-bold text-blue-800">{stats.todayAppointments}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Quick Actions */}
        {isMobile && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate("/dashboard/appointments")}
                className="bg-gradient-to-r from-accent to-accent/90 text-white h-auto p-4 flex-col items-start"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span className="font-semibold">New Booking</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => refreshBookings(true)}
                disabled={refreshing}
                className="h-auto p-4 flex-col items-start"
              >
                <RefreshCw className={`w-6 h-6 mb-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="font-semibold">Refresh</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsiveDashboardLayout>
  );
}