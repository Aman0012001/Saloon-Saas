import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

export default function SimpleAdminAccess() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || "superadmin@salon.com");
  const [password, setPassword] = useState(searchParams.get('password') || "SuperAdmin@2024");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting local admin login...');
      await login(email, password);

      toast({
        title: "Welcome Super Admin!",
        description: "Redirecting to admin dashboard...",
      });
      navigate("/admin");

    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials in local registry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Super Admin Access</CardTitle>
          <p className="text-muted-foreground">
            Enter your credentials to access the admin panel
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is for platform super administrators only.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="superadmin@salon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="SuperAdmin@2024"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Access Admin Panel"}
            </Button>
          </form>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium text-center mb-2">Super Admin Credentials:</p>
            <p className="text-center text-muted-foreground">
              📧 Email: <span className="font-mono">superadmin@salon.com</span><br />
              🔑 Password: <span className="font-mono">SuperAdmin@2024</span>
            </p>
          </div>

          <div className="text-center">
            <Button variant="link" onClick={() => navigate("/")} className="text-sm">
              ← Back to Website
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
