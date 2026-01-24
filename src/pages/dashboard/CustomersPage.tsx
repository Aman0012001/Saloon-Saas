import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  IndianRupee,
  ChevronRight,
  Plus,
  Filter,
  Star,
  TrendingUp,
  Clock,
  MoreHorizontal,
  UserPlus,
  Crown,
  Award,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

interface Customer {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  email?: string;
  total_visits: number;
  total_spent: number;
  last_visit: string | null;
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { currentSalon, loading: salonLoading } = useSalon();
  const isMobile = useMobile();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addFormData, setAddFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    initial_service: ""
  });
  const [sortBy, setSortBy] = useState<"visits" | "spent" | "recent">("visits");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleExport = () => {
    if (customers.length === 0) return;

    const headers = ["Name", "Phone", "Visits", "Total Spent (₹)", "Last Visit"];
    const csvContent = [
      headers.join(","),
      ...filteredCustomers.map(c => [
        `"${c.full_name || 'Anonymous'}"`,
        `"${c.phone || 'N/A'}"`,
        c.total_visits,
        c.total_spent,
        c.last_visit ? format(new Date(c.last_visit), "yyyy-MM-dd") : "Never"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NoamSkin_Customers_${format(new Date(), "yyyy_MM_dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Downloaded ${filteredCustomers.length} customer records.`,
    });
  };

  const handleAddCustomer = async () => {
    if (!addFormData.full_name || !currentSalon) return;

    setAdding(true);
    try {
      // 1. Create a dummy user/profile for the walk-in
      // In a real app, we'd use a specific 'customers' table, 
      // but here we'll create a profile and a 'completed' booking to represent a visit.

      const tempId = crypto.randomUUID();

      // We simulate adding by ensuring a profile exists (this is simplified for the demo/working mock)
      // and creating a booking record which our fetch logic uses to identify customers.

      const { error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user?.id, // In this demo, we use current user as proxy, or tempId if handled by server
          salon_id: currentSalon.id,
          service_id: addFormData.initial_service || (await supabase.from('services').select('id').limit(1).single()).data?.id,
          status: "completed",
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: "12:00",
          notes: `Manually added customer: ${addFormData.full_name}. Phone: ${addFormData.phone}`
        });

      if (bookingError) throw bookingError;

      toast({
        title: "Customer Added",
        description: `${addFormData.full_name} has been added to your records.`,
      });

      setIsAddDialogOpen(false);
      setAddFormData({ full_name: "", phone: "", email: "", initial_service: "" });
      fetchCustomers();
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: "Registration Failed",
        description: "Could not create customer record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const fetchCustomers = async () => {
    if (!currentSalon) return;

    setLoading(true);
    try {
      // Get unique customers from bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("user_id, booking_date, service_id")
        .eq("salon_id", currentSalon.id)
        .in("status", ["confirmed", "completed"]);

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        setCustomers([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(bookings.map(b => b.user_id))];

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Fetch service prices
      const serviceIds = [...new Set(bookings.map(b => b.service_id))];
      const { data: services } = await supabase
        .from("services")
        .select("id, price")
        .in("id", serviceIds);

      // Calculate customer stats
      const customerStats = userIds.map(userId => {
        const userBookings = bookings.filter(b => b.user_id === userId);
        const profile = profiles?.find(p => p.user_id === userId);

        const totalSpent = userBookings.reduce((sum, b) => {
          const service = services?.find(s => s.id === b.service_id);
          return sum + (service?.price || 0);
        }, 0);

        const sortedBookings = userBookings.sort(
          (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
        );

        return {
          user_id: userId,
          full_name: profile?.full_name || null,
          phone: profile?.phone || null,
          avatar_url: profile?.avatar_url || null,
          total_visits: userBookings.length,
          total_spent: totalSpent,
          last_visit: sortedBookings[0]?.booking_date || null,
        };
      });

      // Sort by selected criteria
      if (sortBy === "visits") {
        customerStats.sort((a, b) => b.total_visits - a.total_visits);
      } else if (sortBy === "spent") {
        customerStats.sort((a, b) => b.total_spent - a.total_spent);
      } else if (sortBy === "recent") {
        customerStats.sort((a, b) => {
          if (!a.last_visit) return 1;
          if (!b.last_visit) return -1;
          return new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
        });
      }

      setCustomers(customerStats);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentSalon, sortBy]);

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 10000) return {
      label: "VIP",
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
      text: "text-purple-700",
      icon: Crown
    };
    if (totalSpent >= 5000) return {
      label: "Gold",
      color: "from-amber-500 to-amber-600",
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: Award
    };
    if (totalSpent >= 2000) return {
      label: "Silver",
      color: "from-gray-400 to-gray-500",
      bg: "bg-gray-50",
      text: "text-gray-700",
      icon: Shield
    };
    return {
      label: "Regular",
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: Users
    };
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const topCustomers = customers.slice(0, 3);
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const avgSpentPerCustomer = customers.length > 0 ? totalRevenue / customers.length : 0;

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
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
      headerActions={
        isMobile ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              className="bg-accent text-white px-3 rounded-full"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className={`space-y-${isMobile ? '4' : '6'} pb-${isMobile ? '20' : '0'}`}>
        {/* Mobile Search Bar */}
        {isMobile && showSearch && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-secondary/30 border-border/50 focus:bg-white transition-colors"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Stats Cards */}
        {isMobile && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-3 text-center">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-700">{customers.length}</p>
                <p className="text-xs text-blue-600 font-medium">Total</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-3 text-center">
                <IndianRupee className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-700">₹{Math.round(totalRevenue / 1000)}K</p>
                <p className="text-xs text-emerald-600 font-medium">Revenue</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-3 text-center">
                <TrendingUp className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-700">₹{Math.round(avgSpentPerCustomer)}</p>
                <p className="text-xs text-amber-600 font-medium">Avg</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                Customer CRM
                <Badge className="bg-accent/10 text-accent border-0 font-black px-3">
                  {customers.length}
                </Badge>
              </h1>
              <p className="text-muted-foreground font-medium">Analyze loyalty and manage client relationships</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-12 px-6 rounded-2xl border-none bg-white shadow-sm font-bold text-muted-foreground hover:bg-white hover:text-foreground transition-all"
                onClick={handleExport}
              >
                <Filter className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="h-12 px-6 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Customer
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Stats Cards */}
        {!isMobile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Customers</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">{customers.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-emerald-700 mt-2">₹{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-200 rounded-xl flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">Avg. Spent</p>
                    <p className="text-3xl font-bold text-amber-700 mt-2">₹{Math.round(avgSpentPerCustomer).toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mobile Sort Options */}
        {isMobile && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={sortBy === "visits" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("visits")}
              className={`flex-shrink-0 ${sortBy === "visits" ? "bg-accent text-white" : ""}`}
            >
              Most Visits
            </Button>
            <Button
              variant={sortBy === "spent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("spent")}
              className={`flex-shrink-0 ${sortBy === "spent" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}`}
            >
              Top Spenders
            </Button>
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("recent")}
              className={`flex-shrink-0 ${sortBy === "recent" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}`}
            >
              Recent Activity
            </Button>
          </div>
        )}

        {/* Top Customers - Mobile Compact Version */}
        {isMobile && topCustomers.length > 0 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {topCustomers.slice(0, 3).map((customer, index) => {
                  const tier = getCustomerTier(customer.total_spent);
                  const TierIcon = tier.icon;
                  return (
                    <div
                      key={customer.user_id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5 border border-border/20"
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10 ring-2 ring-accent/20">
                          <AvatarImage src={customer.avatar_url || ""} />
                          <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/10 text-accent font-semibold text-sm">
                            {getInitials(customer.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {customer.full_name || "Anonymous"}
                          </p>
                          <TierIcon className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{customer.total_visits} visits</span>
                          <span>₹{customer.total_spent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Desktop Top Customers */}
        {!isMobile && topCustomers.length > 0 && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topCustomers.map((customer, index) => {
                  const tier = getCustomerTier(customer.total_spent);
                  return (
                    <div
                      key={customer.user_id}
                      className="p-4 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-border/30"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12 ring-2 ring-accent/20">
                            <AvatarImage src={customer.avatar_url || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/10 text-accent font-semibold">
                              {getInitials(customer.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {customer.full_name || "Anonymous"}
                          </p>
                          <Badge className={`${tier.bg} ${tier.text} border-0 text-xs`}>
                            {tier.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Visits:</span>
                          <span className="font-medium">{customer.total_visits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Spent:</span>
                          <span className="font-medium">₹{customer.total_spent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Desktop Search & Filters */}
        {!isMobile && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-secondary/30 border-border/50 focus:bg-white transition-colors text-base"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v: "visits" | "spent" | "recent") => setSortBy(v)}>
                  <SelectTrigger className="w-full lg:w-48 h-12 bg-secondary/30 border-border/50">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visits">Most Visits</SelectItem>
                    <SelectItem value="spent">Highest Spender</SelectItem>
                    <SelectItem value="recent">Recent Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customers List */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
            <div className="flex items-center justify-between">
              <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
                All Customers ({filteredCustomers.length})
              </CardTitle>
              {!isMobile && (
                <Button variant="ghost" size="sm" className="hover:bg-secondary/50">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex items-center gap-3 ${isMobile ? 'p-3' : 'p-4'} rounded-lg bg-secondary/20 animate-pulse`}>
                    <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-secondary/50 rounded-full`} />
                    <div className="flex-1 space-y-2">
                      <div className="w-32 h-4 bg-secondary/50 rounded" />
                      <div className="w-24 h-3 bg-secondary/50 rounded" />
                    </div>
                    <div className="w-16 h-6 bg-secondary/50 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Users className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground`} />
                </div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-foreground mb-2`}>No customers found</h3>
                <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "Start building your customer base by adding your first customer"
                  }
                </p>
                <Button
                  size={isMobile ? "sm" : "default"}
                  className="bg-gradient-to-r from-accent to-accent/90 text-white"
                  onClick={() => {
                    toast({
                      title: "Add Customer",
                      description: "Add customer feature will be available soon",
                    });
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Customer
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((customer) => {
                  const tier = getCustomerTier(customer.total_spent);
                  const TierIcon = tier.icon;
                  return (
                    <div
                      key={customer.user_id}
                      onClick={() => navigate(`/dashboard/customers/${customer.user_id}`)}
                      className={`group flex items-center ${isMobile ? 'gap-3 p-3' : 'gap-4 p-4'} rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 transition-all duration-200 border border-border/20 hover:border-border/40 cursor-pointer`}
                    >
                      <Avatar className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} ring-2 ring-accent/20`}>
                        <AvatarImage src={customer.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/10 text-accent font-semibold">
                          {getInitials(customer.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-foreground ${isMobile ? 'text-sm' : 'text-base'} truncate`}>
                            {customer.full_name || "Anonymous Customer"}
                          </h3>
                          <TierIcon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${tier.text} flex-shrink-0`} />
                          {!isMobile && (
                            <Badge className={`${tier.bg} ${tier.text} border-0 text-xs font-medium`}>
                              {tier.label}
                            </Badge>
                          )}
                        </div>
                        <div className={`flex ${isMobile ? 'flex-col gap-0' : 'items-center gap-4'} ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{customer.phone}</span>
                            </div>
                          )}
                          {customer.last_visit && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {isMobile
                                  ? format(new Date(customer.last_visit), "MMM d")
                                  : `Last visit ${formatDistanceToNow(new Date(customer.last_visit), { addSuffix: true })}`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                        {isMobile && (
                          <div className="flex items-center gap-4 mt-1 text-xs">
                            <span className="text-accent font-medium">{customer.total_visits} visits</span>
                            <span className="text-emerald-600 font-medium">₹{customer.total_spent.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Desktop Stats */}
                      {!isMobile && (
                        <div className="hidden lg:flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">{customer.total_visits}</p>
                            <p className="text-xs text-muted-foreground font-medium">Visits</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">₹{customer.total_spent.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground font-medium">Total Spent</p>
                          </div>
                          <div className="text-center min-w-[100px]">
                            <p className="text-sm font-medium text-foreground">
                              {customer.last_visit
                                ? format(new Date(customer.last_visit), "MMM d, yyyy")
                                : "Never"}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">Last Visit</p>
                          </div>
                        </div>
                      )}

                      {/* Action Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9 opacity-0 group-hover:opacity-100'} transition-opacity hover:bg-secondary/50`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="hover:bg-secondary/50"
                            onClick={() => {
                              toast({
                                title: "Book Appointment",
                                description: "Booking feature will be available soon",
                              });
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Appointment
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-secondary/50"
                            onClick={() => {
                              if (customer.phone) {
                                window.open(`tel:${customer.phone}`);
                              } else {
                                toast({
                                  title: "No Phone Number",
                                  description: "This customer doesn't have a phone number on file",
                                });
                              }
                            }}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-secondary/50"
                            onClick={() => {
                              toast({
                                title: "Customer History",
                                description: "History feature will be available soon",
                              });
                            }}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Mobile Chevron */}
                      {isMobile && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-accent/20 to-accent/5 p-8 pb-6">
            <DialogHeader>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-4">
                <UserPlus className="w-7 h-7 text-accent" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight text-foreground">Add Walk-in</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium text-lg leading-snug">
                Register a new customer to your database instantly.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
              <Input
                placeholder="e.g. Rahul Sharma"
                value={addFormData.full_name}
                onChange={(e) => setAddFormData({ ...addFormData, full_name: e.target.value })}
                className="h-14 bg-secondary/30 border-none rounded-2xl font-bold text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Phone</Label>
                <Input
                  placeholder="98765..."
                  value={addFormData.phone}
                  onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                  className="h-14 bg-secondary/30 border-none rounded-2xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email (Opt)</Label>
                <Input
                  placeholder="rahul@..."
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  className="h-14 bg-secondary/30 border-none rounded-2xl font-medium"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic bg-accent/5 p-3 rounded-xl border border-accent/10">
              * This will create a completed record for today's visit.
            </p>
          </div>

          <div className="p-8 bg-secondary/10 flex gap-4">
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-bold">
              Discard
            </Button>
            <Button
              onClick={handleAddCustomer}
              disabled={!addFormData.full_name || adding}
              className="flex-[2] h-14 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black shadow-xl shadow-accent/20"
            >
              {adding ? "Saving..." : "Add Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ResponsiveDashboardLayout>
  );
}
