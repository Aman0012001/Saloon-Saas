import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import api from "@/services/api";
import { format } from "date-fns";

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  salon_name: string;
  customer_name: string;
  booking_id: string;
  created_at: string;
  processed_at: string | null;
  platform_fee: number;
  salon_payout: number;
}

export default function AdminPaymentsEnhanced() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const bookings = await api.admin.getAllBookings();

      const paymentData: PaymentData[] = bookings.map((b: any, i: number) => {
        const amount = Number(b.price || 500);
        const fee = Math.floor(amount * 0.1);
        return {
          id: `L-TRX-${String(i + 1).padStart(5, '0')}`,
          amount,
          currency: 'USD',
          status: b.status === 'completed' ? 'completed' : b.status === 'cancelled' ? 'failed' : 'pending',
          payment_method: 'UPI / Local',
          salon_name: b.salon_name || 'Saloon Member',
          customer_name: b.user_name || 'Guest',
          booking_id: b.id,
          created_at: b.created_at,
          processed_at: b.updated_at,
          platform_fee: fee,
          salon_payout: amount - fee,
        };
      });

      setPayments(paymentData);
    } catch (error) {
      console.error("Local payment sync failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.salon_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Financial Treasury</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Platform-wide MySQL Transactions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-white">${totalRevenue}</p>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Settled Revenue</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl p-6 flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Platform Fees (10%)</p>
              <p className="text-2xl font-black text-slate-900">${Math.floor(totalRevenue * 0.1)}</p>
            </div>
          </Card>
          <Card className="border-none shadow-sm bg-white rounded-3xl p-6 flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Successful Payouts</p>
              <p className="text-2xl font-black text-slate-900">{payments.filter(p => p.status === 'completed').length}</p>
            </div>
          </Card>
          <Card className="border-none shadow-sm bg-white rounded-3xl p-6 flex items-center gap-6">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">In-Progress Volume</p>
              <p className="text-2xl font-black text-slate-900">${payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)}</p>
            </div>
          </Card>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            <Input
              placeholder="Audit transactions by Saloon or Client..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-14 h-16 bg-white border-none shadow-sm rounded-2xl font-medium"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 h-16 bg-white border-none rounded-2xl shadow-sm font-bold">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Global Feed</SelectItem>
              <SelectItem value="completed">Settled</SelectItem>
              <SelectItem value="pending">Escrow</SelectItem>
              <SelectItem value="failed">Reverted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-black text-slate-900 h-14 px-8">TRANSACTION</TableHead>
                  <TableHead className="font-black text-slate-900">GROSS</TableHead>
                  <TableHead className="font-black text-slate-900">SALOON</TableHead>
                  <TableHead className="font-black text-slate-900">FEE</TableHead>
                  <TableHead className="font-black text-slate-900">STATUS</TableHead>
                  <TableHead className="font-black text-slate-900 text-right px-8">TIMESTAMP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map(p => (
                  <TableRow key={p.id} className="hover:bg-slate-50 transition-colors border-slate-50">
                    <TableCell className="px-8 py-5">
                      <p className="font-black text-slate-900 text-xs tracking-tighter bg-slate-100 px-3 py-1 rounded-full inline-block">{p.id}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{p.customer_name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-slate-900 text-lg">${p.amount}</p>
                    </TableCell>
                    <TableCell className="font-bold text-slate-600">
                      {p.salon_name}
                    </TableCell>
                    <TableCell className="font-black text-amber-600 text-sm">
                      - ${p.platform_fee}
                    </TableCell>
                    <TableCell>
                      {p.status === 'completed' ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1 font-bold">SETTLED</Badge>
                      ) : p.status === 'pending' ? (
                        <Badge className="bg-amber-50 text-amber-600 border-none px-4 py-1 font-bold">ESCROW</Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-600 border-none px-4 py-1 font-bold">FAILED</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <p className="text-xs font-black text-slate-900">{format(new Date(p.created_at), "MMM dd, yyyy")}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(p.created_at), "HH:mm")}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}