'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight, ShoppingBag, Shield, Zap, Globe, Star, Package,
  Truck, RefreshCw, HeadphonesIcon, Sparkles, Heart, MapPin
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SignUpPromoModal from '@/components/layout/SignUpPromoModal';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore } from '@/lib/store/cartStore';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { rewriteAssetUrl } from '@/lib/rewriteAssetUrl';
import { getProductUrl } from '@/lib/shopUrls';
import { toast } from 'sonner';

const ETH_GOLD   = '#b8860b';
const ETH_GREEN  = '#2d6a2d';
const ETH_RED    = '#c0392b';

/** Icons for "Why Choose" features (order must match whyChooseFeatures in settings) */
const WHY_CHOOSE_ICONS = [Shield, Truck, RefreshCw, HeadphonesIcon, Globe, Zap];

const defaultStats = [
  { value: '50K+', label: 'Happy Customers' },
  { value: '5K+',  label: 'Handmade Items'  },
  { value: '200+', label: 'Local Artisans'  },
  { value: '4.9',  label: 'Average Rating'  },
];

/** Used to fetch cover image: category slug or 'digital' for type=digital. URLs use category/product structure. */
const categories = [
  { name: 'Cultural Cloth', emoji: '👘', href: '/shop/hand-woven-textiles-and-apparel', desc: 'Habesha kemis & netela', coverKey: 'hand-woven-textiles-and-apparel' },
  { name: 'Handmade',       emoji: '🧺', href: '/shop/artisan-craft-and-home-decor',   desc: 'Pottery, baskets & crafts', coverKey: 'artisan-craft-and-home-decor' },
  { name: 'Jewelry',        emoji: '📿', href: '/shop/leather-and-leather-goods',     desc: 'Leather & accessories', coverKey: 'leather-and-leather-goods' },
  { name: 'Art & Decor',    emoji: '🎨', href: '/shop/artisan-craft-and-home-decor',   desc: 'Paintings & wall art', coverKey: 'artisan-craft-and-home-decor' },
  { name: 'Coffee & Food',  emoji: '☕', href: '/shop/coffee-ceremony-kits',           desc: 'Ceremony sets & spices', coverKey: 'coffee-ceremony-kits' },
  { name: 'Digital',        emoji: '💻', href: '/shop?type=digital',                    desc: 'Courses & downloads', coverKey: 'digital' },
];

const HERO_TAG_COLORS: Record<string, string> = {
  featured:   '#c0392b',
  bestseller: '#b8860b',
  new:        '#2d6a2d',
  sale:       '#c0392b',
  artisan:    '#9e7a2e',
  digital:    '#2d6a2d',
};

function getHeroTag(product: any): { tag: string; tagColor: string } {
  if (product.isFeatured)                              return { tag: 'Featured',   tagColor: HERO_TAG_COLORS.featured   };
  if (product.comparePrice > product.price)            return { tag: 'Sale',       tagColor: HERO_TAG_COLORS.sale       };
  if (product.type === 'digital')                      return { tag: 'Digital',    tagColor: HERO_TAG_COLORS.digital    };
  if ((product.numReviews || product.reviewCount) > 5) return { tag: 'Bestseller', tagColor: HERO_TAG_COLORS.bestseller };
  return { tag: 'New', tagColor: HERO_TAG_COLORS.new };
}

function getProductEmoji(product: any): string {
  const name = (product.name || '').toLowerCase();
  const cat  = (product.category?.name || '').toLowerCase();
  if (name.includes('kemis') || name.includes('cloth') || cat.includes('cloth')) return '👘';
  if (name.includes('necklace') || name.includes('jewelry') || cat.includes('jewelry')) return '📿';
  if (name.includes('basket') || name.includes('mesob')) return '🧺';
  if (name.includes('coffee') || name.includes('buna'))  return '☕';
  if (name.includes('art') || cat.includes('art'))       return '🎨';
  if (product.type === 'digital')                        return '💻';
  return '🧺';
}

