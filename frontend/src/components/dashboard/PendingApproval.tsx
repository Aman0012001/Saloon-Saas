import { motion } from "framer-motion";
import { ShieldAlert, Clock, CheckCircle2, ArrowRight, Store, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PendingApprovalProps {
    salonName: string;
}

export const PendingApproval = ({ salonName }: PendingApprovalProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-8 max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center relative z-10">
                    <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg z-20">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                </div>
            </motion.div>

            <div className="space-y-3">
                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                    Registration Status: Pending Review
                </Badge>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic">
                    Dossier Under Verification
                </h2>
                <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
                    Your salon <span className="text-slate-900 font-black">"{salonName}"</span> is being reviewed by our super admin network.
                </p>
            </div>

            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] bg-white rounded-[2.5rem] overflow-hidden w-full">
                <CardContent className="p-8 space-y-6 text-left">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl group border border-slate-100/50">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">Digital Identity Validated</p>
                            <p className="text-[11px] font-medium text-slate-400">Your owner credentials have been archived.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl group border border-amber-100/50">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Lock className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">Console Locked</p>
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider font-black text-amber-600">Waiting for super admin activation</p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <p className="text-xs text-slate-400 font-bold leading-relaxed text-center">
                            Typically, registrations are approved within 2–4 hours. You will receive an encrypted notification once your station is fully operational. For any issues or assistance during this process, please contact the administrator on this number <span className="text-slate-900">011 23198819</span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <Button variant="ghost" className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all tracking-tight uppercase text-xs" onClick={() => window.location.reload()}>
                    Refresh Status
                </Button>
            </div>
        </div>
    );
};
