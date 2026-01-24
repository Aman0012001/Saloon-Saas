import { useState, useEffect, useCallback } from "react";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useSalon } from "@/hooks/useSalon";
import { supabase } from "@/integrations/supabase/client";
import {
  Receipt,
  CreditCard,
  Download,
  Eye,
  IndianRupee,
  Calendar,
  TrendingUp,
  FileText,
  Search,
  Plus,
  Smartphone,
  Banknote,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  User,
  X
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

interface Invoice {
  id: string;
  bookingId: string;
  customer: string;
  customerId: string;
  service: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod: string;
  time: string;
}

interface PaymentStats {
  todayRevenue: number;
  pendingAmount: number;
  totalInvoices: number;
  monthlyRevenue: number;
  cashPayments: number;
  upiPayments: number;
  cardPayments: number;
}

const BillingPage = () => {
  const [activeTab, setActiveTab] = useState("invoices");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<PaymentStats>({
    todayRevenue: 0,
    pendingAmount: 0,
    totalInvoices: 0,
    monthlyRevenue: 0,
    cashPayments: 0,
    upiPayments: 0,
    cardPayments: 0,
  });

  // Create Invoice Dialog State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [newInvoice, setNewInvoice] = useState({
    customerId: "",
    serviceId: "",
    amount: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    paymentMethod: "Cash",
    status: "paid" as 'paid' | 'pending',
    notes: "",
  });

  const isMobile = useMobile();
  const { toast } = useToast();
  const { currentSalon } = useSalon();

  const fetchInvoices = useCallback(async () => {
    if (!currentSalon) return;

    setRefreshing(true);
    try {
      // Fetch all completed bookings for the salon
      // 1. Fetch bookings first
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          user_id,
          service_id,
          booking_date,
          booking_time,
          status,
          created_at,
          service:services(name, price)
        `)
        .eq("salon_id", currentSalon.id)
        .in("status", ["completed", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (bookingsError) throw bookingsError;

      // 2. Extract unique user IDs
      const userIds = [...new Set((bookingsData || []).map(b => b.user_id))];

      // 3. Fetch profiles explicitly (Manual Join)
      // This bypasses the "Could not find relationship" error if FK is missing/unnamed
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", userIds);

        if (!profilesError && profilesData) {
          profilesData.forEach(p => profilesMap.set(p.user_id, p));
        } else {
          console.warn("Could not fetch profiles for invoices (RLS likely):", profilesError);
        }
      }

      // 4. Merge Data
      const invoicesData: Invoice[] = (bookingsData || []).map((booking: any, index: number) => {
        const invoiceNumber = `INV-${String(index + 1).padStart(4, '0')}`;
        const bookingDate = new Date(booking.booking_date);
        const isPaid = booking.status === 'completed';
        const isOverdue = !isPaid && bookingDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const customerProfile = profilesMap.get(booking.user_id);

        return {
          id: invoiceNumber,
          bookingId: booking.id,
          customer: customerProfile?.full_name || 'Unknown Customer',
          customerId: booking.user_id,
          service: booking.service?.name || 'Service',
          amount: booking.service?.price || 0,
          date: booking.booking_date,
          status: isOverdue ? 'overdue' : isPaid ? 'paid' : 'pending',
          paymentMethod: getRandomPaymentMethod(),
          time: booking.booking_time || '00:00',
        };
      });

      setInvoices(invoicesData);

      // Calculate statistics
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const todayInvoices = invoicesData.filter(inv =>
        new Date(inv.date) >= todayStart && new Date(inv.date) <= todayEnd
      );

      const monthInvoices = invoicesData.filter(inv =>
        new Date(inv.date) >= monthStart && new Date(inv.date) <= monthEnd
      );

      const paidInvoices = invoicesData.filter(inv => inv.status === 'paid');
      const pendingInvoices = invoicesData.filter(inv => inv.status === 'pending');

      setStats({
        todayRevenue: todayInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
        pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        totalInvoices: invoicesData.length,
        monthlyRevenue: monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
        cashPayments: paidInvoices.filter(inv => inv.paymentMethod === 'Cash').reduce((sum, inv) => sum + inv.amount, 0),
        upiPayments: paidInvoices.filter(inv => inv.paymentMethod === 'UPI').reduce((sum, inv) => sum + inv.amount, 0),
        cardPayments: paidInvoices.filter(inv => inv.paymentMethod === 'Card').reduce((sum, inv) => sum + inv.amount, 0),
      });

    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentSalon, toast]);

  // Helper function to randomly assign payment methods (in real app, this would come from database)
  const getRandomPaymentMethod = () => {
    const methods = ['Cash', 'UPI', 'Card'];
    return methods[Math.floor(Math.random() * methods.length)];
  };

  // Fetch customers for the dropdown
  const fetchCustomers = useCallback(async () => {
    // Note: We don't check currentSalon here because we want to find ALL potential customers in the system
    // The RLS policy we added ensures we can see profiles.

    try {
      // Simplify query to avoid TS deep instantiation issues
      const query = supabase
        .from("profiles")
        .select("user_id, full_name, phone");

      // Conditionally add filter if needed, but for now keep it simple to fix TS
      // query.eq('user_type', 'customer');

      const { data: profilesData, error: profilesError } = await query.order('full_name');

      if (profilesError) throw profilesError;

      setCustomers(
        (profilesData || []).map(p => ({
          id: p.user_id,
          name: p.full_name || 'Unknown',
          phone: p.phone || '',
        }))
      );
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customer list",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch services for the dropdown
  const fetchServices = useCallback(async () => {
    if (!currentSalon) return;

    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price")
        .eq("salon_id", currentSalon.id)
        .eq("is_active", true);

      if (error) throw error;

      setServices(
        (data || []).map(s => ({
          id: s.id,
          name: s.name || 'Service',
          price: s.price || 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  }, [currentSalon]);

  // Handle create invoice
  const handleCreateInvoice = async () => {
    if (!currentSalon) return;

    // Validation
    if (!newInvoice.customerId) {
      toast({
        title: "Validation Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (!newInvoice.serviceId) {
      toast({
        title: "Validation Error",
        description: "Please select a service",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Create a booking entry which will generate the invoice
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: newInvoice.customerId,
          service_id: newInvoice.serviceId,
          salon_id: currentSalon.id,
          booking_date: newInvoice.date,
          booking_time: newInvoice.time,
          status: newInvoice.status === 'paid' ? 'completed' : 'confirmed',
          notes: newInvoice.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Invoice Created",
        description: "Invoice has been created successfully",
      });

      // Reset form
      setNewInvoice({
        customerId: "",
        serviceId: "",
        amount: 0,
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "HH:mm"),
        paymentMethod: "Cash",
        status: "paid",
        notes: "",
      });

      setShowCreateDialog(false);

      // Refresh invoices
      fetchInvoices();
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle service selection - auto-fill amount
  const handleServiceChange = (serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId);
    setNewInvoice({
      ...newInvoice,
      serviceId,
      amount: selectedService?.price || 0,
    });
  };

  // Open create dialog and fetch data
  const handleOpenCreateDialog = () => {
    fetchCustomers();
    fetchServices();
    setShowCreateDialog(true);
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border-0 font-medium text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 hover:text-amber-900 border font-medium text-xs shadow-none">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-0 font-medium text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "upi":
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case "cash":
        return <Banknote className="w-4 h-4 text-green-600" />;
      case "card":
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return <Receipt className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", invoice.bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invoice ${invoiceId} marked as paid`,
      });

      // Refresh invoices
      fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Download Invoice",
      description: `Downloading invoice ${invoiceId}...`,
    });
    // In real app, generate PDF here
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsCards = [
    {
      title: "Today's Revenue",
      value: `₹${stats.todayRevenue.toLocaleString()}`,
      change: "+12%",
      icon: IndianRupee,
      color: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      textColor: "text-emerald-700"
    },
    {
      title: "Pending Payments",
      value: `₹${stats.pendingAmount.toLocaleString()}`,
      change: "-5%",
      icon: Clock,
      color: "from-amber-500 to-amber-600",
      bg: "bg-amber-50",
      textColor: "text-amber-700"
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices.toString(),
      change: "+8%",
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "This Month",
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      change: "+15%",
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
      textColor: "text-purple-700"
    }
  ];

  if (loading) {
    return (
      <ResponsiveDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </ResponsiveDashboardLayout>
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
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={fetchInvoices}
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
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
                  placeholder="Search invoices..."
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
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-3 text-center">
                <IndianRupee className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-700">₹{(stats.todayRevenue / 1000).toFixed(1)}K</p>
                <p className="text-xs text-emerald-600 font-medium">Today</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-3 text-center">
                <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-700">₹{(stats.pendingAmount / 1000).toFixed(1)}K</p>
                <p className="text-xs text-amber-600 font-medium">Pending</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-3 text-center">
                <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-700">{stats.totalInvoices}</p>
                <p className="text-xs text-blue-600 font-medium">Invoices</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-3 text-center">
                <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-purple-700">₹{(stats.monthlyRevenue / 1000).toFixed(1)}K</p>
                <p className="text-xs text-purple-600 font-medium">Month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Billing & Payments</h1>
              <p className="text-muted-foreground">
                Manage invoices, payments, and financial records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchInvoices}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                className="bg-accent hover:bg-accent/90 gap-2"
                onClick={handleOpenCreateDialog}
              >
                <Plus className="w-4 h-4" />
                New Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast({
                    title: "Export Feature",
                    description: "Export all invoices to Excel/PDF",
                  });
                }}
              >
                <Download className="w-4 h-4" />
                Export All
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Stats Grid */}
        {!isMobile && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => (
              <Card key={index} className="border-border shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-sage" />
                    <span className="text-sage">{stat.change}</span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mobile Tab Filters */}
        {isMobile && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={activeTab === "invoices" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("invoices")}
              className={`flex-shrink-0 ${activeTab === "invoices" ? "bg-accent text-white" : ""}`}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Invoices
            </Button>
            <Button
              variant={activeTab === "payments" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("payments")}
              className={`flex-shrink-0 ${activeTab === "payments" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}`}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Payments
            </Button>
            <Button
              variant={activeTab === "reports" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("reports")}
              className={`flex-shrink-0 ${activeTab === "reports" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="invoices" className="space-y-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
                      All Invoices ({filteredInvoices.length})
                    </CardTitle>
                    {!isMobile && (
                      <CardDescription>
                        Manage and track all your invoices
                      </CardDescription>
                    )}
                  </div>
                  {!isMobile && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        toast({
                          title: "Export Invoices",
                          description: "Exporting invoices to PDF...",
                        });
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
                {/* Desktop Search */}
                {!isMobile && (
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 bg-secondary/30 border-border/50 focus:bg-white transition-colors"
                    />
                  </div>
                )}

                {filteredInvoices.length === 0 ? (
                  <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                    <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Receipt className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground`} />
                    </div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-foreground mb-2`}>No invoices found</h3>
                    <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
                      {searchQuery
                        ? "Try adjusting your search criteria"
                        : "Complete bookings to generate invoices"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className={`group ${isMobile ? 'p-4 rounded-xl bg-white border border-border/30 shadow-sm' : 'flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 transition-all duration-200 border border-border/20 hover:border-border/40'}`}
                      >
                        {isMobile ? (
                          // Mobile Layout - Card Style
                          <div className="space-y-3">
                            {/* Header Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center border border-accent/20">
                                  <Receipt className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground text-sm">{invoice.id}</p>
                                  <div className="flex items-center gap-2">
                                    {getPaymentMethodIcon(invoice.paymentMethod)}
                                    <span className="text-xs text-muted-foreground">{invoice.paymentMethod}</span>
                                  </div>
                                </div>
                              </div>
                              {getStatusBadge(invoice.status)}
                            </div>

                            {/* Customer & Service Info */}
                            <div className="bg-secondary/20 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-sm mb-1">{invoice.customer}</p>
                                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{invoice.service}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(invoice.date), 'MMM dd, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {invoice.time}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right ml-3">
                                  <p className="text-xl font-bold text-foreground">₹{invoice.amount.toLocaleString()}</p>
                                  <p className="text-xs text-muted-foreground">Amount</p>
                                </div>
                              </div>
                            </div>

                            {/* Action Row */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/20">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => handleDownloadInvoice(invoice.id)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                {invoice.status === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleMarkAsPaid(invoice.id)}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Mark Paid
                                  </Button>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleDownloadInvoice(invoice.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Desktop Layout - Horizontal
                          <>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center border border-accent/20">
                                <Receipt className="w-5 h-5 text-accent" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-foreground text-base">{invoice.id}</p>
                                  {getPaymentMethodIcon(invoice.paymentMethod)}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{invoice.customer}</p>
                                <p className="text-sm text-muted-foreground truncate">{invoice.service}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-medium text-foreground">₹{invoice.amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
                                <p className="text-xs text-muted-foreground">{invoice.paymentMethod}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                {getStatusBadge(invoice.status)}
                                {invoice.status === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 font-medium"
                                    onClick={() => handleMarkAsPaid(invoice.id)}
                                  >
                                    Mark Paid
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                  onClick={() => handleDownloadInvoice(invoice.id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
                <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Payment Breakdown</CardTitle>
                {!isMobile && (
                  <CardDescription>
                    Payment methods and transaction details
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-3 gap-4'}`}>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} border border-border rounded-lg bg-gradient-to-r from-green-50 to-green-100`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Banknote className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-700">Cash</span>
                      </div>
                      <span className="text-lg font-bold text-green-700">₹{stats.cashPayments.toLocaleString()}</span>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-600`}>Cash payments received</p>
                  </div>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} border border-border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-700">UPI</span>
                      </div>
                      <span className="text-lg font-bold text-blue-700">₹{stats.upiPayments.toLocaleString()}</span>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600`}>PhonePe, GPay, Paytm</p>
                  </div>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} border border-border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-700">Cards</span>
                      </div>
                      <span className="text-lg font-bold text-purple-700">₹{stats.cardPayments.toLocaleString()}</span>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-600`}>Credit & Debit cards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
                <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Financial Reports</CardTitle>
                {!isMobile && (
                  <CardDescription>
                    Download detailed financial reports
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} border border-border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100`}>
                    <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'} mb-2 text-blue-700`}>Daily Sales Report</h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 mb-3`}>
                      Daily revenue and transaction summary
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-100"
                      onClick={() => {
                        toast({
                          title: "Download Report",
                          description: "Generating daily sales report...",
                        });
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} border border-border rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100`}>
                    <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'} mb-2 text-emerald-700`}>Monthly Report</h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-emerald-600 mb-3`}>
                      Comprehensive monthly financial overview
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => {
                        toast({
                          title: "Download Report",
                          description: "Generating monthly report...",
                        });
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDashboardLayout>
  );
};
export default BillingPage;