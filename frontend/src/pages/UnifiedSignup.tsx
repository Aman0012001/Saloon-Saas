import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, Store, User, Mail, Lock, Phone, Sparkles } from "lucide-react";
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

type SignupType = "customer" | "salon_owner";

const UnifiedSignup = () => {
    const [signupType, setSignupType] = useState<SignupType>("customer");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [countryCode, setCountryCode] = useState("+60");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [salonName, setSalonName] = useState("");
    const [salonSlug, setSalonSlug] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { signUp } = useAuth();

    const updateSlug = (name: string) => {
        setSalonName(name);
        if (!salonSlug || salonSlug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
            setSalonSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !email.trim() || !password.trim()) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        if (signupType === "salon_owner" && !salonName.trim()) {
            toast({
                title: "Error",
                description: "Salon brand name is mandatory",
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const fullPhone = phone ? `${countryCode}${phone}` : "";
            const extraData: any = {
                phone: fullPhone,
                user_type: signupType
            };

            if (signupType === "salon_owner") {
                extraData.salon_name = salonName.trim();
                extraData.salon_slug = salonSlug.trim() || undefined;
            }

            await signUp(email.trim(), password, fullName.trim(), extraData);

            if (signupType === "salon_owner") {
                toast({
                    title: "Station Registered!",
                    description: "Your salon has been initialized. Please wait for super admin approval.",
                });
                navigate("/dashboard");
            } else {
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
            }
        } catch (error: any) {
            console.error("Signup error:", error);
            toast({
                title: "Enrollment Failed",
                description: error.message || "Could not initialize account",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex flex-col pt-24">
            <Navbar />
            <div className="flex-grow flex items-center justify-center p-4 py-12">
                <Card className="w-full max-w-xl border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl rounded-[3rem] overflow-hidden border border-white/40">
                    <CardHeader className="text-center pt-12 pb-8">
                        <Link to="/" className="flex justify-center mb-6">
                            <img src={logo} alt="Salon Logo" className="h-14 w-auto" />
                        </Link>
                        <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">
                            {signupType === "customer" ? "Join the Network" : "Partner Enrollment"}
                        </CardTitle>
                        <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">
                            {signupType === "customer" ? "Create your premium customer profile" : "Initialize your local management node"}
                        </CardDescription>
                    </CardHeader>

                    {/* Signup Type Toggle */}
                    <div className="px-10 pb-6">
                        <div className="flex gap-3 p-2 bg-slate-100 rounded-[2rem]">
                            <button
                                type="button"
                                onClick={() => setSignupType("customer")}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-[1.5rem] font-black text-sm uppercase tracking-tight transition-all ${signupType === "customer"
                                    ? "bg-white text-slate-900 shadow-lg"
                                    : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                Customer Account
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignupType("salon_owner")}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-[1.5rem] font-black text-sm uppercase tracking-tight transition-all ${signupType === "salon_owner"
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                                    : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                <Store className="w-4 h-4" />
                                Salon Partner
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSignup} className="px-10 pb-12">
                        <CardContent className="space-y-6 px-0">
                            {/* Salon Owner Badge */}
                            {signupType === "salon_owner" && (
                                <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-[2rem]">
                                    <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                                        <Store className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-sm uppercase tracking-tighter">Business Console Mode</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Exclusive Salon Owner access</p>
                                    </div>
                                </div>
                            )}

                            {/* Common Fields */}
                            <div className={signupType === "salon_owner" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
                                        <User className="w-3 h-3" />
                                        {signupType === "salon_owner" ? "Owner Name *" : "Full Name"}
                                    </Label>
                                    <Input
                                        placeholder={signupType === "salon_owner" ? "John Doe" : "Enter your name"}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 shadow-inner"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
                                        <Mail className="w-3 h-3" />
                                        {signupType === "salon_owner" ? "Business Email *" : "Email Address"}
                                    </Label>
                                    <Input
                                        type="email"
                                        placeholder={signupType === "salon_owner" ? "john@salon.com" : "name@example.com"}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 shadow-inner"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
                                    <Phone className="w-3 h-3" />
                                    {signupType === "salon_owner" ? "Contact Number" : "Phone (Optional)"}
                                </Label>
                                <div className="flex gap-2">
                                    <Select value={countryCode} onValueChange={setCountryCode}>
                                        <SelectTrigger className="w-[110px] h-14 bg-slate-50 border-none rounded-2xl font-bold px-4 shadow-inner">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl bg-white">
                                            {countryCodes.map((c) => (
                                                <SelectItem key={`${c.country}-${c.code}`} value={c.code} className="font-bold py-3 rounded-xl focus:bg-accent/10 cursor-pointer">
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

                            {/* Salon Owner Specific Fields */}
                            {signupType === "salon_owner" && (
                                <div className="p-1 bg-accent/10 rounded-[2rem]">
                                    <div className="bg-white rounded-[1.8rem] p-6 space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Sparkles className="w-5 h-5 text-accent" />
                                            <p className="font-black text-slate-900">Salon Identity</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Salon Brand Name *</Label>
                                            <Input
                                                placeholder="e.g. Noir Grooming Lounge"
                                                value={salonName}
                                                onChange={(e) => updateSlug(e.target.value)}
                                                className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5"
                                                required
                                            />
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* Password Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5">
                                        <Lock className="w-3 h-3" />
                                        {signupType === "salon_owner" ? "Login Pass *" : "Password"}
                                    </Label>
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
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                                        {signupType === "salon_owner" ? "Confirm Pass *" : "Confirm Identity"}
                                    </Label>
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

                        <CardFooter className="flex flex-col gap-6 px-0 pt-8 mt-4">
                            <Button
                                type="submit"
                                className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-900/10 transition-all transform hover:scale-[1.01]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        {signupType === "salon_owner" ? "PROVISIONING NODE..." : "REGISTERING..."}
                                    </>
                                ) : (
                                    signupType === "salon_owner" ? "INITIALIZE MANAGEMENT STATION" : "CREATE ACCOUNT"
                                )}
                            </Button>

                            <div className="text-center space-y-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[80%] mx-auto leading-relaxed">
                                    By creating an account, you agree to our{" "}
                                    <Link to="/terms" className="text-slate-600 underline">Terms of Service</Link> and{" "}
                                    <Link to="/privacy" className="text-slate-600 underline">Privacy Policy</Link>
                                </p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    {signupType === "salon_owner" ? "Existing Partner?" : "Already a member?"}{" "}
                                    <Link to="/login" className="text-accent underline font-black">
                                        {signupType === "salon_owner" ? "Access Dashboard" : "Sign In"}
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

export default UnifiedSignup;
