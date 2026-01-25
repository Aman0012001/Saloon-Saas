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
    console.log('🔄 Fetching salons from local database...');
    try {
      const salonsData = await api.admin.getAllSalons();
      console.log(`✅ Fetched ${salonsData?.length || 0} salons from database`);

      const formattedSalons: Salon[] = salonsData.map((s: any) => ({
        ...s,
        owner_name: s.owner_name || 'Unknown',
        booking_count: s.booking_count || 0,
      }));

      setSalons(formattedSalons);
    } catch (error) {
      console.error('❌ Error fetching salons:', error);
      toast({
        title: "Error",
        description: "Failed to load salons from local backend.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
    const interval = setInterval(fetchSalons, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (salon: Salon) => {
    setActionLoading(true);
    const success = await approveSalon(salon.id);
    if (success) {
      await fetchSalons();
    }
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
      setSelectedSalon(null);
    }
    setActionLoading(false);
  };

  const handleBlock = async () => {
    if (!selectedSalon || !actionReason) return;

    setActionLoading(true);
    const success = await blockSalon(selectedSalon.id, actionReason);
    if (success) {
      await fetchSalons();
      setShowBlockDialog(false);
      setActionReason("");
      setSelectedSalon(null);
    }
    setActionLoading(false);
  };

  const handleUnblock = async (salon: Salon) => {
    setActionLoading(true);
    const success = await unblockSalon(salon.id);
    if (success) {
      await fetchSalons();
    }
    setActionLoading(false);
  };

  const getStatusBadge = (salon: Salon) => {
    if (!salon.is_active) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    switch (salon.approval_status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-0">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-0">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-0">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{salon.approval_status}</Badge>;
    }
  };

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "pending") return matchesSearch && salon.approval_status === "pending";
    if (statusFilter === "approved") return matchesSearch && salon.approval_status === "approved";
    if (statusFilter === "rejected") return matchesSearch && salon.approval_status === "rejected";
    if (statusFilter === "blocked") return matchesSearch && !salon.is_active;

    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Enhanced Header with Dark Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-700 to-black p-8 text-white">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Salon Management</h1>
                  <p className="text-gray-300 text-lg">Manage all registered salons on the platform</p>
                </div>
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <Button
                onClick={fetchSalons}
                disabled={loading}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-white"
                title="Refresh salons"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div>
                <div className="text-3xl font-bold">{salons.length}</div>
                <div className="text-gray-300">Total Salons</div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl"></div>
        </div>

        {/* Enhanced Stats Cards - Dark Theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-400">Approved</p>
                  <p className="text-3xl font-bold text-white">{salons.filter(s => s.approval_status === 'approved').length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-400">Pending</p>
                  <p className="text-3xl font-bold text-white">{salons.filter(s => s.approval_status === 'pending').length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-400">Rejected</p>
                  <p className="text-3xl font-bold text-white">{salons.filter(s => s.approval_status === 'rejected').length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Blocked</p>
                  <p className="text-3xl font-bold text-white">{salons.filter(s => !s.is_active).length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gray-500 flex items-center justify-center">
                  <Ban className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters - Dark Theme */}
        <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search salons by name, city, or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-12 text-base bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-12 bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All Status</SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-gray-700 focus:bg-gray-700">Pending Approval</SelectItem>
                  <SelectItem value="approved" className="text-white hover:bg-gray-700 focus:bg-gray-700">Approved</SelectItem>
                  <SelectItem value="rejected" className="text-white hover:bg-gray-700 focus:bg-gray-700">Rejected</SelectItem>
                  <SelectItem value="blocked" className="text-white hover:bg-gray-700 focus:bg-gray-700">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tabs - Dark Theme */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="grid w-full grid-cols-4 h-12 bg-gray-800 border border-gray-700">
            <TabsTrigger value="all" className="text-sm font-medium text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              All ({salons.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-sm font-medium text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Pending ({salons.filter(s => s.approval_status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-sm font-medium text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Approved ({salons.filter(s => s.approval_status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="blocked" className="text-sm font-medium text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Blocked ({salons.filter(s => !s.is_active).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Enhanced Salons Grid - Dark Theme */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredSalons.length === 0 ? (
          <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-gray-400 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">No salons found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSalons.map((salon) => (
              <Card key={salon.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden bg-gray-800 border border-gray-700">
                <CardContent className="p-0">
                  <div className="h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden">
                    <Building2 className="h-16 w-16 text-white/80" />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(salon)}
                    </div>
                    <div className="absolute inset-0 bg-black/10"></div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-1 text-white">{salon.name}</h3>
                        <p className="text-sm text-gray-400">
                          Owner: <span className="font-medium text-gray-300">{salon.owner_name}</span>
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-gray-700 text-gray-300">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
                          <DropdownMenuItem onClick={() => {
                            setSelectedSalon(salon);
                            setShowDetailsDialog(true);
                          }} className="text-gray-300 hover:bg-gray-700">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {salon.approval_status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(salon)} className="text-green-400 hover:bg-gray-700">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedSalon(salon);
                                setShowRejectDialog(true);
                              }} className="text-red-400 hover:bg-gray-700">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator className="bg-gray-700" />
                          {salon.is_active ? (
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-gray-700"
                              onClick={() => {
                                setSelectedSalon(salon);
                                setShowBlockDialog(true);
                              }}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Block Salon
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUnblock(salon)} className="text-green-400 hover:bg-gray-700">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Unblock Salon
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      {salon.city && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="h-4 w-4 text-blue-400" />
                          <span>{salon.city}, {salon.state}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4 text-green-400" />
                        <span>{salon.booking_count} total bookings</span>
                      </div>
                      {salon.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Phone className="h-4 w-4 text-purple-400" />
                          <span>{salon.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Registered {format(new Date(salon.created_at), 'MMM d, yyyy')}
                      </span>
                      <div className="flex gap-2">
                        {salon.approval_status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(salon)} className="bg-green-500 hover:bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedSalon(salon);
                              setShowRejectDialog(true);
                            }} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Dialog - Dark Theme */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Salon</DialogTitle>
            <DialogDescription className="text-gray-400">
              Provide a reason for rejecting {selectedSalon?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Rejection Reason</Label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!actionReason || actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Rejecting..." : "Reject Salon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog - Dark Theme */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Block Salon</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will prevent {selectedSalon?.name} from receiving new bookings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Block Reason</Label>
              <Textarea
                placeholder="Enter the reason for blocking..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={!actionReason || actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Blocking..." : "Block Salon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog - Dark Theme */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedSalon?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">Salon details and information</DialogDescription>
          </DialogHeader>
          {selectedSalon && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Owner</Label>
                  <p className="font-medium text-white">{selectedSalon.owner_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSalon)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">Location</Label>
                  <p className="font-medium text-white">
                    {selectedSalon.city || 'Not set'}, {selectedSalon.state || 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400">Address</Label>
                  <p className="font-medium text-white">{selectedSalon.address || 'Not set'}</p>
                </div>
                {selectedSalon.phone && (
                  <div>
                    <Label className="text-gray-400">Phone</Label>
                    <p className="font-medium text-white">{selectedSalon.phone}</p>
                  </div>
                )}
                {selectedSalon.email && (
                  <div>
                    <Label className="text-gray-400">Email</Label>
                    <p className="font-medium text-white">{selectedSalon.email}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-400">Total Bookings</Label>
                  <p className="font-medium text-white">{selectedSalon.booking_count}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Registered</Label>
                  <p className="font-medium text-white">
                    {format(new Date(selectedSalon.created_at), 'PPP')}
                  </p>
                </div>
              </div>
              {selectedSalon.description && (
                <div>
                  <Label className="text-gray-400">Description</Label>
                  <p className="mt-1 text-white">{selectedSalon.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}