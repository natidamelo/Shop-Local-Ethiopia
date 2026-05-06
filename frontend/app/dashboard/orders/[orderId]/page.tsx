'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Clock,
  MapPin,
  ArrowLeft,
  Truck,
  CreditCard,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { rewriteAssetUrl } from '@/lib/rewriteAssetUrl';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const { currency } = useSiteSettings();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data.data);
      } catch (err: any) {
        const msg = err.response?.status === 404 ? 'Order not found' : err.response?.data?.message || 'Failed to load order';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Order not found</h2>
          <p className="text-gray-500 mb-6">{error || 'This order does not exist or you do not have access to it.'}</p>
          <Button asChild>
            <Link href="/dashboard/orders" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to My Orders
            </Link>
          </Button>
        </div>
      </>
    );
  }

  const addr = order.shippingAddress || {};
  const orderCurrency = order.currency || currency;

  return (
    <>
      <Navbar />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4" />
                Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </p>
            </div>
            <Badge className={`text-sm border-0 ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
              {order.status}
            </Badge>
          </div>

          {/* Items */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order items</h2>
            <ul className="space-y-4">
              {order.items?.map((item: any, i: number) => (
                <li key={i} className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={rewriteAssetUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                    {item.variant && <p className="text-xs text-gray-500">Variant: {item.variant}</p>}
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice((item.price || 0) * (item.quantity || 1), orderCurrency)}
                    </p>
                    <p className="text-xs text-gray-500">{formatPrice(item.price, orderCurrency)} each</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 space-y-2">
            {order.subtotal != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900 dark:text-white">{formatPrice(order.subtotal, orderCurrency)}</span>
              </div>
            )}
            {order.shippingCost != null && order.shippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-900 dark:text-white">{formatPrice(order.shippingCost, orderCurrency)}</span>
              </div>
            )}
            {order.tax != null && order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900 dark:text-white">{formatPrice(order.tax, orderCurrency)}</span>
              </div>
            )}
            {order.discount != null && order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount, orderCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-gray-900 dark:text-white">{formatPrice(order.total, orderCurrency)}</span>
            </div>
          </div>

          {/* Shipping address */}
          {(addr.street || addr.city || addr.phone) && (
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Shipping address
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                {addr.name && `${addr.name}\n`}
                {addr.street && `${addr.street}\n`}
                {[addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')}
                {addr.country && `\n${addr.country}`}
                {addr.phone && `\n${addr.phone}`}
              </p>
            </div>
          )}

          {/* Payment & tracking */}
          <div className="p-6 flex flex-wrap gap-6">
            {order.paymentMethod && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CreditCard className="w-4 h-4" />
                Payment: {order.paymentMethod}
                {order.paymentStatus && ` (${order.paymentStatus})`}
              </div>
            )}
            {order.trackingNumber && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Truck className="w-4 h-4" />
                Tracking: {order.trackingNumber}
              </div>
            )}
            {order.notes && (
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{order.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
