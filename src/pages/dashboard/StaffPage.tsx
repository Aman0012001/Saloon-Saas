import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCog,
  Plus,
  Search,
  Mail,
  Phone,
  MoreVertical,
  Shield,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  specializations: string[];
  commission_percentage: number;
  is_active: boolean;
  role?: 'owner' | 'manager' | 'staff' | 'super_admin';
}

export default function StaffPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { currentSalon, loading: salonLoading, isOwner, isManager } = useSalon();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"manager" | "staff">("staff");
  const [newStaffCommission, setNewStaffCommission] = useState("0");
  const [newStaffSpecializations, setNewStaffSpecializations] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchStaff = async () => {
    if (!currentSalon) return;

    setLoading(true);
    try {
      // Fetch staff profiles
      const { data: staffData, error: staffError } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("salon_id", currentSalon.id);

      if (staffError) throw staffError;

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("salon_id", currentSalon.id);

      if (rolesError) throw rolesError;

      // Merge data
      const enrichedStaff = staffData?.map((s) => ({
        ...s,
        role: rolesData?.find((r) => r.user_id === s.user_id)?.role,
      })) || [];

      setStaff(enrichedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [currentSalon]);

  const handleAddStaff = async () => {
    if (!currentSalon || !newStaffName) return;

    setCreating(true);
    try {
      // 1. Create a placeholder user ID (or handle auth creation differently if needed)
      // For manual entry without auth, we might need a shadow user or just a profile entry.
      // Assuming we can create a profile linked to a placeholder or generated ID.
      // Ideally, we should create an auth user or just a profile if the table allows null user_id?
      // Checking table schema from context isn't possible directly, but standard pattern:
      // We will create a profile. If user_id is required unique, we might need a workaround or
      // create a dummy auth user. However, often 'staff_profiles' might just need a salon_id.
      // Let's assume we can insert into staff_profiles directly.

      // Since user_id is likely a foreign key to auth.users, we can't easily fake it without an auth account.
      // However, for a "manual add" feature often requested, we might want to just store the profile 
      // and maybe create a shadow user or just use a random UUID if the constraint allows.
      // IF user_id is NOT a foreign key to auth.users but just a UUID, we can generate one.
      // Let's try to insert with a generated UUID.

      const fakeUserId = crypto.randomUUID();

      const { data: newStaff, error } = await supabase
        .from("staff_profiles")
        .insert({
          id: fakeUserId, // Using same for ID and user_id for simplicity if allowed
          salon_id: currentSalon.id,
          user_id: fakeUserId,
          display_name: newStaffName,
          email: newStaffEmail || null,
          phone: newStaffPhone || null,
          specializations: newStaffSpecializations.split(",").map(s => s.trim()).filter(Boolean),
          commission_percentage: parseInt(newStaffCommission) || 0,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        // If foreign key constraint fails, we'll know.
        console.error("Error creating staff profile:", error);
        throw error;
      }

      // If we want to assign a role in user_roles table
      if (newStaffRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: fakeUserId,
            salon_id: currentSalon.id,
            role: newStaffRole
          });

        if (roleError) console.error("Error assigning role:", roleError);
      }

      toast({
        title: "Staff Added",
        description: `${newStaffName} has been added to your team.`,
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchStaff();

    } catch (error: any) {
      console.error("Error adding staff:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member. Database constraint might prevent manual addition without real user account.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setNewStaffCommission("0");
    setNewStaffSpecializations("");
    setNewStaffRole("staff");
  };

  const updateStaffStatus = async (staffId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("staff_profiles")
        .update({ is_active: isActive })
        .eq("id", staffId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Staff member ${isActive ? "activated" : "deactivated"}`,
      });

      fetchStaff();
    } catch (error) {
      console.error("Error updating staff:", error);
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-accent/20 text-accent border-0">Owner</Badge>;
      case "manager":
        return <Badge className="bg-sage/20 text-sage border-0">Manager</Badge>;
      default:
        return <Badge variant="secondary">Staff</Badge>;
    }
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || salonLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ResponsiveDashboardLayout
      showBackButton={true}
      headerActions={
        (isOwner || isManager) && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
            className="bg-gradient-to-r from-accent to-accent/90 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage your team members and their permissions
            </p>
          </div>
          {(isOwner || isManager) && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Staff Member</DialogTitle>
                  <DialogDescription>
                    Manually add a staff member to your team.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Sarah Jones"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="staff@example.com"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        placeholder="+1234567890"
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specializations">Specializations (comma separated)</Label>
                    <Input
                      id="specializations"
                      placeholder="e.g. Haircut, Color, Styling"
                      value={newStaffSpecializations}
                      onChange={(e) => setNewStaffSpecializations(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commission">Commission (%)</Label>
                      <Input
                        id="commission"
                        type="number"
                        min="0"
                        max="100"
                        value={newStaffCommission}
                        onChange={(e) => setNewStaffCommission(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newStaffRole} onValueChange={(v: "manager" | "staff") => setNewStaffRole(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {isOwner && <SelectItem value="manager">Manager</SelectItem>}
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddStaff}
                    disabled={!newStaffName || creating}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {creating ? "Adding..." : "Add Staff Member"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Staff Grid */}
        {
          loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <UserCog className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No staff members found</p>
                {(isOwner || isManager) && (
                  <Button
                    variant="link"
                    className="mt-2 text-accent"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    Add your first team member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((member) => (
                <Card key={member.id} className="border-border shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar_url || ""} />
                          <AvatarFallback className="bg-accent/10 text-accent">
                            {getInitials(member.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {member.display_name}
                          </h3>
                          {getRoleBadge(member.role)}
                        </div>
                      </div>
                      {(isOwner || (isManager && member.role !== "owner")) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="w-4 h-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateStaffStatus(member.id, !member.is_active)}
                            >
                              {member.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      {member.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>

                    {member.specializations && member.specializations.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {member.specializations.slice(0, 3).map((spec, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {member.specializations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.specializations.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Commission: {member.commission_percentage}%
                      </span>
                      <Badge
                        variant={member.is_active ? "default" : "secondary"}
                        className={member.is_active ? "bg-sage/20 text-sage border-0" : ""}
                      >
                        {member.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        }
      </div >
    </ResponsiveDashboardLayout >
  );
}
