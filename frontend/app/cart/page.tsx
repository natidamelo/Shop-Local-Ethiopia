'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/lib/store/cartStore';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { rewriteAssetUrl } from '@/lib/rewriteAssetUrl';
import { getProductUrlFromSlugs } from '@/lib/shopUrls';
import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, couponCode, discount, applyCoupon, removeCoupon } = useCartStore();
  const { currency } = useSiteSettings();
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const subtotal = getSubtotal();
  const shipping = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;
  const tax = subtotal * 0.1;
  const total = getTotal();

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const cartItems = items.map((item) => ({
        productId: item.productId,
        categoryId: item.categoryId,
        price: item.price,
        quantity: item.quantity,
      }));
      const res = await api.post('/orders/validate-coupon', { code: couponInput, subtotal, cartItems });
      applyCoupon(couponInput.toUpperCase(), res.data.data.discount);
      toast.success(`Coupon applied! You saved ${formatPrice(res.data.data.discount, currency)}`);
      setCouponInput('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-16">
        <div className="w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-12">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-6">Your cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Add some products to get started!</p>
              <Button className="bg-violet-600 hover:bg-violet-700" asChild>
                <Link href="/shop">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-6 border-t border-gray-200 dark:border-gray-800 pt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm px-4 sm:px-6">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.variant}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex gap-4 pb-6 border-b border-gray-100 dark:border-gray-800 last:border-none"
                    >
                      <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={rewriteAssetUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {item.type === 'digital' ? '💻' : '📦'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
                        <div className="min-w-0">
                          <Link href={getProductUrlFromSlugs(item.categorySlug ?? 'uncategorized', item.slug)}>
                            <h3 className="font-semibold text-gray-900 dark:text-white hover:text-violet-600 transition-colors line-clamp-2">
                              {item.name}
                            </h3>
                          </Link>
                          {item.variant && (
                            <p className="text-sm text-gray-500 mt-0.5">{item.variant}</p>
                          )}
                          <p className="text-violet-600 font-bold mt-2">
                            {formatPrice(item.price, currency)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          {item.type === 'digital' ? (
                            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                          ) : (
                            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-800">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {formatPrice(item.price * item.quantity, currency)}
                            </span>
                            <button
                              onClick={() => removeItem(item.productId, item.variant)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-8 grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-200 dark:border-gray-800">
                    <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Order special instructions
                    </h2>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Add any notes for the seller (optional)"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-violet-100 dark:border-violet-900/40 shadow-sm">
                    {couponCode ? (
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            {couponCode}
                          </span>
                        </div>
                        <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          placeholder="Coupon code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <Button
                          onClick={handleApplyCoupon}
                          variant="outline"
                          size="sm"
                          disabled={applyingCoupon}
                          className="border-violet-200 text-violet-700 hover:bg-violet-50"
                        >
                          Apply
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                        <span className="font-medium">{formatPrice(subtotal, currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                        <span className="font-medium">
                          {shipping === 0 ? 'Free' : formatPrice(shipping, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                        <span className="font-medium">{formatPrice(tax, currency)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-{formatPrice(discount, currency)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-base font-semibold">
                        <span className="text-gray-900 dark:text-white">Estimated total</span>
                        <span className="text-violet-600">{formatPrice(total, currency)}</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-base" asChild>
                    <Link href="/checkout">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full text-sm" asChild>
                    <Link href="/shop">Continue Shopping</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
