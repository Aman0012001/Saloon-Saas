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
import { supabase } from "@/integrations/supabase/client";
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
      const hours = (currentSalon.business_hours as Record<string, { open: string; close: string; closed: boolean }>) || {};
      const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {};
      DAYS.forEach((day) => {
        defaultHours[day] = hours[day] || { open: "09:00", close: "20:00", closed: false };
      });
      setBusinessHours(defaultHours);

      // Initialize notifications
      const notifSettings = (currentSalon.notification_settings as Record<string, boolean>) || {};
      setNotifications({
        email_bookings: notifSettings.email_bookings ?? true,
        email_reminders: notifSettings.email_reminders ?? true,
        sms_confirmations: notifSettings.sms_confirmations ?? false,
      });
    }
  }, [currentSalon]);

  const handleSaveProfile = async () => {
    if (!currentSalon) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("salons")
        .update({
          name: formData.name,
          description: formData.description || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          pincode: formData.pincode || null,
          phone: formData.phone || null,
          email: formData.email || null,
          gst_number: formData.gst_number || null,
        })
        .eq("id", currentSalon.id);

      if (error) throw error;

      toast({ title: "Success", description: "Salon profile updated" });
      refreshSalons();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
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
      const { error } = await supabase
        .from("salons")
        .update({ business_hours: businessHours })
        .eq("id", currentSalon.id);

      if (error) throw error;

      toast({ title: "Success", description: "Business hours updated" });
      refreshSalons();
    } catch (error: any) {
      console.error("Error saving business hours:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save business hours",
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
      const { error } = await supabase
        .from("salons")
        .update({ notification_settings: notifications })
        .eq("id", currentSalon.id);

      if (error) throw error;

      toast({ title: "Success", description: "Notification settings updated" });
      refreshSalons();
    } catch (error: any) {
      console.error("Error saving notifications:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save notification settings",
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

  if (!isOwner) {
    return null;
  }

  return (
    <ResponsiveDashboardLayout
      showBackButton={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your salon profile and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <Store className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2">
              <Clock className="w-4 h-4" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Salon Profile</CardTitle>
                <CardDescription>
                  Update your salon's basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Salon Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gst">GST Number</Label>
                    <Input
                      id="gst"
                      value={formData.gst_number}
                      onChange={(e) =>
                        setFormData({ ...formData, gst_number: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-accent hover:bg-accent/90"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Hours Tab */}
          <TabsContent value="hours">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>
                  Set your salon's operating hours for each day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg bg-secondary/50"
                  >
                    <div className="w-28 font-medium">{day}</div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!businessHours[day]?.closed}
                        onCheckedChange={(checked) =>
                          setBusinessHours({
                            ...businessHours,
                            [day]: { ...businessHours[day], closed: !checked },
                          })
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {businessHours[day]?.closed ? "Closed" : "Open"}
                      </span>
                    </div>
                    {!businessHours[day]?.closed && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={businessHours[day]?.open || "09:00"}
                          onChange={(e) =>
                            setBusinessHours({
                              ...businessHours,
                              [day]: { ...businessHours[day], open: e.target.value },
                            })
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={businessHours[day]?.close || "20:00"}
                          onChange={(e) =>
                            setBusinessHours({
                              ...businessHours,
                              [day]: { ...businessHours[day], close: e.target.value },
                            })
                          }
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  onClick={handleSaveBusinessHours}
                  disabled={saving}
                  className="bg-accent hover:bg-accent/90 mt-4"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Hours
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Email for New Bookings</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email when a new booking is made
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_bookings}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email_bookings: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Email Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Send reminder emails to customers before appointments
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_reminders}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email_reminders: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">SMS Confirmations</p>
                    <p className="text-sm text-muted-foreground">
                      Send SMS confirmations to customers (additional charges apply)
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms_confirmations}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, sms_confirmations: checked })
                    }
                  />
                </div>
                <Button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="bg-accent hover:bg-accent/90"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDashboardLayout>
  );
}
