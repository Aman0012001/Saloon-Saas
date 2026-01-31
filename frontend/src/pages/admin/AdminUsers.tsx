import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  MoreVertical,
  Building2,
  Calendar,
  Shield,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Download,
  Trash2,
  Coins,
  ArrowRightCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  booking_count?: number;
  is_owner?: boolean;
  salon_name?: string;
  role?: string;
  coin_balance?: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustDescription, setAdjustDescription] = useState<string>("Admin adjustment");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.full_name}? This will remove their login, profile, and roles. This action cannot be undone.`)) return;

    try {
      await api.admin.deleteUser(user.id);
      toast({ title: "User Deleted", description: "The user has been permanently removed." });
      setUsers(users.filter(u => u.id !== user.id));
      setShowDetailsDialog(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAdjustCoins = async () => {
    if (!selectedUser || !adjustAmount) return;

    setIsAdjusting(true);
    try {
      await api.coins.adminAdjust(
        selectedUser.id,
        Number(adjustAmount),
        Number(adjustAmount) > 0 ? 'earned' : 'spent',
        adjustDescription
      );

      toast({
        title: "Points Adjusted",
        description: `Successfully ${Number(adjustAmount) > 0 ? 'added' : 'deducted'} ${Math.abs(Number(adjustAmount))} points.`
      });

      const updatedBalance = (selectedUser.coin_balance || 0) + Number(adjustAmount);
      setSelectedUser({ ...selectedUser, coin_balance: updatedBalance });
      setAdjustAmount("");
      setAdjustDescription("Admin adjustment");
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, coin_balance: updatedBalance } : u));
    } catch (error: any) {
      toast({ title: "Adjustment Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsAdjusting(false);
    }
  };

  const openDetails = async (user: User) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || "").includes(searchQuery);

    if (typeFilter === "all") return matchesSearch;
    if (typeFilter === "owners") return matchesSearch && (user.role === 'owner' || user.is_owner);
    if (typeFilter === "customers") return matchesSearch && (user.role === 'customer' || !user.is_owner);

    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight">User Directory</h1>
            <p className="text-slate-400 font-medium">Platform-wide user management from local MySQL</p>
          </div>
          <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <Users className="w-64 h-64" />
          </div>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Database Users</p>
                <p className="text-4xl font-black text-slate-900">{users.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registered Owners</p>
                <p className="text-4xl font-black text-slate-900">{users.filter(u => u.role === 'owner' || u.is_owner).length}</p>
              </div>
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Clients</p>
                <p className="text-4xl font-black text-slate-900">{users.filter(u => u.role === 'customer' || !u.is_owner).length}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search by name, phone or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm text-lg font-medium text-black"
            />
          </div>
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="bg-white p-1 rounded-2xl shadow-sm">
            <TabsList className="bg-transparent border-none">
              <TabsTrigger value="all" className="rounded-xl font-bold h-12 px-6">All</TabsTrigger>
              <TabsTrigger value="owners" className="rounded-xl font-bold h-12 px-6">Owners</TabsTrigger>
              <TabsTrigger value="customers" className="rounded-xl font-bold h-12 px-6">Clients</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Table */}
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent mx-auto" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold">No users match your criteria in the local records.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-black text-slate-900 h-14 px-8">IDENTITY</TableHead>
                    <TableHead className="font-black text-slate-900">CONTACT</TableHead>
                    <TableHead className="font-black text-slate-900">CLASSIFICATION</TableHead>
                    <TableHead className="font-black text-slate-900">HISTORY</TableHead>
                    <TableHead className="font-black text-slate-900 text-right px-8">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                      <TableCell className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 border-2 border-white shadow-sm ring-2 ring-slate-100">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-slate-100 text-slate-900 font-black">{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-black text-slate-900">{user.full_name || 'Anonymous'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joined {format(new Date(user.created_at), 'MMM yyyy')}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">
                        {user.phone || 'No phone'}
                      </TableCell>
                      <TableCell>
                        {user.is_owner || user.role === 'owner' ? (
                          <Badge className="bg-purple-100 text-purple-700 border-none font-bold px-3">Salon Owner</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border-none font-bold px-3">Customer</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{user.booking_count || 0}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bookings</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openDetails(user)} className="rounded-xl font-bold hover:bg-slate-100">
                            <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)} className="rounded-xl font-bold hover:bg-red-50 text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">Profile Overview</DialogTitle>
            <DialogDescription className="font-medium">Detailed local database record information.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-8 mt-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-xl">
                  <AvatarImage src={selectedUser.avatar_url || ''} />
                  <AvatarFallback className="text-3xl font-black">{getInitials(selectedUser.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{selectedUser.full_name || 'Legacy User'}</h3>
                  <p className="text-sm font-bold text-accent uppercase tracking-widest">{selectedUser.role || 'Member'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mobile Number</p>
                  <p className="font-black text-slate-900">{selectedUser.phone || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transaction Count</p>
                  <p className="font-black text-slate-900">{selectedUser.booking_count} Visits</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Onboard Date</p>
                  <p className="font-black text-slate-900">{format(new Date(selectedUser.created_at), 'PPP')}</p>
                </div>
                {selectedUser.salon_name && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Managed Saloon</p>
                    <p className="font-black text-slate-900">{selectedUser.salon_name}</p>
                  </div>
                )}
                <div className="space-y-1 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-1">
                    <Coins className="w-3 h-3" /> Point Balance
                  </p>
                  <p className="text-2xl font-black text-amber-700">{(selectedUser.coin_balance || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Adjustment Console</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amt (+/-)"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    className="bg-white border-none h-12 rounded-xl font-bold"
                  />
                  <Button
                    onClick={handleAdjustCoins}
                    disabled={isAdjusting || !adjustAmount}
                    className="bg-amber-500 hover:bg-amber-600 text-white h-12 px-4 rounded-xl shadow-lg shadow-amber-500/20"
                  >
                    {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-5 h-5" />}
                  </Button>
                </div>
                <Input
                  placeholder="Reason for adjustment..."
                  value={adjustDescription}
                  onChange={e => setAdjustDescription(e.target.value)}
                  className="bg-white border-none h-10 rounded-xl text-xs"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <Button className="flex-1 bg-slate-900 text-white font-black h-12 rounded-2xl">Audit Logs</Button>
                <Button variant="ghost" onClick={() => selectedUser && handleDeleteUser(selectedUser)} className="bg-red-50 text-red-600 font-black h-12 rounded-2xl">Remove User</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
