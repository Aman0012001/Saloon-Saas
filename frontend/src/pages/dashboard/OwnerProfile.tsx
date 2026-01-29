import { useState, useEffect } from "react";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSalon } from "@/hooks/useSalon";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Camera, Store, Phone, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { countryCodes } from "@/utils/countryCodes";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function OwnerProfile() {
    const { user, loading: authLoading } = useAuth();
    const { currentSalon, loading: salonLoading, refreshSalons } = useSalon();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        logo_url: "",
        address: "",
        city: "",
    });
    const [countryCode, setCountryCode] = useState("+60");

    useEffect(() => {
        if (!authLoading && !user) navigate("/login");
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
                phone: phoneNumber,
                logo_url: currentSalon.logo_url || "",
                address: currentSalon.address || "",
                city: currentSalon.city || "",
            });
            setCountryCode(detectedCode);
        }
    }, [user, currentSalon, authLoading, navigate]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await api.uploads.upload(file);
            setFormData({ ...formData, logo_url: response.url });
            toast({ title: "Visuals Updated", description: "Salon logo successfully uploaded." });
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSalon) return;

        setSaving(true);
        try {
            const fullPhone = formData.phone ? `${countryCode}${formData.phone}` : "";
            await api.salons.update(currentSalon.id, {
                ...formData,
                phone: fullPhone
            });
            await refreshSalons();
            toast({ title: "Registry Updated", description: "Salon identity details have been saved." });
        } catch (error: any) {
            toast({ title: "Sync Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || salonLoading || !user) {
        return (
            <ResponsiveDashboardLayout>
                <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Syncing Station Data...</p>
                </div>
            </ResponsiveDashboardLayout>
        );
    }

    return (
        <ResponsiveDashboardLayout showBackButton={true}>
            <div className="max-w-2xl mx-auto py-12 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-12"
                >
                    {/* Header Section */}
                    <div className="text-center space-y-4">
                        <div className="relative w-32 h-32 mx-auto group">
                            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-[2.5rem] scale-90 group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative w-full h-full bg-white rounded-[2.5rem] p-1 shadow-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                                <Avatar className="w-full h-full rounded-[2.2rem]">
                                    <AvatarImage src={formData.logo_url} className="object-cover" />
                                    <AvatarFallback className="bg-slate-50 text-slate-300">
                                        <Store className="w-12 h-12" />
                                    </AvatarFallback>
                                </Avatar>
                                <Label
                                    htmlFor="salon-logo"
                                    className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300 backdrop-blur-[2px]"
                                >
                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6 mb-1" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">Update Logo</span>
                                </Label>
                                <input id="salon-logo" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{formData.name || "My Salon"}</h1>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Business Profile Registry</p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <Card className="border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden border border-white/40">
                        <CardContent className="p-10 space-y-10">
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5" /> Salon Brand Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            placeholder="Enter Salon Name"
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="h-16 bg-slate-50 border-none rounded-2xl font-black px-6 text-lg shadow-inner focus:ring-2 focus:ring-accent/20 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5" /> Business Contact
                                        </Label>
                                        <div className="flex gap-3">
                                            <Select value={countryCode} onValueChange={setCountryCode}>
                                                <SelectTrigger className="w-[120px] h-16 bg-slate-50 border-none rounded-2xl font-black px-4 shadow-inner">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl bg-white max-h-[300px]">
                                                    {countryCodes.sort((a, b) => a.country.localeCompare(b.country)).map((c) => (
                                                        <SelectItem key={`${c.country}-${c.code}`} value={c.code} className="font-bold py-3 rounded-xl focus:bg-accent/10 cursor-pointer">
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
                                                placeholder="000 000 0000"
                                                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                                                className="h-16 bg-slate-50 border-none rounded-2xl font-black px-6 text-lg shadow-inner flex-1 focus:ring-2 focus:ring-accent/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="address" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5" /> Business Address
                                            </Label>
                                            <Input
                                                id="address"
                                                value={formData.address}
                                                placeholder="Street Address"
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                className="h-16 bg-slate-50 border-none rounded-2xl font-bold px-6 shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="city" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5" /> City / District
                                            </Label>
                                            <Input
                                                id="city"
                                                value={formData.city}
                                                placeholder="e.g. Kuala Lumpur"
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                className="h-16 bg-slate-50 border-none rounded-2xl font-bold px-6 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button disabled={saving} className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-900/10 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-3">
                                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                    SAVE STATION IDENTITY
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        Official Salon Partner Node ID: {currentSalon?.id.substring(0, 8)}...
                    </p>
                </motion.div>
            </div>
        </ResponsiveDashboardLayout>
    );
}
