import { useState, useEffect, useCallback } from "react";
import {
    Loader2,
    Briefcase,
    Calendar,
    Clock,
    DollarSign,
    Users,
    ChevronRight,
    ArrowRightLeft,
    PieChart,
    Plus,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear } from "date-fns";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { StaffMember } from "@/types/staff";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StaffProfileDialogProps {
    staff: StaffMember;
    isOpen: boolean;
    onClose: () => void;
}

export function StaffProfileDialog({ staff, isOpen, onClose }: StaffProfileDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchProfileData = useCallback(async () => {
        if (!staff) return;
        setLoading(true);
        try {
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();

            const statsRes = await api.staff.getProfileStats(staff.id, month, year);
            const leavesRes = await api.staff.getLeaves(staff.id);

            setStats(statsRes.stats);
            setRecentCustomers(statsRes.recent_customers || []);
            setLeaves(leavesRes);
        } catch (error: any) {
            toast({
                title: "Data Sync Failed",
                description: "Could not retrieve comprehensive profile records.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [staff, selectedDate, toast]);

    useEffect(() => {
        if (isOpen) {
            fetchProfileData();
        }
    }, [isOpen, fetchProfileData]);

    const getLeaveBadgeColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    if (!staff) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl h-[90vh] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white flex flex-col">
                <div className="bg-[#F2A93B] p-8 text-white relative flex-shrink-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

                    <div className="flex items-center gap-6 relative z-10">
                        <Avatar className="w-24 h-24 border-4 border-white/20 shadow-2xl">
                            <AvatarImage src={staff.avatar_url || ""} />
                            <AvatarFallback className="bg-white text-[#F2A93B] text-3xl font-black">
                                {staff.display_name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <DialogTitle className="text-3xl font-black tracking-tight uppercase">{staff.display_name}</DialogTitle>
                            <DialogDescription className="text-white/80 font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5" />
                                {staff.role?.replace('_', ' ')} • Commission: {staff.commission_percentage}%
                            </DialogDescription>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
                                    ID: {staff.id.slice(0, 8)}
                                </div>
                                <Badge className={cn(
                                    "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                                    staff.is_active ? "bg-emerald-400 text-white" : "bg-white/20 text-white"
                                )}>
                                    {staff.is_active ? "Active Duty" : "Logged Off"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-8 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                            <TabsList className="bg-transparent h-16 w-full justify-start gap-8">
                                {[
                                    { value: 'overview', label: 'Overview', icon: PieChart },
                                    { value: 'earnings', label: 'Earnings', icon: DollarSign },
                                    { value: 'attendance', label: 'Attendance', icon: Clock },
                                    { value: 'leaves', label: 'Leaves', icon: Calendar },
                                    { value: 'customers', label: 'Customers', icon: Users },
                                ].map(tab => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="bg-transparent border-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#F2A93B] rounded-none h-full text-xs font-black uppercase tracking-widest text-slate-400 relative"
                                    >
                                        <tab.icon className="w-3.5 h-3.5 mr-2" />
                                        {tab.label}
                                        <TabsContent value={tab.value} />
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F2A93B] opacity-0 transition-opacity peer-data-[state=active]:opacity-100" />
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                                        <Loader2 className="w-10 h-10 animate-spin text-[#F2A93B]" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Dossier...</p>
                                    </div>
                                ) : (
                                    <>
                                        <TabsContent value="overview" className="m-0 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <Card className="rounded-3xl border-none shadow-sm bg-slate-50">
                                                    <CardContent className="p-6">
                                                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                                                            <Users className="w-5 h-5 text-[#F2A93B]" />
                                                        </div>
                                                        <p className="text-2xl font-black text-slate-900">{stats?.customers || 0}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Customers Month</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="rounded-3xl border-none shadow-sm bg-slate-50">
                                                    <CardContent className="p-6">
                                                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                                                            <Clock className="w-5 h-5 text-[#F2A93B]" />
                                                        </div>
                                                        <p className="text-2xl font-black text-slate-900">{stats?.total_hours || 0}h</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Logged Hours</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="rounded-3xl border-none shadow-sm bg-slate-50">
                                                    <CardContent className="p-6">
                                                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                                                            <DollarSign className="w-5 h-5 text-emerald-500" />
                                                        </div>
                                                        <p className="text-2xl font-black text-slate-900">${stats?.earnings?.toLocaleString() || 0}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Current Earnings</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="rounded-3xl border-none shadow-sm bg-slate-50">
                                                    <CardContent className="p-6">
                                                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                                                            <Calendar className="w-5 h-5 text-rose-500" />
                                                        </div>
                                                        <p className="text-2xl font-black text-slate-900">{stats?.leave_days || 0} Days</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Leave Balance</p>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                                                    <CardHeader className="p-8 pb-4">
                                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-[#F2A93B]">Performance Chart</CardTitle>
                                                        <CardDescription className="text-xs font-bold text-slate-400">Monthly revenue generation vs targets.</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="px-8 pb-8">
                                                        <div className="h-48 flex items-end gap-3 pt-8">
                                                            {[45, 60, 40, 75, 55, 90, 65].map((h, i) => (
                                                                <div key={i} className="flex-1 group relative">
                                                                    <div
                                                                        style={{ height: `${h}%` }}
                                                                        className="w-full bg-slate-100 rounded-t-lg group-hover:bg-[#F2A93B]/20 transition-all cursor-pointer relative"
                                                                    >
                                                                        {h > 80 && <div className="absolute -top-1 left-0 right-0 h-1 bg-[#F2A93B] rounded-full shadow-[0_0_10px_#F2A93B]" />}
                                                                    </div>
                                                                    <div className="text-[8px] font-black text-slate-300 mt-2 text-center">WED {i + 1}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                                                    <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                                                        <div>
                                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#F2A93B]">Recent Activity</CardTitle>
                                                            <CardDescription className="text-xs font-bold text-slate-400">Latest business transformations.</CardDescription>
                                                        </div>
                                                        <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">View All</Button>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        <div className="divide-y divide-slate-50 px-8 pb-4">
                                                            {recentCustomers.slice(0, 4).map((log, i) => (
                                                                <div key={i} className="py-4 flex items-center justify-between group">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs">
                                                                            {log.full_name?.charAt(0) || i + 1}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-slate-700">{log.service_name}</p>
                                                                            <p className="text-[9px] font-medium text-slate-400 uppercase">{format(new Date(log.booking_date), "MMM dd, HH:mm")}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-black text-slate-900">${log.price}</p>
                                                                        <p className="text-[8px] font-black text-emerald-500 uppercase">Completed</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="earnings" className="m-0">
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between p-8 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full" />
                                                    <div className="space-y-2 relative z-10">
                                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Total Monthly Reward</p>
                                                        <h4 className="text-5xl font-black">${stats?.earnings?.toLocaleString() || 0}</h4>
                                                        <p className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Base Rate + {staff.commission_percentage}% High-Performance Commission</p>
                                                    </div>
                                                    <div className="relative z-10">
                                                        <Button variant="outline" className="rounded-full bg-white/5 border-white/10 text-white font-black text-[10px] uppercase tracking-widest px-8 h-12 hover:bg-white hover:text-slate-900 transition-all group">
                                                            View Statement <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 border-none">
                                                            <TableHead className="rounded-l-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Operation</TableHead>
                                                            <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Resource Revenue</TableHead>
                                                            <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Commission Share</TableHead>
                                                            <TableHead className="rounded-r-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settlement</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {recentCustomers.map((log, i) => (
                                                            <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                                <TableCell className="px-6 py-5">
                                                                    <span className="font-bold text-slate-700">{log.service_name}</span>
                                                                    <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase">{format(new Date(log.booking_date), "MMM dd, yyyy")}</p>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-5 font-bold text-slate-500">${log.price}</TableCell>
                                                                <TableCell className="px-6 py-5 font-bold text-slate-400">{staff.commission_percentage}%</TableCell>
                                                                <TableCell className="px-6 py-5 text-right font-black text-[#F2A93B]">
                                                                    ${(log.price * (staff.commission_percentage / 100)).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="attendance" className="m-0 space-y-8">
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <Card className="rounded-[2rem] border-slate-100 shadow-sm md:col-span-1 bg-slate-50/50">
                                                    <CardHeader className="p-8">
                                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Work Integrity</CardTitle>
                                                        <CardDescription className="text-xs font-bold text-slate-400">Monthly attendance summary.</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="px-8 pb-8 space-y-6">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Punctuality Force</span>
                                                                <span className="text-xs font-black text-emerald-500">92%</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-inner">
                                                                <div className="h-full bg-emerald-500 w-[92%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                                            </div>
                                                        </div>
                                                        <div className="divide-y divide-slate-100">
                                                            <div className="py-3 flex items-center justify-between">
                                                                <span className="text-xs font-bold text-slate-500">Days Active</span>
                                                                <span className="text-xs font-black text-slate-900">{stats?.days_worked || 0}</span>
                                                            </div>
                                                            <div className="py-3 flex items-center justify-between">
                                                                <span className="text-xs font-bold text-slate-500">Total Force (Hrs)</span>
                                                                <span className="text-xs font-black text-slate-900">{stats?.total_hours || 0}</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="rounded-[2rem] border-slate-100 shadow-sm md:col-span-2 bg-white">
                                                    <div className="p-8 h-full flex flex-col">
                                                        <div className="flex items-center justify-between mb-8">
                                                            <h5 className="text-sm font-black uppercase tracking-widest text-slate-900">Force Matrix (Logs)</h5>
                                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                                <button onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))} className="px-2 py-1 text-[10px] font-black uppercase transition-all hover:bg-white rounded shadow-sm">Prev</button>
                                                                <span className="px-4 py-1 text-[10px] font-black uppercase">{format(selectedDate, "MMM yyyy")}</span>
                                                                <button onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))} className="px-2 py-1 text-[10px] font-black uppercase transition-all hover:bg-white rounded shadow-sm">Next</button>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 grid grid-cols-7 gap-2">
                                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                                <div key={day} className={cn(
                                                                    "aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer",
                                                                    day % 7 === 0 ? "bg-slate-50/50 border-slate-100 opacity-30" : "bg-white border-slate-100 hover:border-[#F2A93B] hover:shadow-lg"
                                                                )}>
                                                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-[#F2A93B]">{day}</span>
                                                                    {day < 20 && day % 3 === 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="leaves" className="m-0 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900">Leave Matrix</h4>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Management of absence logs and requests.</p>
                                                </div>
                                                <Button className="h-12 px-8 bg-[#F2A93B] hover:bg-[#E29A2B] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-[#F2A93B]/20 flex items-center gap-3">
                                                    <Plus className="w-4 h-4" /> Log Absence
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {leaves.map((leave, i) => (
                                                    <Card key={i} className="rounded-[2rem] border-slate-100 shadow-sm bg-white hover:shadow-lg transition-all group overflow-hidden">
                                                        <div className={cn("h-2 w-full", leave.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400')} />
                                                        <CardContent className="p-8">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <Badge className={cn("rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest border", getLeaveBadgeColor(leave.status))}>
                                                                    {leave.status}
                                                                </Badge>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{leave.leave_type}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4 py-4 border-y border-slate-50 mb-4">
                                                                <div className="flex-1 text-center">
                                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Start</p>
                                                                    <p className="text-xs font-black text-slate-700">{format(new Date(leave.start_date), "MMM dd, yy")}</p>
                                                                </div>
                                                                <ArrowRightLeft className="w-4 h-4 text-slate-200" />
                                                                <div className="flex-1 text-center">
                                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">End</p>
                                                                    <p className="text-xs font-black text-slate-700">{format(new Date(leave.end_date), "MMM dd, yy")}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic line-clamp-2">"{leave.reason || "No organizational narrative provided."}"</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                                {leaves.length === 0 && (
                                                    <div className="col-span-full py-20 text-center space-y-4 rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50/20">
                                                        <Calendar className="w-12 h-12 text-slate-100 mx-auto" />
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No absence records synchronized for this operative.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="customers" className="m-0">
                                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 border-none">
                                                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Identity</TableHead>
                                                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Operation / Service</TableHead>
                                                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Fulfillment Date</TableHead>
                                                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Resource Val.</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {recentCustomers.map((log, i) => (
                                                            <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                                <TableCell className="px-8 py-6">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-2xl bg-[#F2A93B]/5 flex items-center justify-center font-black text-[#F2A93B] text-xs">
                                                                            {log.full_name?.charAt(0) || "U"}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-slate-700">{log.full_name || "Unknown Identity"}</p>
                                                                            <p className="text-[9px] font-medium text-slate-400 lowercase">{log.email}</p>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="px-8 py-6">
                                                                    <Badge variant="outline" className="rounded-full border-[#F2A93B]/20 text-[#F2A93B] text-[8px] font-black uppercase tracking-widest px-3">
                                                                        {log.service_name}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="px-8 py-6 text-xs font-bold text-slate-500">
                                                                    {format(new Date(log.booking_date), "EEEE, MMM dd, yyyy")}
                                                                </TableCell>
                                                                <TableCell className="px-8 py-6 text-right font-black text-slate-900">
                                                                    ${log.price}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {recentCustomers.length === 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={4} className="h-64 text-center">
                                                                    <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                                                                        <Users className="w-12 h-12" />
                                                                        <p className="text-[10px] font-black uppercase tracking-widest">No customer deployments detected.</p>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </TabsContent>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
