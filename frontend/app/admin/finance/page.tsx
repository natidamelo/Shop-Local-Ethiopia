'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  Filter,
  Download,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';

const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];
const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const GATEWAY_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  flutterwave: 'Flutterwave',
  chapa: 'Chapa',
};

export default function FinancePage() {
  const [overview, setOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    gateway: 'all',
    search: '',
    period: 'month',
  });

  useEffect(() => {
    loadFinancialData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, filters.status, filters.gateway]);

  useEffect(() => {
    loadRevenueChart();
  }, [filters.period]);

  const loadFinancialData = async () => {
    try {
      const res = await api.get('/admin/financial/overview');
      if (res.data.success) {
        setOverview(res.data.data);
      } else {
        toast.error('Failed to load financial overview');
      }
    } catch (error: any) {
      console.error('Financial overview error:', error);
      toast.error(error.response?.data?.message || 'Failed to load financial overview');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.gateway && filters.gateway !== 'all') params.gateway = filters.gateway;
      const res = await api.get('/admin/financial/transactions', { params });
      if (res.data.success) {
        setTransactions(res.data.data || []);
        setPagination(res.data.pagination);
      }
    } catch (error: any) {
      console.error('Transactions error:', error);
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadRevenueChart = async () => {
    try {
      const res = await api.get('/admin/financial/revenue-chart', {
        params: { period: filters.period },
      });
      if (res.data.success) {
        setRevenueChart(res.data.data || []);
      }
    } catch (error: any) {
      console.error('Revenue chart error:', error);
      toast.error(error.response?.data?.message || 'Failed to load revenue chart');
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statCards = [
    {
      label: 'Total Revenue',
      value: overview?.totalRevenue || 0,
      sub: 'All time',
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
      trend: 'up',
    },
    {
      label: 'This Month',
      value: overview?.monthRevenue || 0,
      sub: `${overview?.revenueGrowth >= 0 ? '+' : ''}${overview?.revenueGrowth || 0}% vs last month`,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-100',
      trend: overview?.revenueGrowth >= 0 ? 'up' : 'down',
    },
    {
      label: 'Today',
      value: overview?.todayRevenue || 0,
      sub: 'Revenue today',
      icon: DollarSign,
      color: 'text-purple-600 bg-purple-100',
      trend: 'up',
    },
    {
      label: 'Total Transactions',
      value: overview?.totalTransactions || 0,
      sub: `${overview?.completedTransactions || 0} completed`,
      icon: CreditCard,
      color: 'text-orange-600 bg-orange-100',
      trend: 'up',
      isCount: true,
    },
    {
      label: 'Refunded',
      value: overview?.refundedAmount || 0,
      sub: `${overview?.totalRefunds || 0} refunds`,
      icon: RefreshCw,
      color: 'text-red-600 bg-red-100',
      trend: 'down',
    },
    {
      label: 'Pending',
      value: overview?.pendingTransactions || 0,
      sub: 'Awaiting payment',
      icon: RefreshCw,
      color: 'text-yellow-600 bg-yellow-100',
      trend: 'neutral',
      isCount: true,
    },
  ];

  const chartData = revenueChart.map((item: any) => {
    // Handle _id which might be a string or an object from MongoDB aggregation
    const idValue = typeof item._id === 'string' ? item._id : item._id?.toString() || '';
    let displayName = idValue;
    
    // Format display names for better readability
    if (filters.period === 'month' && idValue) {
      const parts = idValue.split('-');
      if (parts.length === 2) {
        const [year, month] = parts;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        displayName = `${monthNames[parseInt(month) - 1]} ${year}`;
      }
    } else if (filters.period === 'day' && idValue) {
      try {
        const date = new Date(idValue);
        if (!isNaN(date.getTime())) {
          displayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      } catch (e) {
        // Keep original if parsing fails
      }
    }
    
    return {
      name: displayName || 'Unknown',
      revenue: item.revenue || 0,
      transactions: item.transactions || 0,
    };
  });

  const paymentMethodsData =
    overview?.paymentMethodsBreakdown?.map((item: any) => ({
      name: GATEWAY_LABELS[item._id] || item._id,
      value: item.total,
      count: item.count,
    })) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              {card.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : card.trend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : null}
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.isCount ? card.value.toLocaleString() : formatCurrency(card.value)}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Revenue Trend</h2>
            <Select
              value={filters.period}
              onValueChange={(value) => setFilters({ ...filters, period: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>No revenue data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                  labelStyle={{ color: '#000' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Methods Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : paymentMethodsData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <p>No payment method data</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {paymentMethodsData.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {paymentMethodsData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Transactions</h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-64"
              />
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.gateway}
                onValueChange={(value) => setFilters({ ...filters, gateway: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gateways</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="flutterwave">Flutterwave</SelectItem>
                  <SelectItem value="chapa">Chapa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gateway
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactionsLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4">
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tx.gatewayTransactionId || tx.gatewayReference || tx._id.slice(-8)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {tx.user?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">{tx.user?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {tx.order?.orderNumber || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">{GATEWAY_LABELS[tx.gateway] || tx.gateway}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(tx.amount, tx.currency)}
                      </p>
                      {tx.refundAmount > 0 && (
                        <p className="text-xs text-red-500">
                          Refunded: {formatCurrency(tx.refundAmount, tx.currency)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={STATUS_COLORS[tx.status] || ''}>{tx.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500">{formatDate(tx.createdAt)}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of{' '}
              {pagination.total} transactions
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
