import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, Sparkles, User, Mail, Lock, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import Navbar from "@/components/Navbar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { countryCodes } from "@/utils/countryCodes";

const CustomerSignup = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [countryCode, setCountryCode] = useState("+60");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { signUp } = useAuth();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !email.trim() || !password.trim()) {
            toast({
                title: "Information Required",
                description: "Please provide your name, email and a secure password.",
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "The confirmation password does not match.",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Weak Password",
                description: "For your security, please use at least 6 characters.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const fullPhone = phone ? `${countryCode}${phone}` : "";
            const extraData = {
                phone: fullPhone,
                user_type: 'customer'
            };

            await signUp(email.trim(), password, fullName.trim(), extraData);

            toast({
                title: "Account Created!",
                description: "Welcome to the elite grooming network.",
            });

            // Redirect back to booking if we came from there
            const salonId = searchParams.get("salonId");
            if (salonId) {
                navigate(`/book?salonId=${salonId}`);
            } else {
                navigate("/");
            }
        } catch (error: any) {
            console.error("Signup error:", error);
            toast({
                title: "Registration Failed",
                description: error.message || "We encountered a glitch while setting up your account.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex flex-col pt-24">
            <Navbar />
            <div className="flex-grow flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl rounded-[3rem] overflow-hidden border border-white/40">
                    <CardHeader className="text-center pt-12 pb-8">
                        <div className="flex justify-center mb-6">
                            <img src={logo} alt="Salon Logo" className="h-14 w-auto" />
                        </div>
                        <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">Join the Network</CardTitle>
                        <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">Create your premium customer profile</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignup}>
                        <CardContent className="space-y-6 px-10">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5"><User className="w-3 h-3" /> Full Name</Label>
                                <Input
                                    placeholder="Enter your name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Address</Label>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone (Optional)</Label>
                                <div className="flex gap-2">
                                    <Select value={countryCode} onValueChange={setCountryCode}>
                                        <SelectTrigger className="w-[110px] h-14 bg-slate-50 border-none rounded-2xl font-bold px-4 shadow-inner focus:ring-accent/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl bg-white">
                                            {countryCodes.map((c) => (
                                                <SelectItem key={`${c.country}-${c.code}`} value={c.code} className="font-bold py-3 rounded-xl focus:bg-accent/10">
                                                    <span className="flex items-center gap-2">
                                                        <span>{c.flag}</span>
                                                        <span>{c.code}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="tel"
                                        placeholder="000 000 0000"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 shadow-inner flex-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Password</Label>
                                    <div className="relative">
                                        <Input
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
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirm Identity</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 shadow-inner"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-6 px-10 pb-12 pt-8">
                            <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-lg shadow-2xl transition-all transform hover:scale-[1.01]" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        REGISTERING...
                                    </>
                                ) : (
                                    "CREATE ACCOUNT"
                                )}
                            </Button>
                            <div className="text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    Already a member?{" "}
                                    <Link to="/login" className="text-accent underline font-black">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default CustomerSignup;
