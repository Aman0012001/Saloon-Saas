import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscriptions
    const salonsChannel = supabase
      .channel('admin-notifications-salons')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'salons' },
        (payload) => {
          addNotification({
            type: 'pending',
            title: 'New Salon Registration',
            message: `${payload.new.name} has registered and needs approval`,
            actionUrl: '/admin/salons?status=pending'
          });
        }
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel('admin-notifications-bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        () => {
          addNotification({
            type: 'info',
            title: 'New Booking',
            message: 'A new booking has been created on the platform',
            actionUrl: '/admin/bookings'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salonsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      // Fetch pending salons
      const { data: pendingSalons } = await supabase
        .from('salons')
        .select('id, name, created_at')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent bookings
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('id, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      const newNotifications: Notification[] = [];

      // Add pending salon notifications
      pendingSalons?.forEach(salon => {
        newNotifications.push({
          id: `salon-${salon.id}`,
          type: 'pending',
          title: 'Salon Approval Needed',
          message: `${salon.name} is waiting for approval`,
          timestamp: salon.created_at,
          read: false,
          actionUrl: '/admin/salons?status=pending'
        });
      });

      // Add recent booking notifications
      if (recentBookings && recentBookings.length > 0) {
        newNotifications.push({
          id: `bookings-today`,
          type: 'info',
          title: 'Recent Bookings',
          message: `${recentBookings.length} new bookings in the last 24 hours`,
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/admin/bookings'
        });
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`mb-2 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t">
          <Button variant="outline" className="w-full" size="sm" onClick={fetchNotifications}>
            Refresh Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}