import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, Store, LogOut, User, BarChart3, Users, Calendar, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";

const SalonOwnerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, login } = useAuth();

  // Redirect ONLY if already logged in as a salon owner or staff/manager
  useEffect(() => {
    if (!authLoading && user) {
      if (user.user_type === 'salon_owner' || user.salon_role === 'owner' || user.salon_role === 'staff' || user.salon_role === 'manager') {
        console.log("Team session verified, entering dashboard...");
        navigate("/dashboard");
      }
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
    <div className="min-h-screen bg-[#F2A93B] flex items-center justify-center p-4 selection:bg-black/10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Branding & Status */}
        <div className="hidden lg:block space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-accent/20">
                <Store className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-black tracking-tighter">NoamSkin <span className="bg-black text-white px-3 py-1 rounded-lg">Station</span></h1>
                <p className="text-black/60 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Local Registry Environment</p>
              </div>
            </div>
            <h2 className="text-6xl font-black text-black tracking-tighter leading-none">
              Control your saloon <br /> <span className="text-white">offline & faster.</span>
            </h2>
          </div>

          <div className="space-y-8">
            {protocols.map((protocol, index) => (
              <div key={index} className="flex items-center gap-6 group">
                <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <protocol.icon className="w-5 h-5 text-black/60 group-hover:text-black transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-black text-lg">{protocol.title}</h3>
                  <p className="text-black/60 text-sm font-medium">{protocol.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Node */}
        <Card className="w-full max-w-xl border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] bg-white/95 backdrop-blur-3xl rounded-[3rem] overflow-hidden border border-black/5">
          <CardHeader className="text-center pt-16 pb-8 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/20 blur-[100px] rounded-full -translate-y-1/2" />

            {!authLoading && user && !(user.user_type === 'salon_owner' || user.salon_role) && (
              <div className="mb-8 p-4 bg-[#F2A93B]/10 border border-[#F2A93B]/20 rounded-2xl animate-fade-in">
                <p className="text-[#F2A93B] text-sm font-bold mb-3 flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  Currently logged in as {user.user_type}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('auth_token');
                    window.location.reload();
                  }}
                  className="h-10 bg-black/5 border-black/10 text-black hover:bg-black/10 rounded-xl font-bold px-6"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out to Login as Team Member
                </Button>
              </div>
            )}

            {!authLoading && user && (user.salon_role === 'staff' || user.salon_role === 'manager') && (
              <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in">
                <p className="text-emerald-500 text-sm font-bold mb-1 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Authenticated as {user.salon_role?.toUpperCase()}
                </p>
                <p className="text-black/40 text-[10px] font-bold uppercase tracking-widest mb-3 text-center">Your terminal session is ready.</p>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-bold px-6 w-full"
                >
                  Enter Dashboard
                </Button>
              </div>
            )}

            <div className="w-20 h-20 bg-[#F2A93B] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#F2A93B]/40 relative z-10">
              <Store className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-4xl font-black text-black tracking-tight relative z-10">Station Login</CardTitle>
            <CardDescription className="text-black/40 font-bold uppercase tracking-widest text-[10px] mt-2 relative z-10">Authenticated Management Access</CardDescription>
          </CardHeader>

          {(!user || (!(user.user_type === 'salon_owner' || user.salon_role))) && (
            <form onSubmit={handleLogin} className="pb-16 px-12">
              <CardContent className="space-y-8 px-0">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-black/40 tracking-[0.2em] ml-2">Registry Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@local.host"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-16 bg-slate-50 border-slate-100 text-black rounded-2xl font-bold px-6 focus:border-[#F2A93B]/50 focus:ring-[#F2A93B]/20 transition-all text-lg"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-black/40 tracking-[0.2em] ml-2">Access Key</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-16 bg-slate-50 border-slate-100 text-black rounded-2xl font-bold px-6 pr-14 focus:border-[#F2A93B]/50 focus:ring-[#F2A93B]/20 transition-all text-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#F2A93B] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-6 h-6" /> : <Eye className="h-6 h-6" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-8 px-0 mt-10">
                <Button
                  type="submit"
                  className="w-full h-20 bg-[#F2A93B] hover:bg-black hover:text-white text-black rounded-3xl font-black text-xl shadow-2xl shadow-[#F2A93B]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                  <div className="h-px bg-slate-100 w-full relative">
                    <span className="absolute inset-x-0 -top-2 flex justify-center">
                      <span className="bg-white px-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">Network Options</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/signup" className="h-14 rounded-2xl border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400 hover:bg-slate-50 hover:text-black transition-all uppercase tracking-widest">
                      Join Registry
                    </Link>
                    <Link to="/login" className="h-14 rounded-2xl border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400 hover:bg-slate-50 hover:text-black transition-all uppercase tracking-widest">
                      Client Portal
                    </Link>
                  </div>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SalonOwnerLogin;
