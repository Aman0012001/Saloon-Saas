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
import { supabase } from "@/integrations/supabase/client";
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
      let startDate: string;
      let endDate: string;

      if (viewMode === "all") {
        // Show all upcoming appointments from today onwards
        startDate = format(new Date(), "yyyy-MM-dd");
        endDate = format(addDays(new Date(), 365), "yyyy-MM-dd"); // Next year
      } else if (viewMode === "day") {
        startDate = format(selectedDate, "yyyy-MM-dd");
        endDate = startDate;
      } else {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        startDate = format(weekStart, "yyyy-MM-dd");
        endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");
      }

      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("salon_id", currentSalon.id)
        .gte("booking_date", startDate)
        .lte("booking_date", endDate)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });

      if (error) throw error;

      // Fetch related data
      const serviceIds = [...new Set(bookingsData?.map(b => b.service_id) || [])];
      const userIds = [...new Set(bookingsData?.map(b => b.user_id) || [])];

      const [{ data: services }, { data: profiles }] = await Promise.all([
        supabase.from("services").select("id, name, price, duration_minutes").in("id", serviceIds),
        supabase.from("profiles").select("user_id, full_name, phone").in("user_id", userIds),
      ]);

      const enrichedBookings = bookingsData?.map(booking => ({
        ...booking,
        service: services?.find(s => s.id === booking.service_id),
        customer: profiles?.find(p => p.user_id === booking.user_id),
      })) || [];

      setBookings(enrichedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
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

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("salon_id", currentSalon.id)
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        setAvailableServices(data);
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
      // Create a temporary user ID for walk-in customers
      const tempUserId = user?.id || "00000000-0000-0000-0000-000000000000";

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          salon_id: currentSalon.id,
          user_id: tempUserId,
          service_id: newBooking.serviceId,
          booking_date: newBooking.date,
          booking_time: newBooking.time,
          notes: `Walk-in: ${newBooking.customerName}${newBooking.customerPhone ? ' | ' + newBooking.customerPhone : ''}${newBooking.notes ? ' | ' + newBooking.notes : ''}`,
          status: "confirmed",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Appointment Created",
        description: `Appointment for ${newBooking.customerName} has been scheduled`,
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
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    } finally {
      setCreatingBooking(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Appointment ${status}`,
      });

      fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment",
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
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      !searchQuery ||
      booking.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service?.name.toLowerCase().includes(searchQuery.toLowerCase());
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
                <p className="text-xs text-blue-600 font-medium">Today</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-3 text-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-emerald-700">
                  {filteredBookings.filter(b => b.status === 'confirmed').length}
                </p>
                <p className="text-xs text-emerald-600 font-medium">Confirmed</p>
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
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                  {filteredBookings.length} Today
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">
                Manage bookings, walk-ins, and schedule appointments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-border/50 hover:bg-secondary/50"
                onClick={() => {
                  toast({
                    title: "Export Feature",
                    description: "Export functionality will be available soon",
                  });
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-white shadow-lg shadow-accent/25"
                onClick={() => {
                  toast({
                    title: "New Appointment",
                    description: "New appointment feature will be available soon",
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Quick Filters */}
        {isMobile && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={`flex-shrink-0 ${statusFilter === "all" ? "bg-accent text-white" : ""}`}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
              className={`flex-shrink-0 ${statusFilter === "pending" ? "bg-amber-500 text-white hover:bg-amber-600" : ""}`}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "confirmed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("confirmed")}
              className={`flex-shrink-0 ${statusFilter === "confirmed" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}`}
            >
              Confirmed
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("completed")}
              className={`flex-shrink-0 ${statusFilter === "completed" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}`}
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("cancelled")}
              className={`flex-shrink-0 ${statusFilter === "cancelled" ? "bg-red-500 text-white hover:bg-red-600" : ""}`}
            >
              Cancelled
            </Button>
          </div>
        )}

        {/* Desktop Search & Filters */}
        {!isMobile && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer name, phone, or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-secondary/30 border-border/50 focus:bg-white transition-colors text-base"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48 h-12 bg-secondary/30 border-border/50">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Appointments</SelectItem>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={viewMode} onValueChange={(v: "day" | "week" | "all") => setViewMode(v)}>
                  <SelectTrigger className="w-full lg:w-40 h-12 bg-secondary/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Upcoming</SelectItem>
                    <SelectItem value="day">Day View</SelectItem>
                    <SelectItem value="week">Week View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile View Mode Toggle */}
        {isMobile && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("day")}
              className={`flex-1 ${viewMode === "day" ? "bg-accent text-white" : ""}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Day View
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
              className={`flex-1 ${viewMode === "week" ? "bg-accent text-white" : ""}`}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Week View
            </Button>
          </div>
        )}

        {/* Date Navigation */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "lg"}
                onClick={() => setSelectedDate(addDays(selectedDate, viewMode === "day" ? -1 : -7))}
                className="border-border/50 hover:bg-secondary/50"
              >
                <ChevronLeft className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </Button>
              <div className="text-center flex-1 px-4">
                <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-foreground`}>
                  {viewMode === "day"
                    ? format(selectedDate, isMobile ? "MMM d, yyyy" : "EEEE, MMMM d, yyyy")
                    : `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`}
                </h3>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {viewMode === "day" ? "Daily Schedule" : "Weekly Overview"}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "lg"}
                onClick={() => setSelectedDate(addDays(selectedDate, viewMode === "day" ? 1 : 7))}
                className="border-border/50 hover:bg-secondary/50"
              >
                <ChevronRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </Button>
            </div>

            {viewMode === "week" && (
              <div className={`grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-3'}`}>
                {weekDays.map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`${isMobile ? 'p-2' : 'p-4'} rounded-lg text-center transition-all duration-200 ${isSameDay(day, selectedDate)
                      ? "bg-gradient-to-br from-accent to-accent/90 text-white shadow-md"
                      : "hover:bg-secondary/50 border border-border/30"
                      }`}
                  >
                    <p className={`text-xs font-medium ${isSameDay(day, selectedDate) ? "text-white/80" : "text-muted-foreground"
                      }`}>
                      {format(day, "EEE")}
                    </p>
                    <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold mt-1 ${isSameDay(day, selectedDate) ? "text-white" : "text-foreground"
                      }`}>
                      {format(day, "d")}
                    </p>
                    <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${bookings.some(b => isSameDay(new Date(b.booking_date), day))
                      ? isSameDay(day, selectedDate) ? "bg-white" : "bg-accent"
                      : "bg-transparent"
                      }`} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
                  {filteredBookings.length} Appointment{filteredBookings.length !== 1 && "s"}
                </CardTitle>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {viewMode === "day"
                      ? format(selectedDate, "EEEE, MMMM d")
                      : `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d")}`
                    }
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex items-center gap-3 ${isMobile ? 'p-3' : 'p-4'} rounded-lg bg-secondary/20 animate-pulse`}>
                    <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-secondary/50 rounded-lg`} />
                    <div className="flex-1 space-y-2">
                      <div className="w-32 h-4 bg-secondary/50 rounded" />
                      <div className="w-24 h-3 bg-secondary/50 rounded" />
                    </div>
                    <div className="w-16 h-6 bg-secondary/50 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Calendar className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground`} />
                </div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-foreground mb-2`}>No appointments found</h3>
                <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No appointments scheduled for this period"
                  }
                </p>
                <Button
                  size={isMobile ? "sm" : "default"}
                  className="bg-gradient-to-r from-accent to-accent/90 text-white"
                  onClick={() => {
                    toast({
                      title: "New Appointment",
                      description: "New appointment feature will be available soon",
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`group flex ${isMobile ? 'flex-col' : 'flex-row items-center'} justify-between ${isMobile ? 'p-3' : 'p-4'} rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 transition-all duration-200 border border-border/20 hover:border-border/40`}
                  >
                    <div className={`flex items-center ${isMobile ? 'gap-3 w-full' : 'gap-4'}`}>
                      {/* Time & Duration */}
                      <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 flex flex-col items-center justify-center border border-accent/20`}>
                        <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-accent`}>
                          {booking.booking_time.slice(0, 5)}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {booking.service?.duration_minutes || 30}m
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} ring-2 ring-accent/20`}>
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/10 text-accent font-semibold text-xs">
                            {booking.customer?.full_name?.charAt(0) || "W"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-foreground ${isMobile ? 'text-sm' : 'text-base'} truncate`}>
                            {booking.customer?.full_name || "Walk-in Customer"}
                          </p>
                          <div className={`flex ${isMobile ? 'flex-col gap-0' : 'items-center gap-3'} mt-0.5`}>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground truncate`}>
                              {booking.service?.name || "General Service"}
                            </p>
                            {booking.customer?.phone && (
                              <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{booking.customer.phone}</span>
                              </div>
                            )}
                          </div>
                          {viewMode === "week" && (
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                              {format(new Date(booking.booking_date), "EEE, MMM d")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Status */}
                    <div className={`flex items-center ${isMobile ? 'justify-between mt-3 pt-3 border-t border-border/20 w-full' : 'gap-3'}`}>
                      <div className={`${isMobile ? 'text-left' : 'text-right'}`}>
                        <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-foreground`}>
                          ₹{booking.service?.price || 0}
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                          Service fee
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}

                        {/* Action Buttons */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9 opacity-0 group-hover:opacity-100'} transition-opacity hover:bg-secondary/50`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {(isOwner || isManager) && booking.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                  className="text-emerald-600 hover:bg-emerald-50"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Confirm Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel Appointment
                                </DropdownMenuItem>
                              </>
                            )}
                            {(isOwner || isManager) && booking.status === "confirmed" && (
                              <DropdownMenuItem
                                onClick={() => updateBookingStatus(booking.id, "completed")}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="hover:bg-secondary/50"
                              onClick={() => {
                                toast({
                                  title: "Customer Details",
                                  description: "Customer profile feature will be available soon",
                                });
                              }}
                            >
                              <User className="w-4 h-4 mr-2" />
                              View Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Appointment Dialog */}
      <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for a customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={newBooking.customerName}
                onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
              />
            </div>

            {/* Customer Phone */}
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="Enter phone number"
                value={newBooking.customerPhone}
                onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
              />
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service">Service *</Label>
              <Select
                value={newBooking.serviceId}
                onValueChange={(value) => setNewBooking({ ...newBooking, serviceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ₹{service.price} ({service.duration_minutes}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Select
                  value={newBooking.time}
                  onValueChange={(value) => setNewBooking({ ...newBooking, time: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
                      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"].map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests or notes"
                value={newBooking.notes}
                onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNewAppointment(false)}
                disabled={creatingBooking}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-accent to-accent/90"
                onClick={createNewAppointment}
                disabled={creatingBooking || !newBooking.customerName || !newBooking.serviceId}
              >
                {creatingBooking ? "Creating..." : "Create Appointment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ResponsiveDashboardLayout>
  );
}
