import { useEffect, useState } from "react";
import {
    Star,
    Search,
    Filter,
    Trash2,
    MessageCircle,
    Clock,
    CheckCircle,
    XCircle,
    Building2,
    User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Review {
    id: string;
    user_name: string;
    user_avatar: string | null;
    salon_name: string;
    service_name: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export default function AdminReviews() {
    const { toast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchReviews = async () => {
        try {
            setLoading(true);
            // We'll add a new endpoint to api.admin for getting all reviews
            const data = await api.admin.getAllReviews();
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching admin reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to purge this review from the registry?")) return;
        try {
            await api.admin.deleteReview(id);
            toast({ title: "Review Purged", description: "Successfully removed from local database." });
            fetchReviews();
        } catch (error) {
            toast({ title: "Purge Failed", variant: "destructive" });
        }
    };

    const filteredReviews = reviews.filter(review => {
        const searchString = `${review.user_name} ${review.salon_name} ${review.service_name} ${review.comment}`.toLowerCase();
        return searchString.includes(searchQuery.toLowerCase());
    });

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                ))}
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 blur-[120px] rounded-full" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 bg-amber-400/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-amber-400/20 text-amber-400">
                                <Star className="h-8 w-8 fill-amber-400" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight">Platform Comments</h1>
                                <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">User Feedback & Sentiment Hub</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Filter by user, salon, or content..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 w-80 h-14 bg-white/10 border-white/10 text-white placeholder:text-white/30 rounded-2xl font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-slate-100 rounded-[2rem]" />
                        ))}
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                        <MessageCircle className="w-20 h-20 mb-4 opacity-10" />
                        <p className="text-xl font-bold">No feedback detected in registry</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredReviews.map((review) => (
                            <Card key={review.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                                {review.user_avatar ? (
                                                    <img src={review.user_avatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-none">{review.user_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform Member</p>
                                            </div>
                                        </div>
                                        {renderStars(review.rating)}
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 italic font-medium text-slate-600 text-sm leading-relaxed">
                                        "{review.comment || "No written feedback provided."}"
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                            <Building2 className="w-3 h-3" />
                                            {review.salon_name}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Comment ID: {review.id.slice(0, 8)}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(review.id)}
                                            className="text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
