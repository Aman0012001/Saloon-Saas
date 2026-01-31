import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Users,
    Search,
    Filter,
    CreditCard,
    CheckCircle2,
    XCircle,
    Loader2,
    Settings,
    Calendar,
    ArrowRight,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { cn } from "@/lib/utils";

interface Membership {
    salon_id: string;
    salon_name: string;
    salon_email: string;
    subscription_id: string | null;
    plan_id: string | null;
    subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | null;
    subscription_end_date: string | null;
    plan_name: string | null;
}

interface Plan {
    id: string;
    name: string;
    is_active: boolean;
}

export default function AdminMembers() {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Membership | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("active");
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [membershipData, plansData] = await Promise.all([
                api.admin.getMemberships(),
                api.admin.getSubscriptionPlans()
            ]);
            setMemberships(membershipData || []);
            setPlans((plansData || []).filter((p: any) => p.is_active));
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load membership data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssignClick = (member: Membership) => {
        setSelectedMember(member);
        setSelectedPlanId(member.plan_id || "");
        setSelectedStatus(member.subscription_status || "active");
        setShowAssignDialog(true);
    };

    const handleSaveAssignment = async () => {
        if (!selectedMember || !selectedPlanId) {
            toast({ title: "Required", description: "Please select a plan.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            await api.admin.assignMembership({
                salon_id: selectedMember.salon_id,
                plan_id: selectedPlanId,
                status: selectedStatus
            });
            toast({ title: "Success", description: "Membership updated successfully." });
            setShowAssignDialog(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update membership.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const filteredMembers = memberships.filter(m =>
        m.salon_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.salon_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Users className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight">Manage Memberships</h1>
                                <p className="text-gray-400 font-medium text-sm">Assign and control saloon subscription plans</p>
                            </div>
                        </div>

                        <div className="flex w-full md:w-96 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search saloons or emails..."
                                className="pl-12 bg-gray-900/50 border-gray-700 h-12 rounded-xl focus:ring-blue-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Syncing registry data...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-900/50">
                                <TableRow className="border-gray-700 hover:bg-transparent">
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8">Saloon Entity</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Tier Status</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Renewal Date</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Control</TableHead>
                                </TableRow>
                            </TableHeader>
                        </Table>
                    )}
                    {loading ? null : (
                        <ScrollArea className={cn(
                            "w-full",
                            filteredMembers.length > 4 ? "h-[600px]" : "h-auto"
                        )}>
                            <Table>
                                <TableBody>
                                    {filteredMembers.map((member) => (
                                        <TableRow key={member.salon_id} className="border-gray-700 hover:bg-gray-700/30 transition-colors">
                                            <TableCell className="py-6 px-8">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg text-white">{member.salon_name}</span>
                                                    <span className="text-xs text-gray-500">{member.salon_email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex flex-col gap-2">
                                                    <Badge className={cn(
                                                        "w-fit font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full",
                                                        member.plan_name ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" : "bg-gray-700 text-gray-400"
                                                    )}>
                                                        <Zap className="w-3 h-3 mr-1.5 inline" />
                                                        {member.plan_name || "Unassigned"}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={cn(
                                                            "h-1.5 w-1.5 rounded-full",
                                                            member.subscription_status === 'active' ? "bg-emerald-500" : "bg-red-500"
                                                        )} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                            {member.subscription_status || "Inactive"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm font-medium">
                                                        {member.subscription_end_date ? new Date(member.subscription_end_date).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <Button
                                                    onClick={() => handleAssignClick(member)}
                                                    variant="outline"
                                                    className="bg-gray-900 border-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all rounded-xl font-bold text-xs"
                                                >
                                                    Assign Plan &rarr;
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </div>
            </div>

            {/* Assign Modal */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md p-0 overflow-hidden rounded-3xl">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 border-b border-gray-800">
                        <DialogTitle className="text-2xl font-black italic tracking-tight">Modify Membership</DialogTitle>
                        <DialogDescription className="text-gray-400 mt-2 font-medium">
                            Adjusting permissions for <span className="text-white font-bold">{selectedMember?.salon_name}</span>
                        </DialogDescription>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Target Plan Tier</label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger className="bg-gray-800 border-gray-700 h-14 rounded-2xl text-lg font-bold px-6">
                                    <SelectValue placeholder="Select a Tier" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white rounded-2xl">
                                    {plans.map(p => (
                                        <SelectItem key={p.id} value={p.id} className="focus:bg-gray-700 font-bold p-4 rounded-xl">
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Subscription Protocol</label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="bg-gray-800 border-gray-700 h-14 rounded-2xl text-lg font-bold px-6">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white rounded-2xl">
                                    <SelectItem value="active" className="font-bold p-4">Active & Verified</SelectItem>
                                    <SelectItem value="past_due" className="font-bold p-4">Past Due</SelectItem>
                                    <SelectItem value="trial" className="font-bold p-4">Trial Mode</SelectItem>
                                    <SelectItem value="deactivated" className="font-bold p-4 text-red-400">Deactivated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-950 border-t border-gray-800 flex gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowAssignDialog(false)}
                            className="flex-1 h-14 rounded-2xl font-bold text-gray-400"
                        >
                            Abort
                        </Button>
                        <Button
                            onClick={handleSaveAssignment}
                            disabled={saving}
                            className="flex-[2] h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/10"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Deploy Assignment"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
