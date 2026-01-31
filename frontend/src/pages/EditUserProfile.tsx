import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, ArrowLeft } from "lucide-react";
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

export default function EditUserProfile() {
    const { user, loading: authLoading, signOut, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        address: "",
        avatar_url: "",
        avatar_public_id: "",
    });
    const [countryCode, setCountryCode] = useState("+60");

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
        if (user) {
            const rawPhone = (user as any).phone || "";
            let detectedCode = "+60";
            let phoneNumber = rawPhone;

            // Try to detect country code from stored phone
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
                full_name: user.full_name || "",
                phone: phoneNumber,
                address: (user as any).address || "",
                avatar_url: (user as any).avatar_url || "",
                avatar_public_id: (user as any).avatar_public_id || "",
            });
            setCountryCode(detectedCode);
        }
    }, [user, authLoading, navigate]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await api.uploads.upload(file);
            setFormData({ ...formData, avatar_url: response.url, avatar_public_id: response.public_id });
            toast({ title: "Image Uploaded", description: "Snapshot saved to registry preview." });
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fullPhone = formData.phone ? `${countryCode}${formData.phone}` : "";
            await api.profiles.updateMe({
                ...formData,
                phone: fullPhone
            });
            await refreshUser();
            toast({
                title: "Profile Updated",
                description: "Your changes have been saved.",
            });
            navigate("/profile"); // Go back to profile dashboard
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update profile.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-2xl">
                <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b pb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="mr-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="relative group">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={formData.avatar_url} />
                                <AvatarFallback className="text-xl">
                                    {user.full_name?.[0] || user.email?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <Label
                                htmlFor="avatar-upload"
                                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            </Label>
                            <input
                                id="avatar-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Edit Profile</h1>
                            <p className="text-muted-foreground">Update your personal details</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="rounded-lg"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="flex gap-2">
                                    <Select value={countryCode} onValueChange={setCountryCode}>
                                        <SelectTrigger className="w-[120px] rounded-lg">
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
                                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                                        className="rounded-lg flex-1"
                                        placeholder="000 000 0000"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <Button disabled={saving} className="rounded-lg px-8">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/profile")}
                                className="rounded-lg"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}
