import { useState, useEffect, useCallback } from "react";
import {
    CalendarDays,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
    ArrowLeft,
    Loader2,
    Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function StaffLeavesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentSalon } = useSalon();
    const { toast } = useToast();

    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [staffId, setStaffId] = useState<string | null>(null);

    const [newLeave, setNewLeave] = useState({
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: format(new Date(), "yyyy-MM-dd"),
        leave_type: "casual",
        reason: ""
    });

    const fetchLeaves = useCallback(async () => {
        if (!currentSalon || !user) return;
        try {
            setLoading(true);
            const me = await api.staff.getMe(currentSalon.id);
            if (me) {
                setStaffId(me.id);
                const data = await api.staff.getLeaves(me.id);
                setLeaves(data);
            }
        } catch (error) {
            console.error("Fetch leaves error:", error);
        } finally {
            setLoading(false);
        }
    }, [currentSalon, user]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const handleCreateLeave = async () => {
        if (!staffId || !currentSalon) return;

        try {
            await api.staff.createLeave(staffId, {
                ...newLeave,
                salon_id: currentSalon.id
            });
            toast({
                title: "Request Submitted",
                description: "Your leave request is awaiting management approval."
            });
            setIsRequestOpen(false);
            fetchLeaves();
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.message || "Could not log leave request.",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-500 text-white border-none font-black text-[10px] uppercase">Rejected</Badge>;
            default:
                return <Badge className="bg-amber-500 text-white border-none font-black text-[10px] uppercase">Pending</Badge>;
        }
    };

    return (
        <ResponsiveDashboardLayout showBackButton={true}>
            <div className="max-w-[1200px] mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                            <CalendarDays className="w-10 h-10 text-[#F2A93B]" />
                            Staff Leaves
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Absence Management • Tactical Deployment Pause
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsRequestOpen(true)}
                        className="h-14 px-10 bg-[#F2A93B] hover:bg-[#E29A2B] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center gap-4"
                    >
                        <Plus className="w-5 h-5" />
                        New Request
                    </Button>
                </div>

                {/* Tactical Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden p-8 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{leaves.filter(l => l.status === 'approved').length}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved Sessions</p>
                        </div>
                    </Card>
                    <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden p-8 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <Clock className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{leaves.filter(l => l.status === 'pending').length}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Clearances</p>
                        </div>
                    </Card>
                    <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden p-8 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                            <AlertCircle className="w-7 h-7 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{leaves.filter(l => l.status === 'rejected').length}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Denied Apps</p>
                        </div>
                    </Card>
                </div>

                {/* Leave Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {loading ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#F2A93B]" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Local Records...</p>
                        </div>
                    ) : leaves.length === 0 ? (
                        <div className="col-span-full py-32 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                            <Calendar className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Zero Absence Deployments Found</p>
                        </div>
                    ) : (
                        leaves.map((leave, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-2xl transition-all h-full">
                                    <div className={cn(
                                        "h-3 w-full",
                                        leave.status === 'approved' ? 'bg-emerald-500' : leave.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                                    )} />
                                    <CardContent className="p-10 space-y-8">
                                        <div className="flex items-center justify-between">
                                            {getStatusBadge(leave.status)}
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{leave.leave_type}</span>
                                        </div>

                                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-300 uppercase mb-2">Start</p>
                                                <p className="text-sm font-black text-slate-900">{format(new Date(leave.start_date), "MMM dd, yyyy")}</p>
                                            </div>
                                            <ChevronRight className="w-6 h-6 text-slate-200" />
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-300 uppercase mb-2">End</p>
                                                <p className="text-sm font-black text-slate-900">{format(new Date(leave.end_date), "MMM dd, yyyy")}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Reason / Narrative</p>
                                            <p className="text-xs font-bold text-slate-600 italic bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                                                {leave.reason || "Operational narrative not provided."}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Request Dialog */}
                <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                    <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-10 bg-white">
                        <DialogHeader className="space-y-4">
                            <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase">Pause Deployment</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Submit a narrative for management authorization.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-6 border-y border-slate-50 my-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={newLeave.start_date}
                                        onChange={e => setNewLeave({ ...newLeave, start_date: e.target.value })}
                                        className="h-12 bg-slate-50 border-none rounded-xl text-xs font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</Label>
                                    <Input
                                        type="date"
                                        value={newLeave.end_date}
                                        onChange={e => setNewLeave({ ...newLeave, end_date: e.target.value })}
                                        className="h-12 bg-slate-50 border-none rounded-xl text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leave Scope</Label>
                                <Select
                                    value={newLeave.leave_type}
                                    onValueChange={v => setNewLeave({ ...newLeave, leave_type: v })}
                                >
                                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl text-xs font-bold">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-xl">
                                        <SelectItem value="casual">Casual Leave</SelectItem>
                                        <SelectItem value="sick">Medical / Sick</SelectItem>
                                        <SelectItem value="emergency">Emergency Pause</SelectItem>
                                        <SelectItem value="unpaid">Unpaid / Personalized</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission Narrative (Reason)</Label>
                                <Textarea
                                    value={newLeave.reason}
                                    onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                                    placeholder="Provide details for authorization..."
                                    className="min-h-[100px] bg-slate-50 border-none rounded-xl text-xs font-bold p-4 focus:ring-[#F2A93B]"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-3">
                            <Button variant="ghost" onClick={() => setIsRequestOpen(false)} className="h-14 flex-1 font-black text-[10px] uppercase tracking-widest text-slate-400">Abort</Button>
                            <Button onClick={handleCreateLeave} className="h-14 flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl">Submit App</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ResponsiveDashboardLayout>
    );
}
