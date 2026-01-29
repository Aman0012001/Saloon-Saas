import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Gift, Plus, Trash2, Trophy, Coins, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LoyaltyPage() {
    const { currentSalon, loading: salonLoading, isOwner, isManager } = useSalon();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const [rewards, setRewards] = useState<any[]>([]);

    // Form States
    const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
    const [rewardForm, setRewardForm] = useState({
        name: "",
        description: "",
        points_required: "100",
        discount_amount: "0",
        is_active: true
    });

    const [programSettingsForm, setProgramSettingsForm] = useState({
        points_per_currency_unit: "1",
        min_points_redemption: "100",
        signup_bonus_points: "0",
        is_active: false
    });

    useEffect(() => {
        if (currentSalon) {
            fetchData();
        }
    }, [currentSalon]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsData, rewardsData] = await Promise.all([
                api.loyalty.getSettings(currentSalon!.id),
                api.loyalty.getRewards(currentSalon!.id)
            ]);

            setSettings(settingsData.settings);
            setRewards(rewardsData);

            // Init form
            if (settingsData.settings) {
                setProgramSettingsForm({
                    points_per_currency_unit: settingsData.settings.points_per_currency_unit,
                    min_points_redemption: settingsData.settings.min_points_redemption,
                    signup_bonus_points: settingsData.settings.signup_bonus_points,
                    is_active: !!settingsData.settings.is_active
                });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load loyalty data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await api.loyalty.updateSettings({
                salon_id: currentSalon!.id,
                ...programSettingsForm,
                is_active: programSettingsForm.is_active ? 1 : 0
            });
            toast({ title: "Success", description: "Loyalty program settings updated." });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
        }
    };

    const handleAddReward = async () => {
        try {
            await api.loyalty.createReward({
                salon_id: currentSalon!.id,
                ...rewardForm,
                is_active: rewardForm.is_active ? 1 : 0
            });
            toast({ title: "Success", description: "Reward added successfully." });
            setIsAddRewardOpen(false);
            fetchData();
            setRewardForm({ name: "", description: "", points_required: "100", discount_amount: "0", is_active: true });
        } catch (error) {
            toast({ title: "Error", description: "Failed to add reward", variant: "destructive" });
        }
    };

    const handleDeleteReward = async (id: string) => {
        if (!confirm("Are you sure you want to delete this reward?")) return;
        try {
            await api.loyalty.deleteReward(currentSalon!.id, id);
            toast({ title: "Success", description: "Reward deleted." });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete reward", variant: "destructive" });
        }
    };

    if (loading || !currentSalon) {
        return (
            <ResponsiveDashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </ResponsiveDashboardLayout>
        );
    }

    if (!isOwner && !isManager) {
        return (
            <ResponsiveDashboardLayout>
                <div className="p-8 text-center text-red-500">Access Denied</div>
            </ResponsiveDashboardLayout>
        );
    }

    return (
        <ResponsiveDashboardLayout showBackButton={true}>
            <div className="p-6 max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loyalty Program</h1>
                        <p className="text-slate-500">Manage customer rewards and points configuration.</p>
                    </div>
                    {programSettingsForm.is_active && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 text-sm">
                            Program Active
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-slate-50/50 pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Settings2 className="w-5 h-5 text-slate-400" />
                                    Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="font-bold">Enable Program</Label>
                                        <p className="text-xs text-slate-500">Allow customers to earn points.</p>
                                    </div>
                                    <Switch
                                        checked={programSettingsForm.is_active}
                                        onCheckedChange={(c) => setProgramSettingsForm(p => ({ ...p, is_active: c }))}
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="space-y-2">
                                        <Label>Points Earning Rate</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">1 Point per</span>
                                            <Input
                                                className="pl-24"
                                                type="number"
                                                value={programSettingsForm.points_per_currency_unit}
                                                onChange={e => setProgramSettingsForm(p => ({ ...p, points_per_currency_unit: e.target.value }))}
                                            />
                                            <span className="absolute right-3 top-2.5 text-slate-400 text-sm">Spent</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">Example: 1 = 1 point per RM 1. 0.5 = 1 point per RM 2.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Signup Bonus</Label>
                                        <Input
                                            type="number"
                                            value={programSettingsForm.signup_bonus_points}
                                            onChange={e => setProgramSettingsForm(p => ({ ...p, signup_bonus_points: e.target.value }))}
                                        />
                                        <p className="text-[10px] text-slate-400">Points awarded to new customers.</p>
                                    </div>
                                </div>

                                <Button onClick={handleSaveSettings} className="w-full bg-slate-900 text-white font-bold">
                                    Save Configuration
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <CardContent className="p-6 relative z-10">
                                <Trophy className="w-8 h-8 mb-4 text-yellow-300" />
                                <h3 className="text-lg font-bold mb-1">Boost Retention</h3>
                                <p className="text-white/80 text-sm leading-relaxed">
                                    Loyalty programs can increase customer lifetime value by up to 30%. Keep your rewards achievable!
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Rewards List */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-0 shadow-lg h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-xl">Reward Tiers</CardTitle>
                                    <CardDescription>Items customers can redeem with points.</CardDescription>
                                </div>
                                <Dialog open={isAddRewardOpen} onOpenChange={setIsAddRewardOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-[#F2A93B] hover:bg-[#D99020] text-white">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Reward
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Reward</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Reward Name</Label>
                                                <Input
                                                    placeholder="e.g. Free Haircut"
                                                    value={rewardForm.name}
                                                    onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Points Required</Label>
                                                <Input
                                                    type="number"
                                                    value={rewardForm.points_required}
                                                    onChange={e => setRewardForm({ ...rewardForm, points_required: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Discount Value (Optional)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={rewardForm.discount_amount}
                                                    onChange={e => setRewardForm({ ...rewardForm, discount_amount: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Input
                                                    value={rewardForm.description}
                                                    onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddRewardOpen(false)}>Cancel</Button>
                                            <Button onClick={handleAddReward}>Create Reward</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {rewards.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="font-medium">No rewards configured yet.</p>
                                        <p className="text-sm">Add rewards to encourage repeat visits.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {rewards.map((reward) => (
                                            <div key={reward.id} className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-bold text-slate-800">{reward.name}</h3>
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold">
                                                            {reward.points_required} pts
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mb-4">{reward.description || "No description provided."}</p>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${reward.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        {reward.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-400 hover:text-red-500 hover:bg-red-50"
                                                        onClick={() => handleDeleteReward(reward.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ResponsiveDashboardLayout>
    );
}
