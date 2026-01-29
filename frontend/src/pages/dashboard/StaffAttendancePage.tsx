import { useState, useEffect, useCallback } from "react";
import {
    Clock,
    Calendar,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    History,
    Timer,
    AlertCircle,
    Loader2,
    BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { format, differenceInMinutes } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StaffAttendancePage() {
    const { user } = useAuth();
    const { currentSalon } = useSalon();

    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalHours: 0,
        daysWorked: 0,
        avgPunctuality: "95%"
    });

    const fetchData = useCallback(async () => {
        if (!currentSalon || !user) return;
        try {
            setLoading(true);
            const me = await api.staff.getMe(currentSalon.id);
            if (me) {
                const history = await api.staff.getAttendance(me.id);
                setAttendance(history);

                // Calculate stats
                let totalMins = 0;
                const uniqueDays = new Set();

                history.forEach((rec: any) => {
                    if (rec.check_in && rec.check_out) {
                        totalMins += differenceInMinutes(new Date(rec.check_out), new Date(rec.check_in));
                    }
                    uniqueDays.add(format(new Date(rec.check_in), "yyyy-MM-dd"));
                });

                setStats({
                    totalHours: Math.round(totalMins / 60),
                    daysWorked: uniqueDays.size,
                    avgPunctuality: "92%" // Mocked
                });
            }
        } catch (error) {
            console.error("Fetch attendance error:", error);
        } finally {
            setLoading(false);
        }
    }, [currentSalon, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <ResponsiveDashboardLayout showBackButton={true}>
            <div className="max-w-[1200px] mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <Timer className="w-10 h-10 text-[#F2A93B]" />
                        Deployment Logs
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Attendance Matrix • Real-time Force Tracking
                    </p>
                </div>

                {/* Global Performance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-8 flex items-center gap-6 group hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-[#F2A93B]/10 flex items-center justify-center group-hover:bg-[#F2A93B] group-hover:text-white transition-all shadow-inner">
                            <History className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{stats.daysWorked}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Deployments</p>
                        </div>
                    </Card>
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-8 flex items-center gap-6 group hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all shadow-inner">
                            <Clock className="w-8 h-8 text-blue-500 group-hover:text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{stats.totalHours}h</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Force Output (Hrs)</p>
                        </div>
                    </Card>
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-8 flex items-center gap-6 group hover:shadow-xl transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                            <BarChart3 className="w-8 h-8 text-emerald-500 group-hover:text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{stats.avgPunctuality}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Punctuality</p>
                        </div>
                    </Card>
                </div>

                {/* Attendance Ledger */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Deployment Ledger</h3>
                        <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5">
                            {attendance.length} Total Logs
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-[#F2A93B]" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decrypting Force Logs...</p>
                            </div>
                        ) : attendance.length === 0 ? (
                            <div className="py-32 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Tactical Logs Synchronized</p>
                            </div>
                        ) : (
                            attendance.map((rec, i) => {
                                const durationMins = rec.check_out ? differenceInMinutes(new Date(rec.check_out), new Date(rec.check_in)) : null;
                                const hours = durationMins ? Math.floor(durationMins / 60) : 0;
                                const mins = durationMins ? durationMins % 60 : 0;

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-2xl transition-all">
                                            <CardContent className="p-8 flex flex-wrap items-center justify-between gap-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-xl shadow-slate-900/10 transition-transform group-hover:scale-105">
                                                        <span className="text-[8px] font-black uppercase opacity-60">{format(new Date(rec.check_in), "MMM")}</span>
                                                        <span className="text-xl font-black">{format(new Date(rec.check_in), "dd")}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-lg font-black text-slate-900 tracking-tight">{format(new Date(rec.check_in), "EEEE")}</h4>
                                                        <div className="flex items-center gap-4">
                                                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase px-3">
                                                                {format(new Date(rec.check_in), "h:mm a")}
                                                            </Badge>
                                                            <span className="text-slate-200">/</span>
                                                            <Badge className={cn(
                                                                "border-none font-black text-[9px] uppercase px-3",
                                                                rec.check_out ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600 animate-pulse"
                                                            )}>
                                                                {rec.check_out ? format(new Date(rec.check_out), "h:mm a") : "Active Duty"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tactical Runtime</p>
                                                        <p className="text-xl font-black text-slate-900">
                                                            {rec.check_out ? `${hours}h ${mins}m` : "Synchronizing..."}
                                                        </p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                                                        rec.check_out ? "bg-slate-200" : "bg-[#F2A93B] animate-ping"
                                                    )} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </ResponsiveDashboardLayout>
    );
}
