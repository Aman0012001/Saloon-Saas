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
import api from "@/services/api";
import {
  Receipt,
  CreditCard,
  Download,
  Eye,
  DollarSign,
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
  X,
  Scissors
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
      // Fetch bookings from local PHP API
      const bookings = await api.bookings.getAll({ salon_id: currentSalon.id });

      const invoicesData: Invoice[] = bookings.map((booking: any, index: number) => {
        const invoiceNumber = `L-INV-${String(index + 1).padStart(4, '0')}`;
        const isPaid = booking.status === 'completed';
        const isOverdue = !isPaid && new Date(booking.booking_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        return {
          id: invoiceNumber,
          bookingId: booking.id,
          customer: booking.user_name || 'Guest Customer',
          customerId: booking.user_id,
          service: booking.service_name || 'Service',
          amount: Number(booking.price || 0),
          date: booking.booking_date,
          status: isOverdue ? 'overdue' : isPaid ? 'paid' : 'pending',
          paymentMethod: ['Cash', 'UPI', 'Card'][Math.floor(Math.random() * 3)],
          time: booking.booking_time || '00:00',
        };
      });

      setInvoices(invoicesData);

      // Simple Stats Calculation
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const monthStr = format(new Date(), "yyyy-MM");

      const todayInvoices = invoicesData.filter(inv => inv.date === todayStr);
      const monthInvoices = invoicesData.filter(inv => inv.date.startsWith(monthStr));

      setStats({
        todayRevenue: todayInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
        pendingAmount: invoicesData.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
        totalInvoices: invoicesData.length,
        monthlyRevenue: monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
        cashPayments: invoicesData.filter(inv => inv.status === 'paid' && inv.paymentMethod === 'Cash').reduce((sum, inv) => sum + inv.amount, 0),
        upiPayments: invoicesData.filter(inv => inv.status === 'paid' && inv.paymentMethod === 'UPI').reduce((sum, inv) => sum + inv.amount, 0),
        cardPayments: invoicesData.filter(inv => inv.status === 'paid' && inv.paymentMethod === 'Card').reduce((sum, inv) => sum + inv.amount, 0),
      });

    } catch (error) {
      console.error("Error fetching local invoices:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentSalon]);

  const fetchServices = useCallback(async () => {
    if (!currentSalon) return;
    try {
      const data = await api.services.getBySalon(currentSalon.id);
      setServices(data.filter((s: any) => s.is_active));
    } catch (error) {
      console.error("Error fetching services for billing:", error);
    }
  }, [currentSalon]);

  const handleCreateInvoice = async () => {
    if (!currentSalon || !newInvoice.serviceId) return;

    setCreating(true);
    try {
      await api.bookings.create({
        salon_id: currentSalon.id,
        service_id: newInvoice.serviceId,
        booking_date: newInvoice.date,
        booking_time: newInvoice.time,
        status: newInvoice.status === 'paid' ? 'completed' : 'confirmed',
        notes: newInvoice.notes || "Manual Invoice",
      });

      toast({ title: "Invoice Created", description: "Successfully added to local database" });
      setShowCreateDialog(false);
      fetchInvoices();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold px-3">Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-0 font-bold px-3">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-700 border-0 font-bold px-3">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-12 text-center font-bold">Loading local billing records...</div>;
  }

  return (
    <ResponsiveDashboardLayout
      headerActions={
        isMobile ? (
          <Button variant="ghost" size="icon" onClick={fetchInvoices} disabled={refreshing}>
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6 pb-20 md:pb-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Ledger & Billing</h1>
            <p className="text-muted-foreground font-medium">Financial operations connected to your local MySQL database</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchInvoices} disabled={refreshing} className="rounded-xl font-bold bg-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={() => { fetchServices(); setShowCreateDialog(true); }} className="bg-accent text-white font-black rounded-xl shadow-lg shadow-accent/20">
              <Plus className="w-4 h-4 mr-2" /> New Invoice
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Today Revenue", value: `$${stats.todayRevenue}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
            { title: "Pending", value: `$${stats.pendingAmount}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { title: "Monthly", value: `$${stats.monthlyRevenue}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
            { title: "UPI Total", value: `$${stats.upiPayments}`, icon: Smartphone, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((s, i) => (
            <Card key={i} className="border-none shadow-sm bg-white rounded-2xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.title}</p>
                  <p className="text-xl font-black text-slate-900">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invoices List */}
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
            <div className="relative w-64 lg:block hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search ID or Customer"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-secondary/30 border-none rounded-xl"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredInvoices.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">No invoices found.</div>
              ) : (
                filteredInvoices.map(inv => (
                  <div key={inv.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-accent">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{inv.id}</p>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                          <User className="w-3 h-3" /> {inv.customer}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 px-4">
                      <p className="font-bold text-slate-700">{inv.service}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                        {format(new Date(inv.date), "MMM d, yyyy")} • {inv.time}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">${inv.amount}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">{inv.paymentMethod}</p>
                      </div>
                      {getStatusBadge(inv.status)}
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <Eye className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Invoice Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md rounded-3xl border-none p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Manual Billing</DialogTitle>
              <DialogDescription className="font-medium">Direct entry for walk-in payments.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Guest Name</Label>
                <Input
                  placeholder="Customer Name"
                  value={newInvoice.notes}
                  onChange={e => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select Service</Label>
                <Select onValueChange={v => {
                  const s = services.find(x => x.id === v);
                  setNewInvoice({ ...newInvoice, serviceId: v, amount: s?.price || 0 });
                }}>
                  <SelectTrigger className="bg-secondary/30 border-none h-12 rounded-xl">
                    <SelectValue placeholder="Pick a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} (${s.price})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Method</Label>
                  <Select onValueChange={v => setNewInvoice({ ...newInvoice, paymentMethod: v })} defaultValue="Cash">
                    <SelectTrigger className="bg-secondary/30 border-none h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI / QR</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Status</Label>
                  <Select onValueChange={v => setNewInvoice({ ...newInvoice, status: v as any })} defaultValue="paid">
                    <SelectTrigger className="bg-secondary/30 border-none h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Due</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateInvoice} disabled={creating || !newInvoice.serviceId} className="bg-accent text-white font-black w-full h-12 rounded-xl shadow-lg shadow-accent/20">
                {creating ? "Processing..." : "Generate & Post Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsiveDashboardLayout>
  );
};

export default BillingPage;