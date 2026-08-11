'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, TrendingUp, TrendingDown, Package, BarChart2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, TooltipProps,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

const RANGE_OPTIONS = [
  { label: '7D',  months: 0, days: 7 },
  { label: '1M',  months: 1, days: 0 },
  { label: '3M',  months: 3, days: 0 },
  { label: '6M',  months: 6, days: 0 },
  { label: '1Y',  months: 12, days: 0 },
] as const;
type RangeLabel = typeof RANGE_OPTIONS[number]['label'];

// Custom rich tooltip
function RevTooltip({ active, payload, label, currency }: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload?.length) return null;
  const rev = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0;
  const ord = payload.find((p) => p.dataKey === 'orders')?.value ?? 0;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl p-4 min-w-[170px]">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Revenue</span>
        <span className="ml-auto text-sm font-bold text-gray-900 dark:text-white">{formatPrice(rev, currency)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Orders</span>
        <span className="ml-auto text-sm font-bold text-gray-900 dark:text-white">{ord}</span>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboardPage() {
  const { currency } = useSiteSettings();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then((res) => {
      setAnalytics(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Total Users',
      value: analytics?.overview?.totalUsers || 0,
      sub: `+${analytics?.overview?.newUsersThisMonth || 0} this month`,
      icon: Users,
      color: 'text-violet-600 bg-violet-100',
      trend: 'up',
    },
    {
      label: 'Total Orders',
      value: analytics?.overview?.totalOrders || 0,
      sub: `${analytics?.overview?.ordersThisMonth || 0} this month`,
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-100',
      trend: 'up',
    },
    {
      label: 'Revenue (Month)',
      value: formatPrice(analytics?.overview?.revenueThisMonth ?? 0, currency),
      sub: `${analytics?.overview?.revenueGrowth > 0 ? '+' : ''}${analytics?.overview?.revenueGrowth || 0}% vs last month`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
      trend: analytics?.overview?.revenueGrowth >= 0 ? 'up' : 'down',
    },
    {
      label: 'Avg Order Value',
      value: analytics?.overview?.totalOrders > 0
        ? formatPrice((analytics?.overview?.revenueThisMonth || 0) / (analytics?.overview?.ordersThisMonth || 1), currency)
        : formatPrice(0, currency),
      sub: 'This month',
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-100',
      trend: 'up',
    },
  ];

  const [range, setRange] = useState<RangeLabel>('1Y');

  const allRevenueData: { name: string; revenue: number; orders: number; monthIndex: number }[] =
    useMemo(() =>
      (analytics?.monthlyRevenue ?? []).map((m: any) => ({
        name: MONTHS[m._id.month - 1],
        revenue: m.revenue,
        orders: m.orders,
        monthIndex: m._id.month,
      })),
    [analytics]);

  const revenueChartData = useMemo(() => {
    const sel = RANGE_OPTIONS.find((r) => r.label === range)!;
    if (sel.months === 0 || range === '1Y') return allRevenueData;
    return allRevenueData.slice(-sel.months);
  }, [allRevenueData, range]);

  const totalRevenue = revenueChartData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = revenueChartData.reduce((s, d) => s + d.orders,  0);
  const peakRevenue  = revenueChartData.reduce((mx, d) => Math.max(mx, d.revenue), 0);
  const prevRevenue  = (() => {
    const sel = RANGE_OPTIONS.find((r) => r.label === range)!;
    const n = sel.months || 1;
    const prev = allRevenueData.slice(-(n * 2), -n);
    return prev.reduce((s, d) => s + d.revenue, 0);
  })();
  const revenueChange = prevRevenue > 0
    ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
    : null;

  const orderStatusData = analytics?.ordersByStatus?.map((s: any) => ({
    name: s._id,
    value: s.count,
  })) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics Overview</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            {loading ? (
              <Skeleton className="h-8 w-20 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Revenue Trend</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Track revenue &amp; order volume over time</p>
            </div>
            {/* Range tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRange(r.label)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    range === r.label
                      ? 'bg-white dark:bg-gray-600 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary stats row */}
          {!loading && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">
                <p className="text-xs text-violet-500 dark:text-violet-400 font-medium mb-1">Total Revenue</p>
                <p className="text-base font-bold text-violet-700 dark:text-violet-300">{formatPrice(totalRevenue, currency)}</p>
                {revenueChange !== null && (
                  <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${
                    Number(revenueChange) >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {Number(revenueChange) >= 0
                      ? <ArrowUpRight className="w-3 h-3" />
                      : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(Number(revenueChange))}% vs prev
                  </div>
                )}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">Total Orders</p>
                <p className="text-base font-bold text-blue-700 dark:text-blue-300">{totalOrders}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                <p className="text-xs text-amber-500 dark:text-amber-400 font-medium mb-1">Peak Revenue</p>
                <p className="text-base font-bold text-amber-700 dark:text-amber-300">{formatPrice(peakRevenue, currency)}</p>
              </div>
            </div>
          )}

          {loading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : revenueChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-gray-400 dark:text-gray-600">
              <BarChart2 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No revenue data yet</p>
              <p className="text-xs mt-1">Data will appear once orders are placed</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={range}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="rev"
                      orientation="left"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatPrice(v, currency)}
                      width={60}
                    />
                    <YAxis
                      yAxisId="ord"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<RevTooltip currency={currency} />} />
                    <Area
                      yAxisId="rev"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#gradRevenue)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#8b5cf6' }}
                    />
                    <Area
                      yAxisId="ord"
                      type="monotone"
                      dataKey="orders"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      fill="url(#gradOrders)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#60a5fa' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex items-center gap-4 justify-center mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded bg-violet-500 inline-block" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded bg-blue-400 inline-block" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Orders</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Orders by Status</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {orderStatusData.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {orderStatusData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="capitalize text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white">Recent Orders</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : analytics?.recentOrders?.map((order: any) => (
              <div key={order._id} className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatPrice(order.total, currency)}</p>
                  <Badge className={`text-xs border-0 ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white">Top Products</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : analytics?.topProducts?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                  {item.product?.thumbnail ? (
                    <img src={item.product.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product?.name}</p>
                  <p className="text-xs text-gray-500">{item.totalSold} sold</p>
                </div>
                <p className="text-sm font-bold text-violet-600">{formatPrice(item.revenue, currency)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
