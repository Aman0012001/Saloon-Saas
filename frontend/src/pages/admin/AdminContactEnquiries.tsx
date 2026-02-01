import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Clock, CheckCircle, XCircle, Loader2, MessageSquare, User, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ContactEnquiry {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    status: 'pending' | 'replied' | 'closed';
    created_at: string;
    updated_at: string;
}

export default function AdminContactEnquiries() {
    const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEnquiry, setSelectedEnquiry] = useState<ContactEnquiry | null>(null);
    const { toast } = useToast();

    const fetchEnquiries = async () => {
        try {
            setLoading(true);
            const data = await api.admin.getContactEnquiries();
            setEnquiries(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error("Error fetching enquiries:", error);
            toast({
                title: "Error",
                description: "Failed to load contact enquiries",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: 'replied' | 'closed') => {
        try {
            await api.admin.updateContactEnquiryStatus(id, status);
            toast({
                title: "Status Updated",
                description: `Enquiry marked as ${status}`,
            });
            fetchEnquiries();
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
            });
        }
    };

    const deleteEnquiry = async (id: string) => {
        if (!confirm("Are you sure you want to delete this enquiry?")) return;

        try {
            await api.admin.deleteContactEnquiry(id);
            toast({
                title: "Deleted",
                description: "Enquiry deleted successfully",
            });
            fetchEnquiries();
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to delete enquiry",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchEnquiries();
    }, []);

    const stats = {
        total: enquiries.length,
        pending: enquiries.filter(e => e.status === 'pending').length,
        replied: enquiries.filter(e => e.status === 'replied').length,
        closed: enquiries.filter(e => e.status === 'closed').length,
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                    <Loader2 className="animate-spin h-12 w-12 text-accent" />
                    <p className="text-slate-400 font-bold">Loading contact enquiries...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <MessageSquare className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight">Contact Enquiries</h1>
                                <p className="text-slate-400 font-medium mt-2">Manage website contact form submissions</p>
                            </div>
                        </div>
                        <Button onClick={fetchEnquiries} className="bg-white/10 hover:bg-white/20 border-white/10 backdrop-blur-md rounded-xl h-12 px-6 font-bold">
                            <Mail className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "Total Enquiries", value: stats.total, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50" },
                        { label: "Pending", value: stats.pending, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
                        { label: "Replied", value: stats.replied, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
                        { label: "Closed", value: stats.closed, icon: XCircle, color: "text-slate-500", bg: "bg-slate-50" },
                    ].map((stat, i) => (
                        <Card key={i} className="border-none shadow-sm bg-white rounded-3xl">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                        <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Enquiries List */}
                <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">All Enquiries</CardTitle>
                        <CardDescription className="font-medium">View and manage customer contact requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {enquiries.length === 0 ? (
                            <div className="text-center py-16">
                                <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-semibold">No contact enquiries yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                                {enquiries.map((enquiry) => (
                                    <div
                                        key={enquiry.id}
                                        className="p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer"
                                        onClick={() => setSelectedEnquiry(enquiry)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                                        <User className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-lg">{enquiry.name}</h3>
                                                        <p className="text-sm text-slate-500 font-medium">{enquiry.subject}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Mail className="w-4 h-4" />
                                                        <span className="font-medium">{enquiry.email}</span>
                                                    </div>
                                                    {enquiry.phone && (
                                                        <div className="flex items-center gap-2 text-slate-600">
                                                            <Phone className="w-4 h-4" />
                                                            <span className="font-medium">{enquiry.phone}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="font-medium">{format(new Date(enquiry.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                                                    </div>
                                                </div>

                                                <p className="text-slate-600 line-clamp-2">{enquiry.message}</p>
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                <Badge
                                                    className={`font-bold ${enquiry.status === 'pending'
                                                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                                                        : enquiry.status === 'replied'
                                                            ? 'bg-green-100 text-green-700 border-green-200'
                                                            : 'bg-slate-100 text-slate-700 border-slate-200'
                                                        }`}
                                                >
                                                    {enquiry.status.toUpperCase()}
                                                </Badge>

                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {enquiry.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => updateStatus(enquiry.id, 'replied')}
                                                            className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Mark Replied
                                                        </Button>
                                                    )}
                                                    {enquiry.status !== 'closed' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateStatus(enquiry.id, 'closed')}
                                                            className="rounded-lg"
                                                        >
                                                            Close
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteEnquiry(enquiry.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Enquiry Detail Dialog */}
            <Dialog open={!!selectedEnquiry} onOpenChange={() => setSelectedEnquiry(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Enquiry Details</DialogTitle>
                        <DialogDescription>Full contact enquiry information</DialogDescription>
                    </DialogHeader>

                    {selectedEnquiry && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Name</p>
                                    <p className="font-bold text-slate-900">{selectedEnquiry.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                    <Badge
                                        className={`font-bold ${selectedEnquiry.status === 'pending'
                                            ? 'bg-orange-100 text-orange-700'
                                            : selectedEnquiry.status === 'replied'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-700'
                                            }`}
                                    >
                                        {selectedEnquiry.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Email</p>
                                <a href={`mailto:${selectedEnquiry.email}`} className="font-bold text-blue-600 hover:underline">
                                    {selectedEnquiry.email}
                                </a>
                            </div>

                            {selectedEnquiry.phone && (
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Phone</p>
                                    <a href={`tel:${selectedEnquiry.phone}`} className="font-bold text-blue-600 hover:underline">
                                        {selectedEnquiry.phone}
                                    </a>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Subject</p>
                                <p className="font-bold text-slate-900">{selectedEnquiry.subject}</p>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Message</p>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-slate-700 whitespace-pre-wrap">{selectedEnquiry.message}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Submitted</p>
                                <p className="font-medium text-slate-600">{format(new Date(selectedEnquiry.created_at), "MMMM d, yyyy 'at' h:mm a")}</p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <Button
                                    onClick={() => window.location.href = `mailto:${selectedEnquiry.email}?subject=Re: ${selectedEnquiry.subject}`}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 font-bold"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Reply via Email
                                </Button>
                                {selectedEnquiry.status === 'pending' && (
                                    <Button
                                        onClick={() => {
                                            updateStatus(selectedEnquiry.id, 'replied');
                                            setSelectedEnquiry(null);
                                        }}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 font-bold"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark as Replied
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
