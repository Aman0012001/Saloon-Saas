import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, User } from "lucide-react";

export default function AdminAccess() {
  const [email, setEmail] = useState("superadmin@salon.com");
  const [password, setPassword] = useState("SuperAdmin@2024");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with:', { email });
      
      // Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Auth response:', { authData, authError });

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

      console.log('User authenticated, checking admin status for user:', authData.user.id);

      // Check if user is a super admin
      const { data: adminData, error: adminError } = await supabase
        .from('platform_admins')
        .select('id, is_active')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Admin check response:', { adminData, adminError });

      if (adminError) {
        console.error('Error checking admin status:', adminError);
        
        // If it's an RLS error, try to create the admin record
        if (adminError.message.includes('RLS') || adminError.message.includes('policy')) {
          console.log('RLS policy blocking access, attempting to create admin record...');
          
          // Try to insert the admin record directly
          const { data: insertData, error: insertError } = await supabase
            .from('platform_admins')
            .insert({
              user_id: authData.user.id,
              is_active: true
            })
            .select()
            .single();

          console.log('Admin insert attempt:', { insertData, insertError });

          if (insertError) {
            toast({
              title: "Access Setup Failed",
              description: "Could not setup admin access. Please run database setup first.",
              variant: "destructive",
            });
            return;
          }

          // If insert succeeded, continue with login
          console.log('Admin record created successfully');
        } else {
          toast({
            title: "Access Check Failed",
            description: "Could not verify admin status: " + adminError.message,
            variant: "destructive",
          });
          return;
        }
      } else if (!adminData) {
        console.log('User is not a super admin, attempting to create admin record...');
        
        // Try to create admin record
        const { data: insertData, error: insertError } = await supabase
          .from('platform_admins')
          .insert({
            user_id: authData.user.id,
            is_active: true
          })
          .select()
          .single();

        console.log('Admin creation attempt:', { insertData, insertError });

        if (insertError) {
          toast({
            title: "Access Denied",
            description: "You don't have super admin privileges and cannot create admin access.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return;
        }
      }

      console.log('Super admin verified, redirecting...');
      toast({
        title: "Welcome Super Admin!",
        description: "Redirecting to admin dashboard...",
      });

      // Redirect to admin dashboard
      navigate("/admin");

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

  const createTestAdmin = async () => {
    setLoading(true);
    try {
      // Create super admin with predefined credentials
      const adminEmail = "superadmin@salon.com";
      const adminPassword = "SuperAdmin@2024";

      console.log('Creating super admin account...');

      // Try to sign up the super admin
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: "Super Administrator",
            user_type: "super_admin"
          }
        }
      });

      console.log('SignUp response:', { signUpData, signUpError });

      if (signUpError && !signUpError.message.includes("already registered")) {
        console.error('SignUp error:', signUpError);
        throw signUpError;
      }

      let userId = signUpData?.user?.id;

      // If user already exists, try to sign in to get user ID
      if (signUpError?.message.includes("already registered")) {
        console.log('User already exists, signing in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });

        console.log('SignIn response:', { signInData, signInError });

        if (signInError) {
          console.error('SignIn error:', signInError);
          throw signInError;
        }
        userId = signInData.user.id;
      }

      if (userId) {
        console.log('Adding user to platform_admins table:', userId);
        
        // Add to platform_admins table
        const { data: adminInsertData, error: adminError } = await supabase
          .from('platform_admins')
          .upsert({
            user_id: userId,
            is_active: true
          }, {
            onConflict: 'user_id'
          });

        console.log('Admin insert response:', { adminInsertData, adminError });

        if (adminError) {
          console.error('Error adding admin privileges:', adminError);
          throw adminError;
        }

        // Verify the admin was created
        const { data: verifyData, error: verifyError } = await supabase
          .from('platform_admins')
          .select('*')
          .eq('user_id', userId);

        console.log('Admin verification:', { verifyData, verifyError });
      }

      toast({
        title: "✅ Super Admin Created Successfully!",
        description: "Credentials are ready to use. You can now login.",
      });

      // Auto-fill the form
      setEmail(adminEmail);
      setPassword(adminPassword);

    } catch (error) {
      console.error('Error creating super admin:', error);
      toast({
        title: "Error",
        description: "Failed to create super admin: " + (error as Error).message,
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
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
                  placeholder="Enter your password"
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
                Development Only
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={createTestAdmin}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Super Admin Account"}
          </Button>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium text-center mb-2">Super Admin Credentials:</p>
            <p className="text-center text-muted-foreground">
              📧 Email: <span className="font-mono">superadmin@salon.com</span><br/>
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
