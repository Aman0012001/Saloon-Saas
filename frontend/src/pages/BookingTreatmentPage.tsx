import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Save,
    ArrowLeft,
    Camera,
    Calendar,
    User,
    Scissors,
    FileText,
    Sparkles,
    Pill,
    Activity,
    Info,
    TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import api from "@/services/api";
import { format } from "date-fns";

export default function BookingTreatmentPage() {
    const { id } = useParams<{ id: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [record, setRecord] = useState({
        treatment_details: "",
        products_used: "",
        skin_reaction: "",
        improvement_notes: "",
        recommended_next_treatment: "",
        post_treatment_instructions: "",
        before_photo_url: "",
        after_photo_url: ""
    });

    useEffect(() => {
        if (!authLoading && !user) navigate("/login");
        if (id && user) fetchData();
    }, [id, user, authLoading]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Booking
            const bookingData = await api.bookings.getById(id!);
            if (!bookingData) throw new Error("Booking not found");
            setBooking(bookingData);

            // Fetch Record
            const recordData = await api.customerRecords.getTreatmentRecord(id!);
            if (recordData && recordData.record) {
                setRecord({
                    treatment_details: recordData.record.treatment_details || "",
                    products_used: recordData.record.products_used || "",
                    skin_reaction: recordData.record.skin_reaction || "",
                    improvement_notes: recordData.record.improvement_notes || "",
                    recommended_next_treatment: recordData.record.recommended_next_treatment || "",
                    post_treatment_instructions: recordData.record.post_treatment_instructions || "",
                    before_photo_url: recordData.record.before_photo_url || "",
                    after_photo_url: recordData.record.after_photo_url || ""
                });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ title: "Error", description: "Could not load booking details", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.customerRecords.saveTreatmentRecord({
                booking_id: id,
                ...record
            });
            toast({
                title: "Record Saved",
                description: "Treatment details have been successfully updated.",
            });
            // Optional: navigate back or stay
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to save record.",
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const uploadData = await api.uploads.upload(file);
            setRecord(prev => ({
                ...prev,
                [`${type}_photo_url`]: uploadData.url
            }));
            toast({ title: "Photo Uploaded", description: "Image attached successfully." });
        } catch (error) {
            toast({ title: "Upload Failed", description: "Could not upload photo.", variant: "destructive" });
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
            </div>
        );
    }

    if (!booking) return null;

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <Navbar />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-5xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/my-bookings")} className="rounded-xl h-12 w-12 border border-slate-200">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Record</h1>
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 text-[10px] uppercase font-black tracking-widest">
                                    {booking.status}
                                </Badge>
                            </div>
                            <p className="text-slate-500 font-medium mt-1">
                                Treatment details for <span className="text-slate-900 font-bold">{booking.service_name}</span> on {format(new Date(booking.booking_date), "MMM dd, yyyy")}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 hover:bg-black text-white px-8 h-12 rounded-xl font-black shadow-lg shadow-black/10 transition-all hover:scale-105"
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Sidebar: Booking Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-[2rem] overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                <CardTitle className="text-lg font-black text-slate-900">Session Info</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                            <Scissors className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Service</p>
                                            <p className="font-bold text-slate-900 text-lg leading-tight mt-0.5">{booking.service_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Date & Time</p>
                                            <p className="font-bold text-slate-900 text-lg leading-tight mt-0.5">
                                                {format(new Date(booking.booking_date), "MMMM dd")} at {booking.booking_time.slice(0, 5)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Specialist</p>
                                            <p className="font-bold text-slate-900 text-lg leading-tight mt-0.5">
                                                {booking.staff_name || "Unassigned"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-700 mb-2">
                                <Info className="w-5 h-5" />
                                <h4 className="font-black text-sm uppercase tracking-widest">Privacy Notice</h4>
                            </div>
                            <p className="text-blue-900/70 text-sm leading-relaxed font-medium">
                                The information recorded here is part of your permanent clinical history with {booking.salon_name}. Both you and the salon staff can update these records to ensure accurate treatment tracking.
                            </p>
                        </div>
                    </div>

                    {/* Right Content: The Form */}
                    <div className="lg:col-span-8">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-8">
                                <Tabs defaultValue="clinical" className="w-full">
                                    <TabsList className="w-full justify-start bg-slate-50 p-1 rounded-2xl mb-8">
                                        <TabsTrigger value="clinical" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Clinical Details</TabsTrigger>
                                        <TabsTrigger value="results" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Results & Photos</TabsTrigger>
                                        <TabsTrigger value="care" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Aftercare</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="clinical" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Sparkles className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <Label className="text-lg font-black text-slate-900">Treatment Procedure</Label>
                                            </div>
                                            <Textarea
                                                placeholder="Describe the specific protocol used, machine settings, layers applied, etc..."
                                                className="min-h-[150px] bg-slate-50/50 border-slate-200 focus:bg-white rounded-2xl p-4 text-base resize-none"
                                                value={record.treatment_details}
                                                onChange={e => setRecord({ ...record, treatment_details: e.target.value })}
                                            />
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Pill className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <Label className="text-lg font-black text-slate-900">Products Used</Label>
                                            </div>
                                            <Input
                                                placeholder="List specific serums, masks, or products applied during session..."
                                                className="h-14 bg-slate-50/50 border-slate-200 focus:bg-white rounded-2xl px-4 text-base"
                                                value={record.products_used}
                                                onChange={e => setRecord({ ...record, products_used: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Activity className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <Label className="text-lg font-black text-slate-900">Skin Reaction</Label>
                                            </div>
                                            <Textarea
                                                placeholder="Note any redness, frosting, sensitivity, or immediate reactions..."
                                                className="min-h-[100px] bg-slate-50/50 border-slate-200 focus:bg-white rounded-2xl p-4 text-base resize-none"
                                                value={record.skin_reaction}
                                                onChange={e => setRecord({ ...record, skin_reaction: e.target.value })}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="results" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <Label className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-wide">
                                                    <Camera className="w-4 h-4" /> Before
                                                </Label>
                                                <div className="aspect-[3/4] bg-slate-50 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 relative group transition-all hover:border-slate-300">
                                                    {record.before_photo_url ? (
                                                        <img src={record.before_photo_url} className="w-full h-full object-cover" alt="Before" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                                            <Camera className="w-8 h-8 mb-2 opacity-50" />
                                                            <span className="text-xs font-bold uppercase tracking-widest">No Photo</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                                                        <label className="flex items-center justify-center w-full h-10 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors shadow-lg">
                                                            Upload Before
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'before')} />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-wide">
                                                    <Camera className="w-4 h-4 text-emerald-600" /> After
                                                </Label>
                                                <div className="aspect-[3/4] bg-emerald-50/30 rounded-3xl overflow-hidden border-2 border-dashed border-emerald-200 relative group transition-all hover:border-emerald-300">
                                                    {record.after_photo_url ? (
                                                        <img src={record.after_photo_url} className="w-full h-full object-cover" alt="After" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-300">
                                                            <Camera className="w-8 h-8 mb-2 opacity-50" />
                                                            <span className="text-xs font-bold uppercase tracking-widest">No Photo</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                                                        <label className="flex items-center justify-center w-full h-10 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors shadow-lg">
                                                            Upload After
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'after')} />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <TrendingUp className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <Label className="text-lg font-black text-slate-900">Improvements & Progress</Label>
                                            </div>
                                            <Textarea
                                                placeholder="Describe visible improvements compared to previous sessions..."
                                                className="min-h-[120px] bg-slate-50/50 border-slate-200 focus:bg-white rounded-2xl p-4 text-base resize-none"
                                                value={record.improvement_notes}
                                                onChange={e => setRecord({ ...record, improvement_notes: e.target.value })}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="care" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <Label className="text-lg font-black text-slate-900">Post-Care Instructions</Label>
                                            </div>
                                            <Input
                                                placeholder="Instructions for the client (e.g., Avoid sun, moisturize)..."
                                                className="h-14 bg-slate-50/50 border-slate-200 focus:bg-white rounded-2xl px-4 text-base"
                                                value={record.post_treatment_instructions}
                                                onChange={e => setRecord({ ...record, post_treatment_instructions: e.target.value })}
                                            />
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Calendar className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <Label className="text-lg font-black text-slate-900">Recommended Next Treatment</Label>
                                            </div>
                                            <Input
                                                placeholder="What should the client book for their next visit?"
                                                className="h-14 bg-slate-50/50 border-slate-200 focus:bg-white rounded-2xl px-4 text-base"
                                                value={record.recommended_next_treatment}
                                                onChange={e => setRecord({ ...record, recommended_next_treatment: e.target.value })}
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
