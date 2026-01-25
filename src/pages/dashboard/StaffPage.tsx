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
import api from "@/services/api";
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
      const staffData = await api.staff.getBySalon(currentSalon.id);

      // In local DB, roles might be part of the staff object or fetched separately
      // Using generic enrichment pattern
      const enrichedStaff = staffData.map((s: any) => ({
        ...s,
        specializations: typeof s.specializations === 'string'
          ? JSON.parse(s.specializations)
          : (s.specializations || [])
      }));

      setStaff(enrichedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members from local database",
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
      await api.staff.create({
        salon_id: currentSalon.id,
        display_name: newStaffName,
        email: newStaffEmail || null,
        phone: newStaffPhone || null,
        specializations: newStaffSpecializations.split(",").map(s => s.trim()).filter(Boolean),
        commission_percentage: parseInt(newStaffCommission) || 0,
        role: newStaffRole,
        is_active: true
      });

      toast({
        title: "Staff Added",
        description: `${newStaffName} has been added to your local database.`,
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchStaff();
    } catch (error: any) {
      console.error("Error adding staff:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member locally.",
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
      await api.staff.update(staffId, { is_active: isActive });
      toast({
        title: "Success",
        description: `Staff member ${isActive ? "activated" : "deactivated"} locally`,
      });
      fetchStaff();
    } catch (error) {
      console.error("Error updating staff:", error);
      toast({
        title: "Error",
        description: "Failed to update staff member locally",
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
        return <Badge className="bg-emerald-100 text-emerald-700 border-0">Manager</Badge>;
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
            <h1 className="text-3xl font-black text-foreground tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground font-medium">
              Manage your local team members from the XAMPP database
            </p>
          </div>
          {(isOwner || isManager) && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-accent/20 transition-all hover:scale-105">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-3xl border-none">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Register Staff</DialogTitle>
                  <DialogDescription className="font-medium">
                    Create a new staff record in your local salon database.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Sarah Jones"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="h-11 bg-secondary/30 border-none rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="staff@example.com"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="h-11 bg-secondary/30 border-none rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        placeholder="+1 234..."
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        className="h-11 bg-secondary/30 border-none rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specializations" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Specializations (comma separated)</Label>
                    <Input
                      id="specializations"
                      placeholder="e.g. Haircut, Styling"
                      value={newStaffSpecializations}
                      onChange={(e) => setNewStaffSpecializations(e.target.value)}
                      className="h-11 bg-secondary/30 border-none rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commission" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Commission (%)</Label>
                      <Input
                        id="commission"
                        type="number"
                        min="0"
                        max="100"
                        value={newStaffCommission}
                        onChange={(e) => setNewStaffCommission(e.target.value)}
                        className="h-11 bg-secondary/30 border-none rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Role</Label>
                      <Select value={newStaffRole} onValueChange={(v: "manager" | "staff") => setNewStaffRole(v)}>
                        <SelectTrigger className="h-11 bg-secondary/30 border-none rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          {isOwner && <SelectItem value="manager">Manager</SelectItem>}
                          <SelectItem value="staff">Staff Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl font-bold">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddStaff}
                    disabled={!newStaffName || creating}
                    className="bg-accent hover:bg-accent/90 text-white font-black px-8 rounded-xl"
                  >
                    {creating ? "Saving..." : "Register Staff"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <Input
            placeholder="Search by name, role or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl text-lg font-medium"
          />
        </div>

        {/* Staff Grid */}
        {
          loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="border-none shadow-sm h-48 animate-pulse bg-white rounded-[2rem]" />
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm rounded-[2rem]">
              <CardContent className="py-24 text-center">
                <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <UserCog className="w-10 h-10 text-accent opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Your Team is Waiting</h3>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto font-medium">Add staff members to start managing commissions and schedules.</p>
                {(isOwner || isManager) && (
                  <Button
                    variant="link"
                    className="mt-4 text-accent font-black"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    Add your first team member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((member) => (
                <Card key={member.id} className={`group border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-[2rem] overflow-hidden ${!member.is_active ? "opacity-60" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-16 h-16 border-2 border-white shadow-md ring-2 ring-accent/5">
                            <AvatarImage src={member.avatar_url || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/10 text-accent font-black text-lg">
                              {getInitials(member.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          {member.is_active && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-lg leading-tight">
                            {member.display_name}
                          </h3>
                          <div className="mt-1">{getRoleBadge(member.role)}</div>
                        </div>
                      </div>
                      {(isOwner || (isManager && member.role !== "owner")) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-5 h-5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl">
                            <DropdownMenuItem className="rounded-xl py-3 font-bold">
                              <Edit className="w-4 h-4 mr-3 text-blue-500" />
                              Edit Privileges
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl py-3 font-bold">
                              <Shield className="w-4 h-4 mr-3 text-purple-500" />
                              Assign Tasks
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="opacity-50" />
                            <DropdownMenuItem
                              className={`rounded-xl py-3 font-bold ${member.is_active ? "text-red-500 focus:bg-red-50 focus:text-red-600" : "text-emerald-500 focus:bg-emerald-50 focus:text-emerald-600"}`}
                              onClick={() => updateStaffStatus(member.id, !member.is_active)}
                            >
                              {member.is_active ? "Suspend Staff" : "Reactivate Staff"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="mt-6 space-y-3">
                      {member.email && (
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Mail className="w-4 h-4" />
                          </div>
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Phone className="w-4 h-4" />
                          </div>
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>

                    {member.specializations && member.specializations.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {member.specializations.map((spec, i) => (
                          <Badge key={i} className="bg-slate-50 text-slate-600 hover:bg-accent/10 hover:text-accent border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Commission</span>
                        <span className="text-xl font-black text-slate-900 mt-1">{member.commission_percentage}%</span>
                      </div>
                      <Badge
                        className={`font-black tracking-tighter uppercase px-4 py-1.5 rounded-xl border-none ${member.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
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
