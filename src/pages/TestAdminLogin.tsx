import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
      console.log('Starting login process...');
      console.log('Email:', email);
      console.log('Supabase client:', supabase);

      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      console.log('Supabase connection test:', { testData, testError });

      if (testError) {
        toast({
          title: "Database Connection Failed",
          description: testError.message,
          variant: "destructive",
        });
        return;
      }

      // Try to sign in
      console.log('Attempting authentication...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Auth result:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        
        // If user doesn't exist, try to create it
        if (authError.message.includes('Invalid login credentials')) {
          console.log('User not found, creating new user...');
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: "Test Admin",
                user_type: "admin"
              }
            }
          });

          console.log('SignUp result:', { signUpData, signUpError });

          if (signUpError) {
            toast({
              title: "Account Creation Failed",
              description: signUpError.message,
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Account Created!",
            description: "New admin account created. Try logging in again.",
          });
          return;
        }

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

      console.log('Login successful! User:', authData.user.email);
      
      toast({
        title: "Login Successful!",
        description: "Redirecting to admin panel...",
      });

      // Redirect to admin panel
      setTimeout(() => {
        navigate("/admin");
      }, 1000);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      console.log('Testing Supabase connection...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      console.log('Connection test result:', { data, error });

      if (error) {
        toast({
          title: "Connection Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Successful!",
          description: "Supabase is working correctly",
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast({
        title: "Connection Error",
        description: (error as Error).message,
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
              📧 Email: <span className="font-mono">test@admin.com</span><br/>
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