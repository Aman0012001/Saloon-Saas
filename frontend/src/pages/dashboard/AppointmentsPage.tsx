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
  Scissors,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { TreatmentRecordModal } from "@/components/dashboard/TreatmentRecordModal";
import { sendAppointmentConfirmation } from "@/utils/whatsapp";
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
import { format, addDays, startOfWeek, isSameDay, addMonths } from "date-fns";
import { cn } from "@/lib/utils";

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
  staff_id?: string;
  staff_name?: string;
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
  isReturning?: boolean;
  price_paid?: number;
  discount_amount?: number;
  coupon_code?: string;
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
  const [viewType, setViewType] = useState<"list" | "calendar">("list");
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
    staffId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00",
    notes: "",
  });
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Staff Assignment State
  const [showStaffAssignment, setShowStaffAssignment] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assigningStaff, setAssigningStaff] = useState(false);

  const assignStaffToBooking = async (staffId: string) => {
    if (!selectedBooking) return;

    setAssigningStaff(true);
    try {
      await api.bookings.updateStatus(selectedBooking.id, selectedBooking.status, staffId);

      toast({
        title: "Staff Assigned",
        description: "The specialist has been successfully assigned to this booking.",
      });

      // Update local state to reflect change
      setBookings(prev => prev.map(b =>
        b.id === selectedBooking.id
          ? { ...b, staff_id: staffId, staff_name: staffMembers.find(s => s.id === staffId)?.display_name }
          : b
      ));

      setShowStaffAssignment(false);
    } catch (error) {
      console.error("Error assigning staff:", error);
      toast({
        title: "Error",
        description: "Failed to assign staff member",
        variant: "destructive",
      });
    } finally {
      setAssigningStaff(false);
    }
  };

  // Follow-up Reminder State
  const [showFollowupDialog, setShowFollowupDialog] = useState(false);
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("09:00");
  const [selectedBookingForFollowup, setSelectedBookingForFollowup] = useState<any>(null);
  const [selectedRecordBooking, setSelectedRecordBooking] = useState<any>(null);

  const handleScheduleFollowup = (booking: any) => {
    setSelectedBookingForFollowup(booking);
    // Default to 1 month later
    setFollowupDate(format(addMonths(new Date(), 1), "yyyy-MM-dd"));
    setShowFollowupDialog(true);
  };

  const confirmFollowup = async () => {
    if (!selectedBookingForFollowup || !followupDate) return;
    try {
      await api.reminders.create({
        user_id: selectedBookingForFollowup.user_id,
        salon_id: currentSalon?.id,
        booking_id: selectedBookingForFollowup.id,
        title: "Follow-up Reminder",
        message: `Hi ${selectedBookingForFollowup.user_name || 'there'}, we hope you're doing well! It's time to book your next ${selectedBookingForFollowup.service_name || 'session'} at ${currentSalon?.name}.`,
        scheduled_at: `${followupDate} ${followupTime}:00`,
        reminder_type: 'automated_followup'
      });
      toast({ title: "Follow-up Scheduled", description: "Customer will be automatically reminded." });
      setShowFollowupDialog(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to schedule reminder", variant: "destructive" });
    }
  };


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
      const enriched = data.map((b: any) => {
        // Find if returning customer
        const prevCount = data.filter((prev: any) => prev.user_id === b.user_id && prev.id !== b.id).length;

        return {
          ...b,
          isReturning: prevCount > 0,
          service: b.service_name ? {
            id: b.service_id,
            name: b.service_name,
            price: Number(b.price || 0),
            duration_minutes: Number(b.duration_minutes || 30)
          } : undefined,
          customer: b.full_name ? {
            full_name: b.full_name,
            phone: b.phone
          } : undefined,
          user_name: b.full_name,
          user_phone: b.phone
        };
      });

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
    const fetchServicesAndStaff = async () => {
      if (!currentSalon) return;
      try {
        const [servicesData, staffData] = await Promise.all([
          api.services.getBySalon(currentSalon.id),
          api.staff.getBySalon(currentSalon.id)
        ]);
        setAvailableServices(servicesData.filter((s: any) => s.is_active));
        setStaffMembers(staffData.filter((s: any) => s.is_active));
      } catch (e) {
        console.error("Error fetching services/staff:", e);
      }
    };

    fetchServicesAndStaff();
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

    // Duplicate Check
    const hasConflict = bookings.some(b =>
      b.booking_date === newBooking.date &&
      b.booking_time === newBooking.time &&
      b.staff_id === newBooking.staffId &&
      b.status !== 'cancelled'
    );

    if (hasConflict) {
      toast({
        title: "Schedule Conflict",
        description: "This staff member already has an appointment at this time.",
        variant: "destructive",
      });
      return;
    }

    setCreatingBooking(true);
    try {
      await api.bookings.create({
        salon_id: currentSalon.id,
        service_id: newBooking.serviceId,
        staff_id: newBooking.staffId || null,
        booking_date: newBooking.date,
        booking_time: newBooking.time,
        notes: `Walk-in: ${newBooking.customerName}${newBooking.customerPhone ? ' | ' + newBooking.customerPhone : ''}${newBooking.notes ? ' | ' + newBooking.notes : ''}`,
        status: "confirmed",
      });

      toast({
        title: "Appointment Created",
        description: `Appointment for ${newBooking.customerName} has been scheduled locally`,
      });

      // Quick WhatsApp Confirmation
      if (newBooking.customerPhone) {
        const salonInfo = currentSalon;
        const msgBooking = {
          user_name: newBooking.customerName,
          user_phone: newBooking.customerPhone,
          booking_date: newBooking.date,
          booking_time: newBooking.time,
          service_name: availableServices.find(s => s.id === newBooking.serviceId)?.name || 'Service'
        };
        sendAppointmentConfirmation(msgBooking, salonInfo);
      }

      // Reset form
      setNewBooking({
        customerName: "",
        customerPhone: "",
        serviceId: "",
        staffId: "",
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
            Needs Assignment
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
                    <div className="space-y-2">
                      <Label>Staff Member (Assign to)</Label>
                      <Select value={newBooking.staffId} onValueChange={v => setNewBooking({ ...newBooking, staffId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>
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
              className={`flex-shrink-0 font-bold ${statusFilter === "all" ? "bg-[#F2A93B] text-white" : ""}`}
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
            <Button
              variant={viewType === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("list")}
              className={`px-4 font-bold ${viewType === "list" ? "bg-white text-slate-900 shadow-sm" : "text-muted-foreground"}`}
            >
              List
            </Button>
            <Button
              variant={viewType === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("calendar")}
              className={`px-4 font-bold ${viewType === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-muted-foreground"}`}
            >
              Calendar
            </Button>
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

        {/* Calendar View Body */}
        {viewType === "calendar" && (
          <CalendarView
            bookings={bookings}
            selectedDate={selectedDate}
            onDateSelect={(d) => {
              setSelectedDate(d);
              if (viewMode === "all") setViewMode("day");
            }}
          />
        )}

        {/* Date Navigation for day/week views - Only in List mode or if specific mode selected */}
        {viewType === "list" && viewMode !== "all" && (
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

        {/* Desktop Search Bar (Standalone when expanded) - List mode only */}
        {!isMobile && viewType === "list" && (
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

        {/* Appointments List - Switches visibility but also shows details below calendar in desktop if needed? 
            For now, let's keep it strictly List mode only or filter it to show only selected day if coming from calendar */}
        {viewType === "list" && (
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
                            {(() => {
                              const walkInMatch = booking.notes?.match(/Walk-in:\s*([^|#\n]+)/);
                              if (walkInMatch && walkInMatch[1].trim() && walkInMatch[1].trim() !== "undefined") {
                                return walkInMatch[1].trim();
                              }

                              if (booking.user_name && (booking.user_id === user?.id || booking.user_name === user?.full_name)) {
                                return "Walk-in Customer";
                              }

                              return booking.user_name || "Walk-in Customer";
                            })()}
                            {booking.isReturning ? (
                              <Badge className="bg-blue-500/10 text-blue-600 border-none font-black text-[8px] uppercase tracking-widest px-1.5 h-4">Returning</Badge>
                            ) : (
                              <Badge className="bg-[#F2A93B]/10 text-[#F2A93B] border-none font-black text-[8px] uppercase tracking-widest px-1.5 h-4">New</Badge>
                            )}
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
                            {booking.staff_name && (
                              <span className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-lg text-amber-700">
                                <User className="w-3.5 h-3.5" />
                                {booking.staff_name}
                              </span>
                            )}
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
                          <p className="text-xl font-black text-slate-900 flex items-center justify-end gap-2">
                            {booking.discount_amount > 0 && (
                              <Badge className="bg-green-500/10 text-green-600 border-none text-[8px] font-black uppercase tracking-tighter">
                                Discount
                              </Badge>
                            )}
                            ${Number(booking.price || 0).toFixed(2)}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {booking.coupon_code ? `Promo: ${booking.coupon_code}` : 'Paid Amount'}
                          </p>
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
                              {(isOwner || isManager) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowStaffAssignment(true);
                                    }}
                                    className="rounded-xl py-3 font-bold text-amber-600 focus:bg-amber-50 focus:text-amber-700"
                                  >
                                    <Users className="w-4 h-4 mr-3" />
                                    Assign Specialist
                                  </DropdownMenuItem>

                                  {booking.status === "pending" && (
                                    <>
                                      <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "confirmed")} className="rounded-xl py-3 font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">
                                        <CheckCircle className="w-4 h-4 mr-3" />
                                        Confirm Booking
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "cancelled")} className="rounded-xl py-3 font-bold text-red-600 focus:bg-red-50 focus:text-red-700">
                                        <XCircle className="w-4 h-4 mr-3" />
                                        Reject Booking
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                              {(isOwner || isManager) && booking.status === "confirmed" && (
                                <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "completed")} className="rounded-xl py-3 font-bold text-blue-600 focus:bg-blue-50 focus:text-blue-700">
                                  <Star className="w-4 h-4 mr-3" />
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}
                              {booking.status === "completed" && (
                                <DropdownMenuItem onClick={() => setSelectedRecordBooking(booking)} className="rounded-xl py-3 font-bold text-blue-600 focus:bg-blue-50">
                                  <FileText className="w-4 h-4 mr-3" />
                                  Edit Treatment Record
                                </DropdownMenuItem>
                              )}

                              {(isOwner || isManager) && (
                                <DropdownMenuItem onClick={() => handleScheduleFollowup(booking)} className="rounded-xl py-3 font-bold text-indigo-600 focus:bg-indigo-50">
                                  <Clock className="w-4 h-4 mr-3" />
                                  Schedule Follow-up
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => navigate(`/salon/customers/${booking.user_id}`)} className="rounded-xl py-3 font-bold">
                                <User className="w-4 h-4 mr-3" />
                                View Customer Profile
                              </DropdownMenuItem>

                              {booking.user_phone && (
                                <DropdownMenuItem
                                  onClick={() => sendAppointmentConfirmation(booking, currentSalon)}
                                  className="rounded-xl py-3 font-bold text-emerald-600 focus:bg-emerald-50"
                                >
                                  <Phone className="w-4 h-4 mr-3" />
                                  Confirm via WhatsApp
                                </DropdownMenuItem>
                              )}
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
        )}

        {/* Staff Assignment Dialog */}
        <Dialog open={showStaffAssignment} onOpenChange={setShowStaffAssignment}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Assign Specialist</DialogTitle>
              <DialogDescription>
                Select a team member to handle this {selectedBooking?.service_name || 'service'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-3">
                {staffMembers.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No active staff members found.</p>
                ) : (
                  staffMembers.map((staff) => (
                    <button
                      key={staff.id}
                      disabled={assigningStaff}
                      onClick={() => assignStaffToBooking(staff.id)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group hover:border-accent hover:bg-accent/5",
                        selectedBooking?.staff_id === staff.id ? "border-accent bg-accent/5" : "border-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm ring-2 ring-accent/5">
                          <AvatarImage src={staff.avatar_url} />
                          <AvatarFallback className="bg-accent/10 text-accent font-bold">
                            {staff.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{staff.display_name}</p>
                          <p className="text-xs text-slate-500">{staff.role || 'Specialist'}</p>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-slate-300 group-hover:text-accent transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowStaffAssignment(false);
                setSelectedBooking(null);
              }}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Follow-up Scheduler Dialog */}
        <Dialog open={showFollowupDialog} onOpenChange={setShowFollowupDialog}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Follow-up</DialogTitle>
              <DialogDescription>
                Set a reminder for {selectedBookingForFollowup?.user_name} to book their next session.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Time (Optional)</Label>
                <Input
                  type="time"
                  value={followupTime}
                  onChange={(e) => setFollowupTime(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Clock className="w-3 h-3 inline mr-1 mb-0.5" />
                This will automatically notify the customer on the selected date.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowFollowupDialog(false)}>Cancel</Button>
              <Button onClick={confirmFollowup} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Set Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <TreatmentRecordModal
        booking={selectedRecordBooking}
        open={!!selectedRecordBooking}
        onOpenChange={(open) => {
          if (!open) setSelectedRecordBooking(null);
        }}
      />

    </ResponsiveDashboardLayout>
  );
}
