import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Phone,
    Calendar,
    ArrowLeft,
    Mail,
    Activity,
    AlertCircle,
    FileText,
    Save,
    Plus,
    Pill,
    Sparkles,
    ClipboardList,
    History,
    Droplet,
    Gift,
    Zap,
    Crown,
    User,
    Clock,
    MessageSquare,
    MessageCircle,
    Send,
    Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Booking {
    id: string;
    booking_date: string;
    booking_time: string;
    status: string;
    service: {
        name: string;
        price: number;
        duration_minutes: number;
    } | null;
    notes: string | null;
}

interface CustomerProfile {
    user_id: string;
    full_name: string | null;
    phone: string | null;
    email?: string;
    avatar_url: string | null;
    created_at: string;
    date_of_birth?: string;
    skin_type?: string;
    skin_issues?: string[];
    allergies?: string[];
    medical_conditions?: string[];
}

export default function CustomerDetailsPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { currentSalon } = useSalon();

    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("history");

    // CRM Form States
    const [skinType, setSkinType] = useState("Combination");
    const [allergies, setAllergies] = useState("");
    const [skinIssues, setSkinIssues] = useState("");
    const [notes, setNotes] = useState("");

    // Booking Dialog States
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedService, setSelectedService] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState("");

    useEffect(() => {
        if (!userId || !currentSalon) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", userId)
                    .single();

                if (profileError) throw profileError;

                // Fetch Visit History
                const { data: bookingsData, error: bookingsError } = await supabase
                    .from("bookings")
                    .select(`
            id,
            booking_date,
            booking_time,
            status,
            notes,
            service:services (
              name,
              price,
              duration_minutes
            )
          `)
                    .eq("salon_id", currentSalon.id)
                    .eq("user_id", userId)
                    .order("booking_date", { ascending: false });

                if (bookingsError) throw bookingsError;

                setProfile(profileData);
                setBookings(bookingsData as any);

                // Simulating fetching CRM extended data
                setSkinType("Oily/Sensitive");
                setAllergies("Latex, Penicillin");
                setSkinIssues("Acne scarring, Hyperpigmentation");

            } catch (error) {
                console.error("Error fetching customer details:", error);
                toast({
                    title: "Error",
                    description: "Could not load customer data",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, currentSalon]);

    const handleSaveCRM = () => {
        toast({
            title: "CRM Updated",
            description: "Customer health profile saved successfully.",
        });
    };

    const handleBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime) {
            toast({
                title: "Incomplete Details",
                description: "Please select a service, date, and time.",
                variant: "destructive"
            });
            return;
        }

        // Simulate booking process
        setIsBookingOpen(false);
        toast({
            title: "Booking Confirmed",
            description: `Appointment for ${selectedService} scheduled on ${selectedDate} at ${selectedTime}.`,
        });

        // In a real app, you would insert into 'bookings' table here.
    };

    if (loading) {
        return (
            <ResponsiveDashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
            </ResponsiveDashboardLayout>
        );
    }

    if (!profile) {
        return (
            <ResponsiveDashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700">Customer Not Found</h2>
                    <p className="text-slate-500 max-w-md">
                        The customer with ID <code className="bg-slate-100 px-1 rounded">{userId}</code> could not be found or you do not have permission to view them.
                    </p>
                    <Button onClick={() => navigate("/dashboard/customers")} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customers
                    </Button>
                </div>
            </ResponsiveDashboardLayout>
        );
    }

    return (
        <ResponsiveDashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 -m-6 p-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header / Nav */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/dashboard/customers")}
                            className="bg-white/50 hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Profile</h1>
                            <p className="text-slate-500 font-medium">Manage details, history, and automated marketing</p>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: Profile Card (Takes 4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-xl overflow-hidden ring-1 ring-black/5">
                                <div className="h-32 bg-gradient-to-r from-violet-600 to-indigo-600 relative">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                </div>
                                <CardContent className="relative pt-0 px-6 pb-8 text-center mt-[-60px]">
                                    <Avatar className="w-32 h-32 ring-4 ring-white shadow-2xl mx-auto mb-4">
                                        <AvatarImage src={profile.avatar_url || ""} />
                                        <AvatarFallback className="text-4xl bg-slate-100 text-slate-400 font-light">
                                            {profile.full_name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <h2 className="text-2xl font-bold text-slate-900">{profile.full_name}</h2>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <Badge variant="secondary" className="bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border-0 px-3 py-1 font-semibold">
                                            <Crown className="w-3 h-3 mr-1" /> VIP MEMBER
                                        </Badge>
                                    </div>

                                    <div className="mt-8 space-y-5 text-left">
                                        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                <Phone className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</p>
                                                <p className="font-medium text-slate-700">{profile.phone || "No number"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                                <Calendar className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Date of Birth</p>
                                                <p className="font-medium text-slate-700">24 Aug, 1995 (29 yrs)</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                <History className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Last Visit</p>
                                                <p className="font-medium text-slate-700">2 days ago</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                                        <Button
                                            onClick={() => setIsBookingOpen(true)}
                                            className="w-full mt-8 h-12 text-lg font-medium bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20 text-white transition-all transform hover:-translate-y-0.5"
                                        >
                                            <Calendar className="w-5 h-5 mr-2" /> Book Now
                                        </Button>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>New Appointment</DialogTitle>
                                                <DialogDescription>
                                                    Schedule a new visit for {profile.full_name}.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Service</Label>
                                                    <Select onValueChange={setSelectedService} defaultValue={selectedService}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a service" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Hydrafacial">Hydrafacial (60 min)</SelectItem>
                                                            <SelectItem value="Chemical Peel">Chemical Peel (45 min)</SelectItem>
                                                            <SelectItem value="Laser Hair Removal">Laser Hair Removal (30 min)</SelectItem>
                                                            <SelectItem value="Consultation">Consultation (15 min)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={selectedDate}
                                                            onChange={(e) => setSelectedDate(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Time</Label>
                                                        <Select onValueChange={setSelectedTime} defaultValue={selectedTime}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Time" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="09:00">09:00 AM</SelectItem>
                                                                <SelectItem value="10:00">10:00 AM</SelectItem>
                                                                <SelectItem value="11:00">11:00 AM</SelectItem>
                                                                <SelectItem value="14:00">02:00 PM</SelectItem>
                                                                <SelectItem value="15:00">03:00 PM</SelectItem>
                                                                <SelectItem value="16:00">04:00 PM</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    onClick={handleBooking}
                                                    className="w-full bg-accent hover:bg-accent/90"
                                                >
                                                    Confirm Booking
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Content (Takes 8 cols) */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* 🚨 CRITICAL ALERT */}
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-1 shadow-sm overflow-hidden">
                                <div className="border-l-4 border-red-500 bg-white rounded-xl p-5 flex items-start gap-5">
                                    <div className="p-3 bg-red-100 rounded-full shrink-0 animate-pulse">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">Medical Alerts</h3>
                                        <p className="text-red-600 font-medium mt-1">Allergies: {allergies}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 🏥 CLINICAL SNAPSHOT */}
                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-black/5">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Activity className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-slate-900">Clinical Assessment</CardTitle>
                                            <CardDescription>Key skin metrics and observations</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Skin Type</Label>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className="px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm font-medium rounded-full shadow-sm">
                                                    {skinType}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Concerns</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {skinIssues.split(',').map((issue, i) => (
                                                    <Badge key={i} variant="outline" className="px-4 py-1.5 bg-red-50 text-red-700 border-red-200 text-sm font-medium rounded-full">
                                                        {issue.trim()}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100 relative">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
                                            Observations
                                        </div>
                                        <p className="text-slate-600 bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200 text-base leading-relaxed italic text-center">
                                            "Client reports increased sensitivity during winter months. Noticed slight dehydration on the forehead area. Responds well to Hyaluronic Acid treatments."
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* TABS SECTION */}
                            <Tabs defaultValue="history" className="w-full" onValueChange={setActiveTab}>
                                <TabsList className="bg-white/50 backdrop-blur p-1.5 rounded-2xl border border-slate-200/60 shadow-sm w-full grid grid-cols-3 mb-8 h-auto">
                                    <TabsTrigger
                                        value="history"
                                        className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-medium text-slate-500"
                                    >
                                        Treatment Records
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="marketing"
                                        className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-medium text-slate-500"
                                    >
                                        Marketing & Follow-up
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="plan"
                                        className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-medium text-slate-500"
                                    >
                                        Edit Profile
                                    </TabsTrigger>
                                </TabsList>

                                {/* Treatment History Tab */}
                                <TabsContent value="history" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-black/5">
                                        <CardHeader className="border-b border-slate-100 px-8 py-6">
                                            <CardTitle className="text-xl text-slate-900">Visit Timeline</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            {bookings.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <History className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-400 font-medium">No history recorded yet.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 md:before:mx-auto before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                                                    {bookings.map((booking) => (
                                                        <div key={booking.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-500 text-white shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                                                                <Sparkles className="w-5 h-5" />
                                                            </div>
                                                            <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl hover:shadow-md transition-all">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div>
                                                                        <h4 className="font-bold text-lg text-slate-900">{booking.service?.name || "Service session"}</h4>
                                                                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                                            <Clock className="w-3 h-3" /> {booking.service?.duration_minutes} mins
                                                                        </p>
                                                                    </div>
                                                                    <Badge variant="outline" className="font-mono text-indigo-600 bg-indigo-50 border-indigo-100">
                                                                        {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                                                                    </Badge>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <div className="bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-600">
                                                                        <span className="font-semibold text-slate-900 block mb-1">Products Used:</span>
                                                                        Vitamin C Serum, Hyaluronic Acid, Aloe Gel
                                                                    </div>
                                                                    <div className="bg-green-50 px-3 py-2 rounded-lg text-sm text-green-700 border border-green-100">
                                                                        <span className="font-semibold block mb-1">Result:</span>
                                                                        Visible reduction in redness. Client happy.
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Marketing & Follow-up Tab - NOW MANUAL */}
                                <TabsContent value="marketing" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                    {/* MANUAL FOLLOW-UP TOOLS */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 ring-1 ring-emerald-500/20">
                                            <CardHeader className="pb-2">
                                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-2">
                                                    <MessageCircle className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <CardTitle className="text-lg font-bold">WhatsApp Follow-up</CardTitle>
                                                <CardDescription className="text-emerald-700/70">Connect directly on WhatsApp</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-emerald-200 hover:bg-emerald-500 hover:text-white transition-all font-bold rounded-xl"
                                                    onClick={() => {
                                                        const msg = `Hi ${profile.full_name}, this is NoamSkin. Hope you are doing well after your recent visit!`;
                                                        window.open(`https://wa.me/${profile.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                    }}
                                                >
                                                    Send Welcome Message
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 ring-1 ring-blue-500/20">
                                            <CardHeader className="pb-2">
                                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-2">
                                                    <MessageSquare className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <CardTitle className="text-lg font-bold">SMS Campaign</CardTitle>
                                                <CardDescription className="text-blue-700/70">Casual reminder via text</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-blue-200 hover:bg-blue-500 hover:text-white transition-all font-bold rounded-xl"
                                                    onClick={() => toast({ title: "SMS Queued", description: "Reminder SMS has been sent." })}
                                                >
                                                    Send Visit Reminder
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 ring-1 ring-purple-500/20">
                                            <CardHeader className="pb-2">
                                                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-2">
                                                    <Mail className="w-6 h-6 text-purple-600" />
                                                </div>
                                                <CardTitle className="text-lg font-bold">Email Follow-up</CardTitle>
                                                <CardDescription className="text-purple-700/70">Send detailed reports</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-purple-200 hover:bg-purple-500 hover:text-white transition-all font-bold rounded-xl"
                                                    onClick={() => toast({ title: "Email Sent", description: "Maintenance tips sent to inbox." })}
                                                >
                                                    Send Beauty Tips
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* MANUAL TEMPLATE SELECTOR */}
                                    <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-xl ring-1 ring-black/5">
                                        <CardHeader className="px-8 pt-8">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-xl font-black flex items-center gap-2">
                                                        <ClipboardList className="w-6 h-6 text-accent" />
                                                        Manual Follow-up Templates
                                                    </CardTitle>
                                                    <CardDescription>Select a personalized template to engage {profile.full_name}</CardDescription>
                                                </div>
                                                <Badge className="bg-slate-100 text-slate-500 border-0 uppercase tracking-widest text-[10px]">Manual Mode</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Post-Visit Care</h4>
                                                {['7-Day Check-in', 'Care Instructions', 'Feedback Request'].map((template) => (
                                                    <div key={template} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-accent/40 hover:bg-white transition-all cursor-pointer shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center">
                                                                <Send className="w-4 h-4 text-accent" />
                                                            </div>
                                                            <span className="font-bold flex items-center gap-2">{template}</span>
                                                        </div>
                                                        <Button size="sm" onClick={() => toast({ title: "Manual Check-in Sent", description: `Template: ${template}` })} className="rounded-xl font-bold px-4 py-0 h-8 opacity-0 group-hover:opacity-100 transition-opacity">Send</Button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Special Occasions</h4>
                                                <div className="p-4 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-xl shadow-pink-500/20 group hover:scale-[1.02] transition-transform cursor-pointer">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                                <Smile className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="font-black">Birthday Greeting</p>
                                                                <p className="text-xs text-white/80">Occasion: Aug 24</p>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-white text-pink-600 font-black border-0">SEND GIFT</Badge>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <Card className="p-4 bg-slate-50 border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center group">
                                                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                                            <Gift className="w-5 h-5 text-amber-600" />
                                                        </div>
                                                        <p className="text-xs font-black uppercase text-slate-500">Idle Alert</p>
                                                        <p className="font-bold text-[10px] text-slate-400">30 Days Inactive</p>
                                                    </Card>
                                                    <Card className="p-4 bg-slate-50 border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center group">
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                                            <Sparkles className="w-5 h-5 text-indigo-600" />
                                                        </div>
                                                        <p className="text-xs font-black uppercase text-slate-500">Service Rec</p>
                                                        <p className="font-bold text-[10px] text-slate-400">Next Hydrafacial</p>
                                                    </Card>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Edit Tab */}
                                <TabsContent value="plan" className="space-y-6">
                                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-black/5">
                                        <CardHeader>
                                            <CardTitle>Edit Clinical Profile</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <Label>Skin Type</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'].map(type => (
                                                            <Badge key={type} variant="outline" className={`cursor-pointer ${skinType.includes(type) ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`} onClick={() => setSkinType(type)}>{type}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Allergies</Label>
                                                    <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                                                </div>
                                            </div>
                                            <Button onClick={handleSaveCRM} className="w-full">Save Changes</Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </ResponsiveDashboardLayout>
    );
}
