import { useState, useEffect } from "react";
import { Bell, Info, Calendar, Search, Trash2, CheckCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { format } from "date-fns";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    is_read: number;
    link?: string;
}

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const notifData = await api.notifications.getAll({ unread_only: '0' });
            // For admin, we don't pass salon_id to get global admin notifications
            setNotifications(Array.isArray(notifData) ? notifData : []);
        } catch (error) {
            console.error("Failed to fetch admin notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.notifications.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.notifications.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast({
                title: "Dismissed",
                description: "Notification permanently removed.",
            });
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.notifications.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Intelligence Feed</h1>
                        <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Platform-wide alerts and governance logs</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-xs uppercase tracking-wider h-12 px-6"
                            onClick={fetchData}
                        >
                            Refresh Pulse
                        </Button>
                        <Button
                            className="bg-accent hover:bg-accent/90 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-accent/20 h-12 px-6"
                            onClick={markAllRead}
                        >
                            Acknowledge All
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <Card className="border-none shadow-2xl bg-gray-800/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/5">
                        <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <CardTitle className="text-xl font-bold text-white">Critical Alerts</CardTitle>
                                    <CardDescription className="text-slate-400 font-medium">Real-time governance monitoring</CardDescription>
                                </div>
                                <div className="relative group max-w-md w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
                                    <Input
                                        placeholder="Filter feed..."
                                        className="pl-12 pr-4 py-6 bg-white/5 border-white/10 rounded-2xl focus:ring-4 focus:ring-accent/5 transition-all font-medium text-sm text-white placeholder:text-slate-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[700px]">
                                {loading ? (
                                    <div className="p-20 text-center animate-pulse">
                                        <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4" />
                                        <div className="h-4 w-48 bg-white/5 mx-auto rounded" />
                                    </div>
                                ) : filteredNotifications.length === 0 ? (
                                    <div className="text-center py-32">
                                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-12 group-hover:rotate-0 transition-transform">
                                            <Shield className="w-12 h-12 text-slate-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight">Governance Stable</h3>
                                        <p className="text-slate-500 font-medium mt-2">No active alerts requiring intervention.</p>
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-4">
                                        {filteredNotifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className={`group relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${n.is_read
                                                    ? "bg-white/[0.02] border-transparent opacity-40 hover:opacity-100"
                                                    : "bg-white/[0.04] border-accent/20 shadow-xl shadow-accent/5 hover:border-accent/40"
                                                    }`}
                                                onClick={() => {
                                                    markAsRead(n.id);
                                                    if (n.link) navigate(n.link);
                                                }}
                                            >
                                                <div className="flex items-start gap-6">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${n.is_read
                                                        ? "bg-white/5 text-slate-500"
                                                        : n.type === 'alert'
                                                            ? "bg-red-500/10 text-red-400 ring-4 ring-red-500/5"
                                                            : "bg-accent/10 text-accent ring-4 ring-accent/5"
                                                        }`}>
                                                        {n.type === 'alert' ? <Bell className="w-7 h-7" /> : <Info className="w-7 h-7" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="font-black text-lg text-white tracking-tight">{n.title}</h4>
                                                                {!n.is_read && <Badge className="bg-accent text-[8px] font-black uppercase px-2 py-0.5 rounded-full">New</Badge>}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(n.created_at), 'MMM d, HH:mm')}</span>
                                                        </div>
                                                        <p className="text-slate-400 font-medium leading-relaxed">{n.message}</p>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="rounded-xl hover:bg-white/10 text-slate-400"
                                                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-xl bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">System Health</p>
                                    <p className="text-xl font-black text-white">NOMINAL</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="border-none shadow-xl bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Active Alerts</p>
                                    <p className="text-xl font-black text-white">{notifications.filter(n => !n.is_read).length}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="border-none shadow-xl bg-purple-500/5 border border-purple-500/10 rounded-3xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-purple-500/60 uppercase tracking-widest">Governance</p>
                                    <p className="text-xl font-black text-white">ENFORCED</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
