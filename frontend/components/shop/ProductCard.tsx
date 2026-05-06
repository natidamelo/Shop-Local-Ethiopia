'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { rewriteAssetUrl } from '@/lib/rewriteAssetUrl';
import { getProductUrl } from '@/lib/shopUrls';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  thumbnail: string;
  rating: number;
  reviewCount: number;
  type: string;
  stock: number;
  availableStock?: number;
  stockStatus?: string;
  isFeatured?: boolean;
  shortDescription?: string;
  currency?: 'ETB' | 'USD';
  category?: string | { _id: string; slug?: string };
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggle: toggleWishlist, isInWishlist } = useWishlistStore();
  const { currency } = useSiteSettings();
  const inWishlist = isInWishlist(product._id);
  const productCurrency = product.currency ?? currency;
  const outOfStock = product.type === 'physical' && (product.availableStock ?? product.stock) === 0;

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = inWishlist;
    toggleWishlist({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.thumbnail,
    });
    toast.success(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    const catSlug = product.category && typeof product.category === 'object' && 'slug' in product.category ? (product.category as { slug: string }).slug : undefined;
    addItem({
      productId: product._id,
      categoryId: product.category ? (typeof product.category === 'string' ? product.category : (product.category as { _id: string })._id) : undefined,
      categorySlug: catSlug,
      name: product.name,
      price: product.price,
      image: product.thumbnail,
      quantity: 1,
      type: product.type,
      slug: product.slug,
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Link href={getProductUrl(product)} className="block">

        {/* Image */}
        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '4/3' }}>
          {product.thumbnail ? (
            <img
              src={rewriteAssetUrl(product.thumbnail)}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl select-none text-muted-foreground">
              {product.type === 'digital' ? '💻' : product.type === 'service' ? '🛠️' : '📦'}
            </div>
          )}

          {/* Badges — top-left */}
          {(discount > 0 || product.isFeatured || product.type === 'digital') && (
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {discount > 0 && (
                <span className="text-xs font-medium text-white px-2 py-0.5 bg-foreground" style={{ borderRadius: '1px', letterSpacing: '0.02em' }}>
                  -{discount}%
                </span>
              )}
              {product.isFeatured && !discount && (
                <span className="text-xs font-medium text-white px-2 py-0.5" style={{ background: 'var(--eth-gold)', borderRadius: '1px' }}>
                  Featured
                </span>
              )}
              {product.type === 'digital' && (
                <span className="text-xs font-medium text-white px-2 py-0.5 bg-muted-foreground" style={{ borderRadius: '1px' }}>
                  Digital
                </span>
              )}
            </div>
          )}

          {/* Wishlist — top-right */}
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 bg-background/90"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${inWishlist ? 'fill-[#b8860b] text-[#b8860b]' : 'text-foreground'}`}
            />
          </button>

          {/* Add to cart — slides up on hover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium tracking-wide uppercase transition-opacity disabled:opacity-50 bg-foreground text-background"
              style={{ letterSpacing: '0.08em' }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="pt-3.5 pb-1">
          <h3 className="text-sm leading-snug mb-1.5 text-foreground font-normal">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-foreground">
              {formatPrice(product.price, productCurrency)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs line-through text-muted-foreground">
                {formatPrice(product.comparePrice, productCurrency)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
