import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    Loader2,
    Star,
    Info,
    ShoppingCart,
    Heart,
    Plus,
    Minus,
    Facebook,
    Twitter,
    MessageCircle,
    MoreHorizontal,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    discount?: number;
    image_url: string;
    image_url_2?: string;
    image_url_3?: string;
    image_url_4?: string;
    category: string;
    target_audience: 'salon' | 'customer' | 'both';
}

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("description");

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

                // Fetch categorized related products
                const allProducts = await api.platformProducts.getAll(productData.target_audience === 'salon' ? 'salon' : 'customer');
                setRelatedProducts(allProducts.filter((p: Product) => p.id !== id).slice(0, 4));

            } catch (err: any) {
                console.error("Error fetching product details:", err);
                setError("Could not load product details.");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    const gallery = product ? [product.image_url, product.image_url_2, product.image_url_3, product.image_url_4].filter(img => img) as string[] : [];

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <Info className="w-16 h-16 text-slate-200 mb-4" />
                <h2 className="text-2xl font-bold mb-4 text-slate-800">Product Not Found</h2>
                <Button onClick={() => navigate(-1)} className="bg-blue-600 text-white">Return to Catalog</Button>
            </div>
        );
    }

    const discountPerc = product.discount || 20;
    const originalPrice = Math.round(product.price * (1 + (discountPerc / 100)));

    return (
        <div className="min-h-screen bg-[#F8FAFB]">
            <Navbar />

            <main className="pt-28 pb-20">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left: Gallery Section (Lg: 4/12) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[400px]">
                                <motion.div
                                    key={activeImage}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="w-full h-full flex items-center justify-center"
                                >
                                    <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
                                </motion.div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {gallery.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={cn(
                                            "aspect-square rounded-lg border-2 overflow-hidden bg-white shadow-sm transition-all",
                                            activeImage === img ? "border-blue-500" : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>

                        </div>

                        {/* Middle: Info Section (Lg: 5/12) */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} className={cn("w-4 h-4", s <= 4 ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
                                        ))}
                                    </div>

                                </div>
                            </div>

                            {/* Price Section - Based on image */}
                            <div className="flex items-center gap-4">

                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-slate-900">RM {product.price.toLocaleString()}</span>
                                    <span className="text-lg text-slate-400 line-through">RM {originalPrice.toLocaleString()}</span>
                                </div>
                                <span className="bg-white px-3 py-1 rounded-md border border-slate-200 text-xs font-bold text-slate-400">-{discountPerc}%</span>
                            </div>

                            {/* Selection Controls */}
                            <div className="flex flex-wrap items-center gap-6 pt-2">
                                <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden h-12">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="px-4 hover:bg-slate-50 transition-colors border-r border-slate-200"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <Input
                                        className="w-16 border-0 text-center font-bold focus-visible:ring-0"
                                        value={quantity}
                                        readOnly
                                    />
                                    <button
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="px-4 hover:bg-slate-50 transition-colors border-l border-slate-200"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <Button
                                    className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/10 flex items-center gap-2"
                                    onClick={() => toast({ title: "In Bag", description: "Product added to your collection." })}
                                >
                                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                                </Button>

                                <Button variant="outline" className="h-12 px-6 rounded-lg text-slate-600 border-slate-200 hover:bg-slate-50 gap-2">
                                    <Heart className="w-5 h-5" /> Add to Wishlist
                                </Button>
                            </div>



                            {/* Tabs - Based on image */}
                            <div className="pt-8 space-y-6">
                                <div className="flex items-center gap-8 border-b border-slate-200">
                                    {["description", "reviews", "shipping"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                                                activeTab === tab ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            {tab}
                                            {activeTab === tab && (
                                                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="min-h-[200px] text-slate-600 leading-relaxed font-medium">
                                    {activeTab === "description" && (
                                        <div className="space-y-6">
                                            <p>{product.description || "No description provided for this premium asset."}</p>
                                            {product.features && (
                                                <div className="space-y-3">
                                                    <h3 className="font-bold text-slate-900">Key Features</h3>
                                                    <ul className="space-y-2">
                                                        {product.features.split(',').map((f, i) => (
                                                            <li key={i} className="flex items-center gap-3">
                                                                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                                                                    <Plus className="w-3 h-3 text-blue-500" />
                                                                </div>
                                                                <span>{f.trim()}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === "reviews" && (
                                        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl border border-dashed border-slate-200">
                                            <Star className="w-12 h-12 text-slate-100 mb-2" />
                                            <p className="text-slate-400 text-sm italic">Verified reviews synchronization in progress...</p>
                                        </div>
                                    )}
                                    {activeTab === "shipping" && (
                                        <div className="space-y-4">
                                            <div className="flex gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                                                <Package className="w-6 h-6 text-blue-500" />
                                                <div>
                                                    <h4 className="font-bold text-blue-900">Global Dispatch</h4>
                                                    <p className="text-sm text-blue-700">We offer insured worldwide shipping with real-time tracking protocols.</p>
                                                </div>
                                            </div>
                                            <p className="text-sm italic text-slate-400">Standard delivery: 3-5 business days.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Sidebar Section (Lg: 3/12) */}
                        <div className="lg:col-span-3 space-y-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                Related Products
                            </h3>
                            <div className="space-y-4">
                                {relatedProducts.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => navigate(`/product/${p.id}`)}
                                        className="group flex gap-4 bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:shadow-lg transition-all"
                                    >
                                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-100">
                                            <img src={p.image_url} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{p.name}</h4>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                            </div>
                                            <div className="flex items-center gap-2 pt-1 font-bold">
                                                <span className="text-slate-900">RM {p.price.toLocaleString()}</span>
                                                {p.discount && <span className="text-[10px] text-slate-400 line-through">RM {(p.price * 1.2).toLocaleString()}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Promotional Card - Based on image */}
                            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                <CardContent className="p-8 relative z-10 space-y-4">
                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Elite Registry Membership</h4>
                                    <p className="text-blue-100 text-xs leading-relaxed opacity-80 italic">Unlocking the master vault gives you priority dispatch and institutional pricing on all assets.</p>
                                    <Button className="w-full h-12 bg-white text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-all">Join Institutional Network</Button>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
