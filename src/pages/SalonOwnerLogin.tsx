import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, Store, BarChart3, Users, Calendar } from "lucide-react";
import logo from "@/assets/logo.png";
import { ensureUserProfile, makeSalonOwner } from "@/utils/databaseUtils";

const SalonOwnerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      console.log("User already logged in, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Check if user is a salon owner
      if (data.user) {
        // Ensure user profile exists
        let profile = await ensureUserProfile(data.user.id, 'salon_owner');

        // If profile creation failed, try to make existing user a salon owner
        if (!profile) {
          profile = await makeSalonOwner(data.user.id, {
            businessName: data.user.user_metadata?.business_name || 'My Salon'
          });
        }

        toast({
          title: "Welcome Back!",
          description: `Welcome to your salon dashboard`,
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track revenue, appointments, and business growth"
    },
    {
      icon: Calendar,
      title: "Appointment Management",
      description: "Manage bookings, schedules, and customer appointments"
    },
    {
      icon: Users,
      title: "Staff & Customer Management",
      description: "Organize your team and maintain customer relationships"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-sage/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Features */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">NoamSkin</h1>
                <p className="text-muted-foreground">Salon Owner Dashboard</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Manage Your Salon Business
            </h2>
            <p className="text-muted-foreground text-lg">
              Access your complete salon management dashboard with powerful tools to grow your business.
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="w-full border-border shadow-card">
          <CardHeader className="text-center">
            <div className="lg:hidden flex justify-center mb-4">
              <img src={logo} alt="Salon Logo" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold">Salon Owner Login</CardTitle>
            <CardDescription>Access your salon management dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to="/salon-owner/forgot-password"
                  className="text-sm text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full h-12 bg-accent hover:bg-accent/90 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Store className="mr-2 h-5 w-5" />
                    Access Dashboard
                  </>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Don't have a salon owner account?{" "}
                  <Link to="/dashboard/create-salon" className="text-accent hover:underline font-medium">
                    Start free trial
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  Looking to book appointments?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Customer login
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

export default SalonOwnerLogin;