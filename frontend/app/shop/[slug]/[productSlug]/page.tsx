'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Minus, Plus, CheckCircle, Truck, Shield, RefreshCw, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AddedToCartModal from '@/components/shop/AddedToCartModal';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { rewriteAssetUrls } from '@/lib/rewriteAssetUrl';
import { getProductUrl, getCategoryUrl, getShopUrl } from '@/lib/shopUrls';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = typeof params.slug === 'string' ? params.slug : params.slug?.[0] ?? '';
  const productSlug = typeof params.productSlug === 'string' ? params.productSlug : params.productSlug?.[0] ?? '';

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuthStore();
  const { currency, trustBadges } = useSiteSettings();

  useEffect(() => {
    fetchProduct();
  }, [productSlug]);

  useEffect(() => {
    if (!lightboxOpen || !product) return;
    const images = product.images?.length ? product.images : [product.thumbnail || ''];
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, product]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${productSlug}`);
      const p = res.data.data.product;
      const catSlug = p?.category?.slug ?? (typeof p?.category === 'string' ? p.category : null);
      if (p && catSlug && catSlug !== categorySlug) {
        router.replace(getProductUrl(p));
        return;
      }
      setProduct(p);
      setReviews(res.data.data.reviews ?? []);
      if (p?.colors?.length) {
        setSelectedColor(p.colors[0].name);
        if (p.colors[0].image) {
          const allImages: string[] = p.images?.length ? p.images : [p.thumbnail || ''];
          const colorImgPath = (() => { try { return new URL(p.colors[0].image).pathname; } catch { return p.colors[0].image; } })();
          let idx = allImages.indexOf(p.colors[0].image);
          if (idx < 0) idx = allImages.findIndex((img) => { try { return new URL(img).pathname === colorImgPath; } catch { return img === colorImgPath; } });
          if (idx >= 0) setSelectedImage(idx);
        }
      }
    } catch {
      router.push(categorySlug ? getCategoryUrl(categorySlug) : getShopUrl());
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const catSlug = product.category && typeof product.category === 'object' && 'slug' in product.category ? (product.category as { slug: string }).slug : undefined;
    addItem({
      productId: product._id,
      categoryId: product.category ? (typeof product.category === 'string' ? product.category : product.category._id) : undefined,
      categorySlug: catSlug,
      name: selectedColor ? `${product.name} — ${selectedColor}` : product.name,
      price: product.price,
      image: product.thumbnail,
      quantity,
      type: product.type,
      slug: product.slug,
    });
    setCartModalOpen(true);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/products/${product._id}/reviews`, reviewForm);
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, title: '', comment: '' });
      fetchProduct();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const lightboxPrev = useCallback((images: string[]) => {
    setLightboxIndex((i) => (i - 1 + images.length) % images.length);
  }, []);

  const lightboxNext = useCallback((images: string[]) => {
    setLightboxIndex((i) => (i + 1) % images.length);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#fdf6ec' }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="w-full rounded-none" style={{ aspectRatio: '3/4', background: '#f0ddb8' }} />
            <div className="space-y-4 pt-4">
              <Skeleton className="h-8 w-3/4" style={{ background: '#f0ddb8' }} />
              <Skeleton className="h-6 w-1/4" style={{ background: '#f0ddb8' }} />
              <Skeleton className="h-20 w-full" style={{ background: '#f0ddb8' }} />
              <Skeleton className="h-12 w-full" style={{ background: '#f0ddb8' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const productUrl = getProductUrl(product);
  const rawImages = product.images?.length ? product.images : [product.thumbnail || ''];
  const images = rewriteAssetUrls(rawImages);
  const rawImagesUnrewritten: string[] = product.images?.length ? product.images : [product.thumbnail || ''];
  const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const colors: { name: string; hex: string; image?: string }[] = product.colors || [];

  const urlPath = (url: string) => {
    try { return new URL(url).pathname; } catch { return url; }
  };

  const selectColor = (colorName: string) => {
    setSelectedColor(colorName);
    const color = colors.find((c) => c.name === colorName);
    if (color?.image) {
      let idx = rawImagesUnrewritten.indexOf(color.image);
      if (idx < 0) {
        const colorPath = urlPath(color.image);
        idx = rawImagesUnrewritten.findIndex((img) => urlPath(img) === colorPath);
      }
      if (idx >= 0) setSelectedImage(idx);
    }
  };
  const outOfStock = product.type === 'physical' && product.stock === 0;

  return (
    <div className="min-h-screen" style={{ background: '#fdf6ec' }}>
      <Navbar />
      <AddedToCartModal
        open={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        product={{ name: product.name, image: product.thumbnail, price: product.price, currency: product.currency }}
        color={selectedColor ?? undefined}
        currency={currency}
      />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb: Home / Shop / Category / Product */}
          <div className="flex items-center gap-2 text-sm mb-8 flex-wrap" style={{ color: '#9e7a2e' }}>
            <Link href="/" className="hover:underline" style={{ color: '#9e7a2e' }}>Home</Link>
            <span>/</span>
            <Link href={getShopUrl()} className="hover:underline" style={{ color: '#9e7a2e' }}>Shop</Link>
            <span>/</span>
            <Link href={getCategoryUrl(product.category ?? categorySlug)} className="hover:underline" style={{ color: '#9e7a2e' }}>{product.category?.name ?? categorySlug}</Link>
            <span>/</span>
            <span style={{ color: '#3d2b0e' }}>{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <motion.div key={selectedImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="relative overflow-hidden cursor-zoom-in" style={{ aspectRatio: '4/3', background: '#f0e8d8' }} onClick={() => images[selectedImage] && openLightbox(selectedImage)}>
                  {images[selectedImage] ? (
                    <>
                      <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5 shadow-lg">
                          <ZoomIn className="w-4 h-4" style={{ color: '#3d2b0e' }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl">{product.type === 'digital' ? '💻' : '📦'}</div>
                  )}
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 text-xs font-semibold text-white px-2 py-0.5" style={{ background: '#c0392b', borderRadius: '2px' }}>-{discount}%</span>
                  )}
                </motion.div>
                {images.length > 1 && (
                  <>
                    <button onClick={() => { const prev = (selectedImage - 1 + images.length) % images.length; setSelectedImage(prev); const rawPrev = rawImagesUnrewritten[prev]; const mc = colors.find((c) => c.image && (c.image === rawPrev || urlPath(c.image) === urlPath(rawPrev))); if (mc) setSelectedColor(mc.name); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow transition-all opacity-0 group-hover:opacity-100" aria-label="Previous image">
                      <ChevronLeft className="w-5 h-5" style={{ color: '#3d2b0e' }} />
                    </button>
                    <button onClick={() => { const next = (selectedImage + 1) % images.length; setSelectedImage(next); const rawNext = rawImagesUnrewritten[next]; const mc = colors.find((c) => c.image && (c.image === rawNext || urlPath(c.image) === urlPath(rawNext))); if (mc) setSelectedColor(mc.name); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow transition-all opacity-0 group-hover:opacity-100" aria-label="Next image">
                      <ChevronRight className="w-5 h-5" style={{ color: '#3d2b0e' }} />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img: string, i: number) => {
                    const rawI = rawImagesUnrewritten[i];
                    const matchedColor = colors.find((c) => c.image && rawI && (c.image === rawI || urlPath(c.image) === urlPath(rawI)));
                    const isActive = selectedImage === i;
                    return (
                      <button key={i} onClick={() => { setSelectedImage(i); if (matchedColor) setSelectedColor(matchedColor.name); }} className="relative flex-shrink-0 overflow-hidden transition-all" style={{ width: '80px', height: '80px', border: isActive ? '2px solid #b8860b' : '2px solid transparent', opacity: isActive ? 1 : 0.6 }}>
                        <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                        {matchedColor && <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: matchedColor.hex }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <AnimatePresence>
              {lightboxOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
                  <button onClick={closeLightbox} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"><X className="w-5 h-5" /></button>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">{lightboxIndex + 1} / {images.length}</div>
                  {images.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); lightboxPrev(images); }} className="absolute left-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                  )}
                  <motion.div key={lightboxIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="max-w-4xl max-h-[85vh] w-full mx-16 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <img src={images[lightboxIndex]} alt={`${product.name} ${lightboxIndex + 1}`} className="max-w-full max-h-[85vh] object-contain shadow-2xl" />
                  </motion.div>
                  {images.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); lightboxNext(images); }} className="absolute right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"><ChevronRight className="w-6 h-6" /></button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6 lg:pt-2">
              {product.category && (
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9e7a2e' }}>{product.category.name}</p>
              )}
              <h1 className="text-3xl font-light leading-tight" style={{ color: '#1a1008' }}>{product.name}</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-medium" style={{ color: '#1a1008' }}>{formatPrice(product.price, product.currency ?? currency)}</span>
                {product.comparePrice > product.price && (
                  <span className="text-base line-through" style={{ color: '#a08060' }}>{formatPrice(product.comparePrice, product.currency ?? currency)}</span>
                )}
              </div>
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-4 h-4 ${i <= Math.round(product.rating) ? 'fill-amber-500 text-amber-500' : 'text-amber-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm" style={{ color: '#9e7a2e' }}>{product.rating} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})</span>
                </div>
              )}
              {(product.shortDescription || product.description) && (
                <p className="text-sm leading-relaxed" style={{ color: '#5a3e1b' }}>{product.shortDescription || (product.description || '').replace(/<[^>]*>/g, '').slice(0, 200)}</p>
              )}
              <div className="h-px" style={{ background: '#e8d5b0' }} />
              {colors.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-sm" style={{ color: '#3d2b0e' }}>Color</p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => {
                      const isSelected = selectedColor === c.name;
                      return (
                        <button key={c.name} type="button" onClick={() => selectColor(c.name)} className="px-3.5 py-1.5 text-sm transition-all hover:border-gray-800" style={{ border: isSelected ? '2px solid #1a1008' : '1px solid #c8b89a', borderRadius: '999px', background: isSelected ? '#1a1008' : 'transparent', color: isSelected ? '#fff' : '#1a1008', fontWeight: 400, lineHeight: '1.4' }}>{c.name}</button>
                      );
                    })}
                  </div>
                </div>
              )}
              {product.type !== 'digital' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium" style={{ color: '#3d2b0e' }}>Quantity</p>
                  <div className="inline-flex items-center border" style={{ borderColor: '#c8a96a', borderRadius: '4px' }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center transition-colors hover:bg-amber-50" style={{ color: '#3d2b0e' }}><Minus className="w-4 h-4" /></button>
                    <span className="w-12 text-center text-sm font-medium" style={{ color: '#1a1008' }}>{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} className="w-10 h-10 flex items-center justify-center transition-colors hover:bg-amber-50" style={{ color: '#3d2b0e' }}><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
              {product.type === 'physical' && (
                <div className="flex items-center gap-2">
                  {product.stock > 0 ? (<><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm text-green-700 font-medium">{product.stock <= (product.lowStockThreshold || 5) ? `Only ${product.stock} left` : 'In Stock'}</span></>) : <span className="text-sm font-medium text-red-600">Out of Stock</span>}
                </div>
              )}
              <button onClick={handleAddToCart} disabled={outOfStock} className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: outOfStock ? '#c4a97a' : '#b8860b', borderRadius: '3px' }}>
                <ShoppingCart className="w-4 h-4" />{outOfStock ? 'Out of Stock' : 'Add to cart'}
              </button>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {([Truck, Shield, RefreshCw] as const).map((Icon, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-3 text-center" style={{ background: '#fff8ee', border: '1px solid #e8d5b0', borderRadius: '4px' }}>
                    <Icon className="w-4 h-4" style={{ color: '#b8860b' }} />
                    <span className="text-xs leading-tight" style={{ color: '#7a5c1e' }}>{trustBadges[i] ?? ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 border-t" style={{ borderColor: '#e8d5b0' }}>
            <Tabs defaultValue="description">
              <TabsList className="bg-transparent rounded-none border-b w-full justify-start h-auto p-0 mb-8" style={{ borderColor: '#e8d5b0' }}>
                <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium" style={{ color: '#5a3e1b' }}>Description</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium" style={{ color: '#5a3e1b' }}>Reviews ({reviews.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="description">
                <div className="prose max-w-2xl text-sm leading-relaxed" style={{ color: '#5a3e1b' }}><div dangerouslySetInnerHTML={{ __html: product.description || '' }} /></div>
              </TabsContent>
              <TabsContent value="reviews">
                <div className="space-y-6 max-w-2xl">
                  {reviews.length === 0 && <p className="text-sm" style={{ color: '#9e7a2e' }}>No reviews yet. Be the first to share your experience!</p>}
                  {reviews.map((review) => (
                    <div key={review._id} className="py-5 border-b" style={{ borderColor: '#e8d5b0' }}>
                      <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: '#b8860b' }}>{review.user?.name?.charAt(0) || 'U'}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm" style={{ color: '#3d2b0e' }}>{review.user?.name}</span>
                            <span className="text-xs" style={{ color: '#9e7a2e' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-amber-200'}`} />)}
                          </div>
                          {review.title && <p className="font-medium text-sm mb-1" style={{ color: '#3d2b0e' }}>{review.title}</p>}
                          <p className="text-sm leading-relaxed" style={{ color: '#5a3e1b' }}>{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!isAuthenticated && (
                    <div className="py-6 text-center border rounded-sm" style={{ borderColor: '#e8d5b0', background: '#fff8ee' }}>
                      <p className="text-sm mb-3" style={{ color: '#7a5c1e' }}>Log in to write a review.</p>
                      <Link href={`/login?redirect=${encodeURIComponent(productUrl)}`}>
                        <button className="px-6 py-2 text-sm font-semibold text-white" style={{ background: '#b8860b', borderRadius: '3px' }}>Log in to review</button>
                      </Link>
                    </div>
                  )}
                  {isAuthenticated && (
                    <div className="pt-4">
                      <h3 className="font-semibold mb-4" style={{ color: '#3d2b0e' }}>Write a Review</h3>
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block" style={{ color: '#5a3e1b' }}>Rating</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <button key={i} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: i }))}>
                                <Star className={`w-6 h-6 ${i <= reviewForm.rating ? 'fill-amber-500 text-amber-500' : 'text-amber-200'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <input type="text" placeholder="Review title (optional)" value={reviewForm.title} onChange={(e) => setReviewForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1" style={{ border: '1px solid #d4b483', background: '#fffaf2', color: '#3d2b0e', borderRadius: '3px' }} />
                        <textarea placeholder="Share your experience..." value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} required rows={4} className="w-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 resize-none" style={{ border: '1px solid #d4b483', background: '#fffaf2', color: '#3d2b0e', borderRadius: '3px' }} />
                        <button type="submit" disabled={submittingReview} className="px-8 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: '#b8860b', borderRadius: '3px' }}>{submittingReview ? 'Submitting...' : 'Submit Review'}</button>
                      </form>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
