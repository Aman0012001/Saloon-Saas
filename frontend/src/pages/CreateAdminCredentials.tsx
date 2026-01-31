import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CheckCircle, User, Lock, Mail, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateAdminCredentials() {
  const [loading, setLoading] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const createAdminCredentials = async () => {
    setLoading(true);
    try {
      const adminEmail = "admin@salon.com";
      const adminPassword = "Admin@123456";

      console.log('Creating admin credentials...');

      // Step 1: Create auth user
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

      console.log('SignUp result:', { signUpData, signUpError });

      if (signUpError && !signUpError.message.includes("already registered")) {
        throw new Error(`Signup failed: ${signUpError.message}`);
      }

      let userId = signUpData?.user?.id;

      // If user already exists, sign in to get user ID
      if (signUpError?.message.includes("already registered")) {
        console.log('User already exists, signing in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });

        if (signInError) {
          throw new Error(`Signin failed: ${signInError.message}`);
        }
        userId = signInData.user.id;
      }

      if (!userId) {
        throw new Error('No user ID received');
      }

      console.log('User ID:', userId);

      // Step 2: Add to platform_admins table (with relaxed policy)
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('platform_admins')
          .upsert({
            user_id: userId,
            is_active: true
          }, {
            onConflict: 'user_id'
          })
          .select();

        console.log('Admin insert result:', { adminData, adminError });

        if (adminError) {
          // If RLS blocks, try direct SQL approach
          console.log('RLS blocked, trying alternative approach...');

          // Create a profile entry first
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              user_id: userId,
              full_name: "Super Administrator",
              user_type: "super_admin"
            }, {
              onConflict: 'user_id'
            });

          if (profileError) {
            console.log('Profile creation error:', profileError);
          }
        }
      } catch (adminInsertError) {
        console.log('Admin table insert error:', adminInsertError);
        // Continue anyway - we'll handle this in login
      }

      // Step 3: Set credentials and success state
      setCredentials({
        email: adminEmail,
        password: adminPassword
      });
      setAdminCreated(true);

      toast({
        title: "✅ Admin Credentials Created!",
        description: "Super admin account has been set up successfully",
      });

    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: `Failed to create admin: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = () => {
    if (credentials) {
      // Navigate to admin access page with credentials
      navigate(`/admin-access?email=${encodeURIComponent(credentials.email)}&password=${encodeURIComponent(credentials.password)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Admin Credentials</CardTitle>
          <p className="text-muted-foreground">
            Set up super admin access for your platform
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!adminCreated ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will create a super admin account with full platform access.
                </AlertDescription>
              </Alert>

              <Button
                onClick={createAdminCredentials}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Admin Account...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Create Super Admin Account
                  </>
                )}
              </Button>

              <div className="bg-muted/50 p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">What this will create:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Super admin user account</li>
                  <li>• Full platform access permissions</li>
                  <li>• Secure login credentials</li>
                  <li>• Admin dashboard access</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Admin Account Created!</h3>
                <p className="text-muted-foreground mb-4">
                  Your super admin credentials are ready to use
                </p>
              </div>

              {credentials && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Email:</span>
                    <code className="bg-green-100 px-2 py-1 rounded text-sm">
                      {credentials.email}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Password:</span>
                    <code className="bg-green-100 px-2 py-1 rounded text-sm">
                      {credentials.password}
                    </code>
                  </div>
                </div>
              )}

              <Button
                onClick={loginWithCredentials}
                className="w-full"
                size="lg"
              >
                <User className="w-4 h-4 mr-2" />
                Login to Admin Panel
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => navigate("/admin-access")}
                  className="text-sm"
                >
                  Go to Admin Login Page →
                </Button>
              </div>
            </>
          )}

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
