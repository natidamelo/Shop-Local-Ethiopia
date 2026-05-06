'use client';

import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';

const statusIcons: Record<string, any> = {
  completed: CheckCircle,
  failed: XCircle,
  pending: Clock,
  refunded: CreditCard,
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-blue-100 text-blue-700',
};

const gatewayColors: Record<string, string> = {
  stripe: 'bg-blue-100 text-blue-700',
  paypal: 'bg-sky-100 text-sky-700',
  flutterwave: 'bg-orange-100 text-orange-700',
  chapa: 'bg-green-100 text-green-700',
};

export default function PaymentsPage() {
  const { currency } = useSiteSettings();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/my-payments').then((res) => {
      setPayments(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment History</h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No payment history</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {payments.map((payment) => {
                const StatusIcon = statusIcons[payment.status] || Clock;
                return (
                  <div key={payment._id} className="flex items-center gap-4 p-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColors[payment.status] || 'bg-gray-100'}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {payment.order?.orderNumber || 'Payment'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-xs border-0 capitalize ${gatewayColors[payment.gateway] || 'bg-gray-100 text-gray-700'}`}>
                          {payment.gateway}
                        </Badge>
                        <span className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{formatPrice(payment.amount, currency)}</p>
                      <Badge className={`text-xs border-0 capitalize ${statusColors[payment.status] || ''}`}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
