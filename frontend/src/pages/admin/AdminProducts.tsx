import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Plus,
    Filter,
    Download,
    ChevronDown,
    MoreVertical,
    Star,
    ChevronLeft,
    ChevronRight,
    Search,
    Edit2,
    Trash2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { exportToCSV, exportToExcel, exportToPDF } from "@/utils/exportUtils";

interface Product {
    id: string;
    name: string;
    description: string;
    features: string;
    price: number;
    discount: number;
    stock_quantity: number;
    image_url: string;
    image_url_2: string;
    image_url_3: string;
    image_url_4: string;
    category: string;
    brand: string;
    target_audience: 'salon' | 'customer' | 'both';
    is_active: boolean;
}

export default function AdminProducts() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await api.platformProducts.getAll();
            setProducts(data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast({
                title: "Error",
                description: "Failed to load products.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.platformProducts.delete(id);
            toast({ title: "Product Deleted", description: "The product has been removed." });
            fetchProducts();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredProducts.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredProducts.length / entriesPerPage);

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F8FAFC] -m-8 p-8 text-[#1E293B]">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* Top Action Bar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-white border-[#E2E8F0] text-[#475569] font-semibold flex items-center gap-2 px-4">
                                        <Filter className="w-4 h-4" /> Filters <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white">
                                    <DropdownMenuItem>All Products</DropdownMenuItem>
                                    <DropdownMenuItem>Active</DropdownMenuItem>
                                    <DropdownMenuItem>Inactive</DropdownMenuItem>
                                    <DropdownMenuItem>Out of Stock</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-white border-[#E2E8F0] text-[#475569] font-semibold flex items-center gap-2 px-4">
                                        <Download className="w-4 h-4" /> Export <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white">
                                    <DropdownMenuItem onClick={() => exportToExcel(products, 'products_backup.csv')}>Excel</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportToCSV(products, 'products_backup.csv')}>CSV</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportToPDF()}>PDF</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button variant="outline" size="icon" className="bg-white border-[#E2E8F0]">
                                <MoreVertical className="w-4 h-4 text-[#475569]" />
                            </Button>
                        </div>

                        <Button
                            onClick={() => navigate("/super-admin/products/add")}
                            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 h-11 font-bold rounded-lg shadow-sm flex items-center gap-2"
                        >
                            Add New Product
                        </Button>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Table Header Controls */}
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm font-medium text-[#64748B]">
                                Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredProducts.length)} of {filteredProducts.length} entries
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                    <Input
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-10 bg-white border-[#E2E8F0] rounded-lg text-sm font-medium text-black"
                                    />
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-[#64748B]">
                                    Filters
                                    <Select value={entriesPerPage.toString()} onValueChange={(val) => setEntriesPerPage(parseInt(val))}>
                                        <SelectTrigger className="w-20 h-10 bg-white border-[#E2E8F0]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    per page
                                </div>
                            </div>
                        </div>

                        {/* Actual Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-slate-100">
                                        <th className="px-6 py-4 text-[13px] font-bold text-[#475569] uppercase tracking-wider">Image</th>
                                        <th className="px-6 py-4 text-[13px] font-bold text-[#475569] uppercase tracking-wider min-w-[300px]">Product Name</th>
                                        <th className="px-6 py-4 text-[13px] font-bold text-[#475569] uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-4 text-[13px] font-bold text-[#475569] uppercase tracking-wider">Brand</th>
                                        <th className="px-6 py-4 text-[13px] font-bold text-[#475569] uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-[13px] font-bold text-[#475569] uppercase tracking-wider uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-[13px] font-bold text-[#475569] uppercase tracking-wider">Stock</th>
                                        <th className="px-6 py-4 text-[13px] font-bold text-[#475569] uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse border-b border-slate-50">
                                                <td colSpan={8} className="px-6 py-10 h-20 bg-slate-50/50"></td>
                                            </tr>
                                        ))
                                    ) : currentEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-20 text-center text-slate-400 font-medium">
                                                No products found matching your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        currentEntries.map((product) => (
                                            <tr key={product.id} className="border-b border-slate-50 hover:bg-[#F8FAFC] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                                                        {product.image_url ? (
                                                            <img src={getImageUrl(product.image_url)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Star className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-[#1E293B] hover:text-blue-600 cursor-pointer transition-colors line-clamp-1">{product.name}</p>
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} className="w-3 h-3 text-[#CBD5E1] fill-[#CBD5E1]" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-[#64748B]">{product.category}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-[#1E293B]">{product.brand || "—"}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-[#1E293B]">RM {parseFloat(product.price.toString()).toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={cn(
                                                        "px-3 py-1 rounded-md text-[11px] font-bold border-0 shadow-none",
                                                        product.is_active
                                                            ? "bg-[#D1FAE5] text-[#059669] hover:bg-[#D1FAE5]"
                                                            : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]"
                                                    )}>
                                                        {product.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "text-sm font-bold",
                                                        product.stock_quantity === 0 ? "text-red-500" : "text-[#475569]"
                                                    )}>
                                                        {product.stock_quantity === 0 ? "Out of stock" : product.stock_quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/super-admin/products/add?id=${product.id}`)}
                                                            className="bg-white border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 h-9 font-bold flex items-center gap-2 px-4 rounded-xl transition-all shadow-sm"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(product.id)}
                                                            className="bg-white border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 h-9 font-bold flex items-center gap-2 px-4 rounded-xl transition-all shadow-sm"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="h-10 px-4 border-[#E2E8F0] text-[#64748B] font-bold hover:bg-slate-50 gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "w-10 h-10 font-bold rounded-lg transition-all",
                                        currentPage === page
                                            ? "bg-[#2563EB] text-white border-0 shadow-lg shadow-blue-500/20"
                                            : "border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
                                    )}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="h-10 px-4 border-[#E2E8F0] text-[#64748B] font-bold hover:bg-slate-50 gap-2"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
