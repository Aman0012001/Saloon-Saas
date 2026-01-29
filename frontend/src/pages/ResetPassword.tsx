import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const { toast } = useToast();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast({
                title: "Invalid Request",
                description: "Missing reset token. Please request a new link.",
                variant: "destructive",
            });
            navigate("/forgot-password");
        }
    }, [token, navigate, toast]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await api.auth.resetPassword(token as string, password);
            setSuccess(true);
            toast({
                title: "Identity Restored",
                description: "Your access pass has been updated successfully.",
            });
            setTimeout(() => navigate("/login"), 3000);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to reset password",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Aura */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full translate-y-1/2 translate-x-1/2" />

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
                        <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">Access Renew</CardTitle>
                        <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">Initialize Your New Digital Pass</CardDescription>
                    </CardHeader>

                    {success ? (
                        <CardContent className="px-10 pb-12 pt-4 text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            </div>
                            <p className="text-slate-600 font-medium italic">
                                Reset successful. Redirecting to security gate...
                            </p>
                            <Button asChild className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black">
                                <Link to="/login">PROCEED TO SIGN IN</Link>
                            </Button>
                        </CardContent>
                    ) : (
                        <form onSubmit={handleResetPassword}>
                            <CardContent className="space-y-6 px-10">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">New Access Pass</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 pr-12 shadow-inner"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirm Access Pass</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                            UPDATING IDENTITY...
                                        </>
                                    ) : (
                                        "RE-INITIALIZE PASS"
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
