'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package, DollarSign, ShoppingBag, TrendingUp, ArrowRight, Clock,
  Sparkles, Star, Heart, ShoppingCart, Gift, Flame
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store/authStore';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { rewriteAssetUrl } from '@/lib/rewriteAssetUrl';
import { getProductUrl } from '@/lib/shopUrls';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};


export default function DashboardPage() {
  const { user } = useAuthStore();
  const { currency } = useSiteSettings();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recommendedItems, setRecommendedItems] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecommended();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/dashboard-stats');
      setStats(res.data.data);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    try {
      const res = await api.get('/products?limit=4&sort=-rating');
      setRecommendedItems(res.data.data || []);
    } catch {}
  };

  const statCards = [
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: Package, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30', iconBg: 'bg-violet-600' },
    { label: 'Total Spent', value: formatPrice(stats?.totalSpent ?? 0, currency), icon: DollarSign, color: 'text-green-600 bg-green-100 dark:bg-green-900/30', iconBg: 'bg-green-600' },
    { label: 'Active Orders', value: stats?.recentOrders?.filter((o: any) => !['delivered', 'cancelled'].includes(o.status)).length || 0, icon: ShoppingBag, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', iconBg: 'bg-blue-600' },
    { label: 'Member Since', value: '2024', icon: TrendingUp, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30', iconBg: 'bg-orange-600' },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <Navbar />
      <div className="space-y-8 pb-6">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500 p-7 sm:p-8 shadow-xl ring-1 ring-white/15"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl" />
          </div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white/80" />
                <span className="text-white/80 text-sm font-medium">{greeting()}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-white/80 text-base max-w-md">
                Discover new handmade cultural items and track your orders — all in one place.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button className="bg-white text-amber-700 hover:bg-amber-50 font-semibold shadow-md" asChild>
                  <Link href="/shop">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Shop Now
                  </Link>
                </Button>
                <Button className="bg-white text-amber-700 hover:bg-amber-50 font-semibold shadow-md border-0" asChild>
                  <Link href="/dashboard/orders">
                    My Orders <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero Emojis */}
            <div className="hidden md:grid grid-cols-2 gap-3 shrink-0">
              {['☕', '🧺', '📿', '🫓'].map((emoji, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg hover:bg-white/30 transition-colors cursor-pointer"
                >
                  {emoji}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100/70 dark:border-white/10"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              )}
              <p className="text-sm text-gray-500">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recommended Items */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recommended for You</h2>
              </div>
              <p className="text-sm text-gray-500">Handpicked cultural items you might love</p>
            </div>
            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" asChild>
              <Link href="/shop" className="flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedItems.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 cursor-pointer"
              >
                <Link href={getProductUrl(item)}>
                  {/* Image area */}
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {item.thumbnail ? (
                      <img src={rewriteAssetUrl(item.thumbnail)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {item.isFeatured && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-amber-500 text-white border-0 text-xs">Featured</Badge>
                      </div>
                    )}
                    <button
                      onClick={(e) => e.preventDefault()}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Heart className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <Badge variant="outline" className="text-xs px-2 py-0 mb-1 border-gray-200 text-gray-400 dark:border-gray-600">
                      {item.category?.name || 'Uncategorized'}
                    </Badge>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1 group-hover:text-amber-600 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(item.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-xs text-gray-400">({item.numReviews || 0})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{formatPrice(item.price, item.currency ?? currency)}</p>
                        {item.comparePrice > item.price && (
                          <p className="text-xs text-gray-400 line-through">{formatPrice(item.comparePrice, item.currency ?? currency)}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="w-8 h-8 bg-amber-500 hover:bg-amber-600 rounded-xl flex items-center justify-center text-white transition-colors shadow-sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100/70 dark:border-white/10">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Orders</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/orders" className="text-violet-600 flex items-center gap-1 hover:text-violet-700">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : stats?.recentOrders?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">No orders yet</p>
              <p className="text-gray-400 text-sm mb-4">Start exploring our cultural collection!</p>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {stats?.recentOrders?.map((order: any) => (
                <Link
                  key={order._id}
                  href={`/dashboard/orders/${order._id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{formatPrice(order.total, currency)}</p>
                    <Badge className={`text-xs border-0 ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
