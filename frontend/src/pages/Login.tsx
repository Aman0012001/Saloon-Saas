import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Credentials missing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);

      // Get the current user to check user type
      const userData = await api.auth.getCurrentUser();
      const userType = userData?.user?.user_type;
      const salonRole = userData?.user?.salon_role;

      toast({
        title: "Session Established",
        description: "Accessing local management console...",
      });

      // Redirect based on user type and salon role
      if (userType === 'admin') {
        navigate("/admin");
      } else if (userType === 'salon_owner' || salonRole === 'owner' || salonRole === 'staff' || salonRole === 'manager') {
        navigate("/dashboard");
      } else if (userType === 'customer') {
        navigate("/client-hub");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      let errorTitle = "Access Denied";
      let errorMessage = error.message || "Invalid digital signature";

      if (error.message?.includes("WAITING_APPROVAL") || error.message?.includes("waiting for approval")) {
        errorTitle = "Approval Pending";
        errorMessage = "Your salon account is waiting for approval by the Super Admin. Please check back later.";
      } else if (error.message?.includes("REJECTED")) {
        errorTitle = "Registration Rejected";
        errorMessage = "Your salon registration was not approved. Please contact support.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: error.message?.includes("WAITING_APPROVAL") ? "default" : "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Aura */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <Card className="w-full max-w-md border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden border border-white/40">
        <CardHeader className="text-center pt-12 pb-8">
          <Link to="/" className="flex justify-center mb-6">
            <img src={logo} alt="Saloon Logo" className="h-16 w-auto" />
          </Link>
          <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">Sign In</CardTitle>
          <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-2">Secure Access to Your Account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 px-10">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Identifier (Email)</Label>
              <Input
                id="email"
                type="email"
                placeholder="owner@saloon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-5 shadow-inner"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Access Pass</Label>
                <Link to="/forgot-password" className="text-[10px] font-black uppercase text-accent tracking-widest hover:underline">Forgot?</Link>
              </div>
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
          </CardContent>
          <CardFooter className="flex flex-col gap-6 px-10 pb-12 pt-8">
            <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-900/20 transition-all transform hover:scale-[1.01]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  SYNCING...
                </>
              ) : (
                "ACCESS DASHBOARD"
              )}
            </Button>
            <div className="text-center space-y-4">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest max-w-[80%] mx-auto leading-relaxed">
                By signing in, you agree to our{" "}
                <Link to="/terms" className="text-slate-500 underline">Terms</Link> &{" "}
                <Link to="/privacy" className="text-slate-500 underline">Privacy Policy</Link>
              </p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                New Partner?{" "}
                <Link to="/signup" className="text-accent underline font-black">
                  Enroll Instance
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
