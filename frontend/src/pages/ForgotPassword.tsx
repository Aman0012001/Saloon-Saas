import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { toast } = useToast();

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        try {
            await api.auth.forgotPassword(email.trim());
            setSubmitted(true);
            toast({
                title: "Request Sent",
                description: "If an account exists with this email, you will receive reset instructions.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to process request",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Aura */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden border border-white/40">
                    <CardHeader className="text-center pt-12 pb-8">
                        <Link to="/" className="flex justify-center mb-6">
                            <img src={logo} alt="Saloon Logo" className="h-16 w-auto" />
                        </Link>
                        <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">Forgot Access?</CardTitle>
                        <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">Recover Your Business Identity</CardDescription>
                    </CardHeader>

                    {submitted ? (
                        <CardContent className="px-10 pb-12 pt-4 text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                                <MailCheck className="w-10 h-10 text-emerald-500" />
                            </div>
                            <p className="text-slate-600 font-medium">
                                Instructions have been dispatched to <span className="font-bold text-slate-900">{email}</span>. Please verify your inbox to proceed.
                            </p>
                            <Button asChild className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black">
                                <Link to="/login">RETURN TO SIGN IN</Link>
                            </Button>
                        </CardContent>
                    ) : (
                        <form onSubmit={handleForgotPassword}>
                            <CardContent className="space-y-6 px-10">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registered Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@business.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 shadow-inner"
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-6 px-10 pb-12 pt-8">
                                <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-900/20 transition-all transform hover:scale-[1.01]" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                            DISPATCHING...
                                        </>
                                    ) : (
                                        "SEND RESET LINK"
                                    )}
                                </Button>
                                <div className="text-center">
                                    <Link to="/login" className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center hover:text-accent transition-colors">
                                        <ArrowLeft className="w-3 h-3 mr-2" /> Back to Log In
                                    </Link>
                                </div>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
