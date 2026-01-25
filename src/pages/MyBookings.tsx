import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, Clock, ArrowLeft, Loader2, Plus, MapPin, Phone, Scissors, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  salon_id: string;
  service_name: string;
  price: number;
  duration_minutes: number;
  salon_name: string;
  salon_address: string;
  salon_city: string;
  category: string;
}

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getServiceImage = (category: string, serviceName?: string) => {
    const cat = (category || '').trim().toLowerCase();
    const name = (serviceName || '').trim().toLowerCase();
    const combined = `${cat} ${name}`;

    // 1. Spa Special Handling (Specific keywords in name)
    if (combined.includes('spa')) {
      const spaImages: Record<string, string> = {
        'hot stone': 'https://images.unsplash.com/photo-1544161515-4af6b1d46af0?w=800&auto=format&fit=crop',
        'aromatherapy': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&auto=format&fit=crop',
        'swedish': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&auto=format&fit=crop',
        'deep tissue': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop',
        'thai': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=800&auto=format&fit=crop',
        'body wrap': 'https://images.unsplash.com/photo-1570172234445-09a5ad5af4ee?w=800&auto=format&fit=crop',
        'reflexology': 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&auto=format&fit=crop',
      };
      for (const [key, img] of Object.entries(spaImages)) {
        if (combined.includes(key)) return img;
      }
      return 'https://images.unsplash.com/photo-1544161515-4af6b1d46af0?w=800&auto=format&fit=crop';
    }

    // 2. Keyword based mapping for best match
    const keywordMap: Array<{ keywords: string[], image: string }> = [
      {
        keywords: ['hair', 'cut', 'style', 'color', 'highlight', 'balayage', 'barber'],
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['nail', 'manicure', 'pedicure', 'gel', 'acrylic', 'polish'],
        image: 'https://images.unsplash.com/photo-1604654894610-df4906687103?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['facial', 'face', 'skincare', 'cleanse', 'peel'],
        image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc206e?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['makeup', 'bridal', 'wedding', 'cosmetic'],
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['massage', 'body', 'therapy', 'rub'],
        image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&auto=format&fit=crop'
      },
      {
        keywords: ['wax', 'thread', 'laser', 'epilat'],
        image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop'
      }
    ];

    for (const mapping of keywordMap) {
      if (mapping.keywords.some(k => combined.includes(k))) {
        return mapping.image;
      }
    }

    // 3. Absolute Fallback
    return 'https://images.unsplash.com/photo-1521590832896-76c0f2956662?w=800&auto=format&fit=crop';
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      // Fetch user specific bookings from the local PHP API
      const data = await api.bookings.getAll({ user_id: user.id });
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching local bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) fetchBookings();
  }, [user, authLoading]);

  const cancelBooking = async (bookingId: string) => {
    try {
      await api.bookings.update(bookingId, { status: 'cancelled' });
      toast({ title: "Booking Cancelled", description: "Updated in local records." });
      fetchBookings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update record", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">Confirmed</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 border-none font-bold">Pending</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-700 border-none font-bold">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Sessions</h1>
              <p className="text-slate-400 font-medium font-bold uppercase tracking-widest text-[10px] mt-1">Local Booking History</p>
            </div>
            <Link to="/salons">
              <Button className="bg-accent text-white font-black rounded-2xl h-14 px-8 shadow-xl shadow-accent/20">
                <Plus className="w-5 h-5 mr-3" /> Book Experience
              </Button>
            </Link>
          </div>

          {bookings.length === 0 ? (
            <Card className="border-none shadow-sm bg-white rounded-[3rem] py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                <CalendarDays className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">No appointments found</h3>
                <p className="text-slate-400 font-medium">Your local booking archive is empty.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <Card key={booking.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all">
                  <CardContent className="p-0">
                    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-white relative overflow-hidden">
                          <img
                            src={getServiceImage(booking.category, booking.service_name)}
                            alt={booking.service_name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute -top-2 -right-2">
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Store className="w-3 h-3 text-accent" />
                            <p className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">{booking.salon_name}</p>
                          </div>
                          <h3 className="text-xl font-black text-slate-900">{booking.service_name}</h3>
                          <div className="flex items-center gap-2 text-slate-400 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <p className="text-xs font-bold leading-none">{booking.salon_address}{booking.salon_city ? `, ${booking.salon_city}` : ''}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 bg-slate-50 rounded-3xl px-8 py-5">
                        <div className="text-center border-r border-slate-200 pr-8">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reserved On</p>
                          <p className="font-black text-slate-800">{format(new Date(booking.booking_date), "MMM dd")}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Session Slot</p>
                          <p className="font-black text-slate-800">{booking.booking_time}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900">${booking.price}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{booking.duration_minutes} MINS</p>
                        </div>
                        {booking.status === 'pending' && (
                          <Button variant="ghost" onClick={() => cancelBooking(booking.id)} className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center p-0">
                            <Loader2 className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {booking.notes && (
                      <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 italic text-xs text-slate-500 font-medium">
                        Note for Stylist: {booking.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
