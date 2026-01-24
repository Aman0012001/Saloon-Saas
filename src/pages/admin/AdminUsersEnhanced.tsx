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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { supabase } from "@/integrations/supabase/client";
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

interface UserStats {
  totalUsers: number;
  customers: number;
  salonOwners: number;
  admins: number;
  activeToday: number;
  newThisWeek: number;
}

export default function AdminUsersEnhanced() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { blockUser, unblockUser, logActivity } = useSuperAdmin();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [userTypeFilter, setUserTypeFilter] = useState(searchParams.get('type') || 'all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: 'block' | 'unblock' | 'view' | null;
    user: UserData | null;
  }>({ type: null, user: null });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [searchTerm, userTypeFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Build query - profiles table doesn't have user_type column
      let query = supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          created_at
        `);

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      const { data: profilesData, error: profilesError } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (profilesError) throw profilesError;

      // Get user roles to determine user type
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map<string, string>();
      userRoles?.forEach(role => {
        if (role.role === 'owner' || role.role === 'super_admin') {
          roleMap.set(role.user_id, role.role === 'owner' ? 'salon_owner' : 'admin');
        }
      });
      
      // For each profile, get additional data
      const enrichedUsers: UserData[] = [];
      
      for (const profile of profilesData || []) {
        const userType = roleMap.get(profile.user_id) || 'customer';
        
        // Apply user type filter
        if (userTypeFilter !== 'all' && userType !== userTypeFilter) {
          continue;
        }

        // Get salon count for owners
        const { data: salons } = await supabase
          .from('user_roles')
          .select('salon_id')
          .eq('user_id', profile.user_id)
          .eq('role', 'owner');

        // Get booking count
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('user_id', profile.user_id);

        enrichedUsers.push({
          id: profile.user_id,
          email: `user${profile.id.slice(-4)}@example.com`, // Placeholder
          full_name: profile.full_name,
          user_type: userType,
          created_at: profile.created_at,
          last_sign_in_at: null, // Would need auth admin access
          is_blocked: false, // Would need auth admin access
          salon_count: salons?.length || 0,
          booking_count: bookings?.length || 0,
        });
      }

      setUsers(enrichedUsers);

    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, created_at');

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (!profiles) return;

      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const ownerIds = new Set(userRoles?.filter(r => r.role === 'owner').map(r => r.user_id) || []);
      const adminIds = new Set(userRoles?.filter(r => r.role === 'super_admin').map(r => r.user_id) || []);

      const stats: UserStats = {
        totalUsers: profiles.length,
        customers: profiles.filter(p => !ownerIds.has(p.user_id) && !adminIds.has(p.user_id)).length,
        salonOwners: ownerIds.size,
        admins: adminIds.size,
        activeToday: 0, // Would need auth admin access
        newThisWeek: profiles.filter(p => new Date(p.created_at) >= weekAgo).length,
      };

      setStats(stats);

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUserAction = async (action: 'block' | 'unblock', user: UserData) => {
    setActionLoading(true);
    try {
      let success = false;
      
      if (action === 'block') {
        success = await blockUser(user.id, actionReason);
      } else {
        success = await unblockUser(user.id);
      }

      if (success) {
        await fetchUsers();
        setActionDialog({ type: null, user: null });
        setActionReason('');
      }

    } catch (error) {
      console.error('Error performing user action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'salon_owner': return <Building2 className="h-4 w-4" />;
      case 'admin': return <Crown className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'salon_owner': 
        return <Badge className="bg-purple-500/10 text-purple-600 border-0">Owner</Badge>;
      case 'admin': 
        return <Badge className="bg-orange-500/10 text-orange-600 border-0">Admin</Badge>;
      default: 
        return <Badge variant="secondary">Customer</Badge>;
    }
  };

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
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">User Management</h1>
                  <p className="text-gray-300 text-lg">Manage platform users and their access</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              <div className="text-gray-300">Total Users</div>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl"></div>
        </div>

        {/* Enhanced Stats Cards - Dark Theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-400">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-blue-400 mt-1">All registered users</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-400">Salon Owners</p>
                  <p className="text-3xl font-bold text-white">{stats?.salonOwners || 0}</p>
                  <p className="text-xs text-purple-400 mt-1">Business owners</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-400">Customers</p>
                  <p className="text-3xl font-bold text-white">{stats?.customers || 0}</p>
                  <p className="text-xs text-green-400 mt-1">Regular customers</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-400">New This Week</p>
                  <p className="text-3xl font-bold text-white">{stats?.newThisWeek || 0}</p>
                  <p className="text-xs text-orange-400 mt-1">Recent signups</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters - Dark Theme */}
        <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                  />
                </div>
              </div>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All Users</SelectItem>
                  <SelectItem value="customer" className="text-white hover:bg-gray-700 focus:bg-gray-700">Customers</SelectItem>
                  <SelectItem value="salon_owner" className="text-white hover:bg-gray-700 focus:bg-gray-700">Salon Owners</SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-gray-700 focus:bg-gray-700">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Users Table - Dark Theme */}
        <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
          <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Platform Users</CardTitle>
                  <p className="text-sm text-gray-400">Showing {users.length} users</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">No users found</h3>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-700/50 border-gray-600">
                    <TableHead className="font-semibold text-gray-300">User</TableHead>
                    <TableHead className="font-semibold text-gray-300">Type</TableHead>
                    <TableHead className="font-semibold text-gray-300">Activity</TableHead>
                    <TableHead className="font-semibold text-gray-300">Joined</TableHead>
                    <TableHead className="font-semibold text-gray-300">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-700/50 transition-colors border-gray-600">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                            {getUserTypeIcon(user.user_type)}
                            <div className="absolute h-12 w-12 rounded-xl bg-blue-400 animate-ping opacity-20"></div>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.full_name || 'Unknown User'}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getUserTypeBadge(user.user_type)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {user.salon_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-purple-500" />
                              <span className="text-gray-300">{user.salon_count} salon{user.salon_count !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {user.booking_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-green-500" />
                              <span className="text-gray-300">{user.booking_count} booking{user.booking_count !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {user.salon_count === 0 && user.booking_count === 0 && (
                            <span className="text-gray-400">No activity</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-white">{format(new Date(user.created_at), 'MMM d, yyyy')}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_blocked ? (
                          <Badge variant="destructive" className="shadow-sm">Blocked</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shadow-sm">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-gray-700 text-gray-300">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
                            <DropdownMenuItem
                              onClick={() => setActionDialog({ type: 'view', user })}
                              className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-700" />
                            {user.is_blocked ? (
                              <DropdownMenuItem
                                onClick={() => setActionDialog({ type: 'unblock', user })}
                                className="text-green-400 hover:bg-gray-700 focus:bg-gray-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Unblock User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setActionDialog({ type: 'block', user })}
                                className="text-red-400 hover:bg-gray-700 focus:bg-gray-700"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Block User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Action Dialogs - Dark Theme */}
        <Dialog 
          open={actionDialog.type === 'block'} 
          onOpenChange={() => setActionDialog({ type: null, user: null })}
        >
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Block User</DialogTitle>
              <DialogDescription className="text-gray-400">
                This will prevent the user from accessing the platform. Please provide a reason.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason" className="text-gray-300">Reason for blocking</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for blocking this user..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActionDialog({ type: null, user: null })}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => actionDialog.user && handleUserAction('block', actionDialog.user)}
                disabled={!actionReason.trim() || actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? 'Blocking...' : 'Block User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog 
          open={actionDialog.type === 'unblock'} 
          onOpenChange={() => setActionDialog({ type: null, user: null })}
        >
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Unblock User</DialogTitle>
              <DialogDescription className="text-gray-400">
                This will restore the user's access to the platform.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActionDialog({ type: null, user: null })}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => actionDialog.user && handleUserAction('unblock', actionDialog.user)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? 'Unblocking...' : 'Unblock User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}