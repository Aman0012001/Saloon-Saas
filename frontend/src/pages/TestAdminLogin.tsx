import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Shield, Lock, User } from "lucide-react";

export default function TestAdminLogin() {
  const [email, setEmail] = useState("test@admin.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting local login process...');
      console.log('Email:', email);

      const data = await api.auth.login(email, password);

      console.log('Login result:', data);

      if (!data.user) {
        toast({
          title: "Login Failed",
          description: "No user data received from local backend",
          variant: "destructive",
        });
        return;
      }

      console.log('Login successful! User:', data.user.email);

      toast({
        title: "Login Successful!",
        description: "Redirecting to admin panel...",
      });

      // Redirect to admin panel
      setTimeout(() => {
        navigate("/admin");
      }, 1000);

    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: error.message || "Could not sync with local MySQL instance.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      console.log('Testing local backend connection...');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/backend/api'}/`);
      const data = await response.json();

      console.log('Connection test result:', data);

      if (data.data?.status === 'online') {
        toast({
          title: "Connection Successful!",
          description: "Local PHP API is working correctly",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Backend responded but status is not online",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast({
        title: "Connection Error",
        description: "Could not reach the local backend server.",
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
          <CardTitle className="text-2xl">Test Admin Login</CardTitle>
          <p className="text-muted-foreground">
            Debug version with detailed logging
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={testConnection}
            disabled={loading}
          >
            Test Database Connection
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Login
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="test@admin.com"
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
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Test Login"}
            </Button>
          </form>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium text-center mb-2">Test Credentials:</p>
            <p className="text-center text-muted-foreground">
              📧 Email: <span className="font-mono">test@admin.com</span><br />
              🔑 Password: <span className="font-mono">admin123</span>
            </p>
            <p className="text-xs text-center mt-2 text-muted-foreground">
              Check browser console for detailed logs
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
