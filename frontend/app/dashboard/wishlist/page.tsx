'use client';

import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore } from '@/lib/store/cartStore';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { toast } from 'sonner';

export default function WishlistPage() {
  const { items, remove } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const { currency } = useSiteSettings();

  const handleAddToCart = (item: (typeof items)[0]) => {
    addItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      type: 'physical',
      slug: item.slug,
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <>
      <Navbar />
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wishlist</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {items.length === 0
                ? 'Items you save with the heart icon will appear here.'
                : `${items.length} item${items.length === 1 ? '' : 's'} saved`}
            </p>
          </div>
          {items.length > 0 && (
            <Link href="/shop">
              <Button variant="outline" className="gap-2">
                Continue shopping <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Save items you like by clicking the heart on any product. They’ll show up here so you can buy them later.
              </p>
              <Link href="/shop">
                <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                  <ShoppingCart className="w-4 h-4" /> Shop now
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <Link href={item.categorySlug ? `/shop/${encodeURIComponent(item.categorySlug)}/${encodeURIComponent(item.slug)}` : `/shop/${item.slug}`} className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={item.categorySlug ? `/shop/${encodeURIComponent(item.categorySlug)}/${encodeURIComponent(item.slug)}` : `/shop/${item.slug}`}>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate hover:underline">{item.name}</h3>
                    </Link>
                    <p className="text-sm font-medium text-violet-600 dark:text-violet-400 mt-0.5">{formatPrice(item.price, currency)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 gap-1.5"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Add to cart
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        remove(item.productId);
                        toast.success('Removed from wishlist');
                      }}
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
