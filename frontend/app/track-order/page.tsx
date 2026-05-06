'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Package, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';

const ETH_GOLD = '#b8860b';
const ETH_DARK = '#3d2b0e';

export default function TrackOrderPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard/orders');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ background: '#fdf6ec' }}>
      <Navbar />
      <div className="pt-16">
        <div className="h-1 w-full flex">
          <div className="flex-1" style={{ background: '#2d6a2d' }} />
          <div className="flex-1" style={{ background: ETH_GOLD }} />
          <div className="flex-1" style={{ background: '#c0392b' }} />
        </div>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: ETH_GOLD }}>
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold mb-3" style={{ color: ETH_DARK }}>Track Your Order</h1>
            <p className="text-sm mb-8" style={{ color: '#7a5c1e' }}>
              Sign in to your account to view real-time order status, tracking numbers, and delivery updates.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/login?redirect=/dashboard/orders"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: ETH_GOLD }}>
                Sign In to Track <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ border: `2px solid ${ETH_GOLD}`, color: ETH_GOLD }}>
                Create Account
              </Link>
            </div>
            <p className="mt-6 text-xs" style={{ color: '#9e7a2e' }}>
              Need help? Email us at{' '}
              <a href="mailto:support@shopLocal.com" className="underline">support@shopLocal.com</a>
            </p>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
