import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Calendar,
  Building2,
  Crown,
  User,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import api from "@/services/api";
import { format } from "date-fns";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_blocked: boolean;
  salon_count: number;
  booking_count: number;
}

export default function AdminUsersEnhanced() {
  const [searchParams] = useSearchParams();
  const { blockUser, unblockUser } = useSuperAdmin();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [userTypeFilter, setUserTypeFilter] = useState(searchParams.get('type') || 'all');
  const [actionDialog, setActionDialog] = useState<{
    type: 'block' | 'unblock' | 'view' | null;
    user: UserData | null;
  }>({ type: null, user: null });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, userTypeFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllUsers();

      const formatted: UserData[] = data.map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        user_type: u.role || 'customer',
        created_at: u.created_at,
        last_sign_in_at: u.last_login,
        is_blocked: !!u.is_blocked,
        salon_count: Number(u.salon_count || 0),
        booking_count: Number(u.booking_count || 0)
      }));

      setUsers(formatted);
    } catch (error) {
      console.error('Local user sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: 'block' | 'unblock', user: UserData) => {
    setActionLoading(true);
    try {
      if (action === 'block') await blockUser(user.id, actionReason);
      else await unblockUser(user.id);
      fetchUsers();
      setActionDialog({ type: null, user: null });
    } catch (e) {
      console.error("Action error:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = userTypeFilter === 'all' || u.user_type === userTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-accent">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Citizen Archive</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Local MySQL User Records</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black">{users.length}</p>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mt-1">Total Verified Accounts</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            <Input
              placeholder="Locate by Name or Digital ID (Email)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-16 pl-14 bg-white border-none rounded-2xl shadow-sm text-lg font-medium"
            />
          </div>
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger className="w-48 h-16 bg-white border-none rounded-2xl shadow-sm font-bold">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Global Feed</SelectItem>
              <SelectItem value="customer">Clients</SelectItem>
              <SelectItem value="owner">Owners</SelectItem>
              <SelectItem value="admin">Governors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-black text-slate-900 px-8 h-14">PROFILE</TableHead>
                  <TableHead className="font-black text-slate-900">CREDENTIALS</TableHead>
                  <TableHead className="font-black text-slate-900">ACTIVITY</TableHead>
                  <TableHead className="font-black text-slate-900">REGISTRATION</TableHead>
                  <TableHead className="font-black text-slate-900 text-right px-8">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => (
                  <TableRow key={u.id} className="hover:bg-slate-50 transition-colors border-slate-50">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                          {u.user_type === 'admin' ? <Crown className="w-6 h-6 text-accent" /> : u.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-none">{u.full_name || 'Anonymous'}</p>
                          <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] px-2 mt-2 uppercase tracking-tighter">{u.user_type}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-600">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="font-black text-slate-900 leading-none">{u.salon_count}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Saloons</p>
                        </div>
                        <div className="text-center border-l border-slate-200 pl-4">
                          <p className="font-black text-slate-900 leading-none">{u.booking_count}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Visits</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-slate-900 text-xs">{format(new Date(u.created_at || new Date()), "MMM dd, yyyy")}</p>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100"><MoreVertical className="w-5 h-5 text-slate-400" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 w-48">
                          <DropdownMenuItem className="rounded-xl font-bold py-3"><Eye className="w-4 h-4 mr-2" /> View Dossier</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setActionDialog({ type: 'block', user: u })} className="rounded-xl font-bold py-3 text-red-600 focus:bg-red-50 focus:text-red-700">
                            <Ban className="w-4 h-4 mr-2" /> Revoke Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={actionDialog.type === 'block'} onOpenChange={() => setActionDialog({ type: null, user: null })}>
        <DialogContent className="rounded-[3rem] border-none shadow-2xl p-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Revoke Local Access</h2>
          <p className="text-slate-500 font-medium mt-2">Provide justification for restricting {actionDialog.user?.full_name}'s local profile.</p>
          <div className="mt-8 space-y-4">
            <Textarea
              placeholder="Reason for suspension..."
              className="bg-slate-50 border-none rounded-3xl p-6 min-h-[120px] shadow-inner"
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
            />
            <div className="flex gap-4">
              <Button onClick={() => handleUserAction('block', actionDialog.user!)} className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-600/20">Suspend Identity</Button>
              <Button variant="ghost" onClick={() => setActionDialog({ type: null, user: null })} className="font-bold text-slate-400">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}