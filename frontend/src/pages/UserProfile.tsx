import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    User,
    Settings,
    History,
    Heart,
    Star,
    ClipboardList,
    ChevronRight,
    Search,
    Bell,
    LogOut,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/services/api";
import { UserNotificationSystem } from "@/components/UserNotificationSystem";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function UserProfile() {
    const { user, signOut, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [stats, setStats] = useState({
        totalBookings: 0,
        upcomingBookings: 0,
        completedBookings: 0,
    });
    const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [healthProfile, setHealthProfile] = useState<any>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
            return;
        }

        if (user) {
            fetchHubData();
        }
    }, [user, authLoading, navigate]);

    const fetchHubData = async () => {
        setLoading(true);
        try {
            // Fetch bookings
            const bookings = await api.bookings.getAll({ user_id: user?.id });
            const upcoming = bookings.filter((b: any) => b.status === "pending" || b.status === "confirmed");
            const completed = bookings.filter((b: any) => b.status === "completed");

            setStats({
                totalBookings: bookings.length,
                upcomingBookings: upcoming.length,
                completedBookings: completed.length,
            });

            if (upcoming.length === 0 && completed.length > 0) {
                // Auto-generate suggested appointment based on last visit
                const lastVisit = completed.sort((a: any, b: any) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())[0];
                const nextDate = new Date(lastVisit.booking_date);
                nextDate.setMonth(nextDate.getMonth() + 1);

                const suggestedAppointment = {
                    id: 'suggested-' + lastVisit.id,
                    service_name: lastVisit.service_name, // e.g., "Haircut (Suggested)"
                    salon_name: lastVisit.salon_name,
                    booking_date: nextDate.toISOString(),
                    booking_time: lastVisit.booking_time,
                    status: 'suggested'
                };
                setUpcomingBookings([suggestedAppointment]);
            } else {
                setUpcomingBookings(upcoming.slice(0, 2));
            }

            // Fetch health profile (if exists)
            // Note: Since health profiles are salon-linked, we might just show a "Manage Health Profiles" or 
            // a message that it's available. For hub, maybe just a placeholder or general check.
            try {
                // This is a bit tricky as health profiles are salon-specific. 
                // Maybe just show a link to view health history.
            } catch (e) { }

        } catch (error) {
            console.error("Error fetching hub data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) return null;

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <Navbar />

            {/* Main Content */}
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-6xl">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                            Welcome, <span className="text-accent">{user.full_name?.split(' ')[0]}</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 text-lg">
                            Manage your premium salon experience from one hub.
                        </p>
                    </motion.div>

                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: "Total Visits", value: stats.totalBookings, icon: History, color: "bg-blue-50 text-blue-600" },
                        { label: "Upcoming", value: stats.upcomingBookings, icon: Calendar, color: "bg-orange-50 text-orange-600" },
                        { label: "Points", value: stats.completedBookings * 10, icon: Star, color: "bg-yellow-50 text-yellow-600" }
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-8 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                                    </div>
                                    <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Appointments & Actions */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Upcoming Appointments */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black text-slate-900">Next Appointments</CardTitle>
                                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest mt-1">Don't miss your grooming session</CardDescription>
                                    </div>
                                    <Button variant="ghost" asChild className="text-accent font-black hover:bg-accent/5 rounded-xl">
                                        <Link to="/my-bookings">View All <ChevronRight className="w-4 h-4 ml-1" /></Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-8 pt-0 space-y-4">
                                    {upcomingBookings.length > 0 ? (
                                        upcomingBookings.map((booking) => (
                                            <div key={booking.id} className="p-6 rounded-[1.5rem] bg-slate-50 flex flex-col md:flex-row items-center gap-6 group hover:bg-slate-100/80 transition-all border border-transparent hover:border-slate-200">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm shrink-0">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
                                                        {new Date(booking.booking_date).toLocaleString('default', { month: 'short' })}
                                                    </p>
                                                    <p className="text-2xl font-black text-slate-900 leading-none">
                                                        {new Date(booking.booking_date).getDate()}
                                                    </p>
                                                </div>
                                                <div className="flex-1 text-center md:text-left">
                                                    <h4 className="font-black text-slate-900 text-lg">{booking.service_name}</h4>
                                                    <p className="text-slate-500 font-bold text-xs flex items-center justify-center md:justify-start gap-1 mt-1 uppercase tracking-tighter">
                                                        <Clock className="w-3 h-3" /> {booking.booking_time} • {booking.salon_name}
                                                    </p>
                                                </div>
                                                <Badge className={`${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : booking.status === 'suggested' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'} px-5 py-2 rounded-xl border-none font-black text-[10px] uppercase tracking-widest`}>
                                                    {booking.status === 'suggested' ? 'Recommended' : booking.status}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Calendar className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="font-black text-slate-900">No upcoming sessions</h3>
                                            <p className="text-slate-400 text-sm font-medium mt-1">Book a session to start your journey.</p>
                                            <Button asChild className="mt-6 bg-slate-900 hover:bg-black text-white rounded-xl font-black px-8 h-12 shadow-xl shadow-slate-900/10">
                                                <Link to="/salons">Discover Salons</Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Quick Action Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: "Find Salons", desc: "Explore elite grooming spots", icon: Search, link: "/salons", color: "bg-accent text-white" },
                                { title: "Your Sessions", desc: "View detailed treatment records", icon: History, link: "/my-bookings", color: "bg-indigo-600 text-white" }
                            ].map((action, i) => (
                                <motion.div
                                    key={action.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
                                >
                                    <Link to={action.link}>
                                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-300 h-full">
                                            <CardContent className="p-8">
                                                <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/5`}>
                                                    <action.icon className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{action.title}</h3>
                                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 leading-relaxed">{action.desc}</p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Health & Loyalty */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Health Profile Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2.5rem] overflow-hidden">
                                <CardContent className="p-8">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center mb-6">
                                        <ShieldCheck className="w-6 h-6 text-accent" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight">Health Records</h3>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 mb-6">Skin & Treatment History</p>

                                    <div className="space-y-4 mb-4">
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <span className="text-xs font-bold text-slate-300">Skin Type</span>
                                            <Badge variant="outline" className="text-white border-white/20 px-3 py-1 rounded-lg bg-white/5 text-[10px] uppercase font-black tracking-tighter">Normal</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <span className="text-xs font-bold text-slate-300">Allergies</span>
                                            <Badge variant="outline" className="text-rose-400 border-rose-400/20 px-3 py-1 rounded-lg bg-rose-400/5 text-[10px] uppercase font-black tracking-tighter">None Reported</Badge>
                                        </div>
                                    </div>

                                    <Button asChild variant="ghost" className="w-full text-white hover:bg-white/10 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest h-12 border border-white/10">
                                        <Link to="/user/health">Manage Health Profile</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Bottom Actions */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                            className="flex flex-col gap-3"
                        >
                            <Button
                                variant="ghost"
                                onClick={signOut}
                                className="h-14 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                            >
                                <LogOut className="w-4 h-4 mr-2" /> Log Out
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
