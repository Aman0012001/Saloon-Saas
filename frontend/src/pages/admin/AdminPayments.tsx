import { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  TrendingUp,
  Banknote,
  Receipt,
  Calendar,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import api from "@/services/api";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  max_staff: number | null;
  max_services: number | null;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
}

export default function AdminPayments() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("plans");
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [planForm, setPlanForm] = useState({
    name: "",
    slug: "",
    description: "",
    price_monthly: 0,
    price_yearly: 0,
    max_staff: 5,
    max_services: 20,
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Fetch from local subscriptions API
      const data = await api.admin.getSubscriptionPlans();
      setPlans(data || []);
    } catch (error) {
      console.error('Local plans sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        await api.admin.updateSubscriptionPlan(editingPlan.id, planForm);
      } else {
        await api.admin.createSubscriptionPlan(planForm);
      }
      await fetchPlans();
      setShowPlanDialog(false);
      resetForm();
    } catch (error) {
      console.error('Local plan persist failed:', error);
    }
  };

  const resetForm = () => {
    setPlanForm({
      name: "",
      slug: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      max_staff: 5,
      max_services: 20,
    });
    setEditingPlan(null);
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly || 0,
      max_staff: plan.max_staff || 5,
      max_services: plan.max_services || 20,
    });
    setShowPlanDialog(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 blur-[120px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-accent">
                <Receipt className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Financal Ledger</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Subscription & Revenue Models (Local)</p>
              </div>
            </div>
            <Dialog open={showPlanDialog} onOpenChange={(open) => { setShowPlanDialog(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-white font-black rounded-xl h-14 px-8 shadow-lg shadow-accent/20">
                  <Zap className="w-4 h-4 mr-2" /> NEW SUBSCRIPTION TIER
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tight text-slate-900">Configure Tier</DialogTitle>
                  <DialogDescription className="font-bold text-slate-400">Initialize a new economic model for your local saloons.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descriptor</Label>
                      <Input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="h-14 bg-slate-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Slug</Label>
                      <Input value={planForm.slug} onChange={e => setPlanForm({ ...planForm, slug: e.target.value })} className="h-14 bg-slate-50 border-none rounded-xl font-bold" disabled={!!editingPlan} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Monthly Rate (RM)</Label>
                      <Input type="number" value={planForm.price_monthly} onChange={e => setPlanForm({ ...planForm, price_monthly: Number(e.target.value) })} className="h-14 bg-slate-50 border-none rounded-xl font-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Yearly Rate (RM)</Label>
                      <Input type="number" value={planForm.price_yearly} onChange={e => setPlanForm({ ...planForm, price_yearly: Number(e.target.value) })} className="h-14 bg-slate-50 border-none rounded-xl font-black" />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-8">
                  <Button onClick={handleSavePlan} className="w-full h-16 bg-slate-900 text-white font-black rounded-3xl shadow-xl">{editingPlan ? 'PERSIST CHANGES' : 'GENERATE TIER'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Gross Local Intake", value: "RM 0", icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Active Nodes", value: plans.length, icon: Zap, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Registry Tiers", value: plans.filter(p => p.is_active).length, icon: Receipt, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "Tax Protocol", value: "10%", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" }
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm bg-white rounded-3xl p-6 group hover:shadow-lg transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-black uppercase tracking-widest leading-none">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-3">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
            <TabsTrigger value="plans" className="rounded-[1.5rem] px-8 h-12 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Subscription Infrastructure</TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-[1.5rem] px-8 h-12 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card key={plan.id} className="border-none shadow-sm bg-white rounded-[3rem] p-8 relative overflow-hidden group hover:shadow-2xl transition-all border-t-8 border-t-accent">
                  {plan.is_featured && <Badge className="absolute top-6 right-6 bg-accent text-white font-black border-none px-4">ELITE</Badge>}
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{plan.description}</p>

                  <div className="my-10">
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">RM {plan.price_monthly}<span className="text-sm text-slate-400 font-bold ml-2">/ CYCLE</span></p>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center"><Calendar className="w-3.5 h-3.5" /></div>
                      Up to {plan.max_staff || '∞'} Staff Nodes
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center"><Sparkles className="w-3.5 h-3.5" /></div>
                      {plan.max_services || '∞'} Service Records
                    </div>
                  </div>

                  <Button variant="outline" className="w-full h-14 border-slate-200 rounded-2xl font-black hover:bg-slate-900 hover:text-white transition-all" onClick={() => openEditPlan(plan)}>UPDATE POLICY</Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="border-none shadow-sm bg-white rounded-[3rem] p-20 text-center">
              <Receipt className="h-16 w-16 mx-auto mb-6 text-slate-100" />
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest">Audit Archive Empty</h4>
              <p className="text-slate-400 font-bold mt-2">Zero financial events detected in the local repository.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
