import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { debugDatabase, createSampleData, fixServicesWithoutSalon, ensureServicesForSalon } from "@/utils/debugDatabase";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

interface DatabaseState {
  salons: any[];
  services: any[];
  userRoles: any[];
  bookings: any[];
  currentUser: any;
  issues: {
    noSalons: boolean;
    noServices: boolean;
    servicesWithoutSalon: boolean;
    noUserRoles: boolean;
  };
}

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const { toast } = useToast();

  const checkDatabase = async () => {
    setLoading(true);
    try {
      const state = await debugDatabase();
      setDbState(state);
      
      if (state) {
        const issueCount = Object.values(state.issues).filter(Boolean).length;
        toast({
          title: "Database Check Complete",
          description: `Found ${issueCount} issue${issueCount !== 1 ? 's' : ''} that need attention.`,
          variant: issueCount > 0 ? "destructive" : "default",
        });
      }
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Could not check database state",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupSampleData = async () => {
    setSetupLoading(true);
    try {
      const success = await createSampleData();
      
      if (success) {
        toast({
          title: "Setup Complete!",
          description: "Sample salons and services have been created successfully.",
        });
        
        // Refresh database state
        await checkDatabase();
      } else {
        toast({
          title: "Setup Failed",
          description: "Could not create sample data. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "An error occurred during setup",
        variant: "destructive",
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const createServicesForAllSalons = async () => {
    setSetupLoading(true);
    try {
      // Get all salons
      const { data: salons, error: salonsError } = await supabase
        .from("salons")
        .select("id, name");
      
      if (salonsError || !salons) {
        throw new Error("Failed to fetch salons");
      }
      
      let successCount = 0;
      
      for (const salon of salons) {
        const success = await ensureServicesForSalon(salon.id);
        if (success) successCount++;
      }
      
      toast({
        title: "Services Created!",
        description: `Successfully created services for ${successCount}/${salons.length} salons.`,
      });
      
      // Refresh database state
      await checkDatabase();
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Could not create services for all salons. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const getStatusBadge = (hasIssue: boolean, label: string) => (
    <Badge variant={hasIssue ? "destructive" : "default"} className="ml-2">
      {hasIssue ? (
        <>
          <AlertCircle className="w-3 h-3 mr-1" />
          Issue
        </>
      ) : (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          OK
        </>
      )}
    </Badge>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <Database className="w-8 h-8 text-accent" />
              Database Setup & Debug
            </h1>
            <p className="text-muted-foreground">
              Check and fix database issues for the salon booking system
            </p>
          </div>

          {/* Actions */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Button
              onClick={checkDatabase}
              disabled={loading}
              className="h-16 flex flex-col gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              Check Database
            </Button>
            
            <Button
              onClick={setupSampleData}
              disabled={setupLoading || loading}
              variant="outline"
              className="h-16 flex flex-col gap-2"
            >
              {setupLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Database className="w-5 h-5" />
              )}
              Create Sample Data
            </Button>
            
            <Button
              onClick={createServicesForAllSalons}
              disabled={setupLoading || loading}
              variant="outline"
              className="h-16 flex flex-col gap-2"
            >
              {setupLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              Create Services for All Salons
            </Button>
          </div>

          {/* Database State */}
          {dbState && (
            <div className="space-y-6">
              {/* Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Database Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{dbState.salons.length}</div>
                      <div className="text-sm text-muted-foreground">Salons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{dbState.services.length}</div>
                      <div className="text-sm text-muted-foreground">Services</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{dbState.userRoles.length}</div>
                      <div className="text-sm text-muted-foreground">User Roles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{dbState.bookings.length}</div>
                      <div className="text-sm text-muted-foreground">Bookings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Issues */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health Check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Salons Available</span>
                    {getStatusBadge(dbState.issues.noSalons, "Salons")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Services Available</span>
                    {getStatusBadge(dbState.issues.noServices, "Services")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Services Properly Associated</span>
                    {getStatusBadge(dbState.issues.servicesWithoutSalon, "Service Association")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>User Roles Configured</span>
                    {getStatusBadge(dbState.issues.noUserRoles, "User Roles")}
                  </div>
                </CardContent>
              </Card>

              {/* Current User */}
              <Card>
                <CardHeader>
                  <CardTitle>Current User</CardTitle>
                </CardHeader>
                <CardContent>
                  {dbState.currentUser ? (
                    <div className="space-y-2">
                      <div><strong>ID:</strong> {dbState.currentUser.id}</div>
                      <div><strong>Email:</strong> {dbState.currentUser.email}</div>
                      <div><strong>Roles:</strong> {
                        dbState.userRoles
                          .filter(role => role.user_id === dbState.currentUser.id)
                          .map(role => `${role.role} at salon ${role.salon_id}`)
                          .join(", ") || "No roles assigned"
                      }</div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Not logged in</div>
                  )}
                </CardContent>
              </Card>

              {/* Sample Data */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Salons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dbState.salons.length > 0 ? (
                      <div className="space-y-2">
                        {dbState.salons.slice(0, 3).map((salon) => (
                          <div key={salon.id} className="flex justify-between items-center">
                            <span className="font-medium">{salon.name}</span>
                            <Badge variant={salon.is_active ? "default" : "secondary"}>
                              {salon.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        ))}
                        {dbState.salons.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            +{dbState.salons.length - 3} more...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No salons found</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sample Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dbState.services.length > 0 ? (
                      <div className="space-y-2">
                        {dbState.services.slice(0, 3).map((service) => (
                          <div key={service.id} className="flex justify-between items-center">
                            <span className="font-medium">{service.name}</span>
                            <div className="flex items-center gap-2">
                              {service.salon_id ? (
                                <Badge variant="default">Linked</Badge>
                              ) : (
                                <Badge variant="destructive">Orphan</Badge>
                              )}
                              <Badge variant={service.is_active ? "default" : "secondary"}>
                                {service.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {dbState.services.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            +{dbState.services.length - 3} more...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No services found</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Check Database</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Check Database" to analyze the current state and identify any issues.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Create Sample Data</h4>
                <p className="text-sm text-muted-foreground">
                  If no salons exist, click "Create Sample Data" to set up demo salons and services.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Fix Services</h4>
                <p className="text-sm text-muted-foreground">
                  If services exist but aren't linked to salons, click "Fix Services" to associate them properly.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. Test Booking</h4>
                <p className="text-sm text-muted-foreground">
                  Once setup is complete, go to the salon listing page and try booking an appointment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
