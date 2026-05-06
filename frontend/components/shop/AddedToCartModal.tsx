'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cartStore';
import { formatPrice } from '@/lib/useSiteSettings';
import type { CurrencyCode } from '@/lib/useSiteSettings';

interface AddedToCartModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    name: string;
    image?: string;
    price: number;
    currency?: CurrencyCode;
  };
  color?: string;
  currency: CurrencyCode;
}

export default function AddedToCartModal({
  open,
  onClose,
  product,
  color,
  currency,
}: AddedToCartModalProps) {
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/20"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-20 right-4 sm:right-8 z-50 w-[min(420px,calc(100vw-2rem))] bg-white dark:bg-gray-900 shadow-2xl rounded-sm"
            style={{ border: '1px solid #e5e5e5' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Item added to your cart</span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product row */}
            <div className="flex items-start gap-4 px-5 py-5">
              {/* Image */}
              <div
                className="w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-50 dark:bg-gray-800"
                style={{ border: '1px solid #e5e5e5' }}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                  {product.name}
                </p>
                {color && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Color: {color}
                  </p>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {formatPrice(product.price, product.currency ?? currency)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 space-y-3">
              <Link href="/cart" onClick={onClose}>
                <button
                  className="w-full h-12 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  style={{ borderRadius: '1px' }}
                >
                  View cart ({itemCount})
                </button>
              </Link>
              <Link href="/checkout" onClick={onClose}>
                <button
                  className="w-full h-12 text-white text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: '#b8860b', borderRadius: '1px' }}
                >
                  Check out
                </button>
              </Link>
              <div className="text-center">
                <button
                  onClick={onClose}
                  className="text-sm text-gray-700 dark:text-gray-300 underline underline-offset-2 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
