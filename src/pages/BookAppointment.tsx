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
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
    if (!salonId) {
      toast({ title: "No Salon Selected", description: "Choosing the best for you...", variant: "default" });
      navigate("/salons");
      return;
    }
    fetchSalonAndServices();
  }, [salonId]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!salonId || !selectedDate) return;
      setLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const bookings = await api.bookings.getAll({ salon_id: salonId, date: dateStr });
        const booked = bookings.map((b: any) => b.booking_time.substring(0, 5));
        setBookedSlots(booked);
      } catch (err) {
        console.error("Error checking availability:", err);
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
      const salonData = await api.salons.getById(salonId);
      if (!salonData) throw new Error("Salon not found");
      setSalon(salonData);

      const servicesData = await api.services.getBySalon(salonId);
      setServices(servicesData || []);

      // Auto-select service if ID provided in URL
      const serviceId = searchParams.get("serviceId");
      if (serviceId && servicesData) {
        const preselected = servicesData.find((s: any) => s.id === serviceId);
        if (preselected) {
          setSelectedService(preselected);
          setStep(2); // Jump straight to time selection if service is known
        }
      }
    } catch (error) {
      console.error("Error fetching local salon data:", error);
      toast({ title: "Local Database Error", description: "Could not sync with XAMPP backend.", variant: "destructive" });
      navigate("/salons");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Identify yourself to secure this slot.", variant: "default" });
      navigate(`/signup?salonId=${salonId}`);
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime || !salonId) {
      toast({ title: "Missing Details", description: "Every detail matters for a perfect visit.", variant: "destructive" });
      return;
    }

    setBooking(true);
    try {
      await api.bookings.create({
        user_id: user.id,
        salon_id: salonId,
        service_id: selectedService.id,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime,
        notes: notes.trim() || null,
        status: "confirmed",
      });

      toast({ title: "Appointment Confirmed", description: "Recorded in the local vault successfully!" });
      setStep(4);
    } catch (error: any) {
      toast({ title: "Booking Failed", description: error.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <div className="max-w-3xl mx-auto space-y-8">

          {step < 4 && (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="rounded-full bg-white shadow-sm">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Secure Your Session</h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Booking at {salon?.name}</p>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex-1 flex items-center justify-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${step >= s ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-slate-50 text-slate-300'}`}>
                    {s}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {Object.entries(groupedServices).map(([category, items]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent ml-2">{category}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {items.map(service => (
                      <Card key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`cursor-pointer border-none shadow-sm transition-all hover:scale-[1.01] rounded-3xl overflow-hidden ${selectedService?.id === service.id ? 'ring-2 ring-accent' : ''}`}>
                        <CardContent className="p-6 flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-black text-slate-900 text-lg">{service.name}</h4>
                            <p className="text-sm text-slate-500 font-medium">{service.description}</p>
                            <Badge className="bg-slate-50 text-slate-400 border-none font-bold mt-2"><Clock className="w-3 h-3 mr-1" /> {service.duration_minutes}m</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-slate-900">${service.price}</p>
                            <div className={`w-6 h-6 rounded-full border-2 mt-2 flex items-center justify-center transition-all ${selectedService?.id === service.id ? 'bg-accent border-accent' : 'border-slate-200'}`}>
                              {selectedService?.id === service.id && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={() => setStep(2)} disabled={!selectedService} className="w-full h-16 rounded-3xl bg-accent text-white font-black text-lg shadow-xl shadow-accent/20">
                Select Time Slot
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-[2rem] p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="mx-auto"
                />
              </Card>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {timeSlots.map(time => {
                  const isBooked = bookedSlots.includes(time);
                  return (
                    <button key={time}
                      disabled={isBooked}
                      onClick={() => setSelectedTime(time)}
                      className={`h-14 rounded-2xl font-black transition-all ${isBooked ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : selectedTime === time ? 'bg-accent text-white shadow-lg' : 'bg-white text-slate-900 hover:bg-slate-50 shadow-sm'}`}>
                      {isBooked ? 'Taken' : time}
                    </button>
                  );
                })}
              </div>

              <Button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime} className="w-full h-16 rounded-3xl bg-accent text-white font-black text-lg shadow-xl shadow-accent/20">
                Review Details
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[2.5rem] p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Selection</p>
                    <h3 className="text-2xl font-black">{selectedService?.name}</h3>
                  </div>
                  <p className="text-3xl font-black text-accent">${selectedService?.price}</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Apppointment Date</p>
                    <p className="text-lg font-bold">{selectedDate ? format(selectedDate, "PPP") : '--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pick-up Time</p>
                    <p className="text-lg font-bold">{selectedTime}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/10">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Comments for Staff</Label>
                  <Textarea
                    placeholder="Add any specific requirements..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="bg-white/5 border-none h-24 rounded-2xl p-4 text-white focus:ring-1 focus:ring-accent"
                  />
                </div>
              </Card>

              <Button onClick={handleBooking} disabled={booking} className="w-full h-16 rounded-3xl bg-accent text-white font-black text-lg shadow-xl">
                {booking ? "Recording Transaction..." : "Complete Booking"}
              </Button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-12">
              <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-accent" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">You're All Set!</h1>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">Your appointment has been logged in the local database. We look forward to seeing you.</p>
              </div>
              <div className="pt-8 flex flex-col gap-4 max-w-xs mx-auto">
                <Button onClick={() => navigate("/my-bookings")} className="h-14 bg-slate-900 text-white font-black rounded-2xl w-full">Manage Bookings</Button>
                <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-400 font-bold hover:bg-slate-100 rounded-2xl">Return Home</Button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
