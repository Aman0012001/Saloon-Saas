import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    MoreHorizontal,
    Edit,
    XCircle,
    CheckCircle2,
    Star,
    Mail,
    Phone,
    TrendingUp,
    BarChart3,
    Award,
    CalendarDays,
    ArrowUpRight,
    Shield,
    Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StaffMember } from "@/types/staff";
import { EditStaffDialog } from "./EditStaffDialog";

interface StaffCardProps {
    member: StaffMember;
    isOwnerOrManager: boolean;
    onUpdateStatus: (id: string, isActive: boolean) => void;
    onUpdateSuccess?: () => void;
    index: number;
    viewMode?: "grid" | "list";
}

export function StaffCard({ member, isOwnerOrManager, onUpdateStatus, onUpdateSuccess, index, viewMode = "grid" }: StaffCardProps) {
    const navigate = useNavigate();
    const [editOpen, setEditOpen] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleStyles = (role?: string) => {
        switch (role) {
            case "owner":
                return {
                    bg: "bg-slate-900 border-slate-900",
                    text: "text-white",
                    icon: <Award className="w-3 h-3" />,
                    label: "Proprietor"
                };
            case "manager":
                return {
                    bg: "bg-accent/10 border-accent/20",
                    text: "text-accent",
                    icon: <Shield className="w-3 h-3" />,
                    label: "Manager"
                };
            default:
                return {
                    bg: "bg-slate-50 border-slate-100",
                    text: "text-slate-600",
                    icon: <Users className="w-3 h-3" />,
                    label: "Professional"
                };
        }
    };

    const specs = Array.isArray(member.specializations)
        ? member.specializations
        : typeof member.specializations === 'string'
            ? (member.specializations as string).split(',').filter(Boolean)
            : [];

    const roleStyle = getRoleStyles(member.role);

    if (viewMode === "list") {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: index * 0.03 } }}
                className="group relative"
            >
                <div className={`relative flex items-center bg-white rounded-[1.8rem] border border-slate-100 p-4 shadow-sm hover:shadow-xl hover:border-accent/10 transition-all duration-500 overflow-hidden ${!member.is_active ? 'opacity-70 grayscale' : ''}`}>
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="relative shrink-0">
                            <Avatar className="w-16 h-16 rounded-2xl border-0 shadow-lg">
                                <AvatarImage src={member.avatar_url || ""} className="object-cover" />
                                <AvatarFallback className="bg-slate-900 text-white font-bold text-lg">
                                    {getInitials(member.display_name)}
                                </AvatarFallback>
                            </Avatar>
                            {member.is_active && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-black text-slate-900 truncate">{member.display_name}</h3>
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text}`}>
                                    {roleStyle.icon}
                                    {roleStyle.label}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold text-slate-500 truncate">{member.email || "---"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold text-slate-500 truncate">{member.phone || "---"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:flex flex-wrap gap-2 max-w-[30%]">
                            {specs.slice(0, 3).map((spec, i) => (
                                <Badge key={i} className="bg-slate-50 text-slate-500 border-none px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
                                    {spec.trim()}
                                </Badge>
                            ))}
                        </div>

                        <div className="hidden xl:flex items-center gap-8 px-8 border-x border-slate-50">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Commission</p>
                                <p className="text-lg font-black text-slate-900 leading-none">{member.commission_percentage}%</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined</p>
                                <p className="text-xs font-black text-slate-900 leading-none">
                                    {member.created_at ? new Date(member.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/dashboard/reports")}
                            className="hidden md:flex h-10 px-4 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/5 gap-2 rounded-xl"
                        >
                            <TrendingUp className="w-4 h-4" /> Reports
                        </Button>

                        {isOwnerOrManager && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-slate-100">
                                        <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl">
                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditOpen(true); }} className="rounded-xl py-3 font-bold gap-3 focus:bg-slate-50">
                                        <Edit className="w-4 h-4 text-blue-500" /> Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className={`rounded-xl py-3 font-bold gap-3 transition-colors ${member.is_active ? "text-red-500 focus:bg-red-50" : "text-emerald-500 focus:bg-emerald-50"}`} onClick={() => onUpdateStatus(member.id, !member.is_active)}>
                                        {member.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                        {member.is_active ? "Deactivate" : "Activate"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                <EditStaffDialog member={member} onSuccess={() => { setEditOpen(false); onUpdateSuccess?.(); }} isOpen={editOpen} onOpenChange={setEditOpen} />
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.05 } }}
            className="group relative h-full"
        >
            <div className="absolute inset-x-4 -bottom-4 h-8 bg-slate-900/5 blur-2xl rounded-[3rem] -z-10 group-hover:bg-accent/10 transition-colors duration-500" />

            <div className={`relative h-full flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 overflow-hidden ${!member.is_active ? 'opacity-80 grayscale-[0.5]' : ''}`}>

                {/* Header Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-32 bg-slate-50 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-white via-white/50 to-transparent" />
                </div>

                <div className="relative p-8 flex flex-col h-full flex-1">
                    {/* Top Section */}
                    <div className="flex items-start justify-between relative z-10">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-white rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative p-1 bg-white rounded-[1.8rem] shadow-2xl shadow-slate-200">
                                <Avatar className="w-24 h-24 rounded-[1.5rem] border-0">
                                    <AvatarImage src={member.avatar_url || ""} className="object-cover" />
                                    <AvatarFallback className="bg-slate-900 text-white font-bold text-2xl">
                                        {getInitials(member.display_name)}
                                    </AvatarFallback>
                                </Avatar>
                                {member.is_active ? (
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
                                ) : (
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-slate-300 rounded-full border-4 border-white shadow-lg" />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 pt-2">
                            {isOwnerOrManager && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 hover:bg-slate-900 hover:text-white transition-all">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-[1.5rem] border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                                        <DropdownMenuItem
                                            className="rounded-xl py-3 font-bold flex items-center gap-3 text-slate-600 focus:bg-slate-50 focus:text-slate-900 transition-colors"
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                setEditOpen(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4 text-blue-500" /> Edit Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="rounded-xl py-3 font-bold flex items-center gap-3 text-slate-600 focus:bg-slate-50 focus:text-slate-900 transition-colors"
                                            onClick={() => navigate("/dashboard/reports")}
                                        >
                                            <BarChart3 className="w-4 h-4 text-accent" /> View Performance
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                        <DropdownMenuItem
                                            className={`rounded-xl py-3 font-bold flex items-center gap-3 transition-colors ${member.is_active ? "text-red-500 focus:bg-red-50" : "text-emerald-500 focus:bg-emerald-50"}`}
                                            onClick={() => onUpdateStatus(member.id, !member.is_active)}
                                        >
                                            {member.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                            {member.is_active ? "Deactivate" : "Activate"}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {!member.is_active && (
                                <Badge className="bg-red-50 text-red-500 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                    Off Duty
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="mt-8 space-y-4 flex-1">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-accent transition-colors">
                                    {member.display_name}
                                </h3>
                                {member.role === 'owner' && <Star className="w-4 h-4 text-accent fill-accent" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border ${roleStyle.bg} ${roleStyle.text}`}>
                                    {roleStyle.icon}
                                    {roleStyle.label}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 py-4 border-y border-slate-50">
                            <div className="flex items-center gap-3 group/info">
                                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center group-hover/info:bg-accent/10 group-hover/info:text-accent transition-all duration-300">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                                    <p className="text-sm font-bold text-slate-600 truncate">{member.email || "---"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 group/info">
                                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center group-hover/info:bg-accent/10 group-hover/info:text-accent transition-all duration-300">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Phone</p>
                                    <p className="text-sm font-bold text-slate-600">{member.phone || "---"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specialties</p>
                            <div className="flex flex-wrap gap-2">
                                {specs.length > 0 ? (
                                    specs.map((spec, i) => (
                                        <Badge key={i} className="bg-slate-50 text-slate-500 border-none px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider group-hover:bg-accent/5 group-hover:text-accent transition-colors">
                                            {spec.trim()}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-[11px] text-slate-300 font-bold italic tracking-wide">Standard Operations</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Footer */}
                    <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Commission</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {member.commission_percentage}
                                </span>
                                <span className="text-base font-black text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                <CalendarDays className="w-3.5 h-3.5" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Since</p>
                            </div>
                            <p className="text-sm font-black text-slate-900">
                                {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/reports")} className="mt-2 h-7 px-2 text-[10px] font-black text-accent hover:bg-accent/5 gap-1 group/btn">
                                ANALYTICS <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <EditStaffDialog
                member={member}
                onSuccess={() => {
                    setEditOpen(false);
                    onUpdateSuccess?.();
                }}
                isOpen={editOpen}
                onOpenChange={setEditOpen}
            />
        </motion.div>
    );
}
