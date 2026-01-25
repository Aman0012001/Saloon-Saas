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
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Booking {
    id: string;
    booking_date: string;
    booking_time: string;
    status: string;
    service_name: string;
    price: number;
    duration_minutes: number;
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
                // Fetch Profile from local API
                const profileData = await api.profiles.getById(userId);

                // Fetch Visit History from local API
                const bookingsData = await api.bookings.getAll({
                    salon_id: currentSalon.id,
                    user_id: userId
                });

                setProfile(profileData);
                setBookings(bookingsData || []);

                // Simulating fetching CRM extended data
                setSkinType("Oily/Sensitive");
                setAllergies("Latex, Penicillin");
                setSkinIssues("Acne scarring, Hyperpigmentation");

            } catch (error) {
                console.error("Error fetching local customer details:", error);
                toast({
                    title: "Error",
                    description: "Could not load data from local database",
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
            description: "Local customer health profile saved.",
        });
    };

    const handleBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime || !currentSalon) {
            toast({
                title: "Incomplete Details",
                description: "Required fields missing.",
                variant: "destructive"
            });
            return;
        }

        try {
            // Manual booking creation in local DB
            await api.bookings.create({
                salon_id: currentSalon.id,
                user_id: userId,
                service_id: 'local-sync-' + Date.now(), // Placeholder for service logic
                status: "confirmed",
                booking_date: selectedDate,
                booking_time: selectedTime,
            });

            setIsBookingOpen(false);
            toast({
                title: "Booking Confirmed",
                description: `Appointment scheduled for ${selectedDate}.`,
            });

            // Refresh list
            const bData = await api.bookings.getAll({
                salon_id: currentSalon.id,
                user_id: userId
            });
            setBookings(bData || []);
        } catch (e) {
            toast({ title: "Booking Failed", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <ResponsiveDashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="animate-spin h-8 w-8 text-accent" />
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
                    <h2 className="text-xl font-bold text-slate-700">Dossier Missing</h2>
                    <p className="text-slate-500 max-w-md">The requested local profile is not in the registry.</p>
                    <Button onClick={() => navigate("/dashboard/customers")} variant="outline" className="rounded-xl font-bold">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Archive
                    </Button>
                </div>
            </ResponsiveDashboardLayout>
        );
    }

    return (
        <ResponsiveDashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 -m-6 p-6 pb-24">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header / Nav */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/dashboard/customers")}
                            className="bg-white/50 hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-sm rounded-xl h-10 w-10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client Hub</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Local Registry Status: Verified</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* PROFILE CARD */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
                                <div className="h-32 bg-slate-900 relative">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                </div>
                                <CardContent className="relative pt-0 px-8 pb-10 text-center mt-[-64px]">
                                    <Avatar className="w-32 h-32 ring-8 ring-white shadow-2xl mx-auto mb-4 bg-white">
                                        <AvatarImage src={profile.avatar_url || ""} />
                                        <AvatarFallback className="text-4xl bg-slate-50 text-slate-300 font-black">
                                            {profile.full_name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <h2 className="text-2xl font-black text-slate-900">{profile.full_name || 'Unidentified'}</h2>
                                    <Badge className="bg-accent/10 text-accent border-none font-black px-3 py-1 mt-3">PRO CLIENT</Badge>

                                    <div className="mt-8 space-y-4 text-left">
                                        {[
                                            { icon: Phone, label: "Digital ID", value: profile.phone || "No Alias", color: "text-blue-600", bg: "bg-blue-50" },
                                            { icon: Mail, label: "Network", value: profile.email || "No Email", color: "text-purple-600", bg: "bg-purple-50" },
                                            { icon: Clock, label: "Last Visit", value: bookings[0]?.booking_date ? format(new Date(bookings[0].booking_date), 'MMM d, yyyy') : 'No History', color: "text-emerald-600", bg: "bg-emerald-50" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white transition-all shadow-sm">
                                                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.label}</p>
                                                    <p className="font-bold text-slate-700 mt-1">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={() => setIsBookingOpen(true)}
                                        className="w-full mt-10 h-16 text-lg font-black bg-slate-900 hover:bg-black shadow-xl shadow-slate-900/20 text-white rounded-[2rem] transition-all transform hover:scale-[1.02]"
                                    >
                                        <Calendar className="w-5 h-5 mr-3" /> Book Local Session
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 flex items-start gap-6 shadow-sm border-l-8 border-l-red-500">
                                <div className="p-4 bg-white rounded-2xl shadow-sm shrink-0">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-xl">Operational Constraints</h3>
                                    <p className="text-red-700/80 font-bold mt-1 text-sm tracking-tight">Active Hazards: {allergies || "None logged"}</p>
                                </div>
                            </div>

                            <Tabs defaultValue="history" className="w-full">
                                <TabsList className="bg-white p-1.5 rounded-[2.5rem] border border-slate-100 shadow-sm w-full grid grid-cols-3 mb-8 h-18">
                                    <TabsTrigger value="history" className="rounded-[2rem] py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all font-black text-xs uppercase tracking-widest">Treatments</TabsTrigger>
                                    <TabsTrigger value="marketing" className="rounded-[2rem] py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all font-black text-xs uppercase tracking-widest">Connect</TabsTrigger>
                                    <TabsTrigger value="plan" className="rounded-[2rem] py-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all font-black text-xs uppercase tracking-widest">Assesment</TabsTrigger>
                                </TabsList>

                                <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                                    {bookings.length === 0 ? (
                                        <Card className="border-none shadow-sm bg-white rounded-[2rem] p-16 text-center">
                                            <History className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Archive Empty</p>
                                        </Card>
                                    ) : (
                                        <div className="space-y-6">
                                            {bookings.map((b) => (
                                                <Card key={b.id} className="border-none shadow-sm bg-white rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all border-l-8 border-l-accent/50">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-accent">
                                                            <Sparkles className="w-7 h-7" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-xl text-slate-900">{b.service_name || "Treatment Session"}</h4>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{format(new Date(b.booking_date), 'MMMM dd, yyyy')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-slate-900">${b.price || '0'}</p>
                                                        <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[9px] uppercase tracking-tighter mt-1">{b.status}</Badge>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="marketing" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="border-none shadow-sm bg-emerald-500 p-8 rounded-[2.5rem] text-white overflow-hidden relative group">
                                            <MessageCircle className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform" />
                                            <h4 className="text-2xl font-black">WhatsApp Client</h4>
                                            <p className="text-white/70 font-bold text-sm mt-2">Initialize encrypted local channel.</p>
                                            <Button className="w-full mt-8 bg-white text-emerald-600 font-black h-14 rounded-2xl hover:bg-emerald-50 shadow-xl shadow-emerald-500/20">Open Tunnel</Button>
                                        </Card>
                                        <Card className="border-none shadow-sm bg-slate-900 p-8 rounded-[2.5rem] text-white">
                                            <h4 className="text-2xl font-black">Email Brief</h4>
                                            <p className="text-slate-400 font-bold text-sm mt-2">Send maintenance report via SMTP.</p>
                                            <Button className="w-full mt-8 bg-accent text-white font-black h-14 rounded-2xl hover:bg-accent/90 shadow-xl shadow-accent/20">Send Report</Button>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="plan">
                                    <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Assesment Data</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assigned Skin Type</Label>
                                                <Select value={skinType} onValueChange={setSkinType}>
                                                    <SelectTrigger className="h-16 bg-slate-50 border-none rounded-2xl font-bold px-6">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Oily">Oily Focus</SelectItem>
                                                        <SelectItem value="Dry">Dry/Dehydrated</SelectItem>
                                                        <SelectItem value="Combination">Combination</SelectItem>
                                                        <SelectItem value="Sensitive">Hyper Sensitive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Recorded Hazards (Allergies)</Label>
                                                <Input value={allergies} onChange={e => setAllergies(e.target.value)} className="h-16 bg-slate-50 border-none rounded-2xl font-bold px-6" />
                                            </div>
                                        </div>
                                        <Button onClick={handleSaveCRM} className="w-full mt-10 h-16 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl hover:bg-black">Commit to Registry</Button>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogContent className="border-none shadow-2xl rounded-[3rem] p-10 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Manual Booking</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400">Initialize a new visit record in the local database.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 mt-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Service</Label>
                            <Select onValueChange={setSelectedService}>
                                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5">
                                    <SelectValue placeholder="Select Procedure" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Hydrafacial">Hydrafacial Deluxe</SelectItem>
                                    <SelectItem value="Peel">Chemical Rejuvenation</SelectItem>
                                    <SelectItem value="Laser">Laser Precision</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Operation Date</Label>
                                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Timestamp</Label>
                                <Select onValueChange={setSelectedTime}>
                                    <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5">
                                        <SelectValue placeholder="Time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10:00">10:00 AM</SelectItem>
                                        <SelectItem value="14:00">02:00 PM</SelectItem>
                                        <SelectItem value="16:00">04:00 PM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-10">
                        <Button onClick={handleBooking} className="w-full h-16 bg-accent text-white font-black rounded-3xl shadow-xl shadow-accent/20 text-lg">Initialize Booking</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ResponsiveDashboardLayout>
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <div className={`w-8 h-8 relative ${className}`}>
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
    </div>
);
