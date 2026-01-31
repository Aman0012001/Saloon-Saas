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
import api from "@/services/api";
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

  const fetchRecentData = async () => {
    setLoading(true);
    try {
      // Fetch recent salons and bookings via the new API service
      const salonsPromise = api.admin.getAllSalons();
      const bookingsPromise = api.admin.getAllBookings();

      const [allSalons, allBookings] = await Promise.all([salonsPromise, bookingsPromise]);

      // Get top 5 recent ones
      setRecentSalons(allSalons.slice(0, 5));
      setRecentBookings(allBookings.slice(0, 5));

    } catch (error) {
      console.error('Error fetching recent data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentData();

    // Use polling instead of real-time for PHP backend
    const interval = setInterval(() => {
      fetchRecentData();
      refreshStats();
    }, 60000); // Every minute

    return () => clearInterval(interval);
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="px-4 sm:px-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Platform overview and real-time activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-0">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Salons</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{stats?.totalSalons || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      {stats?.activeSalons || 0} active
                    </Badge>
                  </div>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ml-2">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Users</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{stats?.totalCustomers || 0}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">{stats?.totalOwners || 0} salon owners</span>
                  </div>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 ml-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Today's Bookings</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{stats?.todayBookings || 0}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs sm:text-sm text-green-600">
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Real-time</span>
                  </div>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 ml-2">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending Approvals</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{stats?.pendingSalons || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {(stats?.pendingSalons || 0) > 0 ? (
                      <Badge variant="destructive" className="text-xs">Action needed</Badge>
                    ) : (
                      <span className="text-xs sm:text-sm text-muted-foreground">All clear</span>
                    )}
                  </div>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 ml-2">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-0">
          {/* Recent Salon Registrations */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-4 sm:p-6">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg truncate">Recent Salon Registrations</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">New salons awaiting approval</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9" asChild>
                <Link to="/super-admin/salons">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ScrollArea className="h-[250px] sm:h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : recentSalons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Building2 className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No salons registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 pr-4">
                    {recentSalons.map((salon) => (
                      <div
                        key={salon.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{salon.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {salon.city || 'Location not set'} • {format(new Date(salon.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          {getStatusBadge(salon.approval_status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-4 sm:p-6">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg truncate">Recent Bookings</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Real-time booking activity</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9" asChild>
                <Link to="/super-admin/bookings">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ScrollArea className="h-[250px] sm:h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No bookings yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 pr-4">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{booking.service_name || 'Unknown Service'}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {booking.salon_name || 'Unknown Salon'} • {format(new Date(booking.booking_date), 'MMM d')} at {booking.booking_time}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          {getBookingStatusBadge(booking.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mx-4 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Button variant="outline" className="h-auto py-3 sm:py-4 flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm" asChild>
                <Link to="/super-admin/salons?status=pending">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-center">Review Pending</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3 sm:py-4 flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm" asChild>
                <Link to="/super-admin/analytics">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-center">View Reports</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3 sm:py-4 flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm" asChild>
                <Link to="/super-admin/marketing">
                  <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-center">Manage Banners</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-3 sm:py-4 flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm" asChild>
                <Link to="/super-admin/settings">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-center">Platform Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
