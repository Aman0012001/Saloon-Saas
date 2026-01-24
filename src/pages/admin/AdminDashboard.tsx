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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface RecentSalon {
  id: string;
  name: string;
  city: string | null;
  approval_status: string;
  created_at: string;
}

interface RecentBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  salon_name?: string;
  service_name?: string;
}

export default function AdminDashboard() {
  const { stats, refreshStats } = useSuperAdmin();
  const [recentSalons, setRecentSalons] = useState<RecentSalon[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        // Fetch recent salons
        const { data: salonsData } = await supabase
          .from('salons')
          .select('id, name, city, approval_status, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentSalons(salonsData || []);

        // Fetch recent bookings with salon and service names
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            booking_time,
            status,
            salon_id,
            service_id
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (bookingsData) {
          // Get salon and service names
          const salonIds = [...new Set(bookingsData.map(b => b.salon_id).filter(Boolean))];
          const serviceIds = [...new Set(bookingsData.map(b => b.service_id))];

          const [salonsResult, servicesResult] = await Promise.all([
            salonIds.length > 0 
              ? supabase.from('salons').select('id, name').in('id', salonIds)
              : { data: [] },
            supabase.from('services').select('id, name').in('id', serviceIds),
          ]);

          const salonsMap = new Map((salonsResult.data || []).map(s => [s.id, s.name]));
          const servicesMap = new Map((servicesResult.data || []).map(s => [s.id, s.name]));

          const enrichedBookings = bookingsData.map(b => ({
            ...b,
            salon_name: b.salon_id ? salonsMap.get(b.salon_id) : undefined,
            service_name: servicesMap.get(b.service_id),
          }));

          setRecentBookings(enrichedBookings);
        }
      } catch (error) {
        console.error('Error fetching recent data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentData();

    // Set up realtime subscription for bookings
    const bookingsChannel = supabase
      .channel('admin-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchRecentData();
          refreshStats();
        }
      )
      .subscribe();

    // Set up realtime subscription for salons
    const salonsChannel = supabase
      .channel('admin-salons')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salons' },
        () => {
          fetchRecentData();
          refreshStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(salonsChannel);
    };
  }, [refreshStats]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-0">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-0">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-0">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600 border-0">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-0">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-0">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-0">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and real-time activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Salons</p>
                  <p className="text-3xl font-bold">{stats?.totalSalons || 0}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm">
                    <Badge variant="outline" className="text-green-600">
                      {stats?.activeSalons || 0} active
                    </Badge>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{stats?.totalCustomers || 0}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{stats?.totalOwners || 0} salon owners</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Bookings</p>
                  <p className="text-3xl font-bold">{stats?.todayBookings || 0}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Real-time</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                  <p className="text-3xl font-bold">{stats?.pendingSalons || 0}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {(stats?.pendingSalons || 0) > 0 ? (
                      <Badge variant="destructive" className="text-xs">Action needed</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">All clear</span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Salon Registrations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Salon Registrations</CardTitle>
                <CardDescription>New salons awaiting approval</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/salons">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : recentSalons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Building2 className="h-8 w-8 mb-2 opacity-50" />
                    <p>No salons registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSalons.map((salon) => (
                      <div
                        key={salon.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{salon.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {salon.city || 'Location not set'} • {format(new Date(salon.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(salon.approval_status)}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Real-time booking activity</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/bookings">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2 opacity-50" />
                    <p>No bookings yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">{booking.service_name || 'Unknown Service'}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.salon_name || 'Unknown Salon'} • {format(new Date(booking.booking_date), 'MMM d')} at {booking.booking_time}
                            </p>
                          </div>
                        </div>
                        {getBookingStatusBadge(booking.status)}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/salons?status=pending">
                  <Clock className="h-5 w-5" />
                  <span>Review Pending</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/reports">
                  <TrendingUp className="h-5 w-5" />
                  <span>View Reports</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/marketing">
                  <Megaphone className="h-5 w-5" />
                  <span>Manage Banners</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to="/admin/settings">
                  <Settings className="h-5 w-5" />
                  <span>Platform Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}