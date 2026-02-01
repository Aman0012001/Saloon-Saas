import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Settings,
  Save,
  Palette,
  CreditCard,
  Bell,
  Shield,
  FileText,
  Coins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface PlatformSettings {
  platform_name: string;
  platform_commission: number;
  trial_days: number;
  support_email: string;
  currency: string;
  auto_approve_salons: boolean;
  coin_price: number;
  coin_earning_rate: number;
  coin_min_redemption: number;
  coin_max_discount_percent: number;
  coin_signup_bonus: number;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(tabParam || "general");

  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: "GlamBook Local",
    platform_commission: 10,
    trial_days: 14,
    support_email: "support@local.host",
    currency: "MYR",
    auto_approve_salons: false,
    coin_price: 1.00,
    coin_earning_rate: 10,
    coin_min_redemption: 10,
    coin_max_discount_percent: 50,
    coin_signup_bonus: 0,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // In local backend, we might have a specific settings endpoint or generic config
      // For now, let's try to get from local admin API if implemented, else keep defaults
      const data = await api.admin.getSettings();
      if (data) {
        setSettings({
          platform_name: data.platform_name || settings.platform_name,
          platform_commission: Number(data.platform_commission || settings.platform_commission),
          trial_days: Number(data.trial_days || settings.trial_days),
          support_email: data.support_email || settings.support_email,
          currency: data.currency || settings.currency,
          auto_approve_salons: data.auto_approve_salons === true || data.auto_approve_salons === "1",
          coin_price: Number(data.coin_price || settings.coin_price),
          coin_earning_rate: Number(data.coin_earning_rate || settings.coin_earning_rate),
          coin_min_redemption: Number(data.coin_min_redemption || settings.coin_min_redemption),
          coin_max_discount_percent: Number(data.coin_max_discount_percent || settings.coin_max_discount_percent),
          coin_signup_bonus: Number(data.coin_signup_bonus || settings.coin_signup_bonus),
        });
      }
    } catch (error) {
      console.error('Local settings sync failed, using defaults:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.admin.updateSettings(settings);
      toast({ title: "Success", description: "Local registry settings updated" });
    } catch (error) {
      console.error('Error saving local settings:', error);
      toast({ title: "Error", description: "Failed to persist local settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 blur-[120px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-accent">
                <Settings className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Platform Controls</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Configuration Registry</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-accent text-white font-black rounded-xl h-14 px-8 shadow-lg shadow-accent/20">
              {saving ? "SAVING..." : "SAVE CHANGES"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1.5 rounded-[2rem] border border-slate-100 shadow-sm w-full grid grid-cols-5 h-16 mb-8">
            <TabsTrigger value="general" className="rounded-[1.5rem] px-2 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">General</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-[1.5rem] px-2 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Billing</TabsTrigger>
            <TabsTrigger value="economy" className="rounded-[1.5rem] px-2 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Loyalty</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-[1.5rem] px-2 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Alerts</TabsTrigger>
            <TabsTrigger value="legal" className="rounded-[1.5rem] px-2 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Legal</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Palette className="w-6 h-6 text-accent" />
                  Branding Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Platform Alias</Label>
                  <Input
                    value={settings.platform_name}
                    onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                    className="h-16 bg-slate-50 border-none rounded-2xl font-bold px-6 shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Support Endpoint</Label>
                  <Input
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    className="h-16 bg-slate-50 border-none rounded-2xl font-bold px-6 shadow-inner"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-500" />
                  Governance Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 border-2 border-dashed border-slate-100">
                  <div>
                    <p className="font-black text-slate-900">Auto-Authorize Saloons</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Skip manual review for new entries</p>
                  </div>
                  <Switch
                    checked={settings.auto_approve_salons}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_approve_salons: checked })}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trial Validity (Cycles)</Label>
                  <Input
                    type="number"
                    value={settings.trial_days}
                    onChange={(e) => setSettings({ ...settings, trial_days: Number(e.target.value) })}
                    className="h-16 w-full md:w-48 bg-slate-50 border-none rounded-2xl font-black px-8 text-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Financial Protocol</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Platform Tax (%)</Label>
                  <Input
                    type="number"
                    value={settings.platform_commission}
                    onChange={(e) => setSettings({ ...settings, platform_commission: Number(e.target.value) })}
                    className="h-16 bg-slate-50 border-none rounded-2xl font-black px-8 text-2xl"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Active Currency</Label>
                  <Input
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="h-16 bg-slate-50 border-none rounded-2xl font-black px-8"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="economy" className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Set Point Value</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Point Valuation ({settings.currency})</Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">1 Point =</div>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.coin_price}
                      onChange={(e) => setSettings({ ...settings, coin_price: Number(e.target.value) })}
                      className="h-16 bg-slate-50 border-none rounded-2xl font-black pl-24 pr-8 text-2xl"
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Value of one platform point in {settings.currency}.</p>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Earning Rule</Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">1 Point per</div>
                    <Input
                      type="number"
                      value={settings.coin_earning_rate}
                      onChange={(e) => setSettings({ ...settings, coin_earning_rate: Number(e.target.value) })}
                      className="h-16 bg-slate-50 border-none rounded-2xl font-black pl-32 pr-12 text-2xl"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">{settings.currency}</div>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Amount of spending required to earn 1 point.</p>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Minimum Redemption</Label>
                  <Input
                    type="number"
                    value={settings.coin_min_redemption}
                    onChange={(e) => setSettings({ ...settings, coin_min_redemption: Number(e.target.value) })}
                    className="h-16 bg-slate-50 border-none rounded-2xl font-black px-8 text-2xl"
                  />
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Minimum points required in balance to use for a booking.</p>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Maximum Discount (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      max="100"
                      value={settings.coin_max_discount_percent}
                      onChange={(e) => setSettings({ ...settings, coin_max_discount_percent: Number(e.target.value) })}
                      className="h-16 bg-slate-50 border-none rounded-2xl font-black px-8 text-2xl"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</div>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Max percentage of total price that can be paid with points.</p>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">New Account Bonus</Label>
                  <Input
                    type="number"
                    value={settings.coin_signup_bonus}
                    onChange={(e) => setSettings({ ...settings, coin_signup_bonus: Number(e.target.value) })}
                    className="h-16 bg-slate-50 border-none rounded-2xl font-black px-8 text-2xl"
                  />
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Initial point balance for new users.</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10">
              <h3 className="text-2xl font-black text-slate-900 mb-8">Signal Infrastructure</h3>
              <div className="space-y-4">
                {[
                  { label: "New Saloon Alerts", desc: "Notify upon unverified registry entry" },
                  { label: "Aggregate Summary", desc: "Daily local station health check" },
                  { label: "Transaction Logs", desc: "Real-time auditing and alerts" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-black text-slate-900">{item.label}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={i !== 1} />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="animate-in fade-in duration-500">
            <Card className="border-none shadow-sm bg-white rounded-[3rem] p-10">
              <div className="flex items-center gap-4 mb-10">
                <FileText className="w-8 h-8 text-slate-400" />
                <h3 className="text-2xl font-black text-slate-900">Registry Mandates</h3>
              </div>
              <div className="space-y-6">
                {['Terms of Service Registry', 'Privacy Encryption Policy', 'Refund Liability Terms'].map((policy, i) => (
                  <div key={i} className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{policy}</Label>
                    <Input placeholder="/policy-endpoint" className="h-14 bg-slate-50 border-none rounded-xl font-bold px-6" />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
