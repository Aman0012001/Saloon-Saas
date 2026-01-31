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
  Upload,
  Image as ImageIcon,
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countryCodes } from "@/utils/countryCodes";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { currentSalon, loading: salonLoading, isOwner, refreshSalons } = useSalon();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
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
    logo_url: "",
    logo_public_id: "",
    cover_image_url: "",
    cover_image_public_id: "",
    upi_id: "",
    bank_details: "",
  });
  const [countryCode, setCountryCode] = useState("+60");

  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingCover(true);

    try {
      const response = await api.uploads.upload(file);
      if (type === 'logo') {
        setFormData({ ...formData, logo_url: response.url, logo_public_id: response.public_id });
      } else {
        setFormData({ ...formData, cover_image_url: response.url, cover_image_public_id: response.public_id });
      }
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingCover(false);
    }
  };

  const handleDrag = (e: React.DragEvent, type: 'logo' | 'cover', isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setIsDraggingLogo(isEntering);
    else setIsDraggingCover(isEntering);
  };

  const handleDrop = async (e: React.DragEvent, type: 'logo' | 'cover') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setIsDraggingLogo(false);
    else setIsDraggingCover(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file, type);
    } else if (file) {
      toast({ title: "Invalid File", description: "Please drop an image file", variant: "destructive" });
    }
  };

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
      const rawPhone = currentSalon.phone || "";
      let detectedCode = "+60";
      let phoneNumber = rawPhone;

      if (rawPhone.startsWith("+")) {
        for (const c of countryCodes) {
          if (rawPhone.startsWith(c.code)) {
            detectedCode = c.code;
            phoneNumber = rawPhone.substring(c.code.length);
            break;
          }
        }
      }

      setFormData({
        name: currentSalon.name || "",
        description: currentSalon.description || "",
        address: currentSalon.address || "",
        city: currentSalon.city || "",
        state: currentSalon.state || "",
        pincode: currentSalon.pincode || "",
        phone: phoneNumber,
        email: currentSalon.email || "",
        gst_number: currentSalon.gst_number || "",
        logo_url: currentSalon.logo_url || "",
        logo_public_id: currentSalon.logo_public_id || "",
        cover_image_url: currentSalon.cover_image_url || "",
        cover_image_public_id: currentSalon.cover_image_public_id || "",
        upi_id: currentSalon.upi_id || "",
        bank_details: currentSalon.bank_details || "",
      });
      setCountryCode(detectedCode);

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
      const fullPhone = formData.phone ? `${countryCode}${formData.phone}` : "";
      await api.salons.update(currentSalon.id, {
        name: formData.name,
        description: formData.description || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        phone: fullPhone,
        email: formData.email || null,
        gst_number: formData.gst_number || null,
        logo_url: formData.logo_url || null,
        logo_public_id: formData.logo_public_id || null,
        cover_image_url: formData.cover_image_url || null,
        cover_image_public_id: formData.cover_image_public_id || null,
        upi_id: formData.upi_id || null,
        bank_details: formData.bank_details || null,
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
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-[110px] h-12 bg-secondary/30 border-none rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl bg-white max-h-[300px]">
                          {countryCodes.sort((a, b) => a.country.localeCompare(b.country)).map((c) => (
                            <SelectItem key={`${c.country}-${c.code}`} value={c.code} className="font-medium py-2 rounded-lg cursor-pointer">
                              <span className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span>{c.code}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                        className="h-12 bg-secondary/30 border-none rounded-xl flex-1"
                        placeholder="000 000 0000"
                      />
                    </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="upi" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">UPI ID (for payments)</Label>
                    <Input
                      id="upi"
                      placeholder="e.g. salon@upi"
                      value={formData.upi_id}
                      onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                      className="h-12 bg-secondary/30 border-none rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Bank Details (for invoices)</Label>
                    <Input
                      id="bank"
                      placeholder="e.g. Maybank 5642XXX"
                      value={formData.bank_details}
                      onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                      className="h-12 bg-secondary/30 border-none rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Salon Logo</Label>

                    <div className="relative group w-32 h-32">
                      <div
                        className={cn(
                          "w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50 relative transition-all",
                          isDraggingLogo && "scale-110 ring-4 ring-accent/20 border-accent"
                        )}
                        onDragOver={(e) => handleDrag(e, 'logo', true)}
                        onDragLeave={(e) => handleDrag(e, 'logo', false)}
                        onDrop={(e) => handleDrop(e, 'logo')}
                      >
                        {formData.logo_url ? (
                          <img src={formData.logo_url} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-10 h-10" />
                          </div>
                        )}

                        {uploadingLogo && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}

                        {isDraggingLogo && (
                          <div className="absolute inset-0 bg-accent/10 backdrop-blur-[2px] flex items-center justify-center border-2 border-dashed border-accent rounded-full">
                            <Upload className="w-8 h-8 text-accent animate-bounce" />
                          </div>
                        )}
                      </div>

                      <Label htmlFor="logo-upload" className="absolute -bottom-1 -right-1 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                        <Upload className="w-4 h-4" />
                      </Label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*,.avif"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                        disabled={uploadingLogo}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Cover Banner</Label>

                    <div
                      className={cn(
                        "relative group aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-accent/40 bg-slate-50 transition-all",
                        isDraggingCover && "scale-[1.02] border-accent bg-accent/5 ring-4 ring-accent/10"
                      )}
                      onDragOver={(e) => handleDrag(e, 'cover', true)}
                      onDragLeave={(e) => handleDrag(e, 'cover', false)}
                      onDrop={(e) => handleDrop(e, 'cover')}
                    >
                      {formData.cover_image_url ? (
                        <>
                          <img src={formData.cover_image_url} className="w-full h-full object-cover" alt="Cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Label htmlFor="cover-upload" className="cursor-pointer bg-white text-slate-900 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                              <Upload className="w-4 h-4" /> Change Banner
                            </Label>
                          </div>
                        </>
                      ) : (
                        <Label htmlFor="cover-upload" className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 transition-all">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-600">Select Booth Banner</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">or drag and drop</p>
                        </Label>
                      )}

                      {isDraggingCover && (
                        <div className="absolute inset-0 bg-accent/20 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 border-4 border-dashed border-accent m-2 rounded-[2rem]">
                          <Upload className="w-12 h-12 text-accent animate-bounce" />
                          <p className="font-black text-accent uppercase tracking-[0.2em]">Release to Deploy</p>
                        </div>
                      )}

                      {uploadingCover && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-accent">Uploading...</p>
                        </div>
                      )}

                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/*,.avif"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover')}
                        disabled={uploadingCover}
                      />
                    </div>
                  </div>
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
