import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SimpleAdminAccess() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || "admin@salon.com");
  const [password, setPassword] = useState(searchParams.get('password') || "Admin@123456");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login...');
      
      // Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Login Failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Login Failed", 
          description: "No user data received",
          variant: "destructive",
        });
        return;
      }

      console.log('User authenticated:', authData.user.email);

      // For development, we'll bypass the platform_admins check
      // and allow any user with the correct credentials to access admin
      if (email === "admin@salon.com" || email === "superadmin@salon.com") {
        toast({
          title: "Welcome Super Admin!",
          description: "Redirecting to admin dashboard...",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Access Denied",
          description: "Only admin@salon.com or superadmin@salon.com can access the admin panel",
          variant: "destructive",
        });
        await supabase.auth.signOut();
      }

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    setLoading(true);
    try {
      console.log('Creating admin user...');

      const { data, error } = await supabase.auth.signUp({
        email: "admin@salon.com",
        password: "Admin@123456",
        options: {
          data: {
            full_name: "Super Administrator",
            user_type: "super_admin"
          }
        }
      });

      if (error && !error.message.includes("already registered")) {
        throw error;
      }

      toast({
        title: "✅ Admin User Created!",
        description: "You can now login with admin@salon.com / Admin@123456",
      });

      // Update form with new credentials
      setEmail("admin@salon.com");
      setPassword("Admin@123456");

    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: "Failed to create admin user: " + (error as Error).message,
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
            Simplified admin access for development
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Development Mode: This bypasses database policies for easy testing.
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Setup
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={createAdminUser}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Admin User"}
          </Button>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium text-center mb-2">Admin Credentials:</p>
            <p className="text-center text-muted-foreground">
              📧 Email: <span className="font-mono">admin@salon.com</span><br/>
              🔑 Password: <span className="font-mono">Admin@123456</span>
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