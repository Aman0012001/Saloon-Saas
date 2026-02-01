import { useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    ArrowLeft,
    Camera,
    Loader2,
    MinusCircle,
    UploadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function AdminAddProduct() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const productId = searchParams.get("id");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [customCategory, setCustomCategory] = useState("");
    const [customBrand, setCustomBrand] = useState("");
    const [draggingField, setDraggingField] = useState<string | null>(null);

    // Multiple file input refs
    const fileInputRefs = {
        image_url: useRef<HTMLInputElement>(null),
        image_url_2: useRef<HTMLInputElement>(null),
        image_url_3: useRef<HTMLInputElement>(null),
        image_url_4: useRef<HTMLInputElement>(null),
    };

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        features: "",
        price: 0,
        discount: 0,
        stock_quantity: 0,
        image_url: "",
        image_url_2: "",
        image_url_3: "",
        image_url_4: "",
        category: "General",
        brand: "",
        target_audience: 'both' as const,
        is_active: true
    });

    useEffect(() => {
        if (productId) {
            const fetchProduct = async () => {
                setLoading(true);
                try {
                    const data = await api.platformProducts.getAll();
                    const product = data.find((p: any) => p.id === productId);
                    if (product) {
                        setFormData(product);
                    }
                } catch (error) {
                    toast({ title: "Error", description: "Failed to load product data.", variant: "destructive" });
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [productId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof fileInputRefs) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(fieldName);
        try {
            const result = await api.uploads.upload(file);
            setFormData(prev => ({ ...prev, [fieldName]: result.url }));
            toast({ title: "Success", description: "Image uploaded successfully" });
        } catch (error) {
            toast({
                title: "Upload Failed",
                description: "Failed to upload image. Please try again.",
                variant: "destructive"
            });
        } finally {
            setUploadingField(null);
        }
    };

    const handleDrag = (e: React.DragEvent, field: string, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingField(isEntering ? field : null);
    };

    const handleDrop = async (e: React.DragEvent, field: keyof typeof fileInputRefs) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingField(null);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const fakeEvent = { target: { files: [file] } } as any;
            handleFileChange(fakeEvent, field);
        } else if (file) {
            toast({ title: "Invalid File", description: "Please drop an image file", variant: "destructive" });
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.price) {
            toast({
                title: "Missing Fields",
                description: "Product name and price are required.",
                variant: "destructive"
            });
            return;
        }

        setSaving(true);
        const submissionData = {
            ...formData,
            category: formData.category === "Other" ? customCategory : formData.category,
            brand: formData.brand === "Other" ? customBrand : formData.brand
        };

        try {
            if (productId) {
                await api.platformProducts.update(productId, submissionData);
                toast({ title: "Success", description: "Product updated successfully" });
            } else {
                await api.platformProducts.create(submissionData);
                toast({ title: "Success", description: "Product created successfully" });
            }
            navigate("/super-admin/products");
        } catch (error) {
            toast({
                title: "Error",
                description: productId ? "Failed to update product." : "Failed to create product.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const ImageUploadBox = ({ field, label }: { field: keyof typeof fileInputRefs, label: string }) => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#1E293B] tracking-tight">{label}</h3>

            <div
                onClick={() => fileInputRefs[field].current?.click()}
                onDragOver={(e) => handleDrag(e, field, true)}
                onDragLeave={(e) => handleDrag(e, field, false)}
                onDrop={(e) => handleDrop(e, field)}
                className={`aspect-square bg-white border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-6 cursor-pointer transition-all overflow-hidden relative group shadow-sm
                    ${draggingField === field ? 'border-blue-500 bg-blue-50 scale-[1.02] ring-4 ring-blue-500/10' : 'border-[#CBD5E1] hover:border-blue-400 hover:bg-slate-50'}`}
            >
                {uploadingField === field ? (
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                ) : formData[field] ? (
                    <img src={formData[field]} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                    <>
                        <Camera className="w-20 h-20 text-[#94A3B8]" />
                        <Button variant="outline" className="rounded-lg font-bold text-[#2563EB] border-[#E2E8F0] bg-white shadow-sm h-12 px-10 text-lg hover:bg-slate-50">
                            Upload Image
                        </Button>
                    </>
                )}
                {draggingField === field && (
                    <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px] flex items-center justify-center border-2 border-dashed border-blue-500 rounded-xl">
                        <UploadCloud className="w-12 h-12 text-blue-500 animate-bounce" />
                    </div>
                )}
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRefs[field]}
                    onChange={(e) => handleFileChange(e, field)}
                    accept="image/*,.avif"
                />
            </div>

            <div className="p-4 bg-white rounded-xl flex items-center gap-4 border border-[#E2E8F0] h-20 shadow-sm">
                <div
                    className="flex items-center gap-3 px-5 h-12 bg-white border border-[#CBD5E1] rounded shadow-sm cursor-pointer hover:bg-slate-50 transition-colors shrink-0"
                    onClick={() => fileInputRefs[field].current?.click()}
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        <MinusCircle className="w-5 h-5 text-[#1E293B]" />
                    </div>
                    <span className="text-sm font-bold text-[#1E293B]">Choose File</span>
                </div>
                <span className="text-sm font-medium text-slate-500 truncate">
                    {formData[field] ? "Asset-Registry.jpg" : "No file selected."}
                </span>
            </div>
        </div>
    );

    return (
        <AdminLayout>
            <div className="min-h-screen bg-white -m-8 p-12 text-[#1E293B]">
                <div className="max-w-6xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="space-y-2 border-b border-slate-100 pb-8">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate("/super-admin/products")}
                                className="hover:bg-slate-100 text-slate-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <h1 className="text-3xl font-bold text-[#1E293B]">
                                {productId ? "Edit Product" : "Add New Product"}
                            </h1>
                        </div>
                        <p className="text-slate-500 font-medium ml-14">
                            {productId ? "Update product details and assets." : "Fill the details for add a new product."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* Information Section */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Column 1: Product Information */}
                                <div className="space-y-8">
                                    <h3 className="text-xl font-bold text-[#1E293B] tracking-tight">Product Information</h3>

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold text-[#1E293B]">Product Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter product name"
                                            className="h-12 bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 font-medium"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold text-[#1E293B]">Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Enter product description"
                                            className="min-h-[160px] bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 resize-none px-4 py-3 font-medium"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-[#1E293B]">Category</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={val => setFormData({ ...formData, category: val })}
                                            >
                                                <SelectTrigger className="h-12 bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-600 font-medium">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-[#E2E8F0]">
                                                    {['General', 'Hair Care', 'Skin Care', 'Nails', 'Equipment', 'Professional Supplies', 'Other'].map(cat => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {formData.category === "Other" && (
                                            <Input
                                                value={customCategory}
                                                onChange={e => setCustomCategory(e.target.value)}
                                                placeholder="Enter custom category name"
                                                className="h-12 bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 font-medium animate-in slide-in-from-top-2 duration-300"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-[#1E293B]">Brand</Label>
                                            <Select
                                                value={formData.brand}
                                                onValueChange={val => setFormData({ ...formData, brand: val })}
                                            >
                                                <SelectTrigger className="h-12 bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-600 font-medium">
                                                    <SelectValue placeholder="Select Brand" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-[#E2E8F0]">
                                                    {['L\'Oréal', 'Dyson', 'Olaplex', 'Moroccanoil', 'SkinCeuticals', 'Other'].map(brand => (
                                                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {formData.brand === "Other" && (
                                            <Input
                                                value={customBrand}
                                                onChange={e => setCustomBrand(e.target.value)}
                                                placeholder="Enter custom brand name"
                                                className="h-12 bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 font-medium animate-in slide-in-from-top-2 duration-300"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: Pricing & Stock */}
                                <div className="space-y-8">
                                    <h3 className="text-xl font-bold text-[#1E293B] tracking-tight">Pricing & Stock</h3>

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold text-[#1E293B]">Price (RM)</Label>
                                        <Input
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                            className="h-12 bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 font-medium"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold text-[#1E293B]">Discount</Label>
                                        <Input
                                            type="number"
                                            value={formData.discount}
                                            onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                                            className="h-12 bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 font-medium"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold text-[#1E293B]">Stock Quantity</Label>
                                        <Input
                                            type="number"
                                            value={formData.stock_quantity}
                                            onChange={e => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                                            className="h-12 bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 font-medium"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold text-[#1E293B]">Status</Label>
                                        <Select
                                            value={formData.is_active ? "Active" : "Inactive"}
                                            onValueChange={val => setFormData({ ...formData, is_active: val === "Active" })}
                                        >
                                            <SelectTrigger className="h-12 bg-white border-[#CBD5E1] rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-600 font-medium">
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-[#E2E8F0]">
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Images Section */}
                        <div className="lg:col-span-4 space-y-12 bg-white">
                            <ImageUploadBox field="image_url" label="Primary Image" />
                            <ImageUploadBox field="image_url_2" label="Gallery Image 1" />
                            <ImageUploadBox field="image_url_3" label="Gallery Image 2" />
                            <ImageUploadBox field="image_url_4" label="Gallery Image 3" />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-6 pt-12 border-t border-slate-100 pb-20">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/super-admin/products")}
                            className="h-14 px-14 rounded-xl font-bold text-[#1E293B] border-[#CBD5E1] bg-gradient-to-b from-white to-[#F8FAFC] shadow-sm hover:from-[#F8FAFC] hover:to-[#F1F5F9] min-w-[160px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={saving || loading}
                            className="h-14 px-14 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-bold shadow-md shadow-blue-500/20 min-w-[200px]"
                        >
                            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (productId ? "Update Product" : "Add Product")}
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
