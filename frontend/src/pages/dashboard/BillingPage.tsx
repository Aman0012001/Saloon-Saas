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
  Wallet,
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
import { format } from "date-fns";

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
  customerEmail?: string;
  customerPhone?: string;
  discount: number;
  subtotal: number;
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

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const isMobile = useMobile();
  const { toast } = useToast();
  const { currentSalon, loading: salonLoading } = useSalon();

  const handleDownloadPDF = () => {
    if (!selectedInvoice) return;
    window.print();
    toast({
      title: "Generating PDF",
      description: "Printing dialog opened for invoice " + selectedInvoice.id
    });
  };

  const handleDirectDownload = (inv: Invoice) => {
    setSelectedInvoice(inv);
    // Tiny delay to ensure the hidden print container has the right data
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleSendNotify = (type: 'sms' | 'whatsapp') => {
    if (!selectedInvoice) return;

    const phone = selectedInvoice.customerPhone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (!cleanPhone) {
      toast({
        title: "No Phone Number",
        description: "Customer does not have a phone number saved.",
        variant: "destructive"
      });
      return;
    }

    const message = `Hello ${selectedInvoice.customer}, your invoice for ${selectedInvoice.service} at ${currentSalon?.name} is ready. Total: RM ${selectedInvoice.amount}.`;

    const encodedMsg = encodeURIComponent(message);
    const url = type === 'whatsapp'
      ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
      : `sms:${cleanPhone}${isMobile ? '?' : '&'}body=${encodedMsg}`;

    window.open(url, '_blank');

    toast({
      title: "Notification Sent",
      description: `Opening ${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} to send details to ${selectedInvoice.customer}`
    });
  };

  const fetchInvoices = useCallback(async () => {
    if (!currentSalon) {
      if (!salonLoading) setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const bookings = await api.bookings.getAll({ salon_id: currentSalon.id });
      const bookingsArray = Array.isArray(bookings) ? bookings : [];

      const invoicesData: Invoice[] = bookingsArray.map((booking: any, index: number) => {
        const invoiceNumber = `L-INV-${String(index + 1).padStart(4, '0')}`;
        const isPaid = booking.status === 'completed';
        const isOverdue = !isPaid && new Date(booking.booking_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const customerName = booking.full_name || booking.notes || 'Guest Customer';

        return {
          id: invoiceNumber,
          bookingId: booking.id,
          customer: customerName,
          customerId: booking.user_id,
          service: booking.service_name || 'Service',
          amount: Number(booking.price || 0),
          date: booking.booking_date,
          status: isOverdue ? 'overdue' : isPaid ? 'paid' : 'pending',
          paymentMethod: ['Cash', 'UPI', 'Card', 'QR'][Math.floor(Math.random() * 4)],
          time: booking.booking_time || '00:00',
          customerEmail: booking.email || 'customer@example.com',
          customerPhone: booking.phone || '',
          discount: Number(booking.discount_amount || 0),
          subtotal: Number(booking.service_price || booking.price || 0),
        };
      });

      setInvoices(invoicesData);

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
        upiPayments: invoicesData.filter(inv => (inv.status === 'paid' && (inv.paymentMethod === 'UPI' || inv.paymentMethod === 'QR'))).reduce((sum, inv) => sum + inv.amount, 0),
        cardPayments: invoicesData.filter(inv => inv.status === 'paid' && inv.paymentMethod === 'Card').reduce((sum, inv) => sum + inv.amount, 0),
      });

    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentSalon, salonLoading]);

  const fetchServices = useCallback(async () => {
    if (!currentSalon) return;
    try {
      const data = await api.services.getBySalon(currentSalon.id);
      setServices(Array.isArray(data) ? data.filter((s: any) => s.is_active) : []);
    } catch (error) {
      console.error("Error fetching services:", error);
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

      toast({ title: "Invoice Created", description: "Successfully added to ledger" });
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
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold px-3 uppercase text-[9px] tracking-wider">Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-0 font-bold px-3 uppercase text-[9px] tracking-wider">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-700 border-0 font-bold px-3 uppercase text-[9px] tracking-wider">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || salonLoading) {
    return (
      <ResponsiveDashboardLayout showBackButton={true}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-lg shadow-accent/20" />
          <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Ledger...</p>
        </div>
      </ResponsiveDashboardLayout>
    );
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
      <div className="space-y-6 pb-10">
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
            { title: "Today Revenue", value: `RM ${stats.todayRevenue}`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
            { title: "Pending", value: `RM ${stats.pendingAmount}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { title: "Monthly", value: `RM ${stats.monthlyRevenue}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
            { title: "UPI Total", value: `RM ${stats.upiPayments}`, icon: Smartphone, color: "text-purple-600", bg: "bg-purple-50" },
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
                        <p className="text-lg font-black text-slate-900">RM {inv.amount}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">{inv.paymentMethod}</p>
                      </div>
                      <div className="min-w-20 text-center">
                        {getStatusBadge(inv.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-9 w-9 bg-white shadow-sm"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-9 w-9 bg-white shadow-sm hover:text-accent"
                          onClick={() => handleDirectDownload(inv)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-white rounded-3xl shadow-2xl">
            {selectedInvoice && (
              <div className="flex flex-col">
                <div className="p-8 md:p-12 space-y-12 text-sm text-[#444] print-only">
                  {/* Row 1: Logo and Title */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {currentSalon?.logo_url ? (
                        <img src={currentSalon.logo_url} className="w-24 h-auto object-contain" alt="Logo" />
                      ) : (
                        <div className="relative flex items-center justify-center w-16 h-16">
                          <span className="text-5xl font-black text-[#0066FF] leading-none">S</span>
                          <span className="text-5xl font-black text-[#0066FF] leading-none -ml-3 transform skew-x-[15deg] border-l-4 border-white pl-1">A</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Tax Invoice</h2>
                      <div className="space-y-1 text-slate-500 font-medium text-sm">
                        <p>Invoice no: <span className="text-slate-900">{selectedInvoice.id.replace('L-INV-', '')}</span></p>
                        <p>Invoice date: <span className="text-slate-900">{format(new Date(selectedInvoice.date), "MMM d, yyyy")}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-8">
                    <div className="space-y-3 border-l-4 border-slate-50 pl-4">
                      <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">From</p>
                      <div>
                        <p className="text-lg font-black text-slate-900 mb-1">{currentSalon?.name || "Salon Name"}</p>
                        <p className="font-medium">{currentSalon?.email}</p>
                        <p className="font-medium text-slate-500">{currentSalon?.address || "No Address Provided"}</p>
                        <p className="font-medium text-slate-500">{currentSalon?.phone}</p>
                      </div>
                    </div>
                    <div className="space-y-3 border-l-4 border-slate-50 pl-4">
                      <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Bill to</p>
                      <div>
                        <p className="text-lg font-black text-slate-900 mb-1">{selectedInvoice.customer}</p>
                        <p className="font-medium text-slate-500">{selectedInvoice.customerPhone}</p>
                      </div>
                    </div>
                    <div className="space-y-3 border-l-4 border-slate-50 pl-4">
                      <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Ship to</p>
                      <div>
                        <p className="font-medium text-slate-500 italic">Deliverables same as billing address.</p>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#0066FF] text-white font-bold uppercase tracking-widest text-[10px]">
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4 text-center">Rate</th>
                          <th className="px-6 py-4 text-center">Qty</th>
                          <th className="px-6 py-4 text-center">Tax</th>
                          <th className="px-6 py-4 text-center">Disc</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="font-medium border-b border-slate-50">
                          <td className="px-6 py-5">
                            <p className="text-slate-900 font-bold">{selectedInvoice.service}</p>
                            <p className="text-slate-400 text-xs mt-1">Professional salon services provided by our staff.</p>
                          </td>
                          <td className="px-6 py-5 text-center">RM {selectedInvoice.subtotal}</td>
                          <td className="px-6 py-5 text-center">1</td>
                          <td className="px-6 py-5 text-center">0%</td>
                          <td className="px-6 py-5 text-center">RM {selectedInvoice.discount}</td>
                          <td className="px-6 py-5 text-right font-bold text-slate-900">RM {selectedInvoice.amount}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Section */}
                  <div className="flex flex-col md:flex-row justify-between pt-6">
                    <div className="space-y-8 max-w-sm">
                      <div className="space-y-2">
                        <p className="font-bold text-slate-900">Payment instruction</p>
                        <div className="text-slate-500 space-y-1">
                          <p>UPI/Paypal: <span className="font-bold text-slate-700">{currentSalon?.upi_id || "pay@example.com"}</span></p>
                          <p>Bank: <span className="font-bold text-slate-700">{currentSalon?.bank_details || "No Bank Info"}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-72 space-y-3 mt-8 md:mt-0">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">Subtotal</span>
                        <span>RM {selectedInvoice.subtotal}</span>
                      </div>
                      {selectedInvoice.discount > 0 && (
                        <div className="flex justify-between font-medium text-green-600">
                          <span>Discount</span>
                          <span>- RM {selectedInvoice.discount}</span>
                        </div>
                      )}
                      <div className="h-px bg-slate-100 my-2" />
                      <div className="flex justify-between text-lg font-black text-slate-900">
                        <span>Total Paid</span>
                        <span>RM {selectedInvoice.amount}</span>
                      </div>
                      <div className="flex justify-between font-medium text-emerald-600">
                        <span>Amount Settled</span>
                        <span>- RM {selectedInvoice.status === 'paid' ? selectedInvoice.amount : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-slate-50 flex items-center justify-end gap-3 rounded-b-3xl print:hidden">
                  <Button variant="ghost" onClick={() => setShowDetailDialog(false)} className="rounded-xl font-bold">
                    Close
                  </Button>
                  <Button variant="outline" onClick={handleDownloadPDF} className="rounded-xl font-bold border-slate-200">
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                  <Button onClick={() => handleSendNotify('whatsapp')} className="bg-accent text-white font-black rounded-xl px-6 min-w-32 shadow-xl shadow-accent/20">
                    <Smartphone className="w-4 h-4 mr-2" /> SMS/WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                      <SelectItem key={s.id} value={s.id}>{s.name} (RM {s.price})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Hidden Print Container for Direct Download (No Preview Modal) */}
      {selectedInvoice && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] pointer-events-none print-invoice-container">
          <div className="p-12 space-y-12 text-sm text-[#444]">
            {/* Logo and Title */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {currentSalon?.logo_url ? (
                  <img src={currentSalon.logo_url} className="w-24 h-auto object-contain" alt="Logo" />
                ) : (
                  <div className="relative flex items-center justify-center w-16 h-16">
                    <span className="text-5xl font-black text-[#0066FF] leading-none">S</span>
                    <span className="text-5xl font-black text-[#0066FF] leading-none -ml-3 transform skew-x-[15deg] border-l-4 border-white pl-1">A</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Tax Invoice</h2>
                <div className="space-y-1 text-slate-500 font-medium text-sm">
                  <p>Invoice no: <span className="text-slate-900">{selectedInvoice.id.replace('L-INV-', '')}</span></p>
                  <p>Invoice date: <span className="text-slate-900">{format(new Date(selectedInvoice.date), "MMM d, yyyy")}</span></p>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-3 border-l-4 border-slate-50 pl-4">
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">From</p>
                <div>
                  <p className="text-lg font-black text-slate-900 mb-1">{currentSalon?.name || "Salon Name"}</p>
                  <p className="font-medium">{currentSalon?.email}</p>
                  <p className="font-medium text-slate-500">{currentSalon?.address || "No Address Provided"}</p>
                  <p className="font-medium text-slate-500">{currentSalon?.phone}</p>
                </div>
              </div>
              <div className="space-y-3 border-l-4 border-slate-50 pl-4">
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Bill to</p>
                <div>
                  <p className="text-lg font-black text-slate-900 mb-1">{selectedInvoice.customer}</p>
                  <p className="font-medium text-slate-500">{selectedInvoice.customerPhone}</p>
                </div>
              </div>
              <div className="space-y-3 border-l-4 border-slate-50 pl-4">
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Ship to</p>
                <div>
                  <p className="font-medium text-slate-500 italic">Deliverables same as billing address.</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0066FF] text-white font-bold uppercase tracking-widest text-[10px]">
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-center">Rate</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-center">Tax</th>
                    <th className="px-6 py-4 text-center">Disc</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-medium text-slate-700">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">{selectedInvoice.service}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Professional session inclusive of all taxes.</p>
                    </td>
                    <td className="px-6 py-5 text-center">RM {selectedInvoice.subtotal}</td>
                    <td className="px-6 py-5 text-center">1</td>
                    <td className="px-6 py-5 text-center">0%</td>
                    <td className="px-6 py-5 text-center">RM {selectedInvoice.discount}</td>
                    <td className="px-6 py-5 text-right font-bold text-slate-900">RM {selectedInvoice.amount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="flex justify-between items-start pt-6 border-t border-slate-100">
              <div className="space-y-4">
                <p className="font-bold text-slate-900">Payment instruction</p>
                <div className="text-slate-500 space-y-1">
                  <p>UPI/Paypal: <span className="font-bold text-slate-700">{currentSalon?.upi_id || "pay@example.com"}</span></p>
                  <p>Bank: <span className="font-bold text-slate-700">{currentSalon?.bank_details || "No Bank Info"}</span></p>
                </div>
              </div>
              <div className="w-72 space-y-3">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Subtotal</span>
                  <span>RM {selectedInvoice.subtotal}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between font-medium text-green-600">
                    <span>Discount</span>
                    <span>- RM {selectedInvoice.discount}</span>
                  </div>
                )}
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex justify-between text-lg font-black text-slate-900">
                  <span>Total Paid</span>
                  <span>RM {selectedInvoice.amount}</span>
                </div>
                <div className="flex justify-between font-medium text-emerald-600">
                  <span>Amount Settled</span>
                  <span>- RM {selectedInvoice.status === 'paid' ? selectedInvoice.amount : '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          /* Reset page margins */
          @page { margin: 0; size: auto; }
          
          /* Hide everything by default using visibility to handle nested elements */
          body { 
            visibility: hidden !important; 
            background: white !important;
          }
          
          /* Show specifically the print container and its children */
          .print-invoice-container, .print-invoice-container * { 
            visibility: visible !important; 
          }

          /* Position the print container to cover the page */
          .print-invoice-container { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            min-height: 100% !important;
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important; 
            z-index: 99999 !important;
            display: block !important; /* Ensure display:block overrides 'hidden' class */
          }

          /* Ensure content inside has proper spacing */
          .print-invoice-container > div {
             padding: 2cm !important;
          }

          /* Hide UI elements that shouldn't print if they somehow sneak in */
          .print\\:hidden, button, [role="button"], .no-print { display: none !important; }
          
          /* Color exactness */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </ResponsiveDashboardLayout>
  );
};

export default BillingPage;
