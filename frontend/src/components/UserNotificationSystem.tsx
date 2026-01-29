import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, Info, Clock, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/services/api";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
    link?: string;
}

export function UserNotificationSystem() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await api.notifications.getAll();
            setNotifications(data || []);
        } catch (error) {
            console.error('Failed to fetch user notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await api.notifications.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.notifications.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (!user) return null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 md:h-11 md:w-11 rounded-full bg-slate-50 hover:bg-slate-100 transition-all group"
                >
                    <Bell className="w-5 h-5 text-slate-600 group-hover:text-accent transition-colors" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-0 -right-0 w-5 h-5 p-0 text-[10px] flex items-center justify-center font-bold bg-accent text-white border-2 border-white shadow-sm animate-pulse">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 md:w-96 p-0 border-none shadow-2xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white z-[60]" align="end">
                <div className="bg-slate-900 p-5 md:p-6 text-white flex items-center justify-between">
                    <div>
                        <h3 className="text-base md:text-lg font-black tracking-tight">Notifications</h3>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">Personal Updates</p>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-black uppercase text-accent hover:text-white transition-colors">
                            Mark all read
                        </button>
                    )}
                </div>

                <ScrollArea className="h-[350px] md:h-[450px] bg-slate-50/50">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center px-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
                            </div>
                            <p className="text-xs md:text-sm font-bold text-slate-400">All caught up!</p>
                        </div>
                    ) : (
                        <div className="p-3 md:p-4 space-y-3">
                            {notifications.map((n) => (
                                <Card
                                    key={n.id}
                                    className={`border-none shadow-sm rounded-xl md:rounded-2xl overflow-hidden group hover:shadow-md transition-all cursor-pointer ${n.is_read ? 'bg-white/60 opacity-75' : 'bg-white'}`}
                                    onClick={() => {
                                        markAsRead(n.id);
                                        if (n.link) window.location.href = n.link;
                                    }}
                                >
                                    <CardContent className="p-3 md:p-4">
                                        <div className="flex items-start gap-3 md:gap-4">
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${n.type === 'booking' ? 'bg-accent/10 text-accent' : 'bg-blue-50 text-blue-500'
                                                }`}>
                                                {n.type === 'booking' ? <Calendar className="w-4 h-4 md:w-5 md:h-5" /> : <Info className="w-4 h-4 md:w-5 md:h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`font-black text-xs md:text-sm truncate ${n.is_read ? 'text-slate-500' : 'text-slate-900'}`}>{n.title}</h4>
                                                    {!n.is_read && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent rounded-full" />}
                                                </div>
                                                <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                                <p className="text-[8px] md:text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2 md:mt-3">
                                                    {format(new Date(n.created_at), 'MMM dd, HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-3 md:p-4 bg-white border-t border-slate-50">
                    <Button onClick={fetchNotifications} variant="ghost" className="w-full h-10 md:h-12 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all duration-300">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
