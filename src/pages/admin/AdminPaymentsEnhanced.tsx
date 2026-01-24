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
import { supabase } from "@/integrations/supabase/client";
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

interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  averageTransactionValue: number;
  platformFees: number;
  salonPayouts: number;
  refundedAmount: number;
}

export default function AdminPaymentsEnhanced() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [dateRange, setDateRange] = useState(searchParams.get('range') || '30');

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [searchTerm, statusFilter, dateRange]);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Generate mock payment data since we don't have real payments yet
      const mockPayments: PaymentData[] = [];
      
      // Get some bookings to base payments on
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          status,
          salon_id,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get salon names
      const salonIds = [...new Set(bookings?.map(b => b.salon_id).filter(Boolean))];
      const { data: salons } = await supabase
        .from('salons')
        .select('id, name')
        .in('id', salonIds);

      const salonMap = new Map(salons?.map(s => [s.id, s.name]) || []);

      // Generate mock payment data
      bookings?.forEach((booking, index) => {
        const amount = Math.floor(Math.random() * 2000) + 500; // ₹500-₹2500
        const platformFee = Math.floor(amount * 0.1); // 10% platform fee
        const salonPayout = amount - platformFee;
        
        const statuses: PaymentData['status'][] = ['completed', 'completed', 'completed', 'pending', 'failed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        mockPayments.push({
          id: `pay_${booking.id}`,
          amount,
          currency: 'INR',
          status,
          payment_method: ['card', 'upi', 'wallet'][Math.floor(Math.random() * 3)],
          salon_name: salonMap.get(booking.salon_id) || 'Unknown Salon',
          customer_name: `Customer ${index + 1}`,
          booking_id: booking.id,
          created_at: booking.created_at,
          processed_at: status === 'completed' ? booking.created_at : null,
          platform_fee: platformFee,
          salon_payout: salonPayout,
        });
      });

      // Apply filters
      let filteredPayments = mockPayments;

      if (statusFilter !== 'all') {
        filteredPayments = filteredPayments.filter(p => p.status === statusFilter);
      }

      if (searchTerm) {
        filteredPayments = filteredPayments.filter(p => 
          p.salon_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply date range
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      filteredPayments = filteredPayments.filter(p => 
        new Date(p.created_at) >= cutoffDate
      );

      setPayments(filteredPayments);

    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from payments
      const totalRevenue = payments.reduce((sum, p) => 
        p.status === 'completed' ? sum + p.amount : sum, 0
      );

      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const monthlyRevenue = payments
        .filter(p => new Date(p.created_at) >= monthAgo && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const weeklyRevenue = payments
        .filter(p => new Date(p.created_at) >= weekAgo && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const dailyRevenue = payments
        .filter(p => new Date(p.created_at) >= dayAgo && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const stats: PaymentStats = {
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        dailyRevenue,
        totalTransactions: payments.length,
        successfulTransactions: payments.filter(p => p.status === 'completed').length,
        failedTransactions: payments.filter(p => p.status === 'failed').length,
        pendingTransactions: payments.filter(p => p.status === 'pending').length,
        averageTransactionValue: totalRevenue / Math.max(1, payments.filter(p => p.status === 'completed').length),
        platformFees: payments.reduce((sum, p) => 
          p.status === 'completed' ? sum + p.platform_fee : sum, 0
        ),
        salonPayouts: payments.reduce((sum, p) => 
          p.status === 'completed' ? sum + p.salon_payout : sum, 0
        ),
        refundedAmount: payments.reduce((sum, p) => 
          p.status === 'refunded' ? sum + p.amount : sum, 0
        ),
      };

      setStats(stats);

    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const getStatusBadge = (status: PaymentData['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-0">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-0">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-0">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-500/10 text-blue-600 border-0">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: PaymentData['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportPayments = () => {
    // Create CSV content
    const headers = ['Payment ID', 'Amount', 'Status', 'Salon', 'Customer', 'Date', 'Platform Fee', 'Salon Payout'];
    const csvContent = [
      headers.join(','),
      ...payments.map(p => [
        p.id,
        p.amount,
        p.status,
        `"${p.salon_name}"`,
        `"${p.customer_name}"`,
        format(new Date(p.created_at), 'yyyy-MM-dd'),
        p.platform_fee,
        p.salon_payout,
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Payment Management</h1>
                  <p className="text-gray-300 text-lg">Monitor transactions and revenue analytics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                <div className="text-gray-300">Total Revenue</div>
              </div>
              <Button onClick={exportPayments} variant="secondary" className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-purple-400/20 blur-2xl"></div>
        </div>

        {/* Enhanced Revenue Stats Cards - Dark Theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-400">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(stats?.totalRevenue || 0)}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>Monthly: {formatCurrency(stats?.monthlyRevenue || 0)}</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-400">Transactions</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalTransactions || 0}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-blue-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>{stats?.successfulTransactions || 0} successful</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-400">Platform Fees</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(stats?.platformFees || 0)}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-purple-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>10% commission</span>
                  </div>
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
                  <p className="text-sm font-medium text-orange-400">Avg Transaction</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(stats?.averageTransactionValue || 0)}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-orange-400">
                    <Calendar className="h-4 w-4" />
                    <span>Per booking</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
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
                    placeholder="Search by salon, customer, or payment ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600 focus:border-gray-500"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All Payments</SelectItem>
                  <SelectItem value="completed" className="text-white hover:bg-gray-700 focus:bg-gray-700">Completed</SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-gray-700 focus:bg-gray-700">Pending</SelectItem>
                  <SelectItem value="failed" className="text-white hover:bg-gray-700 focus:bg-gray-700">Failed</SelectItem>
                  <SelectItem value="refunded" className="text-white hover:bg-gray-700 focus:bg-gray-700">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="7" className="text-white hover:bg-gray-700 focus:bg-gray-700">Last 7 days</SelectItem>
                  <SelectItem value="30" className="text-white hover:bg-gray-700 focus:bg-gray-700">Last 30 days</SelectItem>
                  <SelectItem value="90" className="text-white hover:bg-gray-700 focus:bg-gray-700">Last 90 days</SelectItem>
                  <SelectItem value="365" className="text-white hover:bg-gray-700 focus:bg-gray-700">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Payments Table - Dark Theme */}
        <Card className="border-0 shadow-xl bg-gray-800 border border-gray-700">
          <CardHeader className="bg-gray-700 rounded-t-lg border-b border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Payment Transactions</CardTitle>
                  <p className="text-sm text-gray-400">Showing {payments.length} payments</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">No payments found</h3>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-700/50 border-gray-600">
                    <TableHead className="font-semibold text-gray-300">Payment ID</TableHead>
                    <TableHead className="font-semibold text-gray-300">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-300">Salon</TableHead>
                    <TableHead className="font-semibold text-gray-300">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-300">Method</TableHead>
                    <TableHead className="font-semibold text-gray-300">Status</TableHead>
                    <TableHead className="font-semibold text-gray-300">Date</TableHead>
                    <TableHead className="text-right font-semibold text-gray-300">Fees</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-700/50 transition-colors border-gray-600">
                      <TableCell>
                        <div className="font-mono text-sm bg-gray-700 px-2 py-1 rounded text-gray-300">
                          {payment.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-lg text-white">{formatCurrency(payment.amount)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium text-white">{payment.salon_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                            {payment.customer_name.charAt(0)}
                          </div>
                          <span className="font-medium text-white">{payment.customer_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize font-medium border-gray-600 text-gray-300">
                          {payment.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          {getStatusBadge(payment.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-white">{format(new Date(payment.created_at), 'MMM d, yyyy')}</div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(payment.created_at), 'h:mm a')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          <div className="font-semibold text-orange-400">Fee: {formatCurrency(payment.platform_fee)}</div>
                          <div className="text-xs text-gray-400">
                            Payout: {formatCurrency(payment.salon_payout)}
                          </div>
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
    </AdminLayout>
  );
}