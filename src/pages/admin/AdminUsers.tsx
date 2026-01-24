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
  UserX,
  UserCheck,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get owners and booking counts
      const [rolesResult, bookingsResult] = await Promise.all([
        supabase.from('user_roles').select('user_id, salon_id, role').eq('role', 'owner'),
        supabase.from('bookings').select('user_id'),
      ]);

      // Get salon names for owners
      const salonIds = rolesResult.data?.map(r => r.salon_id) || [];
      const { data: salonsData } = salonIds.length > 0
        ? await supabase.from('salons').select('id, name').in('id', salonIds)
        : { data: [] };

      const salonsMap = new Map((salonsData || []).map(s => [s.id, s.name]));
      const ownersMap = new Map(rolesResult.data?.map(r => [r.user_id, r.salon_id]));

      // Count bookings per user
      const bookingCounts = new Map<string, number>();
      bookingsResult.data?.forEach(b => {
        bookingCounts.set(b.user_id, (bookingCounts.get(b.user_id) || 0) + 1);
      });

      const enrichedUsers = profilesData?.map(user => ({
        ...user,
        booking_count: bookingCounts.get(user.user_id) || 0,
        is_owner: ownersMap.has(user.user_id),
        salon_name: salonsMap.get(ownersMap.get(user.user_id) || ''),
      })) || [];

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
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
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    
    if (typeFilter === "all") return matchesSearch;
    if (typeFilter === "owners") return matchesSearch && user.is_owner;
    if (typeFilter === "customers") return matchesSearch && !user.is_owner;
    
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage customers and salon owners</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{users.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Salon Owners</p>
                  <p className="text-3xl font-bold">{users.filter(u => u.is_owner).length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-3xl font-bold">{users.filter(u => !u.is_owner).length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="owners">Salon Owners</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All ({users.length})</TabsTrigger>
            <TabsTrigger value="owners">Owners ({users.filter(u => u.is_owner).length})</TabsTrigger>
            <TabsTrigger value="customers">Customers ({users.filter(u => !u.is_owner).length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Users className="h-12 w-12 mb-3 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || 'Unknown'}</p>
                            {user.salon_name && (
                              <p className="text-sm text-muted-foreground">{user.salon_name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        {user.is_owner ? (
                          <Badge className="bg-accent/10 text-accent border-0">Owner</Badge>
                        ) : (
                          <Badge variant="secondary">Customer</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{user.booking_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setShowDetailsDialog(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
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
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || ''} />
                  <AvatarFallback className="text-lg">{getInitials(selectedUser.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.full_name || 'Unknown'}</h3>
                  {selectedUser.is_owner ? (
                    <Badge className="bg-accent/10 text-accent border-0">Salon Owner</Badge>
                  ) : (
                    <Badge variant="secondary">Customer</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Bookings</Label>
                  <p className="font-medium">{selectedUser.booking_count}</p>
                </div>
                {selectedUser.salon_name && (
                  <div>
                    <Label className="text-muted-foreground">Salon</Label>
                    <p className="font-medium">{selectedUser.salon_name}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium">{format(new Date(selectedUser.created_at), 'PPP')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}