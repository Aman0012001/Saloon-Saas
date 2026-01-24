import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, Clock, ArrowLeft, Loader2, Plus, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
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
  services: {
    name: string;
    price: number;
    duration_minutes: number;
  };
  salons: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    logo_url: string | null;
  };
}

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      fetchBookings();
    }
  }, [user, authLoading]);

  const fetchBookings = async () => {
    if (!user) return;
    
    // CRITICAL: Only fetch bookings for the current user
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        services (
          name,
          price,
          duration_minutes
        ),
        salons (
          id,
          name,
          address,
          city,
          phone,
          logo_url
        )
      `)
      .eq("user_id", user.id) // STRICT ISOLATION: Only current user's bookings
      .order("booking_date", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Could not load bookings",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const cancelBooking = async (bookingId: string) => {
    if (!user) return;
    
    // SECURITY: Verify booking belongs to current user before cancelling
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId)
      .eq("user_id", user.id); // CRITICAL: Ensure user can only cancel their own bookings

    if (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: "Could not cancel booking",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Booking Cancelled",
        description: "Your appointment has been cancelled",
      });
      fetchBookings();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (authLoading || loading) {
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
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Link to="/salons">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">My Appointments</h1>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Appointments</h3>
                <p className="text-muted-foreground mb-4">You haven't booked any appointments yet</p>
                <Link to="/salons">
                  <Button>Book Now</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {/* Salon Logo */}
                      <Avatar className="w-12 h-12 border-2 border-accent/20">
                        <AvatarImage src={booking.salons?.logo_url || ""} alt={booking.salons?.name} />
                        <AvatarFallback className="bg-accent text-white font-bold">
                          {booking.salons?.name?.charAt(0).toUpperCase() || "S"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <CardTitle className="text-lg">{booking.services.name}</CardTitle>
                            <p className="text-sm font-medium text-accent">{booking.salons?.name}</p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        {/* Salon Address */}
                        {booking.salons?.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">
                              {booking.salons.address}
                              {booking.salons.city && `, ${booking.salons.city}`}
                            </span>
                          </div>
                        )}
                        
                        {/* Salon Phone */}
                        {booking.salons?.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{booking.salons.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Appointment Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-accent/5 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-accent" />
                        <span className="font-medium">{format(new Date(booking.booking_date), "PPP")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-accent" />
                        <span className="font-medium">{booking.booking_time} ({booking.services.duration_minutes} min)</span>
                      </div>
                    </div>
                    
                    {/* Price and Actions */}
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-accent">₹{booking.services.price}</span>
                      {booking.status === "pending" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelBooking(booking.id)}
                          className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                    
                    {/* Notes */}
                    {booking.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Note:</span> {booking.notes}
                        </p>
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
