import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    Loader2,
    ShoppingBag,
    Star,
    Info,
    ShieldCheck,
    Truck,
    RotateCcw,
    Sparkles,
    ShoppingCart,
    ArrowRight,
    CheckCircle2,
    Package,
    Layers,
    Zap,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Product {
    id: string;
    name: string;
    description: string;
    features: string;
    price: number;
    image_url: string;
    image_url_2: string;
    image_url_3: string;
    image_url_4: string;
    category: string;
    target_audience: 'salon' | 'customer' | 'both';
}

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await api.platformProducts.getById(id);
                const productData = data?.product || data;
                setProduct(productData);
                if (productData?.image_url) {
                    setActiveImage(productData.image_url);
                }
            } catch (err: any) {
                console.error("Error fetching product details:", err);
                setError("Could not load product dossier.");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const getGalleryImages = (p: Product) => {
        return [p.image_url, p.image_url_2, p.image_url_3, p.image_url_4].filter(img => img);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#080C10] flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-[50px] animate-pulse" />
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
                </div>
                <p className="font-black text-gray-500 uppercase tracking-[0.5em] text-[10px] mt-8 animate-pulse">
                    Synchronizing Product Data...
                </p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#080C10] flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 bg-gray-900 rounded-[2.5rem] flex items-center justify-center mb-8 border border-gray-800 shadow-2xl">
                    <Info className="w-10 h-10 text-gray-700" />
                </div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic uppercase">Dossier Missing</h2>
                <p className="text-gray-500 font-bold mb-8 uppercase tracking-widest text-xs">The requested asset could not be located in the registry.</p>
                <Button
                    onClick={() => navigate(-1)}
                    className="bg-white text-black font-black px-12 h-16 rounded-[2rem] hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                    Return to Catalog
                </Button>
            </div>
        );
    }

    const gallery = getGalleryImages(product);

    return (
        <div className="min-h-screen bg-white selection:bg-blue-100">
            <Navbar />

            <main className="pt-32 pb-24">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Back Navigation */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-3 text-gray-400 hover:text-black transition-colors mb-12 group"
                    >
                        <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Back to Registry</span>
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                        {/* Left: Gallery Section */}
                        <div className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative aspect-square rounded-[3.5rem] overflow-hidden bg-[#F8F9FA] shadow-2xl group border border-gray-100"
                            >
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activeImage}
                                        src={activeImage}
                                        alt={product.name}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="w-full h-full object-cover"
                                    />
                                </AnimatePresence>
                                <div className="absolute top-8 right-8">
                                    <Badge className="bg-white/90 backdrop-blur-xl text-black border-0 font-black px-8 py-3 text-2xl italic rounded-full shadow-2xl tracking-tighter">
                                        RM {product.price}
                                    </Badge>
                                </div>
                                <div className="absolute bottom-8 left-8">
                                    <Badge className="bg-black text-white border-0 font-black px-4 py-1.5 text-[9px] uppercase tracking-[0.3em] rounded-full shadow-2xl">
                                        {product.category}
                                    </Badge>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-4 gap-6">
                                {gallery.map((img, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setActiveImage(img)}
                                        className={cn(
                                            "aspect-square rounded-3xl overflow-hidden border-4 transition-all shadow-lg bg-white",
                                            activeImage === img ? "border-black shadow-black/10" : "border-white hover:border-gray-100"
                                        )}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Info Section */}
                        <div className="flex flex-col justify-center space-y-12">
                            <div className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <Badge className="bg-blue-600/5 text-blue-600 border border-blue-600/10 font-black px-5 py-2 text-[10px] uppercase tracking-[0.3em] rounded-full mb-6">
                                        Protocol Verified Asset
                                    </Badge>
                                    <h1 className="text-6xl md:text-7xl font-black text-black tracking-tighter leading-[0.9] italic uppercase">
                                        {product.name}
                                    </h1>
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-gray-500 font-medium text-xl leading-relaxed max-w-xl font-serif italic"
                                >
                                    "{product.description || "Our signature luxury asset, crafted with biological precision to deliver unparalleled revitalization and a natural luminary profile."}"
                                </motion.p>
                            </div>

                            <div className="space-y-8">
                                {product.features && (
                                    <div className="flex flex-wrap gap-3">
                                        {product.features.split(',').map((f, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 + (i * 0.1) }}
                                                className="flex items-center gap-3 px-6 py-3 bg-[#F8F9FA] rounded-full border border-gray-100 shadow-sm"
                                            >
                                                <Sparkles className="w-4 h-4 text-blue-500" />
                                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-700">{f.trim()}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-8 py-10 border-y border-gray-100">
                                    {[
                                        { icon: ShieldCheck, label: "Certified", color: "text-emerald-500", bg: "bg-emerald-50" },
                                        { icon: Truck, label: "Express", color: "text-blue-500", bg: "bg-blue-50" },
                                        { icon: RotateCcw, label: "Returns", color: "text-amber-500", bg: "bg-amber-50" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-4 text-center group">
                                            <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-inner transition-all group-hover:scale-110", item.bg)}>
                                                <item.icon className={cn("w-7 h-7", item.color)} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-black transition-colors">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <Button
                                    className="w-full h-24 rounded-[2.5rem] bg-black text-white font-black text-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:bg-gray-900 transition-all flex items-center justify-center gap-5 group italic tracking-tighter uppercase relative overflow-hidden"
                                    onClick={() => {
                                        toast({ title: "Asset Reserved", description: `${product.name} synchronized to your collection.` });
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Reserve Asset
                                    <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform relative z-10" />
                                </Button>

                                <div className="flex items-center justify-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Status: High</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3 h-3 text-gray-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Global Dispatch Network</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Tabbed Information */}
                    <div className="mt-32 grid grid-cols-1 lg:grid-cols-12 gap-20">
                        <div className="lg:col-span-4 space-y-10">
                            <div>
                                <h3 className="text-2xl font-black text-black tracking-tight italic uppercase mb-6">Technical Profile</h3>
                                <div className="space-y-1">
                                    <div className="flex justify-between py-4 border-b border-gray-50">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Registry ID</span>
                                        <span className="text-[11px] font-black text-black uppercase tracking-widest">{product.id.slice(0, 8)}</span>
                                    </div>
                                    <div className="flex justify-between py-4 border-b border-gray-50">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Classification</span>
                                        <span className="text-[11px] font-black text-black uppercase tracking-widest">{product.category}</span>
                                    </div>
                                    <div className="flex justify-between py-4 border-b border-gray-50">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Protocol</span>
                                        <span className="text-[11px] font-black text-black uppercase tracking-widest">{product.target_audience === 'salon' ? 'Professional' : 'Commercial'}</span>
                                    </div>
                                    <div className="flex justify-between py-4 border-b border-gray-50">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Origin</span>
                                        <span className="text-[11px] font-black text-black uppercase tracking-widest">Verified Local Node</span>
                                    </div>
                                </div>
                            </div>

                            <Card className="rounded-[2.5rem] border border-gray-100 shadow-sm bg-[#F8F9FA]/50 overflow-hidden">
                                <CardContent className="p-8 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white mb-4">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-lg font-black italic uppercase tracking-tight">Need Assistance?</h4>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">Our clinical consultants are available 24/7 to help you optimize your personal care regimen.</p>
                                    <Button variant="outline" className="w-full h-12 rounded-2xl border-2 border-black text-black font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all">
                                        Inquire Registry
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-8">
                            <div className="space-y-12">
                                <div className="p-10 rounded-[3rem] bg-black text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-1000">
                                        <ShieldCheck className="w-96 h-96" />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <Badge className="bg-blue-600 text-white border-0 font-black px-4 py-1 text-[9px] uppercase tracking-widest italic rounded-full">Integrity Verified</Badge>
                                        <h4 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Catalog Authenticity Guarantee</h4>
                                        <p className="text-lg text-gray-400 font-medium max-w-2xl italic font-serif">"Every asset in our master registry is subjected to rigorous quality audits to ensure it meets our platform's uncompromising standards for material excellence."</p>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6">
                                            {[
                                                { icon: CheckCircle2, label: "Sterile" },
                                                { icon: CheckCircle2, label: "Ethical" },
                                                { icon: CheckCircle2, label: "Potent" },
                                                { icon: CheckCircle2, label: "Rare" }
                                            ].map((check, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                                        <check.icon className="w-3.5 h-3.5 text-blue-500" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{check.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <h5 className="text-sm font-black uppercase tracking-widest">Formulation Data</h5>
                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Detailed compound list and chemical interaction profiles available in the digital dossier upon asset acquisition.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <h5 className="text-sm font-black uppercase tracking-widest">Sustainability Matrix</h5>
                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Packaged using carbon-neutral materials with 100% recyclability rating for conscious lifecycle management.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
