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

                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto gap-10">
                            <p className="text-[15px] font-medium text-slate-500">
                                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                            </p>
                        </div>
                    </div>

                    {/* Product Grid - Based on Image Card Style */}
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                                <div
                                    key={product.id}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                    className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer h-full border border-border/50 flex flex-col"
                                >
                                    {/* Product Image */}
                                    <div className="relative h-56 overflow-hidden bg-slate-100 flex items-center justify-center">
                                        {product.image_url ? (
                                            <img
                                                src={getImageUrl(product.image_url)}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <ShoppingBag className="w-16 h-16 text-slate-300" />
                                        )}

                                        {/* Discount Badge */}
                                        {(product.discount && product.discount > 0) && (
                                            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                SAVE RM {product.discount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex flex-col flex-grow">
                                        <div className="mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{product.brand || product.category || "General"}</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900 line-clamp-2 mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">{product.description}</p>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-400 font-medium line-through">
                                                    {(product.discount && product.discount > 0) ? `RM ${(Number(product.price) + Number(product.discount)).toFixed(2)}` : ''}
                                                </span>
                                                <span className="text-xl font-black text-slate-900">RM {product.price}</span>
                                            </div>
                                            <Button size="sm" className="rounded-xl px-4 bg-slate-900 text-white hover:bg-accent font-bold" onClick={(e) => {
                                                e.stopPropagation();
                                                toast({ title: "In Bag", description: `${product.name} added to bag.` });
                                            }}>
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
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
