import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, Store, BarChart3, Users, Calendar, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";

const SalonOwnerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      console.log("Session verified, entering station dashboard...");
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing Credentials",
        description: "Please provide both digital identity and access pass.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Attempt local authentication
      await login(email.trim(), password);

      // 2. Success message
      toast({
        title: "Access Logged",
        description: `Welcome back to the local control center.`,
      });

      // 3. Force redirection
      console.log("Authentication successful, forcing navigation to dashboard");
      navigate("/dashboard", { replace: true });

    } catch (error: any) {
      console.error("Local login failed:", error);
      toast({
        title: "Access Denied",
        description: error.message || "Failed to sync with local MySQL records. Check your credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const protocols = [
    {
      icon: BarChart3,
      title: "Isolated Analytics",
      description: "Direct real-time metrics from your private MySQL node."
    },
    {
      icon: Calendar,
      title: "registry.Local",
      description: "Encrypted appointment management within your network."
    },
    {
      icon: ShieldCheck,
      title: "Station Security",
      description: "Session persistence managed via local JWT protocols."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-accent/30">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Branding & Status */}
        <div className="hidden lg:block space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-accent/20">
                <Store className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">NoamSkin <span className="text-accent underline decoration-4 underline-offset-8">Station</span></h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Local Registry Environment</p>
              </div>
            </div>
            <h2 className="text-6xl font-black text-white tracking-tighter leading-none">
              Control your saloon <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-white">offline & faster.</span>
            </h2>
          </div>

          <div className="space-y-8">
            {protocols.map((protocol, index) => (
              <div key={index} className="flex items-center gap-6 group">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <protocol.icon className="w-5 h-5 text-slate-400 group-hover:text-accent transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{protocol.title}</h3>
                  <p className="text-slate-500 text-sm font-medium">{protocol.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Node */}
        <Card className="w-full border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] overflow-hidden border border-white/5 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full -mr-20 -mt-20" />

          <CardHeader className="text-center pt-14 pb-10">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center">
                <Store className="w-8 h-8 text-black" />
              </div>
            </div>
            <CardTitle className="text-4xl font-black text-white tracking-tight">System Login</CardTitle>
            <CardDescription className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mt-2">Authorization Required</CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin} className="pb-16 px-12">
            <CardContent className="space-y-8 px-0">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Registry Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@local.host"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-16 bg-black/40 border-slate-800 text-white rounded-2xl font-bold px-6 focus:border-accent/50 focus:ring-accent/20 transition-all text-lg"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Access Key</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-16 bg-black/40 border-slate-800 text-white rounded-2xl font-bold px-6 pr-14 focus:border-accent/50 focus:ring-accent/20 transition-all text-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-accent transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-6 h-6" /> : <Eye className="h-6 h-6" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-8 px-0 mt-10">
              <Button
                type="submit"
                className="w-full h-20 bg-accent hover:bg-white text-black rounded-3xl font-black text-xl shadow-2xl shadow-accent/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    AUTHORIZING...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-3 h-6 w-6" />
                    ACCESS DASHBOARD
                  </>
                )}
              </Button>

              <div className="space-y-6">
                <div className="h-px bg-slate-800 w-full relative">
                  <span className="absolute inset-x-0 -top-2 flex justify-center">
                    <span className="bg-slate-900 px-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Network Options</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Link to="/signup" className="h-14 rounded-2xl border border-slate-800 flex items-center justify-center text-xs font-black text-slate-400 hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest">
                    Join Registry
                  </Link>
                  <Link to="/login" className="h-14 rounded-2xl border border-slate-800 flex items-center justify-center text-xs font-black text-slate-400 hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest">
                    Client Portal
                  </Link>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SalonOwnerLogin;