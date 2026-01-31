import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, User, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DirectAdminAccess() {
  const [email, setEmail] = useState("admin@salon.com");
  const [password, setPassword] = useState("Admin@123456");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const directLogin = () => {
    setLoading(true);
    
    // Simple credential check - bypass all database issues
    if (email === "admin@salon.com" && password === "Admin@123456") {
      toast({
        title: "✅ Login Successful!",
        description: "Redirecting to admin dashboard...",
      });
      
      // Set bypass mode
      localStorage.setItem('admin-bypass', 'true');
      
      // Direct redirect to admin panel
      setTimeout(() => {
        navigate("/admin");
      }, 1000);
    } else if (email === "test@admin.com" && password === "admin123") {
      toast({
        title: "✅ Test Login Successful!",
        description: "Redirecting to admin dashboard...",
      });
      
      // Set bypass mode
      localStorage.setItem('admin-bypass', 'true');
      
      setTimeout(() => {
        navigate("/admin");
      }, 1000);
    } else {
      toast({
        title: "❌ Invalid Credentials",
        description: "Please use the correct admin credentials",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const useTestCredentials = () => {
    setEmail("test@admin.com");
    setPassword("admin123");
  };

  const useMainCredentials = () => {
    setEmail("admin@salon.com");
    setPassword("Admin@123456");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Direct Admin Access</CardTitle>
          <p className="text-muted-foreground">
            Bypass method - No database required
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This method bypasses all authentication issues and gives direct admin access.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button 
              onClick={directLogin} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Direct Admin Access"}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Credential Options:</p>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={useMainCredentials}
                className="text-xs"
              >
                Use: admin@salon.com / Admin@123456
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={useTestCredentials}
                className="text-xs"
              >
                Use: test@admin.com / admin123
              </Button>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm">
            <p className="font-medium text-green-800 mb-1">Valid Credentials:</p>
            <div className="space-y-1 text-green-700">
              <div>📧 admin@salon.com | 🔑 Admin@123456</div>
              <div>📧 test@admin.com | 🔑 admin123</div>
            </div>
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
