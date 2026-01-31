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
import { Loader2, ArrowLeft, ShieldCheck, AlertCircle, Calendar as CalendarIcon, Save } from "lucide-react";
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
        skin_type: "",
        skin_issues: "",
        allergy_records: ""
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
            return;
        }
        if (user) {
            fetchSalons();
        }
    }, [user, authLoading, navigate]);

    // Fetch salons the user has visited to let them choose which profile to edit
    const fetchSalons = async () => {
        setLoading(true);
        try {
            // We get salons from the user's bookings history
            const bookings = await api.bookings.getAll({ user_id: user!.id });

            // Extract unique salons
            const uniqueSalonsMap = new Map();
            bookings.forEach((b: any) => {
                if (!uniqueSalonsMap.has(b.salon_id)) {
                    uniqueSalonsMap.set(b.salon_id, {
                        id: b.salon_id,
                        name: b.salon_name,
                        city: b.salon_city,
                        address: b.salon_address
                    });
                }
            });

            const uniqueSalons = Array.from(uniqueSalonsMap.values());
            setSalons(uniqueSalons);

            if (uniqueSalons.length > 0) {
                // Select the most recent salon by default (booking list is usually ordered date desc)
                // Or just the first one found
                setSelectedSalonId(uniqueSalons[0].id);
            }
        } catch (error) {
            console.error("Error fetching salons:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch clinical profile when salon changes
    useEffect(() => {
        if (selectedSalonId && user) {
            fetchClinicalProfile(selectedSalonId);
        }
    }, [selectedSalonId]);

    const fetchClinicalProfile = async (salonId: string) => {
        // Don't set full loading here to avoid flashing the whole page, maybe just form loading?
        // But for simplicity let's rely on fast API
        try {
            const data = await api.customerRecords.getProfile(user!.id, salonId);
            if (data && data.profile) {
                setClinicalData({
                    date_of_birth: data.profile.date_of_birth || "",
                    skin_type: data.profile.skin_type || "",
                    skin_issues: data.profile.skin_issues || "",
                    allergy_records: data.profile.allergy_records || ""
                });
            } else {
                // Reset if no profile found
                setClinicalData({
                    date_of_birth: "",
                    skin_type: "normal", // Default
                    skin_issues: "",
                    allergy_records: ""
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            // Non-critical, just means we start fresh
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
                                                className="min-h-[100px] border-rose-100 focus:border-rose-300 focus:ring-rose-200"
                                                value={clinicalData.allergy_records}
                                                onChange={e => setClinicalData({ ...clinicalData, allergy_records: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="issues" className="font-bold text-slate-700">Specific Skin Concerns</Label>
                                            <Textarea
                                                id="issues"
                                                placeholder="E.g., Acne, Hyperpigmentation, Rosacea, etc..."
                                                className="min-h-[100px]"
                                                value={clinicalData.skin_issues}
                                                onChange={e => setClinicalData({ ...clinicalData, skin_issues: e.target.value })}
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
