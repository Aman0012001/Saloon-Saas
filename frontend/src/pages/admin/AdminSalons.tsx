import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  RefreshCw,
  Zap,
  Trash2,
  Plus,
  Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Salon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  approval_status: string;
  subscription_status: string | null;
  created_at: string;
  owner_name?: string;
  owner_account_email?: string;
  owner_password_plain?: string;
  booking_count?: number;
}

export default function AdminSalons() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { approveSalon, rejectSalon } = useSuperAdmin();
  const { toast } = useToast();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  useEffect(() => {
    if (showDetailsDialog) {
      setShowOwnerPassword(false);
    }
  }, [showDetailsDialog]);

  // Creation Form State
  const [newSalon, setNewSalon] = useState({
    name: '',
    slug: '',
    description: '',
    city: '',
    state: '',
    owner_email: '',
    owner_password: ''
  });

  const fetchSalons = async () => {
    setLoading(true);
    try {
      const salonsData = await api.admin.getAllSalons();
      setSalons(salonsData || []);
    } catch (error) {
      console.error('Error fetching admin salons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  const handleApprove = async (salon: Salon) => {
    setActionLoading(true);
    const success = await approveSalon(salon.id);
    if (success) {
      await fetchSalons();
      if (selectedSalon?.id === salon.id) setShowDetailsDialog(false);
    }
    setActionLoading(false);
  };

  const handleCreateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.admin.createSalon(newSalon);
      toast({ title: "Salon Created", description: "New salon has been added successfully." });
      setShowCreateDialog(false);
      setNewSalon({ name: '', slug: '', description: '', city: '', state: '', owner_email: '', owner_password: '' });
      fetchSalons();
    } catch (error: any) {
      toast({ title: "Creation Failed", description: error.message || "Failed to create salon", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSalon || !actionReason) return;
    setActionLoading(true);
    const success = await rejectSalon(selectedSalon.id, actionReason);
    if (success) {
      await fetchSalons();
      setShowRejectDialog(false);
      setShowDetailsDialog(false);
      setActionReason("");
    }
    setActionLoading(false);
  };

  const handleDelete = async (salon: Salon) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${salon.name}? This will remove all bookings, services, and staff associated with this salon. This cannot be undone.`)) return;

    try {
      await api.admin.deleteSalon(salon.id);
      toast({ title: "Salon Deleted", description: "The salon has been permanently removed." });
      setSalons(salons.filter(s => s.id !== salon.id));
      setShowDetailsDialog(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedSalon || !resetPasswordValue) return;
    setActionLoading(true);
    try {
      await api.admin.resetSalonPassword(selectedSalon.id, resetPasswordValue);
      toast({ title: "Password Updated", description: "The salon owner's password has been successfully reset." });
      setShowResetPasswordDialog(false);
      setResetPasswordValue("");
      fetchSalons(); // Refresh to show new plain password if needed
    } catch (error: any) {
      toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const statusCounts = {
    all: salons.length,
    pending: salons.filter(s => s.approval_status === 'pending').length,
    approved: salons.filter(s => s.approval_status === 'approved').length,
  };

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (salon.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (salon.owner_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "pending") return matchesSearch && salon.approval_status === "pending";
    if (statusFilter === "approved") return matchesSearch && salon.approval_status === "approved";

    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Modern Header */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 blur-[120px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                <Building2 className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Saloon Registry</h1>
                <p className="text-slate-400 font-medium font-bold uppercase tracking-wider text-[10px] mt-2">Verification Control</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowCreateDialog(true)} className="bg-accent hover:bg-accent/90 text-white rounded-xl font-bold border-none">
                <Plus className="w-4 h-4 mr-2" /> Add Saloon
              </Button>
              <Button onClick={fetchSalons} className="bg-white/10 hover:bg-white/20 border-white/5 rounded-xl font-bold">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Data
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`p-6 rounded-3xl transition-all duration-300 text-left relative overflow-hidden group ${statusFilter === status ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-105' : 'bg-white text-slate-400 hover:bg-slate-50 shadow-sm'
                }`}
            >
              <p className={`text-3xl font-black ${statusFilter === status ? 'text-white' : 'text-slate-900'}`}>{count}</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">{status}</p>
              <div className={`absolute top-[-10px] right-[-10px] opacity-10 group-hover:scale-125 transition-transform`}>
                {status === 'pending' ? <Clock className="w-20 h-20" /> : <Building2 className="w-20 h-20" />}
              </div>
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            <Input
              placeholder="Search by Saloon Name, Location or Owner..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-14 h-16 bg-white border-none rounded-3xl shadow-sm text-lg font-medium text-black"
            />
          </div>
        </div>

        {/* Salons Table List */}
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent mx-auto" /></div>
            ) : filteredSalons.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold">No saloons match your search.</div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="font-black text-slate-900 h-14 px-8">SALOON DETAILS</TableHead>
                      <TableHead className="font-black text-slate-900">LOCATION</TableHead>
                      <TableHead className="font-black text-slate-900">STATUS</TableHead>
                      <TableHead className="font-black text-slate-900">PERFORMANCE</TableHead>
                      <TableHead className="font-black text-slate-900 text-right px-8">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalons.map(salon => (
                      <TableRow key={salon.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                        <TableCell className="px-8 py-4">
                          <div>
                            <p className="font-black text-slate-900 text-lg">{salon.name}</p>
                            <p className="text-xs text-slate-500 font-medium">Owner: {salon.owner_name || 'Unclaimed'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {salon.city || 'Unknown City'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`border-none font-bold px-3 py-1 ${salon.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                            salon.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                            {salon.approval_status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-700">{salon.booking_count || 0} Bookings</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedSalon(salon); setShowDetailsDialog(true); }}
                              className="rounded-xl font-bold hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="w-4 h-4 mr-2" /> View
                            </Button>

                            {salon.approval_status === 'pending' ? (
                              <Button
                                size="sm"
                                onClick={() => handleApprove(salon)}
                                className="rounded-xl font-bold bg-accent text-white hover:bg-accent/90 shadow-sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(salon)}
                                className="rounded-xl font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="rounded-[3rem] border-none shadow-2xl p-10 max-w-xl">
          {selectedSalon && (
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedSalon.name}</h2>
                <Badge className={`mt-2 border-none font-bold px-3 py-1 ${selectedSalon.approval_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {selectedSalon.approval_status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="p-5 rounded-3xl bg-slate-50 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Email</p>
                  <p className="font-bold text-slate-700 truncate">{selectedSalon.email || 'None'}</p>
                </div>
                <div className="p-5 rounded-3xl bg-slate-50 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Link</p>
                  <p className="font-bold text-slate-700">{selectedSalon.phone || 'N/A'}</p>
                </div>

                {/* <div className="col-span-2 p-5 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Governance Credentials</p>
                      <p className="font-bold text-sm mt-1">Owner Account Access</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResetPasswordDialog(true)}
                        className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-accent font-black text-[9px] uppercase tracking-widest transition-all"
                      >
                        Reset
                      </Button>
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-accent" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-slate-400">EMAIL</span>
                      <span className="font-mono text-xs text-white">{selectedSalon.owner_account_email || 'No owner assigned'}</span>
                    </div>

                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-slate-400">PASSWORD</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-white">
                          {showOwnerPassword
                            ? (selectedSalon.owner_password_plain || 'Not Stored')
                            : '••••••••••••'}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowOwnerPassword(prev => !prev);
                          }}
                          className="h-8 w-8 hover:bg-white/10 text-slate-400 hover:text-white"
                        >
                          {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    {!selectedSalon.owner_password_plain && (
                      <p className="text-[9px] text-slate-500 italic px-2">※ Password was not stored in plain text during registration.</p>
                    )}
                  </div>
                </div> */}
              </div>

              <div className="p-6 rounded-[2rem] border-2 border-slate-50 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Address</p>
                <p className="font-medium text-slate-600 leading-relaxed">{selectedSalon.address}, {selectedSalon.city}, {selectedSalon.state}</p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                {selectedSalon.approval_status === 'pending' ? (
                  <>
                    <Button onClick={() => handleApprove(selectedSalon)} className="flex-1 bg-accent text-white font-black h-14 rounded-2xl text-lg shadow-xl shadow-accent/20">Verify & Approve</Button>
                    <Button onClick={() => setShowRejectDialog(true)} variant="ghost" className="bg-red-50 text-red-600 font-black h-14 rounded-2xl px-8">Reject</Button>
                  </>
                ) : (
                  <Button onClick={() => handleDelete(selectedSalon)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black h-14 rounded-2xl text-lg">
                    <Trash2 className="w-5 h-5 mr-2" /> Delete Saloon Permanently
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Salon Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Register New Salon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSalon} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Salon Name</Label>
              <Input required value={newSalon.name} onChange={e => setNewSalon({ ...newSalon, name: e.target.value })} className="rounded-xl h-12" placeholder="e.g. Luxe Studio" />
            </div>
            <div className="space-y-2">
              <Label>Unique Slug (URL)</Label>
              <Input required value={newSalon.slug} onChange={e => setNewSalon({ ...newSalon, slug: e.target.value })} className="rounded-xl h-12" placeholder="e.g. luxe-studio-nyc" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={newSalon.city} onChange={e => setNewSalon({ ...newSalon, city: e.target.value })} className="rounded-xl h-12" placeholder="e.g. New York" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={newSalon.state} onChange={e => setNewSalon({ ...newSalon, state: e.target.value })} className="rounded-xl h-12" placeholder="e.g. NY" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Owner Email (Optional)</Label>
              <Input type="email" value={newSalon.owner_email} onChange={e => setNewSalon({ ...newSalon, owner_email: e.target.value })} className="rounded-xl h-12" placeholder="new.owner@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Owner Password (Optional)</Label>
              <Input type="password" value={newSalon.owner_password} onChange={e => setNewSalon({ ...newSalon, owner_password: e.target.value })} className="rounded-xl h-12" placeholder="********" />
              <p className="text-xs text-slate-400">Required if creating a new user.</p>
            </div>
            <Button disabled={actionLoading} type="submit" className="w-full h-12 rounded-xl bg-accent text-white font-bold mt-4">
              {actionLoading ? 'Creating...' : 'Create Registration'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-sm">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-black">Reset Owner Access</DialogTitle>
            <p className="text-slate-500 text-sm font-medium mt-2">
              Set a new plain-text password for this salon owner.
            </p>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</Label>
              <Input
                type="text"
                value={resetPasswordValue}
                onChange={e => setResetPasswordValue(e.target.value)}
                placeholder="SecurePass2024!"
                className="rounded-xl h-12 font-mono"
              />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button
                disabled={actionLoading || !resetPasswordValue}
                onClick={handleResetPassword}
                className="w-full h-12 rounded-xl bg-slate-900 text-white font-black hover:bg-slate-800"
              >
                {actionLoading ? "Updating Registry..." : "Enforce New Password"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowResetPasswordDialog(false)}
                className="w-full text-slate-400 font-bold text-xs uppercase"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
