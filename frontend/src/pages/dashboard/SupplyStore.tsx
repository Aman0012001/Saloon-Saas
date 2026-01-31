import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import {
    ShoppingBag,
    Search,
    Filter,
    Package,
    ArrowRight,
    ShoppingCart,
    Star,
    Info,
    Sparkles,
    Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useSalon } from "@/hooks/useSalon";
import api from "@/services/api";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/imageUrl";

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

export default function SupplyStore() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const { currentSalon } = useSalon();
    const [addingToInventory, setAddingToInventory] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await api.platformProducts.getAll('salon');
                setProducts(data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Could not load professional supplies.",
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
        <ResponsiveDashboardLayout showBackButton={true}>
            <div className="space-y-8 pb-20 p-6 md:p-8">
                {/* Elite Header */}
                <div className="relative bg-[#0F172A] rounded-[3rem] p-12 text-white shadow-2xl overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />

                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <ShoppingBag className="w-6 h-6 text-indigo-400" />
                                </div>
                                <Badge className="bg-indigo-500 border-0 text-white font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                                    Professional Registry
                                </Badge>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                                The Elite <span className="text-indigo-400">Vault</span>
                            </h1>
                            <p className="text-slate-400 font-medium max-w-xl text-lg italic">
                                Unified procurement for master-level practitioners. High-performance compounds for superior outcomes.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <Input
                                    placeholder="Index search assets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-16 w-full sm:w-80 bg-white/5 border-white/10 rounded-2xl pl-12 text-white font-bold placeholder:italic placeholder:opacity-30 focus:ring-4 focus:ring-indigo-500/20 transition-all border-1"
                                />
                            </div>
                            <Button className="h-16 px-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
                                <Filter className="w-4 h-4" /> Filter Catalog
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border-1 italic",
                                selectedCategory === cat
                                    ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 scale-105"
                                    : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {loading ? (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-[2.5rem]" />
                        ))
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full h-80 flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <Package className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Registry currently offline.</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <Card key={product.id} className="group border-0 bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                                <div
                                    className="h-32 relative overflow-hidden bg-slate-50 cursor-pointer"
                                    onClick={() => navigate(`/salon/store/${product.id}`)}
                                >
                                    {product.image_url ? (
                                        <img
                                            src={getImageUrl(product.image_url)}
                                            alt={product.name}
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 p-4"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-12 h-12 text-slate-200" />
                                        </div>
                                    )}
                                    <div className="absolute top-6 right-6">
                                        <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-0 font-black px-4 py-2 text-sm shadow-xl rounded-full italic tracking-tighter">
                                            RM {product.price}
                                        </Badge>
                                    </div>
                                    <div className="absolute inset-0 bg-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <Button
                                            onClick={() => navigate(`/salon/store/${product.id}`)}
                                            className="h-12 w-12 rounded-full bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all scale-0 group-hover:scale-100 delay-75 shadow-lg"
                                        >
                                            <Info className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-8 flex flex-col flex-1 justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{product.category}</p>
                                            <div className="flex gap-1">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight line-clamp-1 italic uppercase">{product.name}</h3>
                                        <p className="text-slate-400 font-medium text-sm line-clamp-2 h-10 leading-relaxed italic">{product.description}</p>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inventory</span>
                                            <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1">
                                                <Zap className="w-2 h-2" /> High Stock
                                            </span>
                                        </div>
                                        <Button
                                            className="h-12 px-6 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
                                            disabled={addingToInventory === product.id}
                                            onClick={async () => {
                                                if (!currentSalon) return;
                                                setAddingToInventory(product.id);
                                                try {
                                                    await api.inventory.create({
                                                        salon_id: currentSalon.id,
                                                        name: product.name,
                                                        category: product.category,
                                                        unit_price: product.price,
                                                        stock_quantity: 0,
                                                        min_stock_level: 5
                                                    });
                                                    toast({
                                                        title: "Inventory Synced",
                                                        description: `${product.name} placeholder created in your inventory.`
                                                    });
                                                } catch (error: any) {
                                                    toast({
                                                        title: "Sync Failed",
                                                        description: error.message || "Could not add product to inventory.",
                                                        variant: "destructive"
                                                    });
                                                } finally {
                                                    setAddingToInventory(null);
                                                }
                                            }}
                                        >
                                            {addingToInventory === product.id ? "Syncing..." : "Secure Asset"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </ResponsiveDashboardLayout>
    );
}
