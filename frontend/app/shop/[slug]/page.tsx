'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shop/ProductCard';
import api from '@/lib/api';
import { getCategoryUrl, getShopUrl, getProductUrl } from '@/lib/shopUrls';

type Category = { _id: string; name: string; slug: string; description?: string; sortOrder?: number };

const SORT_OPTIONS = [
  { value: '-soldCount', label: 'Best selling' },
  { value: 'featured', label: 'Featured' },
  { value: '-createdAt', label: 'Date, new to old' },
  { value: 'createdAt', label: 'Date, old to new' },
  { value: 'price', label: 'Price, low to high' },
  { value: '-price', label: 'Price, high to low' },
  { value: '-rating', label: 'Top Rated' },
];

function SortDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border transition-colors hover:border-foreground/50 bg-background text-foreground"
        style={{ borderRadius: '2px' }}
      >
        <span className="text-muted-foreground font-normal">Sort by:</span>
        <span className="font-medium">{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform text-muted-foreground ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-[200px] shadow-sm border border-border bg-background" style={{ borderRadius: '2px' }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted text-foreground ${opt.value === value ? 'font-semibold bg-muted/50' : 'font-normal'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Single dynamic segment [slug]: category listing, or legacy product redirect. */
export default function ShopSlugPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = typeof params.slug === 'string' ? params.slug : params.slug?.[0] ?? '';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [isCategory, setIsCategory] = useState<boolean | null>(null);
  const [sort, setSort] = useState(searchParams.get('sort') || '-soldCount');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  useEffect(() => {
    api.get('/products/categories')
      .then((res) => {
        const list = res.data?.data ?? [];
        setCategories(list);
        const cat = list.find((c: Category) => c.slug === slug);
        setIsCategory(!!cat);
        setCategoryName(cat ? cat.name : slug);
      })
      .catch(() => {
        setCategories([]);
        setIsCategory(false);
      });
  }, [slug]);

  useEffect(() => {
    if (isCategory === false && slug) {
      api.get(`/products/${slug}`)
        .then((res) => {
          const product = res.data?.data?.product;
          if (product) router.replace(getProductUrl(product));
          else router.replace(getShopUrl());
        })
        .catch(() => router.replace(getShopUrl()));
      return;
    }
    if (!isCategory || !slug) return;
    let cancelled = false;
    setLoading(true);
    const q = new URLSearchParams();
    q.set('category', slug);
    q.set('sort', sort);
    q.set('page', String(page));
    q.set('limit', '12');
    api.get(`/products?${q.toString()}`)
      .then((res) => {
        if (!cancelled) {
          setProducts(res.data.data ?? []);
          setPagination(res.data.pagination ?? { page: 1, pages: 1, total: 0 });
        }
      })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, isCategory, sort, page, router]);

  const updateSort = (v: string) => {
    setSort(v);
    setPage(1);
    const next = new URLSearchParams(searchParams.toString());
    next.set('sort', v);
    next.delete('page');
    router.push(`/shop/${encodeURIComponent(slug)}?${next.toString()}`, { scroll: false });
  };

  const updatePage = (p: number) => {
    setPage(p);
    const next = new URLSearchParams(searchParams.toString());
    next.set('page', String(p));
    router.push(`/shop/${encodeURIComponent(slug)}?${next.toString()}`, { scroll: false });
  };

  if (isCategory === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Navbar />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  if (isCategory === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex justify-center"><Skeleton className="h-64 w-64" /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="py-14 border-b border-border" style={{ background: 'var(--eth-warm)' }}>
          <div className="w-full px-6 sm:px-10 lg:px-16">
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--eth-gold)', letterSpacing: '0.15em' }}>Category</p>
            <h1 className="text-4xl font-light" style={{ color: 'var(--eth-text-primary)', letterSpacing: '-0.02em' }}>{categoryName || slug}</h1>
          </div>
        </div>

        <div className="flex w-full">
          <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-border" style={{ background: 'var(--eth-warm)' }}>
            <div className="sticky top-20 py-6 pl-6 pr-4">
              <div className="flex items-center gap-2 mb-4">
                <LayoutList className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</span>
              </div>
              <nav className="space-y-0.5">
                <Link href={getShopUrl()} className="block py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-md transition-colors">All Products</Link>
                {categories.map((cat) => {
                  const isActive = cat.slug === slug;
                  return (
                    <Link key={cat._id} href={getCategoryUrl(cat)} className={`block py-2.5 px-3 text-sm rounded-md transition-colors ${isActive ? 'font-semibold bg-background/80 border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`} style={isActive ? { color: 'var(--eth-text-primary)' } : {}}>{cat.name}</Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0 px-6 sm:px-10 lg:px-8">
            <div className="lg:hidden flex items-center gap-2 py-3 border-b border-border overflow-x-auto">
              <Link href={getShopUrl()} className="flex-shrink-0 px-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground">All</Link>
              {categories.map((cat) => {
                const isActive = cat.slug === slug;
                return (
                  <Link key={cat._id} href={getCategoryUrl(cat)} className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-md border ${isActive ? 'font-semibold bg-foreground text-background border-foreground' : 'border-border bg-background text-foreground'}`}>{cat.name}</Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between py-4 border-b border-border gap-4">
              <span className="text-xs text-muted-foreground">{loading ? '—' : `${pagination.total} product${pagination.total !== 1 ? 's' : ''}`}</span>
              <SortDropdown value={sort} onChange={updateSort} />
            </div>

            <div className="py-10">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-x-6 gap-y-10">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="w-full rounded-none" style={{ aspectRatio: '4/3' }} />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3.5 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-32">
                  <div className="text-5xl mb-5">🔍</div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">No products in this category</h3>
                  <Link href={getShopUrl()}>
                    <Button className="rounded-sm text-sm bg-foreground text-background hover:bg-foreground/90">View all products</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {products.map((product, i) => (
                      <motion.div key={product._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                  {pagination.pages > 1 && (
                    <div className="flex justify-center gap-1 mt-14">
                      <Button variant="outline" size="sm" className="rounded-sm text-xs" disabled={page === 1} onClick={() => updatePage(page - 1)}>Previous</Button>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                        <Button key={p} size="sm" className={`rounded-sm text-xs ${page === p ? 'bg-foreground text-background border-none' : 'bg-transparent border border-border text-foreground'}`} onClick={() => updatePage(p)}>{p}</Button>
                      ))}
                      <Button variant="outline" size="sm" className="rounded-sm text-xs" disabled={page === pagination.pages} onClick={() => updatePage(page + 1)}>Next</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
