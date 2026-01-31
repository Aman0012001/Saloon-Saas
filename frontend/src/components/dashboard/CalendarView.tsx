import React, { useState, useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    startOfWeek,
    endOfWeek
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Scissors,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarViewProps {
    bookings: any[];
    onDateSelect: (date: Date) => void;
    selectedDate: Date;
}

export const CalendarView = ({ bookings, onDateSelect, selectedDate }: CalendarViewProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const getBookingsForDay = (day: Date) => {
        return bookings.filter(b => isSameDay(new Date(b.booking_date), day));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-500';
            case 'completed': return 'bg-blue-500';
            case 'pending': return 'bg-amber-500';
            case 'cancelled': return 'bg-rose-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md rounded-[2rem] overflow-hidden">
            <CardContent className="p-0">
                <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Operational Schedule • Visual Intelligence
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-inner border border-slate-100">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="rounded-xl hover:bg-slate-50 h-10 w-10"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setCurrentMonth(new Date());
                                onDateSelect(new Date());
                            }}
                            className="px-4 font-black text-[10px] uppercase tracking-widest text-[#F2A93B] hover:bg-[#F2A93B]/5"
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="rounded-xl hover:bg-slate-50 h-10 w-10"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 bg-slate-100/50">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="py-4 text-center border-r border-slate-100 last:border-r-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{day}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 border-t border-slate-100">
                    {days.map((day, idx) => {
                        const dayBookings = getBookingsForDay(day);
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = format(day, 'M') === format(currentMonth, 'M');

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => onDateSelect(day)}
                                className={cn(
                                    "min-h-[140px] p-3 border-r border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50",
                                    !isCurrentMonth && "bg-slate-50/30 opacity-40",
                                    isSelected && "bg-[#F2A93B]/5 ring-2 ring-[#F2A93B]/10 z-10",
                                    idx % 7 === 6 && "border-r-0"
                                )}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={cn(
                                        "text-lg font-black tracking-tight",
                                        isToday(day) ? "text-[#F2A93B]" : "text-slate-900",
                                        !isCurrentMonth && "text-slate-300"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayBookings.length > 0 && (
                                        <Badge className="bg-[#F2A93B] text-white border-0 font-black text-[9px] px-2 h-5">
                                            {dayBookings.length}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-1.5 max-h-[80px] overflow-hidden">
                                    {dayBookings.slice(0, 3).map((booking, bIdx) => (
                                        <TooltipProvider key={booking.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn(
                                                        "group flex items-center gap-2 px-2 py-1.5 rounded-lg text-white shadow-sm transition-transform hover:scale-[1.02]",
                                                        getStatusColor(booking.status)
                                                    )}>
                                                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                                        <span className="text-[9px] font-bold truncate tracking-tight">
                                                            {booking.booking_time.slice(0, 5)} {booking.user_name || 'Guest'}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="bg-[#F2A93B] text-white border-none p-4 rounded-2xl shadow-2xl w-64">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Badge className={cn("text-[8px] font-black uppercase tracking-widest", getStatusColor(booking.status))}>
                                                                {booking.status}
                                                            </Badge>
                                                            <span className="text-xs font-black">{booking.booking_time}</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="font-black text-sm">{booking.user_name || 'Guest'}</h4>
                                                            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                                <Scissors className="w-3 h-3" />
                                                                {booking.service_name}
                                                            </p>
                                                            {booking.staff_name && (
                                                                <p className="text-[10px] font-medium text-amber-400 flex items-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    Staff: {booking.staff_name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                    {dayBookings.length > 3 && (
                                        <p className="text-[8px] font-black text-slate-400 text-center uppercase tracking-widest">
                                            + {dayBookings.length - 3} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
