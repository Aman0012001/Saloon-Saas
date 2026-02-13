import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  ArrowLeft,
  Loader2,
  MapPin,
  Phone,
  Star,
  CheckCircle,
  CheckCircle2,
  MessageSquare,
  Coins,
  Sparkles,
  ChevronRight,
  User,
  ShieldCheck,
  Gem,
  Gift,
  PlusCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

const skinConcerns = [
  "Oily / Breakouts",
  "Redness / Sensitive",
  "Dry / Tired Skin",
  "Uneven Tone / Acne Scars",
  "Loss of Firmness"
];

const mainCategories = [
  { id: 'Facial', label: 'Facial', icon: Sparkles },
  { id: 'Body', label: 'Body (Coming Soon)', icon: User, disabled: true },
  { id: 'Other', label: 'Other', icon: PlusCircle }
];

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const salonId = searchParams.get("salonId");

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number, type?: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1); // 1 to 8

  // New States for 8-Step Flow
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [facialType, setFacialType] = useState<'custom' | 'advanced' | null>(null);
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'service' | 'decide_later' | 'package' | 'membership'>('service');
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // Member Details States
  const [memberDetails, setMemberDetails] = useState({
    fullName: "",
    email: "",
    phone: ""
  });

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [salonOffers, setSalonOffers] = useState<any[]>([]);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [coinPrice, setCoinPrice] = useState(1);
  const [coinSettings, setCoinSettings] = useState({
    min_redemption: 0,
    max_discount_percent: 100,
    earning_rate: 10
  });
  const [useCoins, setUseCoins] = useState(false);

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
    if (!loading && !user) {
      toast({
        title: "Login Required",
        description: "To reserve your bespoke experience, please join our community first.",
        variant: "default"
      });
      navigate(`/signup?salonId=${salonId}${searchParams.get("serviceId") ? `&serviceId=${searchParams.get("serviceId")}` : ""}`);
    }
  }, [user, loading, salonId, navigate]);

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

  useEffect(() => {
    const fetchAvailableStaff = async () => {
      if (!salonId) {
        setAvailableStaff([]);
        return;
      }
      setLoadingStaff(true);
      try {
        const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
        const staff = await api.staff.getAvailableSpecialists({
          salon_id: salonId,
          service_id: selectedServices[0]?.id,
          date: dateStr,
          time: selectedTime
        });
        setAvailableStaff(staff);
      } catch (err) {
        console.error("Error fetching available staff:", err);
        setAvailableStaff([]);
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchAvailableStaff();
  }, [salonId, selectedDate, selectedTime, selectedServices, bookingType]);

  const fetchSalonAndServices = async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      const salonData = await api.salons.getById(salonId);
      if (!salonData) throw new Error("Salon not found");
      setSalon(salonData);

      const servicesData = await api.services.getBySalon(salonId);
      setServices(servicesData || []);

      const offersData = await api.offers.getBySalon(salonId);
      setSalonOffers(offersData || []);

      // Pre-fill member details from user profile
      if (user) {
        setMemberDetails({
          fullName: user.full_name || "",
          email: user.email || "",
          phone: user.phone || ""
        });
      }

      // Auto-select service if ID provided in URL
      const serviceId = searchParams.get("serviceId");
      if (serviceId && servicesData) {
        const preselected = servicesData.find((s: any) => s.id === serviceId);
        if (preselected) {
          setSelectedServices([preselected]);
          setActiveCategory(preselected.category);
          setBookingType('service');
          setStep(2); // Jump to Add-ons
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

  useEffect(() => {
    const fetchCoins = async () => {
      if (!user) return;
      try {
        const data = await api.coins.getBalance();
        setUserCoins(Number(data.balance || 0));
        setCoinPrice(Number(data.price || 1));
        if (data.settings) {
          setCoinSettings(data.settings);
        }
      } catch (err) {
        console.error("Error fetching coins:", err);
      }
    };
    fetchCoins();
  }, [user]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !salonId || !policyAccepted) {
      toast({ title: "Incomplete Ritual", description: "Please complete all steps to reserve your session.", variant: "destructive" });
      return;
    }

    setBooking(true);
    try {
      const subtotal = calculateSubtotal();
      const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
      const coinDiscount = calculateCoinDiscount();
      const finalPrice = Math.max(0, subtotal - couponDiscount - coinDiscount);

      const bookingPayload = {
        user_id: user?.id,
        salon_id: salonId,
        staff_id: selectedStaffId,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime,
        notes: `[GUEST: ${memberDetails.fullName} | ${memberDetails.phone}] ${notes}`.trim(),
        status: "pending",
        use_coins: useCoins,
        price_paid: finalPrice,
        discount_amount: couponDiscount,
        coupon_code: appliedCoupon?.code
      };

      if (bookingType === 'decide_later' || (selectedServices.length === 0 && selectedAddOns.length === 0)) {
        await api.bookings.create({
          ...bookingPayload,
          service_id: selectedServices[0]?.id || null, // Default to first service if available, else null
          price_paid: finalPrice || 100 // Default price for decide_later if not specified
        });
      } else {
        // Distribute discount proportionally if multiple services (simplified: apply to first)
        const totalItems = [...selectedServices, ...selectedAddOns];
        for (let i = 0; i < totalItems.length; i++) {
          const service = totalItems[i];
          const serviceDiscount = i === 0 ? couponDiscount : 0;
          const serviceCoinDiscount = i === 0 ? coinDiscount : 0;
          await api.bookings.create({
            ...bookingPayload,
            service_id: service.id,
            price_paid: Math.max(0, Number(service.price) - serviceDiscount - serviceCoinDiscount),
            discount_amount: serviceDiscount
          });
        }
      }

      toast({
        title: "Booking Ritual Initiated!",
        description: "Your session is being prepared by our stylists."
      });
      setStep(6);
    } catch (error: any) {
      toast({ title: "Ritual Interrupted", description: error.message, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      // Call API to validate coupon using the newly added service
      const coupon = await api.coupons.validate(couponCode);

      if (coupon && coupon.is_active) {
        const subtotal = calculateSubtotal();
        const discountAmount = coupon.discount_type === 'percentage'
          ? (subtotal * coupon.discount_value / 100)
          : coupon.discount_value;

        setAppliedCoupon({
          code: coupon.code,
          discount: discountAmount,
          type: coupon.discount_type
        });
        setCouponError("");
        toast({
          title: "Coupon Applied!",
          description: `You saved RM ${discountAmount.toFixed(2)}`,
        });
      } else {
        setCouponError("Invalid or expired coupon code");
        toast({ title: "Invalid Coupon", description: "This coupon code is not valid.", variant: "destructive" });
      }
    } catch (error) {
      setCouponError("Invalid coupon code");
      toast({ title: "Invalid Coupon", description: "This coupon code is not valid.", variant: "destructive" });
    }
  };

  const calculateSubtotal = () => {
    if (bookingType === 'decide_later') return 100;
    const subtotal = [...selectedServices, ...selectedAddOns].reduce((sum, s) => sum + Number(s.price), 0);
    return subtotal;
  };

  const calculateCoinDiscount = () => {
    if (!useCoins || userCoins < coinSettings.min_redemption) return 0;

    const subtotal = calculateSubtotal();
    const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
    const remainingTotal = Math.max(0, subtotal - couponDiscount);

    // Calculate potential value of coins
    let potentialDiscount = userCoins * coinPrice;

    // Respect max_discount_percent
    const maxAllowedDiscount = (subtotal * coinSettings.max_discount_percent) / 100;
    potentialDiscount = Math.min(potentialDiscount, maxAllowedDiscount);

    // Cannot exceed remaining total
    return Math.min(potentialDiscount, remainingTotal);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const coinDiscount = calculateCoinDiscount();
    return Math.max(0, subtotal - discount - coinDiscount);
  };

  const validateMemberDetails = () => {
    if (!memberDetails.fullName.trim() || !memberDetails.email.trim() || !memberDetails.phone.trim()) {
      toast({
        title: "Details Required",
        description: "Please complete all member fields to proceed with your ritual.",
        variant: "destructive"
      });
      return false;
    }
    // Simple email valid check
    if (!memberDetails.email.includes('@')) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const getStepTitle = (s: number) => {
    switch (s) {
      case 1: return "Welcome to Noam Skin";
      case 2: return "Select Your Stylist";
      case 3: return "Registry Calendar";
      case 4: return "Member Details";
      case 5: return "Policy Review";
      case 6: return "Session Reserved";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Syncing Registry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Progress Header */}
          {step < 6 && (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                  className="rounded-full bg-white shadow-sm hover:shadow-md transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-1">Step 0{step} of 05</span>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">{getStepTitle(step)}</h1>
                </div>
              </div>

              <div className="flex gap-2 h-1.5 px-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`flex-1 rounded-full transition-all duration-500 ${step >= s ? (step === s ? 'bg-accent w-2/3' : 'bg-slate-900') : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: WELCOME */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12 py-12 text-center"
              >
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-accent" />
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                    Ready to start<br />your ritual?
                  </h2>
                  <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto italic">
                    Step into a space of calm. Select your services, find your stylist, and reserve your moment.
                  </p>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  className="h-20 px-16 bg-slate-900 hover:bg-black text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all hover:scale-105"
                >
                  Start Booking
                </Button>
              </motion.div>
            )}

            {/* STEP 2: SELECT THERAPIST (was Step 3) */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedStaffId(null)}
                    className={cn(
                      "p-8 rounded-[2rem] border-2 transition-all flex items-center gap-6",
                      !selectedStaffId ? "border-accent bg-accent/5 shadow-lg shadow-accent/5" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <User className={cn("w-8 h-8", !selectedStaffId ? "text-accent" : "text-slate-300")} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xl font-black text-slate-900 uppercase">Any Beautician</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Best for immediate registry</p>
                    </div>
                  </button>

                  {availableStaff.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => setSelectedStaffId(staff.id)}
                      className={cn(
                        "p-8 rounded-[2rem] border-2 transition-all flex items-center gap-6 text-left",
                        selectedStaffId === staff.id ? "border-accent bg-accent/5 shadow-lg shadow-accent/5" : "border-slate-100 bg-white hover:border-slate-200"
                      )}
                    >
                      <Avatar className="w-16 h-16 rounded-2xl border-4 border-white shadow-sm">
                        <AvatarImage src={staff.avatar_url} />
                        <AvatarFallback className="bg-slate-100 font-black text-slate-400">{staff.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase">{staff.display_name}</h4>
                        <p className="text-xs text-accent font-bold uppercase tracking-widest">Master Specialist</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => setStep(1)} variant="outline" className="h-20 rounded-[2.5rem] px-12 font-black uppercase tracking-widest">Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1 h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-lg shadow-xl">Select Time & Date</Button>
                </div>
              </motion.div>
            )}


            {/* STEP 3: REGISTRY CALENDAR - DATE & TIME */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const compareDate = new Date(date);
                        compareDate.setHours(0, 0, 0, 0);
                        return compareDate < today || date.getDay() === 0;
                      }}
                      className="mx-auto"
                    />
                  </Card>

                  <div className="space-y-8">
                    <div className="flex items-center gap-3 ml-2">
                      <Clock className="w-5 h-5 text-accent" />
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Available Time Slots</Label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {timeSlots.map(time => {
                        const isBooked = bookedSlots.includes(time);
                        return (
                          <button
                            key={time}
                            disabled={isBooked}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "h-16 rounded-2xl font-black transition-all text-sm uppercase",
                              isBooked ? "bg-slate-50 text-slate-200 cursor-not-allowed border border-slate-100" :
                                selectedTime === time ? "bg-accent text-white shadow-xl shadow-accent/20 scale-105" :
                                  "bg-white text-slate-900 hover:bg-slate-50 border border-slate-100 shadow-sm"
                            )}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTime && (
                      <div className="p-6 rounded-3xl bg-slate-900 text-white flex justify-between items-center animate-in slide-in-from-bottom-2">
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Selection</span>
                        <span className="text-lg font-black">{selectedDate ? format(selectedDate, "MMM dd") : ''} at {selectedTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => setStep(2)} variant="outline" className="h-20 rounded-[2.5rem] px-12 font-black uppercase tracking-widest">Back</Button>
                  <Button onClick={() => setStep(4)} disabled={!selectedDate || !selectedTime} className="flex-1 h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-lg shadow-xl">Complete Details</Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PERSONAL DETAILS (was Step 5) */}
            {step === 4 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                <Card className="border-none shadow-sm bg-white rounded-[3rem] p-12 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[5rem]" />
                  <div className="relative space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                        <Input
                          value={memberDetails.fullName}
                          onChange={(e) => setMemberDetails({ ...memberDetails, fullName: e.target.value })}
                          className="h-16 rounded-2xl bg-white border-2 border-slate-100 focus:border-accent px-6 font-bold"
                          placeholder="Your identity..."
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
                        <Input
                          value={memberDetails.email}
                          onChange={(e) => setMemberDetails({ ...memberDetails, email: e.target.value })}
                          className="h-16 rounded-2xl bg-white border-2 border-slate-100 focus:border-accent px-6 font-bold"
                          placeholder="ritual@noam.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</Label>
                      <Input
                        value={memberDetails.phone}
                        onChange={(e) => setMemberDetails({ ...memberDetails, phone: e.target.value })}
                        className="h-16 rounded-2xl bg-white border-2 border-slate-100 focus:border-accent px-6 font-bold"
                        placeholder="01X-XXX XXXX"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Additional Notes</Label>
                      <Textarea
                        className="h-32 rounded-3xl bg-white border-2 border-slate-100 focus:border-accent p-6 font-medium italic"
                        placeholder="Any allergies or specific requirements we should prepare for?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </Card>

                <div className="flex gap-4">
                  <Button onClick={() => setStep(3)} variant="outline" className="h-20 rounded-[2.5rem] px-12 font-black uppercase tracking-widest">Back</Button>
                  <Button onClick={() => setStep(5)} className="flex-1 h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-lg shadow-xl">Review & Policy</Button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: POLICY REVIEW (was Step 6) */}
            {step === 5 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[3rem] p-12 space-y-12">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-tighter border-b border-white/10 pb-6">Cancellation & House Policy</h3>
                    <div className="space-y-8 text-slate-400 font-medium italic leading-relaxed text-sm">
                      <p>We value everyone’s time and kindly request that any changes or cancellations be made at least 24 hours in advance.</p>
                      <div className="space-y-4">
                        <p className="text-white font-black uppercase tracking-widest text-[10px] opacity-60">To maintain a comfortable environment:</p>
                        <ul className="space-y-4">
                          <li className="flex gap-4">
                            <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white font-black text-[10px] shrink-0">1</span>
                            <span>No pets are allowed in the studio.</span>
                          </li>
                          <li className="flex gap-4">
                            <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white font-black text-[10px] shrink-0">2</span>
                            <span>Children under 12 years old are not permitted.</span>
                          </li>
                          <li className="flex gap-4">
                            <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white font-black text-[10px] shrink-0">3</span>
                            <span>Only one accompanying person allowed.</span>
                          </li>
                          <li className="flex gap-4">
                            <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white font-black text-[10px] shrink-0">4</span>
                            <span>Same-day cancellations, no-shows, or late arrivals (15+ min) will be charged 100% of the service fee.</span>
                          </li>
                        </ul>
                      </div>
                      <p className="pt-4 border-t border-white/10">By booking with us, you agree to these terms. For assistance, contact: 011-2319 8819.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-8 rounded-[2rem] bg-white/5 border border-white/10">
                    <Checkbox
                      id="policy"
                      checked={policyAccepted}
                      onCheckedChange={(val) => setPolicyAccepted(val as boolean)}
                      className="mt-1 border-white/20 data-[state=checked]:bg-accent data-[state=checked]:text-white"
                    />
                    <Label htmlFor="policy" className="text-sm font-bold text-slate-300 cursor-pointer select-none">
                      I have read and agree to the Cancellation & House Policy.
                    </Label>
                  </div>

                  {/* Offer/Coupon Code Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Have an Offer Code?</Label>
                      <div className="flex gap-4">
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="PROMO CODE"
                          className="h-16 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-accent px-6 font-bold text-white placeholder:text-slate-500"
                        />
                        <Button
                          onClick={applyCoupon}
                          disabled={!couponCode || !!appliedCoupon}
                          className="h-16 px-8 rounded-2xl bg-accent hover:bg-accent/80 text-black font-black uppercase tracking-widest"
                        >
                          {appliedCoupon ? "OK" : "Apply"}
                        </Button>
                      </div>
                      {appliedCoupon && appliedCoupon.discount > 0 && (
                        <div className="flex items-center gap-2 text-accent animate-in fade-in slide-in-from-top-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase">RM {appliedCoupon.discount.toFixed(2)} Savings applied</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Use Loyalty points</Label>
                        <Badge variant="outline" className="border-accent/30 text-accent bg-accent/5 font-black text-[10px] px-3 py-1 rounded-full">
                          {userCoins} POINTS (RM {(userCoins * coinPrice).toFixed(2)})
                        </Badge>
                      </div>

                      <button
                        onClick={() => setUseCoins(!useCoins)}
                        disabled={userCoins < coinSettings.min_redemption}
                        className={cn(
                          "w-full h-16 rounded-2xl border-2 transition-all flex items-center justify-between px-6",
                          useCoins
                            ? "bg-accent/10 border-accent text-accent"
                            : "bg-white/5 border-white/10 text-white hover:border-white/20",
                          userCoins < coinSettings.min_redemption && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Coins className={cn("w-5 h-5", useCoins ? "text-accent" : "text-white/40")} />
                          <span className="font-black uppercase text-xs tracking-widest">
                            {useCoins ? "Redeeming Balance" : "Redeem Points"}
                          </span>
                        </div>
                        <Switch
                          checked={useCoins}
                          disabled={userCoins < coinSettings.min_redemption}
                          className="data-[state=checked]:bg-accent"
                        />
                      </button>

                      {userCoins < coinSettings.min_redemption ? (
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-tight italic ml-1">
                          Min. {coinSettings.min_redemption} points required to redeem
                        </p>
                      ) : useCoins && (
                        <div className="flex items-center gap-2 text-accent animate-in fade-in slide-in-from-top-1">
                          <Gem className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase">RM {calculateCoinDiscount().toFixed(2)} Point Discount Applied</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Review */}
                  <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Reservation Value</p>
                      <p className="text-5xl font-black text-accent tracking-tighter">RM {calculateTotal().toFixed(2)}</p>
                    </div>
                    <Button
                      onClick={handleBooking}
                      disabled={!policyAccepted || booking}
                      className="h-20 px-16 bg-accent hover:bg-white hover:text-black text-black rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all"
                    >
                      {booking ? "Finalizing Registry..." : "Confirm & Book Now"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* STEP 6: SUCCESS (was Step 7) */}
            {step === 6 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-12 py-12">
                <div className="space-y-8">
                  <div className="w-32 h-32 bg-accent/10 rounded-[3rem] flex items-center justify-center mx-auto">
                    <CheckCircle className="w-16 h-16 text-accent" />
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight uppercase">Session Reserved.</h1>
                    <p className="text-xl text-slate-500 font-medium max-w-sm mx-auto italic">Your ritual has been successfully logged. We are preparing for your arrival.</p>
                  </div>
                </div>

                <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm max-w-md mx-auto space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Date & Time</span>
                    <span className="text-sm font-black text-slate-900">{selectedDate ? format(selectedDate, "PPP") : ''} at {selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Therapist</span>
                    <span className="text-sm font-black text-slate-900">{selectedStaffId ? 'Master Specialist' : 'Direct Registry'}</span>
                  </div>
                </div>

                <div className="pt-8 flex flex-col gap-4 max-w-xs mx-auto">
                  <Button onClick={() => navigate("/my-bookings")} className="h-20 bg-slate-900 text-white font-black rounded-3xl w-full text-sm uppercase tracking-widest shadow-xl">View Appointments</Button>
                  <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-400 font-bold hover:bg-slate-50 rounded-2xl uppercase tracking-widest text-[10px]">Return Home</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookAppointment;
