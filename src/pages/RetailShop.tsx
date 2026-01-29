import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    ShoppingBag,
    Search,
    Filter,
    Package,
    ArrowRight,
    ShoppingCart,
    Star,
    Info,
    ChevronRight,
    ShieldCheck,
    Truck,
    RotateCcw,
    Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { cn } from "@/lib/utils";

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

export default function RetailShop() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await api.platformProducts.getAll('customer');
                setProducts(data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Could not load the shop catalog.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#FDFCFB] selection:bg-accent/20">
            <Navbar />

            <main className="pt-24 pb-20">
                <div className="container mx-auto px-4">
                    {/* Premium Hero Section */}
                    <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden mb-16 shadow-2xl group">
                        <div className="absolute inset-0 bg-slate-900">
                            <img
                                src="https://images.unsplash.com/photo-1596462502278-27bfaf403348?q=80&w=2080&auto=format&fit=crop"
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2s]"
                                alt="Beauty Products"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 space-y-6">
                            <Badge className="bg-accent text-white border-0 px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.3em] animate-in slide-in-from-bottom duration-700">
                                Premium Skin Care
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight italic max-w-4xl animate-in slide-in-from-bottom duration-[1s]">
                                Elevate Your Daily Ritual
                            </h1>
                            <p className="text-slate-200 text-lg md:text-xl font-medium max-w-2xl animate-in slide-in-from-bottom duration-[1.2s]">
                                Discover clinical-grade products curated by experts for your unique skin type.
                            </p>
                            <Button className="h-16 px-10 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 animate-in slide-in-from-bottom duration-[1.4s]">
                                Explore Catalog <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                        {/* Sidebar Filters */}
                        <aside className="lg:col-span-1 space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-slate-900 italic tracking-tight">Refine Search</h3>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-14 bg-white border-slate-100 rounded-2xl pl-12 shadow-sm focus:ring-accent"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Categories</h3>
                                <div className="flex flex-wrap lg:flex-col gap-2">
                                    {categories.map(cat => (
                                        <Button
                                            key={cat}
                                            variant="ghost"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`justify-start h-12 px-4 rounded-xl font-bold text-sm transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg translate-x-1' : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            {cat}
                                            {selectedCategory === cat && <ChevronRight className="w-4 h-4 ml-auto" />}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="lg:col-span-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                                {loading ? (
                                    Array(6).fill(0).map((_, i) => (
                                        <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-[3rem]" />
                                    ))
                                ) : filteredProducts.length === 0 ? (
                                    <div className="col-span-full h-80 flex flex-col items-center justify-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                        <ShoppingBag className="w-16 h-16 text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold">The treasury is currently being restocked.</p>
                                    </div>
                                ) : (
                                    filteredProducts.map(product => (
                                        <Card key={product.id} className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white rounded-[3rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                            <div className="h-72 relative overflow-hidden">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                        <Package className="w-12 h-12 text-slate-200" />
                                                    </div>
                                                )}
                                                <div className="absolute top-6 right-6">
                                                    <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-0 font-black px-4 py-2 text-sm shadow-xl rounded-full">
                                                        RM {product.price}
                                                    </Badge>
                                                </div>
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <Button
                                                        onClick={() => navigate(`/product/${product.id}`)}
                                                        className="h-12 w-12 rounded-full bg-white text-slate-900 hover:bg-accent hover:text-white transition-all scale-0 group-hover:scale-100 delay-75 shadow-lg"
                                                    >
                                                        <Info className="w-5 h-5" />
                                                    </Button>
                                                    <Button
                                                        className="h-12 w-12 rounded-full bg-accent text-white hover:bg-white hover:text-accent transition-all scale-0 group-hover:scale-100 delay-150 shadow-xl"
                                                        onClick={() => {
                                                            toast({ title: "Bag Updated", description: `${product.name} has been reserved.` });
                                                        }}
                                                    >
                                                        <ShoppingCart className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardContent className="p-8 space-y-4 text-center">
                                                <div>
                                                    <p className="text-[9px] font-black text-accent uppercase tracking-[0.25em] mb-2">{product.category}</p>
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight line-clamp-1 italic">{product.name}</h3>
                                                    <p className="text-slate-400 font-medium text-sm mt-3 line-clamp-2 h-10 leading-relaxed">{product.description}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