export default function HomePage() {
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [heroProducts,  setHeroProducts]  = useState<any[]>([]);
  const [latestOrder,   setLatestOrder]   = useState<any>(null);
  /** Cover image URL per category coverKey (from first product in that category) */
  const [categoryCovers, setCategoryCovers] = useState<Record<string, string>>({});
  const { isAuthenticated } = useAuthStore();
  const { siteName, hero, testimonials = [], currency, whyChooseHeading, whyChooseSubtitle, whyChooseFeatures = [] } = useSiteSettings();
  const { toggle: toggleWishlist, isInWishlist } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const stats = hero.stats?.length ? hero.stats : defaultStats;

  useEffect(() => {
    api.get('/products?limit=8&sort=-rating').then((r) => setFeaturedItems(r.data.data || [])).catch(() => {});
    api.get('/products?limit=4&sort=-rating&isActive=true').then((r) => setHeroProducts(r.data.data || [])).catch(() => {});
  }, []);

  // Fetch one product per category to use as cover image for "Shop by Category"
  useEffect(() => {
    const keys = Array.from(new Set(categories.map((c) => c.coverKey)));
    const fetchCover = async (coverKey: string) => {
      const params = coverKey === 'digital'
        ? '?type=digital&limit=1&sort=-rating'
        : `?category=${coverKey}&limit=1&sort=-rating`;
      try {
        const r = await api.get(`/products${params}`);
        const list = r.data?.data || [];
        const product = list[0];
        const url = product?.thumbnail || product?.images?.[0] || '';
        if (url) return { coverKey, url };
      } catch (_) {}
      return { coverKey, url: '' };
    };
    Promise.all(keys.map(fetchCover)).then((results) => {
      const next: Record<string, string> = {};
      results.forEach(({ coverKey, url }) => {
        if (url) next[coverKey] = url;
      });
      setCategoryCovers((prev) => ({ ...prev, ...next }));
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    api.get('/orders?limit=1&sort=-createdAt').then((r) => {
      const orders = r.data.data || r.data.orders || [];
      if (orders.length > 0) setLatestOrder(orders[0]);
    }).catch(() => {});
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--eth-section-bg)' }}>
      <SignUpPromoModal />
      <Navbar />

      {/* ── HERO BANNER ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16" style={{ background: '#0a192f' }}>
        {/* Flag stripe */}
        <div className="h-1 w-full flex">
          <div className="flex-1" style={{ background: ETH_GREEN }} />
          <div className="flex-1" style={{ background: ETH_GOLD }} />
          <div className="flex-1" style={{ background: ETH_RED }} />
        </div>

        {/* Full-width hero background — video */}
        {(hero.heroMediaType ?? 'image') === 'video' && hero.heroVideoUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <video
              src={hero.heroVideoUrl}
              className="w-full h-full object-cover"
              autoPlay={hero.heroVideoAutoplay ?? true}
              loop={hero.heroVideoLoop ?? true}
              muted={hero.heroVideoMuted ?? true}
              playsInline
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, #0a192f 0%, #0a192fee 40%, #0a192f99 60%, transparent 75%)' }} />
          </div>
        )}

        {/* Full-width hero background — image */}
        {(hero.heroMediaType ?? 'image') === 'image' && hero.heroImageUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={hero.heroImageUrl}
              alt=""
              className="w-full h-full"
              style={{
                objectFit: hero.heroImageObjectFit ?? 'cover',
                objectPosition: hero.heroImagePosition ?? 'center',
                transform: `scale(${(hero.heroImageScale ?? 100) / 100})`,
                transformOrigin: 'center center',
              }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, #0a192f 0%, #0a192fee 40%, #0a192f99 60%, transparent 75%)' }} />
          </div>
        )}

        {/* Diagonal accent */}
        {!(hero.heroMediaType === 'video' ? hero.heroVideoUrl : hero.heroImageUrl) && (
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(155deg, #0a192f 55%, ${ETH_GOLD}22 55%, ${ETH_GOLD}11 100%)` }} />
        )}

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#b8860b 0,#b8860b 1px,transparent 0,transparent 50%)', backgroundSize: '14px 14px', zIndex: 2 }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16" style={{ zIndex: 3 }}>
          <div className="grid lg:grid-cols-2 gap-8 items-center">

            {/* Left — text (on mobile appears below hero image) */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="space-y-5 order-2 lg:order-none">

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {hero.badge1 && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full" style={{ background: 'rgba(184,134,11,0.2)', color: ETH_GOLD, border: '1px solid rgba(184,134,11,0.35)' }}>
                    <MapPin className="w-3 h-3" /> {hero.badge1}
                  </span>
                )}
                {hero.badge2 && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full" style={{ background: 'rgba(45,106,45,0.2)', color: '#7dcc7d', border: '1px solid rgba(45,106,45,0.35)' }}>
                    {hero.badge2}
                  </span>
                )}
              </div>

              {/* Headline */}
              <div>
                <h1 className="font-extrabold leading-[1.08] tracking-tight text-white" style={{ fontSize: 'clamp(2.6rem,5.5vw,4.5rem)' }}>
                  {hero.headlineLine1}<br />
                  <span style={{ color: ETH_GOLD }}>{hero.headlineLine2}</span>{' '}
                  {(() => {
                    const words = hero.headlineLine3.split(' ');
                    if (words.length <= 1) return <span style={{ color: ETH_GOLD }}>{hero.headlineLine3}</span>;
                    return <><span className="text-white">{words.slice(0, -1).join(' ')}</span>{' '}<span style={{ color: ETH_GOLD }}>{words[words.length - 1]}</span></>;
                  })()}
                </h1>
                <div className="mt-4 flex gap-1.5">
                  <div className="h-1 w-16 rounded-full" style={{ background: ETH_GOLD }} />
                  <div className="h-1 w-8 rounded-full" style={{ background: ETH_GREEN }} />
                  <div className="h-1 w-4 rounded-full" style={{ background: ETH_RED }} />
                </div>
              </div>

              <p className="text-base lg:text-lg leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {hero.description}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4">
                {hero.buttons.map((btn, idx) => (
                  <Link key={idx} href={btn.link || '#'}>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold transition-all"
                      style={btn.style === 'primary'
                        ? { background: ETH_GOLD, color: '#fff', borderRadius: '6px', boxShadow: '0 4px 24px rgba(184,134,11,0.4)' }
                        : { background: 'transparent', border: '2px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: '6px' }
                      }>
                      {btn.style === 'primary' && <ShoppingBag className="w-5 h-5" />}
                      {btn.text}
                      {btn.style === 'outline' && <ArrowRight className="w-4 h-4" />}
                    </motion.button>
                  </Link>
                ))}
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {['A','B','C','D'].map((l, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{ borderColor: '#0a192f', background: i % 2 === 0 ? ETH_GOLD : ETH_GREEN }}>
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{hero.socialProofText}</p>
                </div>
              </div>
            </motion.div>

            {/* Right — hero media (shown on all screens; stacks below text on mobile) */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-center lg:justify-end order-first lg:order-none">
              {(hero.heroMediaType ?? 'image') === 'video' && hero.heroVideoUrl ? (
                <div className="relative overflow-hidden rounded-xl w-full max-h-[260px] lg:max-h-[380px]" style={{ aspectRatio: '3/4' }}>
                  <div className="absolute -inset-3 rounded-2xl rotate-2 opacity-20 hidden lg:block" style={{ background: ETH_GOLD }} />
                  <video
                    src={hero.heroVideoUrl}
                    className="relative rounded-xl shadow-2xl w-full h-full object-cover"
                    autoPlay={hero.heroVideoAutoplay ?? true}
                    loop={hero.heroVideoLoop ?? true}
                    muted={hero.heroVideoMuted ?? true}
                    playsInline
                  />
                </div>
              ) : (hero.heroMediaType ?? 'image') === 'image' && hero.heroImageUrl ? (
                <div className="relative overflow-hidden rounded-xl w-full max-h-[260px] lg:max-h-[380px]" style={{ aspectRatio: '3/4' }}>
                  <div className="absolute -inset-3 rounded-2xl rotate-2 opacity-20 hidden lg:block" style={{ background: ETH_GOLD }} />
                  <img
                    src={hero.heroImageUrl}
                    alt="Hero"
                    className="relative rounded-xl shadow-2xl w-full h-full object-cover"
                    style={{
                      objectFit: hero.heroImageObjectFit ?? 'cover',
                      objectPosition: hero.heroImagePosition ?? 'center',
                      transform: `scale(${(hero.heroImageScale ?? 100) / 100})`,
                      transformOrigin: 'center center',
                    }}
                  />
                </div>
              ) : (
                <div className="w-full max-w-lg rounded-xl flex items-center justify-center max-h-[260px] lg:max-h-[380px]" style={{ aspectRatio: '3/4', background: 'rgba(184,134,11,0.08)', border: '2px dashed rgba(184,134,11,0.2)' }}>
                  <div className="text-center space-y-3 px-8">
                    <div className="text-6xl">☕ 🧺 📿</div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>Upload a hero image or video<br />in Admin &rarr; Hero Page</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURE ICONS BAR ────────────────────────────────────────── */}
      <section style={{ background: 'var(--eth-warm)', borderBottom: '1px solid var(--eth-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck,          label: 'Free Delivery',       desc: 'On orders over ETB 5,000' },
              { icon: RefreshCw,      label: 'Return Guarantee',    desc: '30-day hassle-free returns' },
              { icon: HeadphonesIcon, label: '24/7 Support',        desc: 'Round the clock assistance' },
              { icon: Globe,          label: 'Worldwide Delivery',  desc: 'Ship anywhere globally' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--eth-icon-bg)' }}>
                  <f.icon className="w-5 h-5" style={{ color: 'var(--eth-gold)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--eth-text-primary)' }}>{f.label}</p>
                  <p className="text-xs" style={{ color: 'var(--eth-text-muted)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--eth-footer-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center">
                <div className="text-4xl font-extrabold" style={{ color: 'var(--eth-gold)' }}>{s.value}</div>
                <div className="text-sm mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'var(--eth-section-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--eth-text-muted)' }}>Browse by Category</p>
            <div className="flex items-end justify-between">
              <h2 className="text-3xl font-extrabold" style={{ color: 'var(--eth-text-primary)' }}>Shop by Category</h2>
              <Link href="/shop" className="text-sm font-semibold flex items-center gap-1 hover:underline" style={{ color: 'var(--eth-gold)' }}>
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-3 h-0.5 w-16" style={{ background: 'var(--eth-gold)' }} />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => {
              const coverUrl = categoryCovers[cat.coverKey];
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} whileHover={{ y: -4 }}>
                  <Link href={cat.href} className="flex flex-col items-center gap-3 p-5 text-center group transition-all overflow-hidden"
                    style={{ background: 'var(--eth-card-bg)', border: '1px solid var(--eth-border)', borderRadius: '6px' }}>
                    <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-lg flex items-center justify-center text-3xl transition-transform group-hover:scale-105 overflow-hidden flex-shrink-0"
                      style={{ background: 'var(--eth-icon-bg)' }}>
                      {coverUrl ? (
                        <img
                          src={rewriteAssetUrl(coverUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        cat.emoji
                      )}
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--eth-text-primary)' }}>{cat.name}</span>
                    <span className="text-xs leading-tight" style={{ color: 'var(--eth-text-muted)' }}>{cat.desc}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'var(--eth-warm)' }}>
        <div className="w-full px-6 sm:px-10 lg:px-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--eth-gold)', letterSpacing: '0.15em' }}>
                Featured Collection
              </p>
              <h2 className="text-3xl font-light" style={{ color: 'var(--eth-text-primary)', letterSpacing: '-0.02em' }}>Handpicked for You</h2>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--eth-text-muted)' }}>Authentic cultural items crafted by local artisans</p>
              <div className="mt-3 h-px w-12" style={{ background: 'var(--eth-gold)' }} />
            </div>
            <Link href="/shop" className="hidden md:flex items-center gap-1 text-sm hover:underline" style={{ color: 'var(--eth-gold)' }}>
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-x-6 gap-y-10">
            {featuredItems.map((item, i) => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }}
                className="group">
                <Link href={getProductUrl(item)} className="block">
                  <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: 'var(--eth-icon-bg)' }}>
                    {item.thumbnail
                      ? <img src={rewriteAssetUrl(item.thumbnail)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12" style={{ color: 'var(--eth-border)' }} /></div>
                    }
                    {item.isFeatured && (
                      <span className="absolute top-3 left-3 text-xs font-medium text-white px-2 py-0.5" style={{ background: '#b8860b', borderRadius: '1px' }}>Featured</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const wasInWishlist = isInWishlist(item._id);
                        toggleWishlist({
                          productId: item._id,
                          name: item.name,
                          slug: item.slug || item._id,
                          price: item.price,
                          image: item.thumbnail || '',
                        });
                        toast.success(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
                      }}
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(255,255,255,0.9)' }}
                      aria-label={isInWishlist(item._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${isInWishlist(item._id) ? 'fill-[#b8860b] text-[#b8860b]' : 'text-[#333]'}`}
                      />
                    </button>
                    {/* Add to cart — slides up on hover */}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addItem({ productId: item._id, categoryId: item.category ? (typeof item.category === 'string' ? item.category : item.category._id) : undefined, categorySlug: item.category?.slug, name: item.name, price: item.price, image: item.thumbnail, quantity: 1, type: item.type, slug: item.slug || item._id });
                          toast.success(`${item.name} added to cart!`);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium uppercase tracking-wide"
                        style={{ background: 'var(--eth-dark)', color: 'var(--eth-warm)', letterSpacing: '0.08em' }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  </div>
                  <div className="pt-3.5 pb-1">
                    <p className="text-xs mb-0.5 uppercase tracking-wide" style={{ color: 'var(--eth-text-muted)', fontSize: '10px' }}>{item.category?.name || ''}</p>
                    <h3 className="text-sm line-clamp-2 mb-1.5" style={{ color: 'var(--eth-text-primary)', fontWeight: 400 }}>{item.name}</h3>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= Math.round(item.rating||0) ? 'fill-amber-400 text-amber-400' : 'text-neutral-200 dark:text-neutral-600'}`} />)}
                      <span className="text-xs ml-1" style={{ color: 'var(--eth-text-muted)' }}>({item.numReviews||0})</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--eth-text-primary)' }}>{formatPrice(item.price, item.currency ?? currency)}</span>
                      {item.comparePrice > item.price && (
                        <span className="text-xs line-through" style={{ color: 'var(--eth-text-muted)' }}>{formatPrice(item.comparePrice, item.currency ?? currency)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/shop">
              <motion.button whileHover={{ scale: 1.01 }}
                className="inline-flex items-center gap-2 px-10 py-3 text-sm font-medium transition-all border"
                style={{ borderColor: 'var(--eth-text-primary)', color: 'var(--eth-text-primary)', background: 'transparent' }}>
                See All Products <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES (Why Choose) ─────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'var(--eth-section-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--eth-text-primary)' }}>{whyChooseHeading} {siteName}?</h2>
            <p className="text-sm" style={{ color: 'var(--eth-text-muted)' }}>{whyChooseSubtitle}</p>
            <div className="mt-3 h-0.5 w-12 mx-auto" style={{ background: 'var(--eth-gold)' }} />
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(whyChooseFeatures.length >= 6 ? whyChooseFeatures : []).map((f, i) => {
              const Icon = WHY_CHOOSE_ICONS[i] ?? Shield;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -3 }} className="p-6 group transition-all"
                  style={{ background: 'var(--eth-card-bg)', border: '1px solid var(--eth-border)', borderRadius: '6px' }}>
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4 transition-colors"
                    style={{ background: 'var(--eth-icon-bg)' }}>
                    <Icon className="w-5 h-5" style={{ color: 'var(--eth-gold)' }} />
                  </div>
                  <h3 className="font-bold mb-1.5" style={{ color: 'var(--eth-text-primary)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--eth-text-secondary)' }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'var(--eth-warm)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--eth-text-primary)' }}>What Our Customers Say</h2>
            <div className="mt-3 h-0.5 w-12 mx-auto" style={{ background: 'var(--eth-gold)' }} />
            <p className="mt-3 text-sm max-w-xl mx-auto" style={{ color: 'var(--eth-text-muted)' }}>
              Love our products? Leave a rating and review on any product page — open a product and go to the Reviews tab.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-5 transition-all"
                style={{ background: 'var(--eth-card-bg)', border: '1px solid var(--eth-border)', borderRadius: '6px' }}>
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(j => <Star key={j} className={`w-3.5 h-3.5 ${j <= (t.rating ?? 5) ? 'fill-amber-500 text-amber-500' : 'text-amber-200 dark:text-amber-900'}`} />)}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--eth-text-secondary)' }}>&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: i % 2 === 0 ? 'var(--eth-gold)' : 'var(--eth-green)' }}>
                    {(t.avatar || t.name?.charAt(0) || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--eth-text-primary)' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--eth-text-muted)' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENT METHODS ──────────────────────────────────────────── */}
      <section className="py-14" style={{ background: 'var(--eth-section-bg)', borderTop: '1px solid var(--eth-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--eth-text-muted)' }}>Accepted Payment Methods</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Stripe','PayPal','Flutterwave','Chapa','Telebirr','CBE Birr','Awash Bank','Dashen Bank'].map((m) => (
              <span key={m} className="px-4 py-2 text-sm font-semibold"
                style={{ background: 'var(--eth-card-bg)', border: '1px solid var(--eth-border)', borderRadius: '4px', color: 'var(--eth-text-primary)' }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: '#050c1a' }}>
        {/* Ethiopian flag accent stripe */}
        <div className="h-1 w-full flex">
          <div className="flex-1" style={{ background: ETH_GREEN }} />
          <div className="flex-1" style={{ background: ETH_GOLD }} />
          <div className="flex-1" style={{ background: ETH_RED }} />
        </div>

        <div className="relative">
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1400&auto=format&fit=crop&q=80"
            alt="Ethiopian cultural market"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, #050c1a 50%, transparent 100%)' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

              {/* Left: text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="flex-1 space-y-4"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{ background: 'rgba(184,134,11,0.18)', color: ETH_GOLD, border: '1px solid rgba(184,134,11,0.35)' }}>
                  <MapPin className="w-3 h-3" /> Made in Ethiopia
                </span>
                <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight text-white whitespace-pre-line">
                  {hero.ctaBannerTitle.replace(/\\n/g, '\n')}
                </h2>
                <div className="flex gap-1.5">
                  <div className="h-0.5 w-12 rounded-full" style={{ background: ETH_GOLD }} />
                  <div className="h-0.5 w-6 rounded-full" style={{ background: ETH_GREEN }} />
                  <div className="h-0.5 w-3 rounded-full" style={{ background: ETH_RED }} />
                </div>
                <p className="text-sm lg:text-base max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {hero.ctaBannerDescription}
                </p>
              </motion.div>

              {/* Right: stats + buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
                className="flex flex-col items-center lg:items-end gap-5 shrink-0"
              >
                {/* mini stats */}
                <div className="flex gap-4">
                  {[{ value: '50K+', label: 'Customers' }, { value: '200+', label: 'Artisans' }, { value: '4.9★', label: 'Rating' }].map((s) => (
                    <div key={s.label} className="text-center px-4 py-2 rounded-lg"
                      style={{ background: 'rgba(184,134,11,0.15)', border: '1px solid rgba(184,134,11,0.25)' }}>
                      <p className="text-lg font-extrabold text-white leading-none">{s.value}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#c8a84b' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* buttons */}
                <div className="flex gap-3">
                  <Link href="/register">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg"
                      style={{ background: ETH_GOLD, color: '#fff', boxShadow: '0 4px 20px rgba(184,134,11,0.4)' }}>
                      <ShoppingBag className="w-4 h-4" /> Create Free Account
                    </motion.button>
                  </Link>
                  <Link href="/shop">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg"
                      style={{ border: '2px solid rgba(255,255,255,0.25)', color: '#fff' }}>
                      Browse <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
