import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  salon_name?: string;
  service_name?: string;
  customer_name?: string;
  customer_email?: string;
}

export default function AdminBookings() {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!bookingsData) {
        setBookings([]);
        return;
      }

      // Get salon and service names
      const salonIds = [...new Set(bookingsData.map(b => b.salon_id).filter(Boolean))];
      const serviceIds = [...new Set(bookingsData.map(b => b.service_id))];
      const userIds = [...new Set(bookingsData.map(b => b.user_id))];

      const [salonsResult, servicesResult, profilesResult] = await Promise.all([
        salonIds.length > 0 
          ? supabase.from('salons').select('id, name').in('id', salonIds)
          : { data: [] },
        supabase.from('services').select('id, name').in('id', serviceIds),
        supabase.from('profiles').select('user_id, full_name').in('user_id', userIds),
      ]);

      const salonsMap = new Map((salonsResult.data || []).map(s => [s.id, s.name]));
      const servicesMap = new Map((servicesResult.data || []).map(s => [s.id, s.name]));
      const profilesMap = new Map((profilesResult.data || []).map(p => [p.user_id, p.full_name]));

      const enrichedBookings = bookingsData.map(b => ({
        ...b,
        salon_name: b.salon_id ? salonsMap.get(b.salon_id) : undefined,
        service_name: servicesMap.get(b.service_id),
        customer_name: profilesMap.get(b.user_id) || 'Unknown',
      }));

      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Real-time subscription
    const channel = supabase
      .channel('admin-bookings-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
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

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.salon_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesDate = !dateFilter || booking.booking_date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Enhanced Header with Dark Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-700 to-black p-8 text-white">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Booking Management</h1>
                  <p className="text-gray-300 text-lg">Monitor all appointments across the platform</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{bookings.length}</div>
              <div className="text-gray-300">Total Bookings</div>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-green-400/20 blur-2xl"></div>
        </div>

        {/* Enhanced Stats Cards - Dark Theme */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            const isActive = statusFilter === status;
            const colors = {
              all: 'from-gray-800 to-gray-900 text-gray-400',
              pending: 'from-gray-800 to-gray-900 text-yellow-400',
              confirmed: 'from-gray-800 to-gray-900 text-green-400',
              completed: 'from-gray-800 to-gray-900 text-blue-400',
              cancelled: 'from-gray-800 to-gray-900 text-red-400',
            };
            
            return (
              <Card 
                key={status}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-gradient-to-br ${colors[status as keyof typeof colors]} border border-gray-700 ${
                  isActive ? 'ring-2 ring-blue-500 shadow-xl' : ''
                }`}
                onClick={() => setStatusFilter(status)}
              >
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-white">{count}</p>
                  <p className="text-sm font-medium capitalize mt-1">{status === 'all' ? 'Total' : status}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Filters - Dark Theme */}
        <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer, salon, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-12 text-base bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-12 bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All Status</SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-gray-700 focus:bg-gray-700">Pending</SelectItem>
                  <SelectItem value="confirmed" className="text-white hover:bg-gray-700 focus:bg-gray-700">Confirmed</SelectItem>
                  <SelectItem value="completed" className="text-white hover:bg-gray-700 focus:bg-gray-700">Completed</SelectItem>
                  <SelectItem value="cancelled" className="text-white hover:bg-gray-700 focus:bg-gray-700">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full md:w-[180px] h-12 bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-gray-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Bookings Table - Dark Theme */}
        <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
          <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Platform Bookings</CardTitle>
                  <p className="text-sm text-gray-400">Showing {filteredBookings.length} bookings</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                  <Calendar className="h-10 w-10 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">No bookings found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-700/50 border-gray-600">
                    <TableHead className="font-semibold text-gray-300">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-300">Salon</TableHead>
                    <TableHead className="font-semibold text-gray-300">Service</TableHead>
                    <TableHead className="font-semibold text-gray-300">Date & Time</TableHead>
                    <TableHead className="font-semibold text-gray-300">Status</TableHead>
                    <TableHead className="font-semibold text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-700/50 transition-colors border-gray-600">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {booking.customer_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{booking.customer_name}</p>
                            <p className="text-sm text-gray-400">Customer</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{booking.salon_name || 'Unknown'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{booking.service_name || 'Unknown'}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-white">{format(new Date(booking.booking_date), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.booking_time}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetailsDialog(true);
                          }}
                          className="hover:bg-gray-700 text-gray-300"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog - Dark Theme */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Booking Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Booking #{selectedBooking?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Customer</Label>
                  <p className="font-medium text-white">{selectedBooking.customer_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">Salon</Label>
                  <p className="font-medium text-white">{selectedBooking.salon_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Service</Label>
                  <p className="font-medium text-white">{selectedBooking.service_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Date</Label>
                  <p className="font-medium text-white">
                    {format(new Date(selectedBooking.booking_date), 'PPP')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400">Time</Label>
                  <p className="font-medium text-white">{selectedBooking.booking_time}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Created</Label>
                  <p className="font-medium text-white">
                    {format(new Date(selectedBooking.created_at), 'PPP p')}
                  </p>
                </div>
              </div>
              {selectedBooking.notes && (
                <div>
                  <Label className="text-gray-400">Notes</Label>
                  <p className="mt-1 text-white">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}