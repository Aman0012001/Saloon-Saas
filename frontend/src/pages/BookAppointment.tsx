import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Clock, ArrowLeft, Loader2, MapPin, Phone, Star, CheckCircle, MessageSquare, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
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
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number, type?: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1);
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
      if (!salonId || !selectedDate || !selectedTime || selectedServices.length === 0) {
        setAvailableStaff([]);
        return;
      }
      setLoadingStaff(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        // Use the first service as the primary selection for staff qualification
        const staff = await api.staff.getAvailableSpecialists({
          salon_id: salonId,
          service_id: selectedServices[0].id,
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
  }, [salonId, selectedDate, selectedTime, selectedServices]);

  const fetchSalonAndServices = async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      const salonData = await api.salons.getById(salonId);
      if (!salonData) throw new Error("Salon not found");
      setSalon(salonData);

      const servicesData = await api.services.getBySalon(salonId);
      setServices(servicesData || []);

      try {
        const offersData = await api.offers.getBySalon(salonId);
        setSalonOffers(offersData || []);
        console.log("[BookAppointment] Loaded offers:", offersData);
      } catch (offerErr) {
        console.error("Error loading salon offers:", offerErr);
        // Fallback or ignore for now, don't crash the whole page
      }

      // Auto-select service if ID provided in URL
      const serviceId = searchParams.get("serviceId");
      if (serviceId && servicesData) {
        const preselected = servicesData.find((s: any) => s.id === serviceId);
        if (preselected) {
          setSelectedServices([preselected]);
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
    // Redundant check removed as it's handled by useEffect at page entry

    if (selectedServices.length === 0 || !selectedDate || !selectedTime || !salonId) {
      toast({ title: "Missing Details", description: "Every detail matters for a perfect visit.", variant: "destructive" });
      return;
    }

    if (useCoins) {
      if (userCoins < coinSettings.min_redemption) {
        toast({
          title: "Redemption Restricted",
          description: `You need at least ${coinSettings.min_redemption} coins to redeem for a booking.`,
          variant: "destructive"
        });
        return;
      }
      const subtotal = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
      const afterCoupon = subtotal - getDiscount();
      const maxCoinDiscount = (afterCoupon * coinSettings.max_discount_percent) / 100;
      const actualCoinValue = Math.min(userCoins * coinPrice, maxCoinDiscount);
      if (actualCoinValue <= 0) {
        toast({
          title: "Coin Redemption Not Applicable",
          description: "Coins cannot be used for this booking due to minimum redemption or maximum discount limits.",
          variant: "destructive"
        });
        return;
      }
    }

    setBooking(true);
    try {
      const subtotal = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
      const discountPercentage = appliedCoupon ? (appliedCoupon.type === 'percentage' ? appliedCoupon.discount : (getDiscount() / subtotal) * 100) : 0;

      // Create a booking for each selected service
      for (const service of selectedServices) {
        const servicePrice = Number(service.price);
        const serviceDiscount = (servicePrice * discountPercentage) / 100;
        const servicePricePaid = servicePrice - serviceDiscount;

        await api.bookings.create({
          user_id: user.id,
          salon_id: salonId,
          service_id: service.id,
          staff_id: selectedStaffId,
          price_paid: servicePricePaid,
          discount_amount: serviceDiscount,
          coupon_code: appliedCoupon?.code || null,
          booking_date: format(selectedDate, "yyyy-MM-dd"),
          booking_time: selectedTime,
          notes: notes.trim() || null,
          status: "pending",
          use_coins: useCoins
        });
      }

      toast({
        title: "Booking Request Sent!",
        description: `${selectedServices.length} service(s) pending salon approval.`
      });
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

  const handleApplyCoupon = () => {
    setCouponError("");
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      console.log("Applying coupon. Input:", code, "Available offers:", salonOffers);

      const matchingOffer = salonOffers.find(o => {
        const normalizedInput = code.replace(/\s+/g, '');
        const normalizedDbCode = (o.code || "").trim().toUpperCase().replace(/\s+/g, '');

        const now = new Date();
        const startValid = !o.start_date || new Date(o.start_date) <= now;
        const endValid = !o.end_date || new Date(o.end_date) >= now;
        const isActive = o.status === 'active';

        const isMatch = normalizedDbCode === normalizedInput && startValid && endValid && isActive;
        if (isMatch) console.log("Match found!", o);
        return isMatch;
      });

      if (matchingOffer) {
        const discountValue = Number(matchingOffer.value);
        setAppliedCoupon({
          code: matchingOffer.code,
          discount: discountValue,
          type: matchingOffer.type // Store type so we can handle fixed vs percentage later if needed
        });
        toast({
          title: "Coupon Applied!",
          description: matchingOffer.type === 'percentage'
            ? `You saved ${discountValue}% on your booking!`
            : `You saved RM ${discountValue.toFixed(2)} on your booking!`
        });
      } else {
        setCouponError(`Invalid code. This coupon doesn't exist for this salon.`);
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setCouponError("Error validating coupon. Please try again.");
      console.error(err);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const calculateTotal = () => {
    const subtotal = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
    if (appliedCoupon) {
      if (appliedCoupon.type === 'fixed') {
        return Math.max(0, subtotal - appliedCoupon.discount);
      }
      const discount = (subtotal * appliedCoupon.discount) / 100;
      return subtotal - discount;
    }
    return subtotal;
  };

  const getDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
    if (appliedCoupon.type === 'fixed') {
      return appliedCoupon.discount;
    }
    return (subtotal * appliedCoupon.discount) / 100;
  };

  const getCoinValue = () => {
    if (!useCoins) return 0;
    const subtotal = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
    const afterCoupon = subtotal - getDiscount();
    const possibleValue = userCoins * coinPrice;
    const maxDiscountFromTotal = (afterCoupon * coinSettings.max_discount_percent) / 100;
    return Math.min(possibleValue, maxDiscountFromTotal);
  };

  const calculateFinalTotal = () => {
    return calculateTotal() - getCoinValue();
  };

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
                    {items.map(service => {
                      const isSelected = selectedServices.some(s => s.id === service.id);
                      return (
                        <Card key={service.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedServices(selectedServices.filter(s => s.id !== service.id));
                            } else {
                              setSelectedServices([...selectedServices, service]);
                            }
                          }}
                          className={`cursor-pointer border-none shadow-sm transition-all hover:scale-[1.01] rounded-3xl overflow-hidden ${isSelected ? 'ring-2 ring-accent' : ''}`}>
                          <CardContent className="p-6 flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="font-black text-slate-900 text-lg">{service.name}</h4>
                              <p className="text-sm text-slate-500 font-medium">{service.description}</p>
                              <Badge className="bg-slate-50 text-slate-400 border-none font-bold mt-2"><Clock className="w-3 h-3 mr-1" /> {service.duration_minutes}m</Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-slate-900">RM {Number(service.price).toFixed(2)}</p>
                              <div className={`w-6 h-6 rounded-lg border-2 mt-2 flex items-center justify-center transition-all ${isSelected ? 'bg-accent border-accent' : 'border-slate-200'}`}>
                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
              {selectedServices.length > 0 && (
                <div className="space-y-4">
                  <Card className="border-none shadow-sm bg-white rounded-3xl p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-accent">Selected Services</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Subtotal</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">RM {selectedServices.reduce((sum, s) => sum + Number(s.price), 0).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Coupon Input */}
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Have a Coupon?</Label>
                        {!appliedCoupon ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter coupon code"
                              value={couponCode}
                              onChange={(e) => {
                                setCouponCode(e.target.value.toUpperCase());
                                setCouponError("");
                              }}
                              className="h-12 bg-slate-50 border-none rounded-xl font-bold uppercase"
                            />
                            <Button
                              onClick={handleApplyCoupon}
                              className="h-12 px-6 bg-slate-900 text-white font-black rounded-xl hover:bg-black"
                            >
                              Apply
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-black text-green-900">{appliedCoupon.code}</p>
                                <p className="text-xs text-green-600 font-medium">{appliedCoupon.discount}% discount applied</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveCoupon}
                              className="text-green-600 hover:text-green-700 hover:bg-green-100 font-bold"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                        {couponError && (
                          <div className="space-y-2 mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                              {couponError}
                            </p>
                            {salonOffers.length > 0 && (
                              <div className="pt-2 border-t border-red-200">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Available codes for this salon:</p>
                                <div className="flex flex-wrap gap-2">
                                  {salonOffers.filter(o => o.status === 'active').slice(0, 5).map(o => (
                                    <button
                                      key={o.id}
                                      onClick={() => {
                                        setCouponCode(o.code);
                                        setCouponError("");
                                      }}
                                      className="text-[10px] bg-white border border-slate-200 rounded px-2 py-1 hover:bg-slate-50 font-mono font-bold text-accent"
                                    >
                                      {o.code}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Total with Discount */}
                      {appliedCoupon && (
                        <div className="pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Discount ({appliedCoupon.discount}%)</span>
                            <span className="text-green-600 font-black">-RM {getDiscount().toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t-2 border-accent/20 flex justify-between items-center">
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Total Amount</p>
                        <p className="text-3xl font-black text-accent">RM {calculateTotal().toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
              <Button onClick={() => setStep(2)} disabled={selectedServices.length === 0} className="w-full h-16 rounded-3xl bg-accent text-white font-black text-lg shadow-xl shadow-accent/20">
                Select Time Slot ({selectedServices.length} service{selectedServices.length > 1 ? 's' : ''})
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
                      onClick={() => {
                        setSelectedTime(time);
                        setSelectedStaffId(null); // Reset staff selection when time changes
                      }}
                      className={`h-14 rounded-2xl font-black transition-all ${isBooked ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : selectedTime === time ? 'bg-accent text-white shadow-lg' : 'bg-white text-slate-900 hover:bg-slate-50 shadow-sm'}`}>
                      {isBooked ? 'Taken' : time}
                    </button>
                  );
                })}
              </div>

              {selectedTime && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between px-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Select Specialist (Optional)</Label>
                    <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-400 uppercase tracking-tighter">Recommended</Badge>
                  </div>

                  {loadingStaff ? (
                    <div className="flex items-center justify-center p-8 bg-white rounded-3xl border border-dashed border-slate-200">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    </div>
                  ) : availableStaff.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                      <div
                        onClick={() => setSelectedStaffId(null)}
                        className={`flex-shrink-0 w-24 p-3 rounded-2xl border-2 transition-all cursor-pointer text-center flex flex-col items-center gap-2 ${!selectedStaffId ? 'border-accent bg-accent/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                          <CheckCircle className={`w-6 h-6 ${!selectedStaffId ? 'text-accent' : 'text-slate-300'}`} />
                        </div>
                        <span className="text-[10px] font-black uppercase leading-tight">Any<br />Specialist</span>
                      </div>

                      {availableStaff.map((staff) => (
                        <div
                          key={staff.id}
                          onClick={() => setSelectedStaffId(staff.id)}
                          className={`flex-shrink-0 w-24 p-3 rounded-2xl border-2 transition-all cursor-pointer text-center flex flex-col items-center gap-2 ${selectedStaffId === staff.id ? 'border-accent bg-accent/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                        >
                          <Avatar className="w-12 h-12 rounded-xl border-2 border-white shadow-sm">
                            <AvatarImage src={staff.avatar_url} />
                            <AvatarFallback className="bg-slate-100 font-black text-slate-400">{staff.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] font-black uppercase leading-tight truncate w-full">{staff.display_name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching specialists free at this slot</p>
                      <p className="text-[10px] font-medium text-slate-300 mt-1 uppercase">Any available member will be assigned</p>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime} className="w-full h-16 rounded-3xl bg-accent text-white font-black text-lg shadow-xl shadow-accent/20">
                Review Details
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[2.5rem] p-8 space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Selection</p>
                  {selectedServices.map((service, index) => (
                    <div key={service.id} className="flex justify-between items-center pb-4 border-b border-white/10 last:border-0">
                      <div>
                        <h3 className="text-lg font-black">{service.name}</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">{service.duration_minutes} minutes</p>
                      </div>
                      <p className="text-xl font-black text-accent">RM {Number(service.price).toFixed(2)}</p>
                    </div>
                  ))}

                  {/* Coupon Section */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Have a Coupon?</Label>
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                          className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl font-bold uppercase focus:ring-accent"
                        />
                        <Button
                          onClick={handleApplyCoupon}
                          className="h-12 px-6 bg-accent text-black font-black rounded-xl hover:bg-white"
                        >
                          Apply
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-900/30 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="font-black text-green-400">{appliedCoupon.code}</p>
                            <p className="text-xs text-green-500 font-medium">{appliedCoupon.discount}% discount applied</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-green-400 hover:text-green-300 hover:bg-green-900/20 font-bold"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    {couponError && (
                      <p className="text-xs text-red-400 font-medium">{couponError}</p>
                    )}
                  </div>

                  {/* Discount Display */}
                  {appliedCoupon && (
                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Subtotal</span>
                        <span className="text-white font-bold">RM {selectedServices.reduce((sum, s) => sum + Number(s.price), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Discount ({appliedCoupon.discount}%)</span>
                        <span className="text-green-400 font-black">-RM {getDiscount().toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Coin Payment Section */}
                  {userCoins > 0 && (
                    <div className="pt-4 border-t border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-100/10 rounded-lg flex items-center justify-center">
                            <Coins className="w-4 h-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">Use Coins</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Balance: {userCoins.toFixed(2)} (Value: RM {(userCoins * coinPrice).toFixed(2)})</p>
                          </div>
                        </div>
                        <Switch id="use-coins" checked={useCoins} onCheckedChange={setUseCoins} disabled={userCoins < coinSettings.min_redemption} />
                      </div>
                      {userCoins > 0 && userCoins < coinSettings.min_redemption && (
                        <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-tighter">
                          Need {coinSettings.min_redemption} coins to redeem (Current: {userCoins.toFixed(1)})
                        </p>
                      )}
                      {useCoins && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                          <p className="text-xs font-bold text-amber-200 uppercase tracking-tighter">Coins redemption applied</p>
                          <p className="font-black text-amber-400">-RM {getCoinValue().toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t-2 border-accent/20">
                    <h3 className="text-xl font-black">Total Amount</h3>
                    <p className="text-3xl font-black text-accent">RM {calculateFinalTotal().toFixed(2)}</p>
                  </div>
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

                {selectedStaffId && (
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Preferred Specialist</p>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                      <Avatar className="w-10 h-10 rounded-xl border border-white/20">
                        <AvatarImage src={availableStaff.find(s => s.id === selectedStaffId)?.avatar_url} />
                        <AvatarFallback className="bg-white/10 font-bold">{availableStaff.find(s => s.id === selectedStaffId)?.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-black">{availableStaff.find(s => s.id === selectedStaffId)?.display_name}</p>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Specialist</p>
                      </div>
                    </div>
                  </div>
                )}

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
