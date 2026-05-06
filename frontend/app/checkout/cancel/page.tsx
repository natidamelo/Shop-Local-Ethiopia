'use client';

import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <XCircle className="w-12 h-12 text-red-500" />
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Payment Cancelled</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Your payment was cancelled and you have not been charged.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-8">
            Your cart items are still saved. You can try again whenever you're ready.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-violet-600 hover:bg-violet-700">
              <Link href="/checkout">
                <ArrowLeft className="mr-2 w-4 h-4" /> Try Again
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cart">
                <ShoppingCart className="mr-2 w-4 h-4" /> View Cart
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
