import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    History,
    Calendar,
    Clock,
    ChevronRight,
    Loader2,
    FileText,
    Sparkles,
    Pill,
    Activity,
    Info,
    Camera,
    ArrowLeft
} from "lucide-react";
import api from "@/services/api";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface TreatmentRecord {
    id: string;
    booking_id: string;
    service_name: string;
    booking_date: string;
    treatment_details: string;
    products_used: string;
    skin_reaction: string;
    improvement_notes: string;
    recommended_next_treatment: string;
    post_treatment_instructions: string;
    before_photo_url: string;
    after_photo_url: string;
}

export default function SessionHistory() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTreatment, setSelectedTreatment] = useState<TreatmentRecord | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
            return;
        }

        if (user) {
            fetchTreatments();
        }
    }, [user, authLoading, navigate]);

    const fetchTreatments = async () => {
        setLoading(true);
        try {
            const data = await api.customerRecords.getUserTreatments(user!.id);
            setTreatments(data.treatments || []);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20 max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                            Your <span className="text-accent">Sessions</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 text-lg">
                            Review your treatment records and personalized clinical notes.
                        </p>
                    </motion.div>

                    <Button
                        variant="outline"
                        onClick={() => navigate("/client-hub")}
                        className="rounded-2xl font-bold h-12 border-slate-200"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* List of Sessions */}
                    <div className="lg:col-span-4 space-y-4">
                        {treatments.length > 0 ? (
                            treatments.map((session) => (
                                <Card
                                    key={session.id}
                                    onClick={() => setSelectedTreatment(session)}
                                    className={`border-none shadow-sm cursor-pointer transition-all rounded-[1.5rem] overflow-hidden ${selectedTreatment?.id === session.id
                                        ? 'ring-2 ring-accent bg-accent/5'
                                        : 'bg-white hover:bg-slate-50'
                                        }`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200">
                                                {format(new Date(session.booking_date), "MMM dd, yyyy")}
                                            </Badge>
                                            <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${selectedTreatment?.id === session.id ? 'rotate-90' : ''}`} />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{session.service_name}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 mt-2">
                                            <Clock className="w-3.5 h-3.5" />
                                            <p className="text-xs font-bold uppercase tracking-tighter">Treatment Record</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="font-bold text-slate-900">No session records yet</h3>
                                <p className="text-slate-400 text-sm mt-1">Details will appear after your sessions are completed.</p>
                            </div>
                        )}
                    </div>

                    {/* Detailed View */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {selectedTreatment ? (
                                <motion.div
                                    key={selectedTreatment.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-[2.5rem] overflow-hidden border border-slate-100">
                                        <CardHeader className="p-8 pb-4 border-b border-slate-50">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{selectedTreatment.service_name}</CardTitle>
                                                    <CardDescription className="font-bold text-[10px] uppercase tracking-widest mt-1">
                                                        Treatment Record • {format(new Date(selectedTreatment.booking_date), "MMMM dd, yyyy")}
                                                    </CardDescription>
                                                </div>
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl w-fit">
                                                    Professional Verified
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-8">

                                            {/* Photo Comparison */}
                                            {(selectedTreatment.before_photo_url || selectedTreatment.after_photo_url) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block flex items-center gap-2">
                                                            <Camera className="w-3 h-3" /> Before Treatment
                                                        </Label>
                                                        <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200">
                                                            {selectedTreatment.before_photo_url ? (
                                                                <img src={selectedTreatment.before_photo_url} className="w-full h-full object-cover" alt="Before" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-sm">No photo captured</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block flex items-center gap-2">
                                                            <Camera className="w-3 h-3" /> After Treatment
                                                        </Label>
                                                        <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 ring-2 ring-emerald-500/20">
                                                            {selectedTreatment.after_photo_url ? (
                                                                <img src={selectedTreatment.after_photo_url} className="w-full h-full object-cover" alt="After" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-sm">No photo captured</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Left Column */}
                                                <div className="space-y-6">
                                                    <Section icon={Sparkles} title="Treatment Details" content={selectedTreatment.treatment_details} />
                                                    <Section icon={Pill} title="Products Used" content={selectedTreatment.products_used} />
                                                    <Section icon={Activity} title="Skin Reaction" content={selectedTreatment.skin_reaction} />
                                                </div>

                                                {/* Right Column */}
                                                <div className="space-y-6">
                                                    <Section icon={TrendingUp} title="Improvement Notes" content={selectedTreatment.improvement_notes} />
                                                    <Section icon={Info} title="Post-Care Instructions" content={selectedTreatment.post_treatment_instructions} />
                                                    <div className="p-6 bg-slate-900 rounded-[1.5rem] text-white">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Sparkles className="w-4 h-4 text-accent" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Recommendation</span>
                                                        </div>
                                                        <h4 className="text-sm font-bold">Recommended Next Step</h4>
                                                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                                            {selectedTreatment.recommended_next_treatment || "To be discussed during follow-up."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ) : (
                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                                        <FileText className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select a Session</h2>
                                    <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">
                                        Choose a session from the list to view your full clinical profile and treatment results.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function Section({ icon: Icon, title, content }: { icon: any, title: string, content: string | null }) {
    if (!content) return null;
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
            </div>
            <p className="text-slate-700 font-medium text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {content}
            </p>
        </div>
    );
}

function TrendingUp({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
        </svg>
    )
}
