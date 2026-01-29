import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MapPin, Clock, Phone, Mail,
    ChevronLeft, Loader2, Scissors,
    Sparkles, Zap, Award, CheckCircle2,
    CalendarDays, Share2, Heart,
    Info, ShieldCheck, Star, Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import api from "@/services/api";

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    category: string;
    image_url: string;
    salon_id: string;
    salon_name?: string;
    salon_address?: string;
    salon_city?: string;
    salon_logo_url?: string;
    salon_phone?: string;
    salon_email?: string;
    salon_pincode?: string;
}

interface Review {
    id: string;
    user_name: string;
    user_avatar: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface KnowledgeItem {
    id: string;
    salon_id: string;
    category: 'Skin Care' | 'FAQ';
    title: string;
    content: string;
    is_active: boolean;
}

export default function ServiceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [service, setService] = useState<Service | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchService = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await api.services.getById(id);
                const serviceData = data?.service || data;
                setService(serviceData);

                // Fetch reviews and knowledge base safely
                try {
                    const [reviewsData, knowledgeData] = await Promise.all([
                        api.reviews.getByService(id),
                        api.knowledgeBase.getBySalon(serviceData.salon_id, "Skin Care", id)
                    ]);
                    setReviews(reviewsData?.reviews || []);
                    setKnowledgeItems(knowledgeData || []);
                } catch (dataErr) {
                    console.warn("Could not fetch auxiliary data:", dataErr);
                }
            } catch (err: any) {
                console.error("Error fetching details:", err);
                setError("Could not load treatment details.");
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Analyzing Ritual Dossier...</p>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                    <Info className="w-10 h-10 text-slate-200" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Ritual Not Found</h2>
                <Button onClick={() => navigate("/salons")} className="bg-slate-900 text-white font-black px-12 h-14 rounded-2xl">
                    Return to Registry
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20 max-w-6xl">
                {/* Banner - Action Image */}
                <div className="relative w-full aspect-[21/9] rounded-[1.5rem] overflow-hidden shadow-sm">
                    <img
                        src={service.image_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&auto=format&fit=crop&q=80"}
                        alt={service.name}
                        className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-6 left-6 bg-accent text-white border-none font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-xl">
                        {service.category}
                    </Badge>
                </div>

                {/* Identity Row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-8 gap-6 px-2">
                    <div className="flex items-start gap-6">
                        {/* Circular Provider Identity */}
                        <div className="relative -mt-16 md:-mt-20">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[6px] border-white overflow-hidden shadow-md bg-white">
                                <img
                                    src={service.salon_logo_url || "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=200&h=200&fit=crop"}
                                    alt={`${service.salon_name} logo`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-3xl md:text-3xl font-bold text-slate-900 flex items-center">
                                <span className="px-2 rounded mr-2 h-8 inline-flex items-center text-slate-700">
                                    {service.name.split(' ')[0]}
                                </span>
                                {service.name.split(' ').slice(1).join(' ')}
                            </h1>
                            <p className="text-sm font-medium text-slate-500">By {service.salon_name || "Premium Provider"} • {service.salon_city || "Active District"}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Verified Treatment</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => navigate(`/book?salonId=${service.salon_id}&serviceId=${service.id}`)}
                        className="bg-[#214E78] hover:bg-[#1a3d5e] text-white font-bold h-14 px-10 rounded-full shadow-md text-sm uppercase tracking-wider"
                    >
                        Schedule This Appoitment
                    </Button>
                </div>

                {/* Description Section */}
                <div className="mt-8 px-2 max-w-4xl">
                    <h2 className="text-xs font-black uppercase text-accent tracking-[0.3em] mb-4">Treatment Dossier</h2>
                    <p className="text-slate-600 text-[17px] leading-relaxed font-serif italic">
                        "{service.description || "Indulge in a signature bespoke treatment designed to revitalize your essence and enhance your natural aesthetics."}"
                    </p>
                </div>

                {/* Info Grid Section */}
                <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Metrics & Attributes */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900">Ritual Specifications</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#214E78]">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest leading-none">Total Length</p>
                                        <p className="text-lg font-bold text-slate-900 mt-1">{service.duration_minutes} Minutes</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-emerald-600">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest leading-none">Investment</p>
                                        <p className="text-lg font-bold text-slate-900 mt-1">RM {service.price}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-amber-500">
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest leading-none">Elite Level</p>
                                        <p className="text-lg font-bold text-slate-900 mt-1">Master Craft</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900">Provider Location & Contact</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#214E78]/5 border border-[#214E78]/10">
                                    <div className="w-10 h-10 rounded-xl bg-[#214E78] flex items-center justify-center text-white flex-shrink-0 mt-1">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{service.salon_name}</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            {service.salon_address}
                                            <br />
                                            {service.salon_city}, {service.salon_pincode}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {service.salon_phone && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700">{service.salon_phone}</span>
                                        </div>
                                    )}
                                    {service.salon_email && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700 truncate">{service.salon_email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Benefits & Ritual Highlights */}
                    <div className="lg:col-span-8">
                        <Card className="border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/20">
                                <h3 className="text-xl font-bold text-slate-900">What's included in this Ritual?</h3>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { title: "Sartorial Consultation", desc: "One-on-one session to align on your desired aesthetic outcome.", icon: Info },
                                        { title: "Signature Techniques", desc: "Exclusive procedural mastery unavailable elsewhere in the registry.", icon: Award },
                                        { title: "Premium Compounds", desc: "Usage of ultra-high-end professional beauty products.", icon: Sparkles },
                                        { title: "Post-Ritual Care", desc: "Focused guidance on maintaining your transformation at home.", icon: CheckCircle2 }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{item.title}</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 p-8 rounded-2xl bg-[#214E78] text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <ShieldCheck className="w-32 h-32" />
                                    </div>
                                    <div className="relative z-10 space-y-4">
                                        <h4 className="text-lg font-bold">Standard Registry Guarantee</h4>
                                        <p className="text-sm text-white/70 font-medium max-w-lg">All treatments recorded via our local vault undergo strict hygiene and quality oversight to ensure your sanctuary experience remains elite.</p>
                                        <div className="flex items-center gap-6 pt-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Hygienic</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Certified</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Private</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-20 border-t border-slate-100 pt-16">
                    <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                        Customer Experiences
                        <span className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full font-bold">{reviews.length}</span>
                    </h2>

                    <div className="grid grid-cols-1 gap-12">
                        {/* Reviews List Column */}
                        <div className="space-y-6">
                            {reviews.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No reviews yet for this verified ritual.</p>
                                </div>
                            ) : reviews.map((review) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={review.id}
                                    className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm overflow-hidden">
                                                {review.user_avatar ? <img src={review.user_avatar} className="w-full h-full object-cover" /> : review.user_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{review.user_name || "Guest User"}</p>
                                                <p className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        "{review.comment}"
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Skin Care Tips Section */}
                {knowledgeItems.filter(i => i.category === 'Skin Care' && i.is_active).length > 0 && (
                    <div className="mt-20 border-t border-slate-100 pt-20">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl font-black text-slate-900 mb-4 flex items-center gap-3">
                                    <Sparkles className="w-8 h-8 text-blue-500" />
                                    Professional Skin Care Tips
                                </h2>
                                <p className="text-slate-500 font-medium">Expert advice from {service.salon_name} to help you maintain your glow and ensure lasting results.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {knowledgeItems.filter(i => i.category === 'Skin Care' && i.is_active).map((item) => (
                                <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all bg-blue-50/30 rounded-[2rem] overflow-hidden group">
                                    <CardContent className="p-8">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed italic">
                                            "{item.content}"
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
