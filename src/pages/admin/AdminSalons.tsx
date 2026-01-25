import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  RefreshCw,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { format } from "date-fns";

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
  booking_count?: number;
}

export default function AdminSalons() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { approveSalon, rejectSalon, blockSalon, unblockSalon } = useSuperAdmin();
  const { toast } = useToast();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
    if (success) await fetchSalons();
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!selectedSalon || !actionReason) return;
    setActionLoading(true);
    const success = await rejectSalon(selectedSalon.id, actionReason);
    if (success) {
      await fetchSalons();
      setShowRejectDialog(false);
      setActionReason("");
    }
    setActionLoading(false);
  };

  const statusCounts = {
    all: salons.length,
    pending: salons.filter(s => s.approval_status === 'pending').length,
    approved: salons.filter(s => s.approval_status === 'approved').length,
    blocked: salons.filter(s => !s.is_active).length,
  };

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (salon.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (salon.owner_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "pending") return matchesSearch && salon.approval_status === "pending";
    if (statusFilter === "approved") return matchesSearch && salon.approval_status === "approved";
    if (statusFilter === "blocked") return matchesSearch && !salon.is_active;

    return matchesSearch;
  });
  console.log(salons);
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
                <p className="text-slate-400 font-medium font-bold uppercase tracking-wider text-[10px]">Verification & Governance Control</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchSalons} className="bg-white/10 hover:bg-white/20 border-white/5 rounded-xl font-bold">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Data
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
              className="pl-14 h-16 bg-white border-none rounded-3xl shadow-sm text-lg font-medium"
            />
          </div>
        </div>

        {/* Salons Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-[2rem]" />)}
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="py-32 text-center text-slate-400 font-black text-xl">No local saloons match your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSalons.map(salon => (
              <Card key={salon.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white group overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-24 bg-slate-900 relative overflow-hidden px-8 flex items-center justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl opacity-50" />
                    <h3 className="text-white font-black text-xl relative z-10 truncate max-w-[200px]">{salon.name}</h3>
                    <Badge className="bg-white/10 text-white border-none backdrop-blur-md rounded-full px-4 py-1 font-bold text-[10px] uppercase tracking-tighter">
                      {salon.approval_status}
                    </Badge>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-accent">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Location</p>
                        <p className="font-bold text-slate-700">{salon.city || 'Undisclosed'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-blue-500">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Performance</p>
                        <p className="font-bold text-slate-700">{salon.booking_count} Bookings Processed</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex gap-2">
                      <Button
                        onClick={() => { setSelectedSalon(salon); setShowDetailsDialog(true); }}
                        className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-900 font-black rounded-2xl h-12 shadow-none"
                      >
                        Details
                      </Button>
                      {salon.approval_status === 'pending' && (
                        <Button
                          onClick={() => handleApprove(salon)}
                          className="bg-accent text-white font-black rounded-2xl h-12 px-8 shadow-lg shadow-accent/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="rounded-[3rem] border-none shadow-2xl p-10 max-w-xl">
          {selectedSalon && (
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedSalon.name}</h2>
                <p className="text-accent font-bold mt-1 uppercase tracking-widest text-xs">Legacy Application Request</p>
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
              </div>

              <div className="p-6 rounded-[2rem] border-2 border-slate-50 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Address</p>
                <p className="font-medium text-slate-600 leading-relaxed">{selectedSalon.address}, {selectedSalon.city}, {selectedSalon.state}</p>
              </div>

              <div className="flex gap-4">
                {selectedSalon.approval_status === 'pending' ? (
                  <>
                    <Button onClick={() => handleApprove(selectedSalon)} className="flex-1 bg-accent text-white font-black h-14 rounded-2xl text-lg shadow-xl shadow-accent/20">Verify & Approve</Button>
                    <Button onClick={() => setShowRejectDialog(true)} variant="ghost" className="bg-red-50 text-red-600 font-black h-14 rounded-2xl px-8">Reject</Button>
                  </>
                ) : (
                  <Button className="w-full bg-slate-900 text-white font-black h-14 rounded-2xl text-lg">Manage Compliance</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}