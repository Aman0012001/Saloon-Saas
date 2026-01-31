import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function DebugSupabase() {
  const [status, setStatus] = useState<{
    connection: 'checking' | 'success' | 'error';
    auth: 'checking' | 'success' | 'error';
    database: 'checking' | 'success' | 'error';
    envVars: 'checking' | 'success' | 'error';
    details: any;
  }>({
    connection: 'checking',
    auth: 'checking', 
    database: 'checking',
    envVars: 'checking',
    details: {}
  });

  useEffect(() => {
    checkSupabase();
  }, []);

  const checkSupabase = async () => {
    const results: any = {};

    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    results.envVars = {
      url: supabaseUrl ? '✅ Set' : '❌ Missing',
      key: supabaseKey ? '✅ Set' : '❌ Missing',
      urlValue: supabaseUrl,
      keyLength: supabaseKey ? supabaseKey.length : 0
    };

    // Test basic connection
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      results.connection = error ? 'error' : 'success';
      results.connectionDetails = { data, error: error?.message };
    } catch (error) {
      results.connection = 'error';
      results.connectionDetails = { error: (error as Error).message };
    }

    // Test auth
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      results.auth = error ? 'error' : 'success';
      results.authDetails = { 
        session: session ? 'Active session' : 'No session',
        error: error?.message 
      };
    } catch (error) {
      results.auth = 'error';
      results.authDetails = { error: (error as Error).message };
    }

    // Test database tables
    try {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('count')
        .limit(1);
      
      results.database = error ? 'error' : 'success';
      results.databaseDetails = { 
        platformAdmins: error ? error.message : 'Table accessible',
        data 
      };
    } catch (error) {
      results.database = 'error';
      results.databaseDetails = { error: (error as Error).message };
    }

    setStatus({
      connection: results.connection,
      auth: results.auth,
      database: results.database,
      envVars: results.envVars.url.includes('✅') && results.envVars.key.includes('✅') ? 'success' : 'error',
      details: results
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500">OK</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">Checking...</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Supabase Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={checkSupabase} className="w-full">
              Refresh Status
            </Button>

            {/* Environment Variables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Environment Variables</span>
                {getStatusBadge(status.envVars)}
              </div>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                <div>VITE_SUPABASE_URL: {status.details.envVars?.url}</div>
                <div>VITE_SUPABASE_PUBLISHABLE_KEY: {status.details.envVars?.key}</div>
                {status.details.envVars?.urlValue && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    URL: {status.details.envVars.urlValue}
                  </div>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Database Connection</span>
                {getStatusBadge(status.connection)}
              </div>
              <div className="bg-muted p-3 rounded text-sm">
                <pre>{JSON.stringify(status.details.connectionDetails, null, 2)}</pre>
              </div>
            </div>

            {/* Auth Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Authentication</span>
                {getStatusBadge(status.auth)}
              </div>
              <div className="bg-muted p-3 rounded text-sm">
                <pre>{JSON.stringify(status.details.authDetails, null, 2)}</pre>
              </div>
            </div>

            {/* Database Tables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Database Tables</span>
                {getStatusBadge(status.database)}
              </div>
              <div className="bg-muted p-3 rounded text-sm">
                <pre>{JSON.stringify(status.details.databaseDetails, null, 2)}</pre>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="font-medium">Quick Actions</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.open('/admin-access', '_blank')}>
                  Try Admin Access
                </Button>
                <Button variant="outline" onClick={() => window.open('/test-admin', '_blank')}>
                  Try Test Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
