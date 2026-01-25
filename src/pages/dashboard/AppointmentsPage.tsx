import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Phone,
  MapPin,
  Star,
  CalendarDays,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  user_id: string;
  service_id: string;
  service_name?: string;
  price?: number;
  duration_minutes?: number;
  user_name?: string;
  user_phone?: string;
  // For compatibility with UI
  service?: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  };
  customer?: {
    full_name: string | null;
    phone: string | null;
  };
}

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { currentSalon, loading: salonLoading, isOwner, isManager } = useSalon();
  const isMobile = useMobile();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showSearch, setShowSearch] = useState(false);

  // New Appointment Dialog State
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [newBooking, setNewBooking] = useState({
    customerName: "",
    customerPhone: "",
    serviceId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00",
    notes: "",
  });
  const [creatingBooking, setCreatingBooking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchBookings = async () => {
    if (!currentSalon) return;

    setLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (viewMode === "day") {
        startDate = format(selectedDate, "yyyy-MM-dd");
        endDate = startDate;
      } else if (viewMode === "week") {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        startDate = format(weekStart, "yyyy-MM-dd");
        endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");
      }

      // Using the generic getAll but passing date filters if necessary
      // Assuming the PHP backend handles start_date/end_date if we pass them
      const data = await api.bookings.getAll({
        salon_id: currentSalon.id,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      // Enrich data for UI if backend returns flat structure
      const enriched = data.map((b: any) => ({
        ...b,
        service: b.service_name ? {
          id: b.service_id,
          name: b.service_name,
          price: Number(b.price || 0),
          duration_minutes: Number(b.duration_minutes || 30)
        } : undefined,
        customer: b.user_name ? {
          full_name: b.user_name,
          phone: b.user_phone
        } : undefined
      }));

      setBookings(enriched);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments from local database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentSalon, selectedDate, viewMode]);

  // Fetch available services for new appointment
  useEffect(() => {
    const fetchServices = async () => {
      if (!currentSalon) return;
      try {
        const data = await api.services.getBySalon(currentSalon.id);
        setAvailableServices(data.filter((s: any) => s.is_active));
      } catch (e) {
        console.error("Error fetching services:", e);
      }
    };

    fetchServices();
  }, [currentSalon]);

  const createNewAppointment = async () => {
    if (!currentSalon || !newBooking.serviceId || !newBooking.customerName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setCreatingBooking(true);
    try {
      await api.bookings.create({
        salon_id: currentSalon.id,
        service_id: newBooking.serviceId,
        booking_date: newBooking.date,
        booking_time: newBooking.time,
        notes: `Walk-in: ${newBooking.customerName}${newBooking.customerPhone ? ' | ' + newBooking.customerPhone : ''}${newBooking.notes ? ' | ' + newBooking.notes : ''}`,
        status: "confirmed",
      });

      toast({
        title: "Appointment Created",
        description: `Appointment for ${newBooking.customerName} has been scheduled locally`,
      });

      // Reset form
      setNewBooking({
        customerName: "",
        customerPhone: "",
        serviceId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "10:00",
        notes: "",
      });
      setShowNewAppointment(false);

      // Refresh bookings
      fetchBookings();
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment in local DB",
        variant: "destructive",
      });
    } finally {
      setCreatingBooking(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await api.bookings.updateStatus(bookingId, status);

      toast({
        title: "Success",
        description: `Appointment ${status}`,
      });

      fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment locally",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border-0 font-medium text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-0 font-medium text-xs">
            <Star className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border-0 font-medium text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-0 font-medium text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs text-capitalize">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const customerName = booking.customer?.full_name || booking.user_name || "";
    const serviceName = booking.service?.name || booking.service_name || "";

    const matchesSearch =
      !searchQuery ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i)
  );

  if (authLoading || salonLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ResponsiveDashboardLayout
      headerActions={
        isMobile ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-accent to-accent/90 text-white px-3"
              onClick={() => setShowNewAppointment(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className={`space-y-${isMobile ? '4' : '6'} pb-${isMobile ? '20' : '0'}`}>
        {/* Mobile Search Bar */}
        {isMobile && showSearch && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-secondary/30 border-border/50 focus:bg-white transition-colors"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Header Stats */}
        {isMobile && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-3 text-center">
                <CalendarDays className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-700">{filteredBookings.length}</p>
                <p className="text-xs text-blue-600 font-medium">Results</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-3 text-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-emerald-700">
                  {filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length}
                </p>
                <p className="text-xs text-emerald-600 font-medium">Done/Conf</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-3 text-center">
                <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-amber-700">
                  {filteredBookings.filter(b => b.status === 'pending').length}
                </p>
                <p className="text-xs text-amber-600 font-medium">Pending</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Appointments
                </h1>
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-black">
                  {filteredBookings.length} Total
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg font-medium">
                Manage bookings and walk-ins from your local database
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-border/50 hover:bg-secondary/50 font-bold"
                onClick={() => {
                  toast({
                    title: "Export Feature",
                    description: "Exporting data from local database...",
                  });
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-white shadow-lg shadow-accent/25 font-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Schedule Appointment</DialogTitle>
                    <DialogDescription>Create a manual booking entry in the local database.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Customer Name</Label>
                      <Input
                        placeholder="Full Name"
                        value={newBooking.customerName}
                        onChange={e => setNewBooking({ ...newBooking, customerName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone (Optional)</Label>
                      <Input
                        placeholder="Phone number"
                        value={newBooking.customerPhone}
                        onChange={e => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Service</Label>
                      <Select value={newBooking.serviceId} onValueChange={v => setNewBooking({ ...newBooking, serviceId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableServices.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name} - ${s.price}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={newBooking.date}
                          onChange={e => setNewBooking({ ...newBooking, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={newBooking.time}
                          onChange={e => setNewBooking({ ...newBooking, time: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowNewAppointment(false)}>Cancel</Button>
                    <Button
                      onClick={createNewAppointment}
                      disabled={creatingBooking || !newBooking.serviceId || !newBooking.customerName}
                      className="bg-accent text-white font-bold"
                    >
                      {creatingBooking ? "Scheduling..." : "Create Appointment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={`flex-shrink-0 font-bold ${statusFilter === "all" ? "bg-slate-900 text-white" : ""}`}
            >
              All
            </Button>
            {["pending", "confirmed", "completed", "cancelled"].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={`flex-shrink-0 font-bold capitalize ${statusFilter === status ? "bg-accent text-white" : ""}`}
              >
                {status}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-xl">
            {["all", "day", "week"].map(mode => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode as any)}
                className={`px-4 font-bold capitalize ${viewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-muted-foreground"}`}
              >
                {mode === "all" ? "Upcoming" : mode}
              </Button>
            ))}
          </div>
        </div>

        {/* Date Navigation for day/week views */}
        {viewMode !== "all" && (
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, viewMode === "day" ? -1 : -7))}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-lg font-black tracking-tight">
                  {viewMode === "day"
                    ? format(selectedDate, "EEEE, MMM d, yyyy")
                    : `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, viewMode === "day" ? 1 : 7))}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {viewMode === "week" && (
                <div className="grid grid-cols-7 border-b">
                  {weekDays.map((day) => (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`py-4 text-center transition-colors ${isSameDay(day, selectedDate) ? "bg-accent/5" : "hover:bg-secondary/20"}`}
                    >
                      <p className={`text-[10px] font-black uppercase tracking-wider ${isSameDay(day, selectedDate) ? "text-accent" : "text-muted-foreground"}`}>
                        {format(day, "EEE")}
                      </p>
                      <p className={`text-xl font-black mt-1 ${isSameDay(day, selectedDate) ? "text-accent" : "text-foreground"}`}>
                        {format(day, "d")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Desktop Search Bar (Standalone when expanded) */}
        {!isMobile && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Filter by customer, service or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl text-lg font-medium"
            />
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-sm animate-pulse h-24 bg-white" />
            ))
          ) : filteredBookings.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground">No bookings found</h3>
              <p className="text-muted-foreground mt-1">No appointments match your current filters or selected date.</p>
              <Button
                variant="outline"
                className="mt-6 border-accent/20 text-accent font-bold rounded-xl"
                onClick={() => { setStatusFilter("all"); setSearchQuery(""); setViewMode("all"); }}
              >
                Clear all filters
              </Button>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card
                key={booking.id}
                className="group border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden rounded-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-center">
                  {/* Time Badge - Styled for prominence */}
                  <div className="bg-slate-50 md:w-32 p-6 flex md:flex-col items-center justify-center border-b md:border-b-0 md:border-r gap-3 md:gap-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">
                      {booking.booking_time.slice(0, 5)}
                    </span>
                    <Badge variant="secondary" className="bg-white border-slate-200 text-slate-500 font-bold text-[10px] uppercase px-2">
                      {booking.duration_minutes || booking.service?.duration_minutes || 30} MINS
                    </Badge>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-sm ring-2 ring-accent/5">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/10 text-accent font-black">
                          {(booking.user_name || "W").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          {booking.user_name || booking.customer?.full_name || "Walk-in Customer"}
                          {isSameDay(new Date(booking.booking_date), new Date()) && (
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                          <span className="flex items-center gap-1.5 bg-slate-100/80 px-2 py-0.5 rounded-lg text-slate-600">
                            <Scissors className="w-3.5 h-3.5" />
                            {booking.service_name || booking.service?.name || "General Service"}
                          </span>
                          {viewMode === "all" || viewMode === "week" ? (
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {format(new Date(booking.booking_date), "MMM d")}
                            </span>
                          ) : null}
                          {booking.user_phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              {booking.user_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end md:self-auto">
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-900">${booking.price || booking.service?.price || 0}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paid Amount</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                              <MoreHorizontal className="w-5 h-5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl">
                            {(isOwner || isManager) && booking.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "confirmed")} className="rounded-xl py-3 font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">
                                  <CheckCircle className="w-4 h-4 mr-3" />
                                  Accept Booking
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "cancelled")} className="rounded-xl py-3 font-bold text-red-600 focus:bg-red-50 focus:text-red-700">
                                  <XCircle className="w-4 h-4 mr-3" />
                                  Reject Booking
                                </DropdownMenuItem>
                              </>
                            )}
                            {(isOwner || isManager) && booking.status === "confirmed" && (
                              <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "completed")} className="rounded-xl py-3 font-bold text-blue-600 focus:bg-blue-50 focus:text-blue-700">
                                <Star className="w-4 h-4 mr-3" />
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/customers/${booking.user_id}`)} className="rounded-xl py-3 font-bold">
                              <User className="w-4 h-4 mr-3" />
                              View Customer Profile
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </ResponsiveDashboardLayout>
  );
}
