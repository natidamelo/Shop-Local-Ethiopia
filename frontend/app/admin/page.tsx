'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

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

  const revenueChartData = analytics?.monthlyRevenue?.map((m: any) => ({
    name: MONTHS[m._id.month - 1],
    revenue: m.revenue,
    orders: m.orders,
  })) || [];

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
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Revenue Trend</h2>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val: any) => [formatPrice(val, currency), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
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
