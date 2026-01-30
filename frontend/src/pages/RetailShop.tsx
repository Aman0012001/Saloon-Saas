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
    ChevronLeft,
    Heart,
    LayoutGrid,
    List,
    ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/imageUrl";

interface Product {
    id: string;
    name: string;
    description: string;
    features: string;
    price: number;
    discount?: number;
    image_url: string;
    category: string;
    brand?: string;
    target_audience: 'salon' | 'customer' | 'both';
}

export default function RetailShop() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("default");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

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

    const categories = ["all", ...Array.from(new Set(products.map(p => p.category.toLowerCase())))];

    const sortedProducts = [...products].sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0; // default
    });

    const filteredProducts = sortedProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || p.category.toLowerCase() === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="min-h-screen bg-[#F8FAFB] selection:bg-blue-100">
            <Navbar />

            <main className="pt-28 pb-20">
                <div className="container mx-auto px-4 max-w-7xl">

                    {/* Filter Top Bar - Based on Image */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full md:w-[190px] h-11 bg-white border-slate-200 rounded-lg font-medium text-slate-700 focus:ring-0">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat} className="capitalize">{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full md:w-[230px] h-11 bg-white border-slate-200 rounded-lg font-medium text-slate-700 focus:ring-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-normal">Sort by:</span>
                                        <SelectValue placeholder="Default Sorting" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default Sorting</SelectItem>
                                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                                    <SelectItem value="name">Product Name</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* View Mode Dropdown - Like in image */}
                            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                                <SelectTrigger className="w-[80px] h-11 bg-white border-slate-200 rounded-lg text-slate-700 focus:ring-0">
                                    <LayoutGrid className="w-4 h-4" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grid"><LayoutGrid className="w-4 h-4" /></SelectItem>
                                    <SelectItem value="list"><List className="w-4 h-4" /></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto gap-10">
                            <p className="text-[15px] font-medium text-slate-500">
                                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                            </p>
                            <div className="hidden sm:flex items-center gap-2">
                                <Button variant="ghost" size="icon" className={cn("w-10 h-10 rounded-lg", viewMode === 'grid' ? "bg-blue-50 text-blue-600" : "text-slate-400")}>
                                    <LayoutGrid className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className={cn("w-10 h-10 rounded-lg", viewMode === 'list' ? "bg-blue-50 text-blue-600" : "text-slate-400")}>
                                    <List className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Product Grid - Based on Image Card Style */}
                    <div className={cn(
                        "grid gap-6",
                        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" : "grid-cols-1"
                    )}>
                        {loading ? (
                            Array(10).fill(0).map((_, i) => (
                                <div key={i} className="h-[450px] bg-white border border-slate-200 animate-pulse rounded-2xl" />
                            ))
                        ) : currentProducts.length === 0 ? (
                            <div className="col-span-full h-96 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
                                <ShoppingBag className="w-16 h-16 text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold text-lg">No products found matching your search.</p>
                            </div>
                        ) : (
                            currentProducts.map(product => (
                                <Card key={product.id} className="group border border-slate-200/60 shadow-none bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                    {/* Image Section */}
                                    <div
                                        className="relative h-32 bg-white flex items-center justify-center overflow-hidden border-b border-slate-50 cursor-pointer"
                                        onClick={() => navigate(`/product/${product.id}`)}
                                    >


                                        {product.image_url ? (
                                            <img
                                                src={getImageUrl(product.image_url)}
                                                alt={product.name}
                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 p-4"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50/50">
                                                <Package className="w-12 h-12 text-slate-200" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Section */}
                                    <CardContent className="p-5 flex flex-col flex-1">
                                        <div className="space-y-3">
                                            <h3
                                                className="text-[16px] font-bold text-slate-800 tracking-tight leading-tight line-clamp-2 min-h-[40px] group-hover:text-blue-600 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/product/${product.id}`)}
                                            >
                                                {product.name}
                                            </h3>

                                            {/* Rating - Based on Image */}
                                            <div className="flex items-center gap-1.5 pt-0.5">
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} className={cn("w-3 h-3", star <= 4 ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
                                                    ))}
                                                </div>

                                            </div>

                                            {/* Price - Based on Image Style */}
                                            <div className="flex items-center gap-2.5 pt-2">
                                                <span className="text-xl font-bold text-slate-900 tracking-tight">
                                                    RM {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
                                                </span>
                                                {(product.discount || product.id.length % 3 === 0) && (
                                                    <span className="text-[13px] text-slate-400 line-through font-medium">
                                                        RM {Math.round(product.price * 1.25).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Buttons - Based on Image */}
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    className="flex-1 h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg shadow-sm transition-all active:scale-95 text-xs tracking-tight"
                                                    onClick={() => {
                                                        toast({ title: "In Bag", description: `${product.name} reserved.` });
                                                    }}
                                                >
                                                    Add to Cart
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="w-10 h-10 rounded-lg border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                                                >
                                                    <Heart className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Pagination - Based on Image */}
                    {totalPages > 1 && (
                        <div className="mt-16 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={currentPage === 1}
                                onClick={() => {
                                    setCurrentPage(p => Math.max(1, p - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-10 h-10 rounded-lg border-slate-200 text-slate-400 hover:bg-white"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    onClick={() => {
                                        setCurrentPage(page);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={cn(
                                        "w-10 h-10 font-bold rounded-lg transition-all",
                                        currentPage === page
                                            ? "bg-[#2563EB] text-white border-0 shadow-lg shadow-blue-500/20"
                                            : "border-slate-200 text-slate-600 hover:bg-white bg-white"
                                    )}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="icon"
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    setCurrentPage(p => Math.min(totalPages, p + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-10 h-10 rounded-lg border-slate-200 text-slate-400 hover:bg-white"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>

                            <Button
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    setCurrentPage(p => Math.min(totalPages, p + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="h-10 px-5 rounded-lg border-slate-200 text-slate-700 font-bold ml-2 bg-white hover:bg-slate-50 transition-colors"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
