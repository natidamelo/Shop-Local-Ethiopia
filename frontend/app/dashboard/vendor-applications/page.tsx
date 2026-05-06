'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';
import { CalendarClock, Store, Clock, DollarSign, Receipt } from 'lucide-react';

type VendorStatus = 'pending' | 'approved' | 'rejected';

interface TablePricing {
  fullTablePrice: number;
  halfTablePrice: number;
  currency: string;
  priceNote: string;
}

interface VendorApplication {
  _id: string;
  vendorType: 'enterprise' | 'individual';
  tableType: 'full' | 'half';
  displayName: string;
  productType: string;
  productShortDescription: string;
  hasPreviousBazarExperience: boolean;
  previousBazarDetails?: string;
  email: string;
  phone: string;
  agreeToRules: boolean;
  needElectricity: boolean;
  status: VendorStatus;
  paymentStatus: 'pending' | 'paid' | 'not_required';
  paymentWindowExpiresAt?: string;
  createdAt: string;
  approvedAt?: string;
}

export default function VendorApplicationsDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [pricing, setPricing] = useState<TablePricing | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [appsRes, regRes] = await Promise.all([
        api.get('/vendor-applications/my'),
        api.get('/settings/bazar-registration').catch(() => null),
      ]);
      setApplications(appsRes.data?.data || []);
      if (regRes?.data?.data?.pricing) {
        setPricing(regRes.data.data.pricing);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load your bazar vendor applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const computePaymentState = (app: VendorApplication) => {
    if (app.paymentStatus === 'paid') {
      return { label: 'Paid', variant: 'success' as const, expired: false, remaining: '' };
    }
    if (app.paymentStatus === 'not_required') {
      return { label: 'No payment required', variant: 'secondary' as const, expired: false, remaining: '' };
    }
    if (app.status !== 'approved') {
      return { label: 'Waiting for approval', variant: 'outline' as const, expired: false, remaining: '' };
    }

    if (!app.paymentWindowExpiresAt) {
      return { label: 'Payment window not set', variant: 'outline' as const, expired: false, remaining: '' };
    }

    const now = new Date();
    const expires = new Date(app.paymentWindowExpiresAt);
    const diffMs = expires.getTime() - now.getTime();
    if (diffMs <= 0) {
      return { label: 'Payment window expired', variant: 'destructive' as const, expired: true, remaining: '' };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const remaining = `${hours}h ${minutes}m`;

    return { label: 'Awaiting payment', variant: 'warning' as const, expired: false, remaining };
  };

  const getStatusBadge = (status: VendorStatus) => {
    if (status === 'approved') return <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
    return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-600" />
            My bazar vendor applications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track the status of your vendor registration, see payment deadlines, and complete payment when approved.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/bazar-vendor-apply')}
          className="text-xs"
        >
          Apply as vendor again
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading your applications...</p>
      ) : applications.length === 0 ? (
        <Card className="p-6 text-center text-sm text-gray-500">
          You have not submitted any bazar vendor applications yet.
          <div className="mt-3">
            <Button size="sm" onClick={() => router.push('/bazar-vendor-apply')}>
              Apply as vendor
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const paymentState = computePaymentState(app);
            const canPay =
              app.status === 'approved' &&
              app.paymentStatus === 'pending' &&
              paymentState.expired === false &&
              !!app.paymentWindowExpiresAt;

            const tablePrice = pricing
              ? app.tableType === 'full'
                ? pricing.fullTablePrice
                : pricing.halfTablePrice
              : null;
            const showPrice = tablePrice !== null && tablePrice > 0;

            return (
              <Card key={app._id} className="overflow-hidden">
                {/* Top: status bar */}
                <div className={`h-1 w-full ${app.status === 'approved' ? 'bg-emerald-500' : app.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`} />

                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left: application info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {app.displayName}
                      </span>
                      {getStatusBadge(app.status)}
                      {app.tableType && (
                        <Badge variant="outline" className="text-[10px]">
                          {app.tableType === 'half' ? 'Half table' : 'Full table'}
                        </Badge>
                      )}
                      {app.vendorType && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {app.vendorType}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{app.productType}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Submitted:{' '}
                      <span suppressHydrationWarning>{new Date(app.createdAt).toLocaleString()}</span>
                    </p>
                    {app.approvedAt && (
                      <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" />
                        Approved:{' '}
                        <span suppressHydrationWarning>{new Date(app.approvedAt).toLocaleString()}</span>
                      </p>
                    )}
                    {app.paymentWindowExpiresAt && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Payment deadline:{' '}
                        <span suppressHydrationWarning>{new Date(app.paymentWindowExpiresAt).toLocaleString()}</span>
                      </p>
                    )}
                  </div>

                  {/* Right: payment panel */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {/* Amount due box — shown when approved and price is set */}
                    {app.status === 'approved' && showPrice && (
                      <div className={`rounded-xl border px-4 py-3 text-center ${
                        paymentState.label === 'Paid'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                          : paymentState.expired
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                      }`}>
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Receipt className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                            {paymentState.label === 'Paid' ? 'Amount paid' : 'Amount due'}
                          </span>
                        </div>
                        <p className={`text-xl font-bold ${
                          paymentState.label === 'Paid'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : paymentState.expired
                            ? 'text-red-600'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {pricing!.currency} {tablePrice!.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {app.tableType === 'full' ? 'Full table' : 'Half table'} fee
                        </p>
                        {pricing?.priceNote && (
                          <p className="text-[10px] text-gray-500 mt-1 leading-tight">{pricing.priceNote}</p>
                        )}
                      </div>
                    )}

                    {/* Payment status badge */}
                    <div className="text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          paymentState.expired
                            ? 'bg-red-50 text-red-700'
                            : paymentState.label === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        {paymentState.label}
                        {paymentState.remaining && (
                          <span className="font-semibold">· {paymentState.remaining} left</span>
                        )}
                      </span>
                    </div>

                    {canPay ? (
                      <Button
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs"
                        onClick={() =>
                          toast.info(
                            'Payment for vendors is not wired to an online gateway yet. Please contact the bazar admin with your application details to complete payment.',
                            { duration: 8000 }
                          )
                        }
                      >
                        Pay now · within {paymentState.remaining}
                      </Button>
                    ) : app.status !== 'approved' ? null : (
                      <Button size="sm" variant="outline" disabled className="w-full text-xs">
                        {paymentState.label === 'Paid' ? 'Payment complete' : 'Payment unavailable'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

