import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, ShieldCheck, AlertCircle, Calendar as CalendarIcon, Save, Image as ImageIcon, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/services/api";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ClinicalProfile() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [salons, setSalons] = useState<any[]>([]);
    const [selectedSalonId, setSelectedSalonId] = useState<string>("");

    // Clinical Data State
    const [clinicalData, setClinicalData] = useState({
        date_of_birth: "",
        skin_type: "normal",
        skin_issues: "",
        allergy_records: "",
        medical_conditions: "",
        notes: "",
        concern_photo_url: "",
        concern_photo_public_id: ""
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return;

            setLoading(true);
            try {
                // Fetch bookings to see which salons the user has visited
                const bookings = await api.bookings.getAll({ user_id: user.id });

                // Extract unique salons from bookings
                const visitedSalonsMap = new Map();
                bookings.forEach((b: any) => {
                    if (b.salon_id && !visitedSalonsMap.has(b.salon_id)) {
                        visitedSalonsMap.set(b.salon_id, {
                            id: b.salon_id,
                            name: b.salon_name || "Salon",
                            city: b.salon_city || ""
                        });
                    }
                });

                const visitedSalons = Array.from(visitedSalonsMap.values());
                setSalons(visitedSalons);

                if (visitedSalons.length > 0) {
                    const firstSalonId = visitedSalons[0].id;
                    setSelectedSalonId(firstSalonId);
                    await fetchClinicalProfile(firstSalonId);
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [user]);

    useEffect(() => {
        if (selectedSalonId && user) {
            fetchClinicalProfile(selectedSalonId);
        }
    }, [selectedSalonId, user]);

    const fetchClinicalProfile = async (salonId: string) => {
        try {
            const data = await api.customerRecords.getProfile(user!.id, salonId);
            if (data && data.profile) {
                setClinicalData({
                    date_of_birth: data.profile.date_of_birth || "",
                    skin_type: data.profile.skin_type || "normal",
                    skin_issues: data.profile.skin_issues || "",
                    allergy_records: data.profile.allergy_records || "",
                    medical_conditions: data.profile.medical_conditions || "",
                    notes: data.profile.notes || "",
                    concern_photo_url: data.profile.concern_photo_url || "",
                    concern_photo_public_id: data.profile.concern_photo_public_id || ""
                });
            } else {
                setClinicalData({
                    date_of_birth: "",
                    skin_type: "normal",
                    skin_issues: "",
                    allergy_records: "",
                    medical_conditions: "",
                    notes: "",
                    concern_photo_url: "",
                    concern_photo_public_id: ""
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await api.uploads.upload(file);
            setClinicalData(prev => ({
                ...prev,
                concern_photo_url: response.url,
                concern_photo_public_id: response.public_id
            }));
            toast({ title: "Photo Uploaded", description: "Your concern photo has been added to your profile." });
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSalonId) {
            toast({ title: "No Salon Selected", description: "You need to have visited a salon to create a profile.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            await api.customerRecords.saveProfile({
                user_id: user!.id,
                salon_id: selectedSalonId,
                ...clinicalData
            });
            toast({
                title: "Health Profile Updated",
                description: "Your clinical details have been securely saved.",
            });
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message || "Failed to save health profile.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <Navbar />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-3xl">
                <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b pb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/user/profile")} className="mr-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Health Profile</h1>
                            <p className="text-slate-500 font-medium">Manage your clinical information regarding skin type and allergies.</p>
                        </div>
                    </div>

                    {salons.length === 0 ? (
                        <Alert className="bg-amber-50 border-amber-200">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800 font-bold">No Treatment History</AlertTitle>
                            <AlertDescription className="text-amber-700">
                                You need to book an appointment with a salon before you can manage your clinical profile with them.
                                <div className="mt-4">
                                    <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                                        <a href="/salons">Find a Salon</a>
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid gap-6">
                            {/* Salon Selection (Only if multiple, otherwise just show info) */}
                            {salons.length > 1 && (
                                <Card className="border-none shadow-sm bg-white">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold">Select Salon Profile</CardTitle>
                                        <CardDescription>Different salons may maintain separate health records for you.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Select value={selectedSalonId} onValueChange={setSelectedSalonId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose salon..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {salons.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.city})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>
                            )}

                            <form onSubmit={handleSave}>
                                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-[2rem] overflow-hidden">
                                    <CardHeader className="p-8 pb-4 border-b border-slate-50">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-xl font-black text-slate-900">Clinical Details</CardTitle>
                                                <CardDescription className="text-xs uppercase font-bold tracking-wider mt-1">
                                                    For {salons.find(s => s.id === selectedSalonId)?.name || 'Salon'}
                                                </CardDescription>
                                            </div>
                                            <ShieldCheck className="w-8 h-8 text-emerald-500/20" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="dob" className="font-bold text-slate-700">Date of Birth</Label>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        id="dob"
                                                        type="date"
                                                        className="pl-10"
                                                        value={clinicalData.date_of_birth}
                                                        onChange={e => setClinicalData({ ...clinicalData, date_of_birth: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="skin_type" className="font-bold text-slate-700">Skin Type</Label>
                                                <Select
                                                    value={clinicalData.skin_type}
                                                    onValueChange={v => setClinicalData({ ...clinicalData, skin_type: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Skin Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="dry">Dry</SelectItem>
                                                        <SelectItem value="oily">Oily</SelectItem>
                                                        <SelectItem value="combination">Combination</SelectItem>
                                                        <SelectItem value="sensitive">Sensitive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="allergies" className="font-bold text-slate-700 flex items-center gap-2">
                                                Allergies & Sensitivities
                                                <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Critical</span>
                                            </Label>
                                            <Textarea
                                                id="allergies"
                                                placeholder="List any known allergies to products, medications, or ingredients..."
                                                className="min-h-[80px] border-rose-100 focus:border-rose-300 focus:ring-rose-200"
                                                value={clinicalData.allergy_records}
                                                onChange={e => setClinicalData({ ...clinicalData, allergy_records: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="conditions" className="font-bold text-slate-700">Medical Conditions</Label>
                                            <Textarea
                                                id="conditions"
                                                placeholder="Heart conditions, pregnancy, recent surgeries, medications..."
                                                className="min-h-[80px]"
                                                value={clinicalData.medical_conditions}
                                                onChange={e => setClinicalData({ ...clinicalData, medical_conditions: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="issues" className="font-bold text-slate-700">Specific Skin Concerns</Label>
                                            <Textarea
                                                id="issues"
                                                placeholder="E.g., Acne, Hyperpigmentation, Rosacea, etc..."
                                                className="min-h-[80px]"
                                                value={clinicalData.skin_issues}
                                                onChange={e => setClinicalData({ ...clinicalData, skin_issues: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="font-bold text-slate-700 block">Current Skin Concern Photo</Label>
                                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                                <div className="w-full md:w-48 h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center relative group hover:border-primary/50 transition-colors">
                                                    {clinicalData.concern_photo_url ? (
                                                        <>
                                                            <img
                                                                src={clinicalData.concern_photo_url}
                                                                alt="Skin Concern"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-white text-xs font-bold">Update Photo</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center p-4">
                                                            <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Photo Uploaded</p>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={handleImageUpload}
                                                        disabled={uploading}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-2 pt-2">
                                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                                        Uploading a clear photo of your skin concern can help your therapist better understand your needs before your appointment.
                                                    </p>
                                                    {uploading && (
                                                        <div className="flex items-center gap-2 text-primary font-bold text-xs">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Uploading snapshot...
                                                        </div>
                                                    )}
                                                    {!uploading && clinicalData.concern_photo_url && (
                                                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                                                            <ShieldCheck className="w-3 h-3" />
                                                            Securely Uploaded
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="notes" className="font-bold text-slate-700">Additional Notes</Label>
                                            <Textarea
                                                id="notes"
                                                placeholder="Any other information that might be relevant for your treatments..."
                                                className="min-h-[100px]"
                                                value={clinicalData.notes}
                                                onChange={e => setClinicalData({ ...clinicalData, notes: e.target.value })}
                                            />
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Button disabled={saving} className="bg-slate-900 text-white font-bold rounded-xl px-8 h-12 hover:bg-black transition-colors">
                                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                <Save className="w-4 h-4 mr-2" /> Save Clinical Profile
                                            </Button>
                                        </div>

                                    </CardContent>
                                </Card>
                            </form>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
