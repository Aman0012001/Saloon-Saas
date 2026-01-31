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
import api from "@/services/api";
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
  user_name?: string;
  user_email?: string;
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
      // Fetch all bookings from the local PHP Admin API
      const data = await api.admin.getAllBookings();
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching admin bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // For local backend, we can optionally use polling
    const interval = setInterval(fetchBookings, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-0">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-0">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-400 border-0">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-400 border-0">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const customerName = booking.user_name || "";
    const salonName = booking.salon_name || "";
    const serviceName = booking.service_name || "";

    const matchesSearch =
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchQuery.toLowerCase());

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
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="h-14 w-14 rounded-2xl bg-accent/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Calendar className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tight">Platform Bookings</h1>
                  <p className="text-slate-400 font-medium">Monitoring local backend activity across all salons</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-4xl font-black text-white">{bookings.length}</div>
              <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Logged</div>
            </div>
          </div>
        </div>

        {/* Stats Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`p-6 rounded-2xl transition-all duration-300 text-center border-none shadow-sm ${isActive ? 'bg-accent text-white scale-105 shadow-xl shadow-accent/20' : 'bg-white text-slate-400 hover:bg-slate-50'
                  }`}
              >
                <p className={`text-2xl font-black ${isActive ? 'text-white' : 'text-slate-900'}`}>{count}</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 capitalize">{status}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search by ID, Customer, Salon, or Service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-slate-50 border-none rounded-2xl font-medium text-black"
                />
              </div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full md:w-[220px] h-14 bg-slate-50 border-none rounded-2xl font-bold"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Calendar className="h-16 w-16 opacity-20 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">No records found</h3>
                <p className="font-medium">Try clearing your filters for the local database</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-black text-slate-900 h-14 px-6">CUSTOMER</TableHead>
                    <TableHead className="font-black text-slate-900">SALON</TableHead>
                    <TableHead className="font-black text-slate-900">SERVICE</TableHead>
                    <TableHead className="font-black text-slate-900">DATE & TIME</TableHead>
                    <TableHead className="font-black text-slate-900">STATUS</TableHead>
                    <TableHead className="font-black text-slate-900 text-right px-6">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-black">
                            {booking.user_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{booking.user_name || 'Guest User'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{booking.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-700">{booking.salon_name || '---'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-700">{booking.service_name || '---'}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-black text-slate-900">{format(new Date(booking.booking_date), 'MMM d, yyyy')}</p>
                          <p className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.booking_time}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetailsDialog(true);
                          }}
                          className="hover:bg-accent/10 hover:text-accent font-bold rounded-xl"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
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

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-white border-none rounded-[2rem] shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Appointment #...</DialogTitle>
            <DialogDescription className="font-medium">Complete record of this local transaction</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-accent text-xl">
                  {selectedBooking.user_name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">{selectedBooking.user_name}</h4>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{selectedBooking.user_email || "No email provided"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Salon Entity</Label>
                  <p className="font-black text-slate-900">{selectedBooking.salon_name}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Service Booked</Label>
                  <p className="font-black text-slate-900">{selectedBooking.service_name}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</Label>
                  <p className="font-black text-slate-900">{format(new Date(selectedBooking.booking_date), 'PPP')}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time</Label>
                  <p className="font-black text-slate-900">{selectedBooking.booking_time}</p>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-100">
                  <Label className="text-[10px] font-black uppercase text-accent tracking-widest">Special Notes</Label>
                  <p className="mt-1 font-medium text-slate-700 italic">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
