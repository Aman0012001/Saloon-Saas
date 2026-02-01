import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Plus,
    Zap,
    Check,
    Settings,
    Trash2,
    Edit2,
    Loader2,
    Star,
    Sparkles,
    Calendar,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { cn } from "@/lib/utils";

interface Plan {
    id: string;
    name: string;
    description: string;
    monthly_price: number;
    annual_price: number;
    features: string[];
    is_active: boolean;
}

export default function AdminMembershipPlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({
        name: "",
        description: "",
        monthly_price: 0,
        annual_price: 0,
        features: [""],
        is_active: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const plansData = await api.admin.getSubscriptionPlans();

            const processedPlans = (plansData || []).map((p: any) => ({
                ...p,
                features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || [])
            }));
            setPlans(processedPlans);
        } catch (error: any) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: "Failed to load subscription data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddFeature = () => {
        setCurrentPlan(prev => ({
            ...prev,
            features: [...(prev.features || []), ""]
        }));
    };

    const handleRemoveFeature = (index: number) => {
        setCurrentPlan(prev => ({
            ...prev,
            features: (prev.features || []).filter((_, i) => i !== index)
        }));
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...(currentPlan.features || [])];
        newFeatures[index] = value;
        setCurrentPlan(prev => ({ ...prev, features: newFeatures }));
    };

    const handleSubmitPlan = async () => {
        if (!currentPlan.name || !currentPlan.monthly_price) {
            toast({ title: "Required Fields", description: "Plan name and monthly price are required.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const planData = {
                ...currentPlan,
                features: JSON.stringify(currentPlan.features?.filter(f => f.trim() !== ""))
            };

            if (currentPlan.id) {
                await api.admin.updateSubscriptionPlan(currentPlan.id, planData);
                toast({ title: "Success", description: "Membership plan updated successfully." });
            } else {
                await api.admin.createSubscriptionPlan(planData);
                toast({ title: "Success", description: "New membership plan created." });
            }
            setShowDialog(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save membership plan.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const togglePlanStatus = async (plan: Plan) => {
        try {
            await api.admin.updateSubscriptionPlan(plan.id, {
                ...plan,
                is_active: !plan.is_active,
                features: JSON.stringify(plan.features)
            });
            fetchData();
            toast({ title: plan.is_active ? "Plan Deactivated" : "Plan Activated" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        }
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F8FAFC] -m-8 p-8 text-[#1E293B]">
                <div className="max-w-7xl mx-auto space-y-10">

                    {/* Header */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 blur-[100px] rounded-full" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Zap className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tight text-[#1E293B]">Subscription Management</h1>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Configure packages  for Saloon Owners</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    onClick={() => {
                                        setCurrentPlan({ name: "", description: "", monthly_price: 0, annual_price: 0, features: [""], is_active: true });
                                        setShowDialog(true);
                                    }}
                                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 h-12 font-bold rounded-xl shadow-md shadow-blue-500/10"
                                >
                                    <Plus className="w-5 h-5 mr-2" /> Create Plan
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8">
                            <h2 className="text-sm font-black uppercase tracking-widest text-[#1E293B]">Membership Plans Configuration</h2>
                        </div>

                        <div className="mt-6">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-white h-[500px] rounded-[3rem] animate-pulse border border-slate-100" />
                                    ))}
                                </div>
                            ) : plans.length === 0 ? (
                                <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
                                    <Sparkles className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-[#1E293B]">No Plans Configured</h3>
                                    <p className="text-slate-500 font-medium">Start by creating a membership plan.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className={cn(
                                                "bg-white rounded-[3rem] border-2 p-10 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden",
                                                plan.is_active ? "border-slate-100 shadow-xl shadow-slate-200/50" : "border-slate-100 opacity-70 grayscale"
                                            )}
                                        >
                                            <div className="space-y-8">
                                                <div className="space-y-2">
                                                    <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-lg">
                                                        {plan.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                    <h3 className="text-3xl font-black text-[#1E293B] group-hover:text-blue-600 transition-colors uppercase tracking-tight">{plan.name}</h3>
                                                    <p className="text-slate-500 font-medium line-clamp-2">{plan.description}</p>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black text-[#1E293B]">RM {plan.monthly_price}</span>
                                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">/ month</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Included Features</p>
                                                    <div className="space-y-3">
                                                        {plan.features.slice(0, 6).map((feature, idx) => (
                                                            <div key={idx} className="flex items-center gap-3">
                                                                <div className="h-5 w-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                                    <Check className="w-3 h-3 text-green-600 stroke-[3px]" />
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-600">{feature}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-8 flex items-center justify-between gap-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setCurrentPlan(plan);
                                                            setShowDialog(true);
                                                        }}
                                                        className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                                    >
                                                        <Edit2 className="w-4 h-4 mr-2" /> Edit Plan
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => togglePlanStatus(plan)}
                                                        className={cn(
                                                            "w-12 h-12 rounded-xl p-0",
                                                            plan.is_active ? "text-slate-400 hover:text-red-500" : "text-green-500 hover:text-green-600"
                                                        )}
                                                    >
                                                        {plan.is_active ? <Trash2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Plan Modal */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-2xl bg-white rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                        <div className="px-10 py-8 bg-slate-900 text-white relative">
                            <DialogTitle className="text-3xl font-black tracking-tight mb-2">
                                {currentPlan.id ? "Edit Membership Plan" : "Create Membership Plan"}
                            </DialogTitle>
                        </div>

                        <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Plan Name</Label>
                                <Input
                                    value={currentPlan.name}
                                    onChange={e => setCurrentPlan(prev => ({ ...prev, name: e.target.value }))}
                                    className="h-14 bg-slate-50 border-slate-100 rounded-xl font-bold px-6 shadow-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description</Label>
                                <Textarea
                                    value={currentPlan.description}
                                    onChange={e => setCurrentPlan(prev => ({ ...prev, description: e.target.value }))}
                                    className="min-h-[100px] bg-slate-50 border-slate-100 rounded-xl font-medium px-6 py-4 shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Monthly (RM)</Label>
                                    <Input
                                        type="number"
                                        value={currentPlan.monthly_price}
                                        onChange={e => setCurrentPlan(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) }))}
                                        className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold px-6 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Annual (RM)</Label>
                                    <Input
                                        type="number"
                                        value={currentPlan.annual_price}
                                        onChange={e => setCurrentPlan(prev => ({ ...prev, annual_price: parseFloat(e.target.value) }))}
                                        className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold px-6 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Feature List</Label>
                                    <Button size="sm" onClick={handleAddFeature} variant="ghost" className="bg-blue-600 text-white font-bold hover:bg-blue-700 h-10 px-6 rounded-xl transition-colors shadow-lg">
                                        <Plus className="w-4 h-4 mr-2" /> Add Item
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {currentPlan.features?.map((feature, idx) => (
                                        <div key={idx} className="flex gap-3 group items-center">
                                            <Input
                                                value={feature}
                                                onChange={(e) => handleFeatureChange(idx, e.target.value)}
                                                className="flex-1 h-12 bg-slate-50 border-slate-100 rounded-xl font-bold px-4"
                                            />
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleRemoveFeature(idx)}
                                                className="text-slate-300 hover:text-red-500 h-10 w-10"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 flex gap-4">
                            <Button variant="ghost" onClick={() => setShowDialog(false)} className="flex-1 h-14 rounded-xl font-bold">Cancel</Button>
                            <Button disabled={saving} onClick={handleSubmitPlan} className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-xl">
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Configuration"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
