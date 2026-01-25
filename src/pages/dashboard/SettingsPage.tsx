import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Store,
  Clock,
  Bell,
  Receipt,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { currentSalon, loading: salonLoading, isOwner, refreshSalons } = useSalon();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    gst_number: "",
  });
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({});
  const [notifications, setNotifications] = useState({
    email_bookings: true,
    email_reminders: true,
    sms_confirmations: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!salonLoading && !isOwner && currentSalon) {
      navigate("/dashboard");
    }
  }, [salonLoading, isOwner, currentSalon, navigate]);

  useEffect(() => {
    if (currentSalon) {
      setFormData({
        name: currentSalon.name || "",
        description: currentSalon.description || "",
        address: currentSalon.address || "",
        city: currentSalon.city || "",
        state: currentSalon.state || "",
        pincode: currentSalon.pincode || "",
        phone: currentSalon.phone || "",
        email: currentSalon.email || "",
        gst_number: currentSalon.gst_number || "",
      });

      // Initialize business hours
      let hours = currentSalon.business_hours;
      if (typeof hours === 'string') {
        try { hours = JSON.parse(hours); } catch (e) { hours = {}; }
      }

      const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {};
      DAYS.forEach((day) => {
        defaultHours[day] = (hours as any)?.[day] || { open: "09:00", close: "20:00", closed: false };
      });
      setBusinessHours(defaultHours);

      // Initialize notifications
      let notifSettings = currentSalon.notification_settings;
      if (typeof notifSettings === 'string') {
        try { notifSettings = JSON.parse(notifSettings); } catch (e) { notifSettings = {}; }
      }

      setNotifications({
        email_bookings: (notifSettings as any)?.email_bookings ?? true,
        email_reminders: (notifSettings as any)?.email_reminders ?? true,
        sms_confirmations: (notifSettings as any)?.sms_confirmations ?? false,
      });
    }
  }, [currentSalon]);

  const handleSaveProfile = async () => {
    if (!currentSalon) return;

    setSaving(true);
    try {
      await api.salons.update(currentSalon.id, {
        name: formData.name,
        description: formData.description || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        phone: formData.phone || null,
        email: formData.email || null,
        gst_number: formData.gst_number || null,
      });

      toast({ title: "Success", description: "Salon profile updated locally" });
      refreshSalons();
    } catch (error: any) {
      console.error("Error saving salon profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile locally",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusinessHours = async () => {
    if (!currentSalon) return;

    setSaving(true);
    try {
      await api.salons.update(currentSalon.id, {
        business_hours: JSON.stringify(businessHours)
      });

      toast({ title: "Success", description: "Business hours updated locally" });
      refreshSalons();
    } catch (error: any) {
      console.error("Error saving hours:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save hours locally",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentSalon) return;

    setSaving(true);
    try {
      await api.salons.update(currentSalon.id, {
        notification_settings: JSON.stringify(notifications)
      });

      toast({ title: "Success", description: "Notification settings updated locally" });
      refreshSalons();
    } catch (error: any) {
      console.error("Error saving notifications:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || salonLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isOwner) return null;

  return (
    <ResponsiveDashboardLayout
      showBackButton={true}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Salon Settings</h1>
          <p className="text-muted-foreground font-medium">
            Manage your salon's configuration in the local database
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary/50 p-1 rounded-2xl">
            <TabsTrigger value="profile" className="gap-2 rounded-xl h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Store className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2 rounded-xl h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Clock className="w-4 h-4" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 rounded-xl h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-none shadow-sm bg-white rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Business Information</CardTitle>
                <CardDescription className="font-medium">
                  Public details visible to customers on the listing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Salon Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 bg-secondary/30 border-none rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 bg-secondary/30 border-none rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="bg-secondary/30 border-none rounded-xl p-4 min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Public Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 bg-secondary/30 border-none rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gst" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">GST Number</Label>
                    <Input
                      id="gst"
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                      className="h-12 bg-secondary/30 border-none rounded-xl font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Detailed Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-12 bg-secondary/30 border-none rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-12 bg-secondary/30 border-none rounded-xl"
                  />
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="h-12 bg-secondary/30 border-none rounded-xl"
                  />
                  <Input
                    placeholder="PIN Code"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="h-12 bg-secondary/30 border-none rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-accent hover:bg-accent/90 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-accent/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save All Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card className="border-none shadow-sm bg-white rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Opening Hours</CardTitle>
                <CardDescription className="font-medium">Define your weekly operational schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {DAYS.map((day) => (
                  <div key={day} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-secondary/20 transition-all hover:bg-secondary/30">
                    <div className="w-32 font-black text-slate-700">{day}</div>
                    <div className="flex items-center gap-6 flex-1 justify-end">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground">{businessHours[day]?.closed ? "CLOSED" : "OPEN"}</span>
                        <Switch
                          checked={!businessHours[day]?.closed}
                          onCheckedChange={(checked) => setBusinessHours({
                            ...businessHours,
                            [day]: { ...businessHours[day], closed: !checked }
                          })}
                        />
                      </div>
                      {!businessHours[day]?.closed && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={businessHours[day]?.open || "09:00"}
                            onChange={(e) => setBusinessHours({
                              ...businessHours,
                              [day]: { ...businessHours[day], open: e.target.value }
                            })}
                            className="w-32 bg-white border-none h-10 rounded-lg font-bold"
                          />
                          <span className="text-xs font-black text-muted-foreground">TO</span>
                          <Input
                            type="time"
                            value={businessHours[day]?.close || "20:00"}
                            onChange={(e) => setBusinessHours({
                              ...businessHours,
                              [day]: { ...businessHours[day], close: e.target.value }
                            })}
                            className="w-32 bg-white border-none h-10 rounded-lg font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-6">
                  <Button onClick={handleSaveBusinessHours} disabled={saving} className="bg-accent text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-accent/20">
                    {saving ? "Saving..." : "Update Business Hours"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-none shadow-sm bg-white rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Communication Settings</CardTitle>
                <CardDescription className="font-medium">How we alert you and your clients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'email_bookings', label: 'Email for New Bookings', desc: 'Get an alert for every new appointment', checked: notifications.email_bookings },
                  { id: 'email_reminders', label: 'Client Email Reminders', desc: 'Automated reminders 24h before visits', checked: notifications.email_reminders },
                  { id: 'sms_confirmations', label: 'SMS Confirmations', desc: 'Direct text alerts (Local SMS charges apply)', checked: notifications.sms_confirmations },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-6 rounded-2xl bg-secondary/10 border border-slate-50">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">{item.label}</p>
                      <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                    <Switch
                      checked={item.checked}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.id]: checked })}
                    />
                  </div>
                ))}
                <Button onClick={handleSaveNotifications} disabled={saving} className="bg-accent text-white font-black px-8 h-12 rounded-xl mt-4 shadow-lg shadow-accent/20">
                  {saving ? "Saving..." : "Update Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDashboardLayout>
  );
}
