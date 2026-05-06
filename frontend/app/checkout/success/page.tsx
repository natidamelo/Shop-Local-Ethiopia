'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import { useCartStore } from '@/lib/store/cartStore';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md mx-auto px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-12 h-12 text-green-600" />
      </motion.div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Payment Successful!</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Your order has been confirmed. You'll receive an email confirmation shortly.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderId && (
          <Button asChild className="bg-violet-600 hover:bg-violet-700">
            <Link href={`/dashboard/orders`}>
              <Package className="mr-2 w-4 h-4" /> View Orders
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/shop">
            Continue Shopping <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <Suspense fallback={<div className="text-center"><div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
