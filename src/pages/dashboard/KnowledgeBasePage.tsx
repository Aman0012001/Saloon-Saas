import { useEffect, useState } from "react";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BookOpen,
    Plus,
    HelpCircle,
    Sparkles,
    Edit,
    Trash2,
    Loader2,
    Search,
    ChevronRight,
    SearchSlash
} from "lucide-react";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface KnowledgeItem {
    id: string;
    salon_id: string;
    category: 'Skin Care' | 'FAQ';
    title: string;
    content: string;
    is_active: boolean;
    service_id: string | null;
    created_at: string;
    updated_at: string;
}

const KnowledgeBasePage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const { currentSalon, loading: salonLoading, isOwner, isManager } = useSalon();

    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "Skin Care" as 'Skin Care' | 'FAQ',
        service_id: "all" as string | null, // "all" means general tip
        is_active: true
    });

    const [services, setServices] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    const fetchItems = async () => {
        if (!currentSalon) {
            if (!salonLoading) setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [kbData, servicesData] = await Promise.all([
                api.knowledgeBase.getBySalon(currentSalon.id),
                api.services.getBySalon(currentSalon.id)
            ]);
            setItems(kbData);
            setServices(servicesData || []);
        } catch (error) {
            console.error("Error fetching knowledge base:", error);
            toast({
                title: "Error",
                description: "Failed to load knowledge base items",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [currentSalon]);

    const resetForm = () => {
        setFormData({
            title: "",
            content: "",
            category: "Skin Care",
            service_id: "all",
            is_active: true
        });
        setEditingItem(null);
    };

    const handleSave = async () => {
        if (!currentSalon || !formData.title || !formData.content) {
            toast({
                title: "Validation Error",
                description: "Title and content are required",
                variant: "destructive"
            });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                service_id: formData.service_id === "all" ? null : formData.service_id,
                salon_id: currentSalon.id
            };

            if (editingItem) {
                await api.knowledgeBase.update(editingItem.id, payload);
                toast({ title: "Success", description: "Entry updated successfully" });
            } else {
                await api.knowledgeBase.create(payload);
                toast({ title: "Success", description: "Entry published successfully" });
            }

            setIsDialogOpen(false);
            resetForm();
            fetchItems();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save entry",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        try {
            await api.knowledgeBase.delete(id);
            toast({ title: "Success", description: "Entry removed" });
            fetchItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const openEditDialog = (item: KnowledgeItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            content: item.content,
            category: item.category,
            service_id: item.service_id || "all",
            is_active: item.is_active
        });
        setIsDialogOpen(true);
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (authLoading || salonLoading) {
        return (
            <ResponsiveDashboardLayout showBackButton={true}>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-[#F2A93B]" />
                </div>
            </ResponsiveDashboardLayout>
        );
    }

    return (
        <ResponsiveDashboardLayout showBackButton={true}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage Skin Care Tips and Frequently Asked Questions
                        </p>
                    </div>
                    {(isOwner || isManager) && (
                        <Button
                            onClick={() => { resetForm(); setIsDialogOpen(true); }}
                            className="bg-[#F2A93B] hover:bg-[#E29A2B] text-white gap-2 shadow-lg rounded-xl h-12"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Entry
                        </Button>
                    )}
                </div>

                {/* Filters & Search */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search tips or questions..."
                            className="pl-10 h-12 rounded-xl border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">All Content</SelectItem>
                            <SelectItem value="Skin Care">Skin Care Tips</SelectItem>
                            <SelectItem value="FAQ">FAQs</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border-none shadow-sm bg-blue-50/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Skin Care Tips</p>
                                <p className="text-2xl font-black text-slate-900">{items.filter(i => i.category === 'Skin Care').length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-amber-50/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                                <HelpCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-600 uppercase tracking-wider">FAQs Published</p>
                                <p className="text-2xl font-black text-slate-900">{items.filter(i => i.category === 'FAQ').length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#F2A93B]" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Knowledge Base...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <SearchSlash className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No entries found</h3>
                            <p className="text-slate-400 max-w-xs mx-auto mt-2">
                                {searchQuery ? "Try adjusting your search query or filters." : "Start by adding your first skin care tip or frequently asked question."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredItems.map((item) => (
                                <Card key={item.id} className="group border-none shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    <div className="flex flex-col sm:flex-row">
                                        <div className={`w-2 ${item.category === 'Skin Care' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                        <div className="flex-1 p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Badge className={item.category === 'Skin Care' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}>
                                                        {item.category === 'Skin Care' ? <Sparkles className="w-3 h-3 mr-1" /> : <HelpCircle className="w-3 h-3 mr-1" />}
                                                        {item.category}
                                                    </Badge>
                                                    {!item.is_active && <Badge variant="outline" className="text-slate-400">Inactive</Badge>}
                                                    {item.service_id && (
                                                        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                                                            Linked: {services.find(s => s.id === item.service_id)?.name || "Unknown Service"}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 hover:bg-slate-100">
                                                        <Edit className="w-4 h-4 text-slate-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
                                                        <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                            <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
                                                {item.content}
                                            </p>

                                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Published {new Date(item.created_at).toLocaleDateString()}
                                                </p>
                                                <Button variant="ghost" className="text-[#F2A93B] font-bold text-xs h-8" onClick={() => openEditDialog(item)}>
                                                    Full Detail <ChevronRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-xl rounded-[2rem] overflow-hidden border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-900">
                                {editingItem ? "Refine Entry" : "Create Knowledge Node"}
                            </DialogTitle>
                            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-[#F2A93B]">
                                {editingItem ? "Updating professional advice" : "Publishing new salon intelligence"}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-5 py-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: 'Skin Care' })}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm ${formData.category === 'Skin Care'
                                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                                            : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <Sparkles className="w-4 h-4" /> Skin Care Tip
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: 'FAQ' })}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm ${formData.category === 'FAQ'
                                            ? 'border-amber-500 bg-amber-50 text-amber-600'
                                            : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <HelpCircle className="w-4 h-4" /> FAQ Item
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Service (Optional)</Label>
                                <Select
                                    value={formData.service_id || "all"}
                                    onValueChange={(val) => setFormData({ ...formData, service_id: val })}
                                >
                                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold px-5">
                                        <SelectValue placeholder="Show on all services" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-xl border-slate-100">
                                        <SelectItem value="all">General (Show on all services)</SelectItem>
                                        {services.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={formData.category === 'Skin Care' ? "How to maintain hydration..." : "What is your cancellation policy?"}
                                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold px-5 focus-visible:ring-2 focus-visible:ring-[#F2A93B]/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detailed Content</Label>
                                <Textarea
                                    rows={6}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Provide detailed professional advice or answer..."
                                    className="bg-slate-50 border-none rounded-2xl font-bold px-5 py-4 focus-visible:ring-2 focus-visible:ring-[#F2A93B]/20 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none">Visibility Status</Label>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active nodes are visible to clients</p>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${formData.is_active ? 'bg-green-500 justify-end' : 'bg-slate-200 justify-start'}`}
                                >
                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                </button>
                            </div>
                        </div>

                        <DialogFooter className="gap-3">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 flex-1 font-black text-[10px] uppercase tracking-widest text-slate-400">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-14 flex-1 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl transition-all"
                            >
                                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : editingItem ? "Commit Update" : "Publish Entry"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ResponsiveDashboardLayout>
    );
};

export default KnowledgeBasePage;
