import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, Loader2 } from "lucide-react";
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

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'pending';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch platform-wide notifications
      const data = await api.notifications.getAll();

      const mapped = data.map((n: any) => ({
        id: n.id,
        type: (n.type === 'booking' ? 'success' : n.type === 'system' ? 'info' : 'warning') as 'info' | 'warning' | 'success' | 'pending',
        title: n.title,
        message: n.message,
        timestamp: n.created_at,
        read: Boolean(n.is_read),
        actionUrl: n.link
      }));

      setNotifications(mapped);
    } catch (error) {
      console.error('Local notification sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark admin notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.notifications.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-700 transition-colors">
          <Bell className="h-5 w-5 text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-4 w-4 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-800">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 border-none shadow-2xl rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-800" align="end">
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black tracking-tight">Governance Events</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Platform Status Registry</p>
          </div>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
        </div>

        <ScrollArea className="h-[450px] bg-slate-950">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-10">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-800">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-slate-500">Governance is synchronized. No pending alerts.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((n) => (
                <Card
                  key={n.id}
                  className={`border-none shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all cursor-pointer ${n.read ? 'bg-slate-900/50 opacity-60' : 'bg-slate-900 border border-slate-800'
                    }`}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.actionUrl) window.location.href = n.actionUrl;
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'pending' || n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                        {n.type === 'pending' || n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-white text-sm truncate">{n.title}</h4>
                          <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="text-slate-600 hover:text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-medium text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                          {format(new Date(n.timestamp), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <Button onClick={fetchNotifications} variant="ghost" className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all duration-300">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sync Data Now"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
