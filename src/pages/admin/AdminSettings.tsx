import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Palette,
  CreditCard,
  Bell,
  Shield,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlatformSettings {
  platform_name: string;
  platform_commission: number;
  trial_days: number;
  support_email: string;
  currency: string;
  auto_approve_salons: boolean;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: "GlamBook",
    platform_commission: 10,
    trial_days: 14,
    support_email: "support@glambook.com",
    currency: "INR",
    auto_approve_salons: false,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value');

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      data?.forEach(row => {
        settingsMap[row.key] = typeof row.value === 'string' ? row.value : row.value;
      });

      setSettings(prev => ({
        ...prev,
        platform_name: settingsMap.platform_name || prev.platform_name,
        platform_commission: settingsMap.platform_commission || prev.platform_commission,
        trial_days: settingsMap.trial_days || prev.trial_days,
        support_email: settingsMap.support_email || prev.support_email,
        currency: settingsMap.currency || prev.currency,
        auto_approve_salons: settingsMap.auto_approve_salons || prev.auto_approve_salons,
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'platform_name', value: settings.platform_name },
        { key: 'platform_commission', value: settings.platform_commission },
        { key: 'trial_days', value: settings.trial_days },
        { key: 'support_email', value: settings.support_email },
        { key: 'currency', value: settings.currency },
        { key: 'auto_approve_salons', value: settings.auto_approve_salons },
      ];

      for (const update of updates) {
        await supabase
          .from('platform_settings')
          .update({ value: JSON.stringify(update.value) })
          .eq('key', update.key);
      }

      toast({ title: "Success", description: "Settings saved successfully" });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 bg-gray-900 text-white min-h-screen">
        {/* Header - Dark Theme */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-700 to-black p-8 text-white">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Platform Settings</h1>
                  <p className="text-gray-300 text-lg">Configure your SaaS platform</p>
                </div>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-purple-400/20 blur-2xl"></div>
        </div>

        {/* Tabs - Dark Theme */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-gray-800 border border-gray-700">
            <TabsTrigger value="general" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">General</TabsTrigger>
            <TabsTrigger value="billing" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Billing</TabsTrigger>
            <TabsTrigger value="notifications" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Notifications</TabsTrigger>
            <TabsTrigger value="legal" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Legal</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
              <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Palette className="h-5 w-5" />
                  Branding
                </CardTitle>
                <CardDescription className="text-gray-400">Configure your platform branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Platform Name</Label>
                    <Input
                      value={settings.platform_name}
                      onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Support Email</Label>
                    <Input
                      type="email"
                      value={settings.support_email}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
              <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5" />
                  Salon Management
                </CardTitle>
                <CardDescription className="text-gray-400">Control how salons are onboarded</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Auto-approve Salons</p>
                    <p className="text-sm text-gray-400">
                      Automatically approve new salon registrations
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_approve_salons}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_approve_salons: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Trial Period (days)</Label>
                  <Input
                    type="number"
                    value={settings.trial_days}
                    onChange={(e) => setSettings({ ...settings, trial_days: Number(e.target.value) })}
                    className="w-32 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
              <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="h-5 w-5" />
                  Commission Settings
                </CardTitle>
                <CardDescription className="text-gray-400">Configure platform commission rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Platform Commission (%)</Label>
                    <Input
                      type="number"
                      value={settings.platform_commission}
                      onChange={(e) => setSettings({ ...settings, platform_commission: Number(e.target.value) })}
                      min={0}
                      max={100}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                    />
                    <p className="text-xs text-gray-400">
                      Percentage taken from each transaction
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Currency</Label>
                    <Input
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
              <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
                <CardTitle className="text-white">Payment Gateway</CardTitle>
                <CardDescription className="text-gray-400">Configure payment processing</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-400">
                  Payment gateway integration coming soon. You'll be able to connect Stripe, Razorpay, or other payment providers.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
              <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription className="text-gray-400">Configure notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">New Salon Registration</p>
                    <p className="text-sm text-gray-400">
                      Get notified when a new salon registers
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Daily Summary</p>
                    <p className="text-sm text-gray-400">
                      Receive a daily summary of platform activity
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Payment Alerts</p>
                    <p className="text-sm text-gray-400">
                      Get notified about payment issues
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gray-800 border border-gray-700">
              <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  Legal Pages
                </CardTitle>
                <CardDescription className="text-gray-400">Manage legal content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Terms of Service URL</Label>
                  <Input placeholder="/terms" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Privacy Policy URL</Label>
                  <Input placeholder="/privacy" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Refund Policy URL</Label>
                  <Input placeholder="/refund-policy" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}