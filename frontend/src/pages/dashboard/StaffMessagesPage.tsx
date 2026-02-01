import { useState, useEffect, useCallback } from "react";
import {
    Mail,
    Search,
    ChevronRight,
    User,
    Clock,
    CheckCircle,
    Archive,
    RefreshCw,
    Bell,
    Trash2,
    Inbox,
    Send,
    Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StaffMessagesPage() {
    const { user } = useAuth();
    const { currentSalon } = useSalon();
    const { toast } = useToast();

    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMessage, setActiveMessage] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
    const { isOwner, isManager } = useSalon();
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [sending, setSending] = useState(false);

    const [composeData, setComposeData] = useState({
        recipient_type: "owner" as "owner" | "super_admin" | "staff",
        receiver_id: "" as string,
        subject: "",
        content: ""
    });

    const fetchMessages = useCallback(async () => {
        if (!currentSalon || !user) return;
        try {
            setLoading(true);
            const data = await api.messages.getAll(currentSalon.id);
            setMessages(data);
            if (data.length > 0 && !activeMessage) {
                // Find first relevant message for the tab
                const filtered = data.filter((m: any) => {
                    if (isOwner || isManager) return activeTab === 'inbox' ? m.sender_id !== user.id : m.sender_id === user.id;
                    return activeTab === 'inbox'
                        ? (m.receiver_id === user.id || (m.recipient_type === 'staff' && !m.receiver_id))
                        : m.sender_id === user.id;
                });
                if (filtered.length > 0) setActiveMessage(filtered[0]);
            }
        } catch (error: any) {
            console.error("Fetch messages error:", error);
            toast({
                title: "Transmission Error",
                description: error.message || "Failed to synchronize messages.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [currentSalon, user, activeTab, activeMessage]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        if (isOwner) {
            setComposeData(prev => ({ ...prev, recipient_type: "staff" }));
        }
    }, [isOwner]);

    const handleSendMessage = async () => {
        if (!composeData.content.trim() || !currentSalon) return;

        try {
            setSending(true);
            await api.messages.send({
                salon_id: currentSalon.id,
                content: composeData.content,
                subject: composeData.subject || "No Subject",
                recipient_type: composeData.recipient_type,
                receiver_id: composeData.receiver_id || undefined
            });

            toast({
                title: "Transmission Success",
                description: "Your signal has been dispatched to leadership."
            });

            setIsComposeOpen(false);
            setComposeData({ recipient_type: "owner", receiver_id: "", subject: "", content: "" });
            fetchMessages();
        } catch (error: any) {
            toast({
                title: "Dispatch Failed",
                description: error.message || "Network interference detected. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    const markRead = async (id: string) => {
        try {
            await api.messages.markAsRead(id);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: 1 } : m));
        } catch (error) {
            console.error("Mark read error:", error);
        }
    };

    const filteredMessages = messages.filter((m: any) => {
        if (isOwner || isManager) {
            return activeTab === 'inbox' ? m.sender_id !== user?.id : m.sender_id === user?.id;
        }
        return activeTab === 'inbox'
            ? (m.receiver_id === user?.id || (m.recipient_type === 'staff' && !m.receiver_id))
            : m.sender_id === user?.id;
    });


    return (
        <ResponsiveDashboardLayout showBackButton={true}>
            <div className="max-w-[1400px] mx-auto py-10 px-6 h-[calc(100vh-120px)] flex flex-col gap-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                            <Mail className="w-10 h-10 text-[#F2A93B]" />
                            Mail System
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Internal Communications • Operational Intelligence
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="h-12 px-6 bg-[#F2A93B] hover:bg-[#E29A2B] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    New Dispatch
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-white rounded-3xl border-none shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Compose Dispatch</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 pt-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#F2A93B]">Priority Target</Label>
                                        <Select
                                            value={composeData.recipient_type}
                                            onValueChange={(v: any) => setComposeData(prev => ({ ...prev, recipient_type: v }))}
                                        >
                                            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold">
                                                <SelectValue placeholder="Select Recipient" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-xl bg-white">
                                                {!isOwner && <SelectItem value="owner" className="font-bold py-3">SALON OWNER</SelectItem>}
                                                {(isOwner || isManager) && <SelectItem value="staff" className="font-bold py-3">STAFF BROADCAST</SelectItem>}
                                                {isOwner && <SelectItem value="super_admin" className="font-bold py-3">SUPER ADMIN</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</Label>
                                        <Input
                                            placeholder="Operational Summary"
                                            className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                                            value={composeData.subject}
                                            onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Details</Label>
                                        <Textarea
                                            placeholder="Enter your message here..."
                                            className="min-h-[150px] bg-slate-50 border-none rounded-xl font-bold p-4"
                                            value={composeData.content}
                                            onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="pt-6">
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={sending || !composeData.content.trim()}
                                        className="w-full h-14 bg-[#F2A93B] hover:bg-[#E29A2B] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                    >
                                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : "TRANSMIT SIGNAL"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button
                            onClick={() => fetchMessages()}
                            className="h-12 w-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all border-none"
                        >
                            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* Messaging Interface */}
                <div className="flex-1 flex gap-8 min-h-0">
                    {/* Sidebar - Threads */}
                    <div className="w-full md:w-[400px] flex flex-col gap-6 shrink-0">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setActiveTab("inbox")}
                                className={cn(
                                    "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === "inbox" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Inbox
                            </button>
                            <button
                                onClick={() => setActiveTab("sent")}
                                className={cn(
                                    "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === "sent" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Dispatch Logs
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                            {loading && filteredMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#F2A93B]" />
                                </div>
                            ) : filteredMessages.length === 0 ? (
                                <div className="text-center py-20 space-y-4 opacity-40">
                                    <Inbox className="w-12 h-12 mx-auto" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Transmissions Found</p>
                                </div>
                            ) : (
                                filteredMessages.map((msg, i) => (
                                    <Card
                                        key={i}
                                        onClick={() => {
                                            setActiveMessage(msg);
                                            if (!msg.is_read && activeTab === 'inbox') markRead(msg.id);
                                        }}
                                        className={cn(
                                            "border-none shadow-sm rounded-[2rem] cursor-pointer transition-all hover:shadow-xl",
                                            activeMessage?.id === msg.id ? "bg-[#F2A93B] text-white" : "bg-white",
                                            activeTab === 'inbox' && !msg.is_read && activeMessage?.id !== msg.id && "ring-2 ring-[#F2A93B]/20"
                                        )}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                                                        activeMessage?.id === msg.id ? "bg-white/10" : "bg-slate-50"
                                                    )}>
                                                        {activeTab === 'sent' ? <Send className={cn("w-5 h-5", activeMessage?.id === msg.id ? "text-[#F2A93B]" : "text-slate-400")} /> : <Mail className={cn("w-5 h-5", activeMessage?.id === msg.id ? "text-[#F2A93B]" : "text-slate-400")} />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-black tracking-tight line-clamp-1">{msg.subject || "No Subject"}</h4>
                                                            {activeTab === 'inbox' && !msg.is_read && <div className="w-2 h-2 rounded-full bg-[#F2A93B] shadow-[0_0_10px_rgba(242,169,59,0.5)]" />}
                                                        </div>
                                                        <p className={cn("text-[9px] font-black uppercase tracking-widest", activeMessage?.id === msg.id ? "text-white/40" : "text-slate-400")}>
                                                            {activeTab === 'inbox' ? `FROM: ${msg.sender_name || 'System'}` : `TO: ${msg.recipient_type.toUpperCase()}`} • {format(new Date(msg.created_at), "MMM dd")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className={cn("w-4 h-4", activeMessage?.id === msg.id ? "text-white/20" : "text-slate-100")} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Content Area - Thread Detail */}
                    <div className="hidden md:flex flex-1 bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden flex-col">
                        <AnimatePresence mode="wait">
                            {activeMessage ? (
                                <motion.div
                                    key={activeMessage.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex-1 flex flex-col p-12"
                                >
                                    {/* Message Header */}
                                    <div className="flex items-start justify-between pb-10 border-b border-slate-50">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-[#F2A93B] text-white flex items-center justify-center text-xl font-black shadow-2xl">
                                                {(activeTab === 'inbox' ? activeMessage.sender_name : activeMessage.recipient_type)[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeMessage.subject || "Tactical Signal"}</h2>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-[#F2A93B]" />
                                                    {activeTab === 'inbox' ? `FROM: ${activeMessage.sender_name || 'System'}` : `TO: ${activeMessage.recipient_type.toUpperCase()}`}
                                                    • {format(new Date(activeMessage.created_at), "eeee, MMM dd, yyyy")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="ghost" className="h-12 w-12 rounded-2xl hover:bg-slate-50 text-slate-400">
                                                <Archive className="w-5 h-5" />
                                            </Button>
                                            <Button variant="ghost" className="h-12 w-12 rounded-2xl hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Message Body */}
                                    <div className="flex-1 py-12">
                                        <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100/50">
                                            <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                                                {activeMessage.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Message Action Footer */}
                                    <div className="pt-10 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">
                                                Security Protocol Active
                                            </Badge>
                                        </div>
                                        {activeTab === 'inbox' && (
                                            <Button
                                                onClick={() => {
                                                    setComposeData({
                                                        recipient_type: isOwner ? "staff" : "owner",
                                                        receiver_id: activeMessage.sender_id,
                                                        subject: `Re: ${activeMessage.subject}`,
                                                        content: `\n\n--- Original Signal ---\n${activeMessage.content}`
                                                    });
                                                    setIsComposeOpen(true);
                                                }}
                                                className="h-14 px-10 bg-[#F2A93B] hover:bg-[#E29A2B] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center gap-4"
                                            >
                                                <Send className="w-4 h-4" /> Reply Signal
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20">
                                    <Mail className="w-24 h-24 mb-6" />
                                    <h3 className="text-xl font-black uppercase tracking-widest">Select Signal for Decoding</h3>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </ResponsiveDashboardLayout>
    );
}
