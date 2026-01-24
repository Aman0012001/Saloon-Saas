import { useEffect, useState } from "react";
import {
  CreditCard,
  Download,
  Search,
  TrendingUp,
  DollarSign,
  Receipt,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');

      if (error) throw error;

      const parsedPlans = data?.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : [],
      })) || [];

      setPlans(parsedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
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
        await supabase
          .from('subscription_plans')
          .update({
            name: planForm.name,
            description: planForm.description,
            price_monthly: planForm.price_monthly,
            price_yearly: planForm.price_yearly,
            max_staff: planForm.max_staff,
            max_services: planForm.max_services,
          })
          .eq('id', editingPlan.id);
      } else {
        await supabase.from('subscription_plans').insert({
          name: planForm.name,
          slug: planForm.slug,
          description: planForm.description,
          price_monthly: planForm.price_monthly,
          price_yearly: planForm.price_yearly,
          max_staff: planForm.max_staff,
          max_services: planForm.max_services,
        });
      }

      await fetchPlans();
      setShowPlanDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving plan:', error);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payments & Subscriptions</h1>
            <p className="text-muted-foreground">Manage subscription plans and track payments</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold">₹0</p>
                  <p className="text-sm text-muted-foreground">This month</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plans Available</p>
                  <p className="text-3xl font-bold">{plans.filter(p => p.is_active).length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                  <p className="text-3xl font-bold">10%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showPlanDialog} onOpenChange={(open) => {
                setShowPlanDialog(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>Add New Plan</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                    <DialogDescription>
                      Configure subscription plan details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input
                          value={planForm.name}
                          onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                          placeholder="e.g., Professional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input
                          value={planForm.slug}
                          onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                          placeholder="e.g., professional"
                          disabled={!!editingPlan}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={planForm.description}
                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                        placeholder="Short description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Monthly Price (₹)</Label>
                        <Input
                          type="number"
                          value={planForm.price_monthly}
                          onChange={(e) => setPlanForm({ ...planForm, price_monthly: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Yearly Price (₹)</Label>
                        <Input
                          type="number"
                          value={planForm.price_yearly}
                          onChange={(e) => setPlanForm({ ...planForm, price_yearly: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Staff</Label>
                        <Input
                          type="number"
                          value={planForm.max_staff}
                          onChange={(e) => setPlanForm({ ...planForm, max_staff: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Services</Label>
                        <Input
                          type="number"
                          value={planForm.max_services}
                          onChange={(e) => setPlanForm({ ...planForm, max_services: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSavePlan}>
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => (
                  <Card key={plan.id} className={plan.is_featured ? 'border-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.is_featured && (
                          <Badge>Popular</Badge>
                        )}
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold">₹{plan.price_monthly}</p>
                        <p className="text-sm text-muted-foreground">/month</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p>• Up to {plan.max_staff || 'Unlimited'} staff</p>
                        <p>• Up to {plan.max_services || 'Unlimited'} services</p>
                        {plan.features.slice(0, 3).map((feature, i) => (
                          <p key={i}>• {feature}</p>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => openEditPlan(plan)}
                      >
                        Edit Plan
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground">
                  Payment tracking will appear here once salons start subscribing
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}