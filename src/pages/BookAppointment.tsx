import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Clock, ArrowLeft, Loader2, MapPin, Phone, Star, CheckCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { notifySalonOwner } from "@/utils/bookingNotifications";
import { debugDatabase, createSampleData, fixServicesWithoutSalon, ensureServicesForSalon } from "@/utils/debugDatabase";
import Navbar from "@/components/Navbar";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  salon_id: string;
}

interface Salon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  business_hours: any;
  is_active: boolean;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
];

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const salonId = searchParams.get("salonId");
  const salonName = searchParams.get("salonName");

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // CRITICAL: Validate salon selection
    if (!salonId) {
      toast({
        title: "No Salon Selected",
        description: "Please select a salon first",
        variant: "destructive",
      });
      navigate("/salons");
      return;
    }

    fetchSalonAndServices();
  }, [salonId]);

  // Fetch booked slots when date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!salonId || !selectedDate) return;

      setLoadingSlots(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      console.log(`Checking availability for ${formattedDate} at salon ${salonId}`);

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('booking_time')
          .eq('salon_id', salonId)
          .eq('booking_date', formattedDate)
          .neq('status', 'cancelled'); // Don't count cancelled bookings

        if (error) {
          console.error("Error fetching slots:", error);
          return;
        }

        const booked = data.map(b => b.booking_time.substring(0, 5));
        setBookedSlots(booked);
        console.log("Booked slots (normalized):", booked);
      } catch (err) {
        console.error("Slot fetch error:", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [salonId, selectedDate]);

  const fetchSalonAndServices = async () => {
    if (!salonId) return;

    setLoading(true);
    try {
      // Debug database state
      console.log("🔍 Debugging database for salon:", salonId);
      const debugInfo = await debugDatabase();

      // Fetch salon details - CRITICAL: Verify salon exists and is active
      const { data: salonData, error: salonError } = await supabase
        .from("salons")
        .select("*")
        .eq("id", salonId)
        .eq("is_active", true)
        .single();

      if (salonError || !salonData) {
        console.error("Salon fetch error:", salonError);
        toast({
          title: "Salon Not Found",
          description: "The selected salon is not available",
          variant: "destructive",
        });
        navigate("/salons");
        return;
      }

      setSalon(salonData);
      console.log("✅ Salon found:", salonData.name);

      // Fetch services - CRITICAL: Only services for THIS salon
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("salon_id", salonId) // STRICT ISOLATION: Only this salon's services
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (servicesError) {
        console.error("Services fetch error:", servicesError);
        toast({
          title: "Error",
          description: "Could not load services for this salon",
          variant: "destructive",
        });
        return;
      }

      console.log("📋 Services found:", servicesData?.length || 0);
      setServices(servicesData || []);

      // If no services found, try to fix the issue
      if (!servicesData || servicesData.length === 0) {
        console.log("⚠️ No services found, attempting to create services for this salon...");

        toast({
          title: "Setting up services...",
          description: "Please wait while we prepare services for this salon.",
        });

        // Try to ensure services exist for this salon
        const ensured = await ensureServicesForSalon(salonId);
        if (ensured) {
          // Retry fetching services
          const { data: retryServices } = await supabase
            .from("services")
            .select("*")
            .eq("salon_id", salonId)
            .eq("is_active", true);

          if (retryServices && retryServices.length > 0) {
            setServices(retryServices);
            toast({
              title: "Services Ready!",
              description: "Services have been set up for this salon successfully.",
            });
            return;
          }
        }

        // If that didn't work, try the old method
        console.log("⚠️ Fallback: Checking for orphan services...");

        // Check if there are any services in the database at all
        const { data: allServices } = await supabase
          .from("services")
          .select("id, name, salon_id")
          .limit(5);

        console.log("All services in DB:", allServices);

        if (allServices && allServices.length > 0) {
          // Services exist but not for this salon
          const servicesWithoutSalon = allServices.filter(s => !s.salon_id);

          if (servicesWithoutSalon.length > 0) {
            console.log("🔧 Found services without salon_id, attempting to fix...");

            // Try to fix services
            const fixed = await fixServicesWithoutSalon(salonId);
            if (fixed) {
              // Retry fetching services
              const { data: retryServices } = await supabase
                .from("services")
                .select("*")
                .eq("salon_id", salonId)
                .eq("is_active", true);

              if (retryServices && retryServices.length > 0) {
                setServices(retryServices);
                toast({
                  title: "Services Ready!",
                  description: "Salon services have been set up successfully.",
                });
                return;
              }
            }
          }
        }

        // Last resort: redirect to admin setup
        toast({
          title: "No Services Available",
          description: "This salon currently has no services. Please contact support or try the admin setup.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching salon data:", error);
      toast({
        title: "Error",
        description: "Failed to load salon information",
        variant: "destructive",
      });
      navigate("/salons");
    } finally {
      setLoading(false);
    }
  };

  const [customerType, setCustomerType] = useState<"New" | "Returning">("New");

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book an appointment",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // CRITICAL VALIDATION: Ensure all required data is present
    if (!selectedService || !selectedDate || !selectedTime || !salonId || !salon) {
      toast({
        title: "Error",
        description: "Please select all required fields",
        variant: "destructive",
      });
      return;
    }

    // SECURITY CHECK: Verify service belongs to selected salon
    if (selectedService.salon_id !== salonId) {
      toast({
        title: "Security Error",
        description: "Invalid service selection",
        variant: "destructive",
      });
      return;
    }

    setBooking(true);

    try {
      // 1. DUPLICATE PREVENTION (Double Check)
      // Check if slot is still free immediately before booking
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('salon_id', salonId)
        .eq('booking_date', format(selectedDate, "yyyy-MM-dd"))
        .eq('booking_time', selectedTime)
        .neq('status', 'cancelled')
        .maybeSingle();

      if (existingBooking) {
        toast({
          title: "Slot No Longer Available",
          description: "So sorry! Someone just booked this slot differently. Please pick another time.",
          variant: "destructive",
        });
        setBookedSlots(prev => [...prev, selectedTime]); // Update local state
        setBooking(false);
        setStep(2); // Go back to time selection
        return;
      }

      // 2. TAG CUSTOMER (New vs Returning)
      const { count: previousBookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const type = (previousBookingsCount || 0) > 0 ? "Returning" : "New";
      setCustomerType(type);

      // 3. CREATE BOOKING
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          salon_id: salonId,
          service_id: selectedService.id,
          booking_date: format(selectedDate, "yyyy-MM-dd"),
          booking_time: selectedTime,
          notes: notes.trim() || null,
          status: "confirmed", // Auto-confirm per user request
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      // SUCCESS
      toast({
        title: "Booking Confirmed! 🎉",
        description: "Your appointment has been successfully scheduled.",
      });

      // Send notification to salon owner
      try {
        await notifySalonOwner({
          bookingId: bookingData.id,
          salonId: salonId,
          salonName: salon.name,
          customerName: user.user_metadata?.full_name || user.email?.split('@')[0] || "Customer",
          serviceName: selectedService.name,
          bookingDate: format(selectedDate, "PPP"),
          bookingTime: selectedTime,
          customerPhone: user.user_metadata?.phone,
        });
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
      }

      // Move to Success Step
      setStep(4);

    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  const getGoogleCalendarUrl = () => {
    if (!selectedDate || !selectedTime || !selectedService || !salon) return "";

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + selectedService.duration_minutes);

    const formatGoogleDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const details = `Service: ${selectedService.name}\nSalon: ${salon.name}\nAddress: ${salon.address || ''}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Appointment at ${salon.name}`)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(salon.address || "")}`;
  };

  const openWhatsAppConfirmation = () => {
    if (!salon || !selectedService || !selectedDate || !selectedTime) return;

    const message = `*Appointment Confirmation*\n\nSalon: ${salon.name}\nService: ${selectedService.name}\nDate: ${format(selectedDate, "PPP")}\nTime: ${selectedTime}\n\nPlease confirm my booking.`;
    const phone = salon.phone || "919999999999"; // Fallback to a valid format if null

    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ... (render logic continues)

  {/* Step 4: Success View */ }


  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <Button
          variant="ghost"
          onClick={() => step > 1 ? setStep(step - 1) : navigate("/salons")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step > 1 ? "Back" : "Back to Salons"}
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Salon Header - Show selected salon info */}
          {salon && (
            <Card className="mb-6 border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-accent/20">
                    <AvatarImage src={salon.logo_url || ""} alt={salon.name} />
                    <AvatarFallback className="bg-accent text-white font-bold text-lg">
                      {salon.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      Booking at {salon.name}
                    </h2>
                    {salon.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-4 h-4 text-accent" />
                        <span>
                          {salon.address}
                          {salon.city && `, ${salon.city}`}
                          {salon.pincode && ` - ${salon.pincode}`}
                        </span>
                      </div>
                    )}
                    {salon.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 text-accent" />
                        <span>{salon.phone}</span>
                      </div>
                    )}
                  </div>

                  <Badge className="bg-accent/10 text-accent border-accent/20">
                    Selected Salon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {s}
                </div>
                {s < 3 && <div className={cn("w-12 h-1 mx-1", step > s ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>

          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Select a Service</h1>
                <p className="text-muted-foreground">
                  Choose from {salon?.name}'s available services
                </p>
              </div>

              {services.length === 0 ? (
                <Card className="text-center p-8">
                  <CardContent>
                    <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Services Available</h3>
                    <p className="text-muted-foreground mb-4">
                      This salon currently has no services available for booking.
                    </p>
                    <Button onClick={() => navigate("/salons")}>
                      Browse Other Salons
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {Object.entries(groupedServices).map(([category, categoryServices]) => (
                    <div key={category}>
                      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-accent rounded-full"></span>
                        {category}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryServices.map((service) => (
                          <Card
                            key={service.id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md border-2",
                              selectedService?.id === service.id
                                ? "border-accent bg-accent/5"
                                : "border-transparent hover:border-accent/30"
                            )}
                            onClick={() => setSelectedService(service)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg flex items-center justify-between">
                                {service.name}
                                {selectedService?.id === service.id && (
                                  <Badge className="bg-accent text-white">Selected</Badge>
                                )}
                              </CardTitle>
                              <CardDescription>{service.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-accent">₹{service.price}</span>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {service.duration_minutes} min
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedService}
                    onClick={() => setStep(2)}
                  >
                    Continue with {selectedService?.name || "Selected Service"}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Select Date & Time</h1>
                <p className="text-muted-foreground">Pick your preferred appointment slot</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Selected Service
                    <Badge className="bg-accent/10 text-accent border-accent/20">
                      {salon?.name}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{selectedService?.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedService?.duration_minutes} minutes</p>
                    </div>
                    <span className="text-xl font-bold text-accent">₹{selectedService?.price}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date() || date.getDay() === 0}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingSlots ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((time) => {
                          const isBooked = bookedSlots.includes(time);
                          return (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              size="sm"
                              disabled={isBooked}
                              onClick={() => setSelectedTime(time)}
                              className={cn(
                                isBooked && "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 decoration-slate-500 line-through ring-0 border-slate-200"
                              )}
                              title={isBooked ? "This slot is already booked" : "Click to select"}
                            >
                              {isBooked ? "Booked" : time}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 3: Confirm Booking */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Confirm Booking</h1>
                <p className="text-muted-foreground">Review your appointment details</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                  <CardDescription>
                    Appointment at {salon?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Salon</span>
                    <span className="font-medium">{salon?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedDate && format(selectedDate, "PPP")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{selectedService?.duration_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold text-accent">₹{selectedService?.price}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleBooking}
                disabled={booking}
              >
                {booking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Success View (Moved to correct location) */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <div>
                <Badge variant="outline" className="mb-4 text-xs font-semibold uppercase tracking-wider">
                  {customerType === "New" ? "🎉 New Member" : "⭐ Returning Member"}
                </Badge>
                <h1 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Your appointment for <strong>{selectedService?.name}</strong> at <strong>{salon?.name}</strong> has been booked successfully.
                </p>
              </div>



              <div className="pt-8">
                <Button variant="link" onClick={() => navigate("/my-bookings")}>
                  View My Bookings &rarr;
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
