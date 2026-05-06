'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shop/ProductCard';
import api from '@/lib/api';
import { getCategoryUrl, getShopUrl } from '@/lib/shopUrls';

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

function parseTags(raw: string): string[] {
  return raw ? raw.split(',').map((t) => t.trim()).filter(Boolean) : [];
}

/** "Product type" dropdown — Sabahar-style inline filter */
function ProductTypeDropdown({
  allTagCounts,
  selectedTags,
  onToggle,
  onReset,
}: {
  allTagCounts: { tag: string; count: number }[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (allTagCounts.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors hover:border-foreground/50 bg-background text-foreground ${selectedTags.length > 0 ? 'border-foreground font-semibold' : 'border-border'}`}
        style={{ borderRadius: '2px' }}
      >
        Product type
        {selectedTags.length > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold bg-foreground text-background" style={{ fontSize: '10px' }}>
            {selectedTags.length}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform text-muted-foreground ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-full mt-1 z-30 min-w-[220px] shadow-sm border border-border bg-background"
            style={{ borderRadius: '2px' }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {selectedTags.length > 0 ? `${selectedTags.length} selected` : 'Product type'}
              </span>
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onReset(); }}
                  className="text-xs hover:underline text-muted-foreground"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="py-1 max-h-72 overflow-y-auto">
              {allTagCounts.map(({ tag, count }) => {
                const checked = selectedTags.includes(tag);
                return (
                  <label
                    key={tag}
                    className={`flex items-center justify-between gap-3 px-4 py-2 cursor-pointer transition-colors hover:bg-muted ${checked ? 'bg-muted/50' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex-shrink-0 w-4 h-4 border flex items-center justify-center transition-colors ${checked ? 'bg-foreground border-foreground' : 'bg-background border-border'}`}
                      >
                        {checked && (
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-background" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm capitalize text-foreground ${checked ? 'font-medium' : ''}`}>
                        {tag}
                      </span>
                    </div>
                    <span className="text-xs flex-shrink-0 text-muted-foreground">
                      {count}
                    </span>
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggle(tag)} />
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "Sort by" dropdown — Sabahar-style inline sort */
function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-1 z-30 min-w-[200px] shadow-sm border border-border bg-background"
            style={{ borderRadius: '2px' }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [allTagCounts, setAllTagCounts] = useState<{ tag: string; count: number }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    type: searchParams.get('type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: '-soldCount',
    featured: searchParams.get('featured') || '',
    tags: searchParams.get('tags') || '',
    page: 1,
  });

  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  // Fetch categories for sidebar
  useEffect(() => {
    api.get('/products/categories')
      .then((res) => setCategories(res.data?.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // Sync filters from URL params
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get('category') || '',
      featured: searchParams.get('featured') || '',
      type: searchParams.get('type') || '',
      tags: searchParams.get('tags') || '',
    }));
  }, [searchParams]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.type, filters.sort, filters.featured, filters.page, filters.search, filters.minPrice, filters.maxPrice, filters.tags]);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const fetchTagCounts = useCallback(async (baseFilters: typeof filters) => {
    try {
      const params = new URLSearchParams();
      if (baseFilters.category) params.append('category', baseFilters.category);
      if (baseFilters.search) params.append('search', baseFilters.search);
      if (baseFilters.featured) params.append('featured', baseFilters.featured);
      if (baseFilters.type) params.append('type', baseFilters.type);
      params.append('limit', '500');
      const res = await api.get(`/products?${params.toString()}`);
      const all: any[] = res.data.data || [];
      const countMap: Record<string, number> = {};
      all.forEach((p) => {
        (p.tags || []).forEach((tag: string) => {
          const t = tag.trim().toLowerCase();
          if (t) countMap[t] = (countMap[t] || 0) + 1;
        });
      });
      setAllTagCounts(
        Object.entries(countMap)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
      );
    } catch {
      setAllTagCounts([]);
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val && key !== 'page') params.append(key, String(val));
      });
      if (filters.page > 1) params.append('page', String(filters.page));
      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data);
      setPagination(res.data.pagination);
      fetchTagCounts(filters);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: string | number) => {
    const newFilters = {
      ...filters,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {}),
    };
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && k !== 'page') params.append(k, String(v));
    });
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const toggleTag = (tag: string) => {
    const current = parseTags(filters.tags);
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    updateFilter('tags', next.join(','));
  };

  const resetTags = () => updateFilter('tags', '');

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ search: '', category: '', type: '', minPrice: '', maxPrice: '', sort: '-soldCount', featured: '', tags: '', page: 1 });
    router.push(getShopUrl(), { scroll: false });
  };

  const selectedTags = parseTags(filters.tags);
  const hasActiveFilters = !!(filters.category || filters.type || filters.minPrice || filters.maxPrice || filters.featured || filters.tags);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">

        {/* Hero — minimal */}
        <div className="py-14 border-b border-border" style={{ background: 'var(--eth-warm)' }}>
          <div className="w-full px-6 sm:px-10 lg:px-16">
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--eth-gold)', letterSpacing: '0.15em' }}>Marketplace</p>
            <h1 className="text-4xl font-light mb-6" style={{ color: 'var(--eth-text-primary)', letterSpacing: '-0.02em' }}>Shop All Products</h1>
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-11 pr-4 py-3 text-sm border focus:outline-none focus:border-amber-600 transition-colors bg-background border-border text-foreground"
                style={{ borderRadius: '2px' }}
              />
            </div>
          </div>
        </div>

        <div className="flex w-full">
          {/* Sidebar — categories (products show in main area when category selected) */}
          <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-border" style={{ background: 'var(--eth-warm)' }}>
            <div className="sticky top-20 py-6 pl-6 pr-4">
              <div className="flex items-center gap-2 mb-4">
                <LayoutList className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</span>
              </div>
              <nav className="space-y-0.5">
                <Link
                  href={getShopUrl()}
                  className={`block py-2.5 px-3 text-sm transition-colors rounded-md ${!filters.category ? 'font-semibold bg-background/80 border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                  style={!filters.category ? { color: 'var(--eth-text-primary)' } : {}}
                >
                  All Products
                </Link>
                {categories.map((cat) => {
                  const isActive = filters.category === cat.slug;
                  return (
                    <Link
                      key={cat._id}
                      href={getCategoryUrl(cat)}
                      className={`block py-2.5 px-3 text-sm transition-colors rounded-md ${isActive ? 'font-semibold bg-background/80 border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                      style={isActive ? { color: 'var(--eth-text-primary)' } : {}}
                    >
                      {cat.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0 px-6 sm:px-10 lg:px-8">

          {/* Mobile category dropdown (when sidebar hidden) */}
          <div className="lg:hidden flex items-center gap-2 py-3 border-b border-border overflow-x-auto">
            <Link
              href={getShopUrl()}
              className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-md border ${!filters.category ? 'font-semibold bg-foreground text-background border-foreground' : 'border-border bg-background text-foreground'}`}
            >
              All
            </Link>
            {categories.map((cat) => {
              const isActive = filters.category === cat.slug;
              return (
                <Link
                  key={cat._id}
                  href={getCategoryUrl(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-md border ${isActive ? 'font-semibold bg-foreground text-background border-foreground' : 'border-border bg-background text-foreground'}`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between py-4 border-b border-border gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filter:</span>
              <ProductTypeDropdown
                allTagCounts={allTagCounts}
                selectedTags={selectedTags}
                onToggle={toggleTag}
                onReset={resetTags}
              />
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 transition-colors hover:opacity-70 bg-muted text-muted-foreground border border-border"
                      style={{ borderRadius: '2px' }}
                    >
                      <span className="capitalize">{tag}</span>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  ))}
                  <button type="button" onClick={resetTags} className="text-xs hover:underline text-muted-foreground">
                    Clear all
                  </button>
                </div>
              )}
              {hasActiveFilters && !selectedTags.length && (
                <button onClick={clearFilters} className="text-xs flex items-center gap-1 hover:underline text-muted-foreground">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-5 flex-shrink-0">
              <span className="text-xs hidden sm:block text-muted-foreground">
                {loading ? '—' : `${pagination.total} product${pagination.total !== 1 ? 's' : ''}`}
              </span>
              <SortDropdown value={filters.sort} onChange={(val) => updateFilter('sort', val)} />
            </div>
          </div>

          {/* Product grid */}
          <div ref={productsRef} className="py-10">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-x-6 gap-y-10">
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
                <h3 className="text-lg font-medium mb-2 text-foreground">No products found</h3>
                <p className="text-sm mb-6 text-muted-foreground">Try adjusting your filters</p>
                <Button onClick={clearFilters} className="rounded-sm text-sm bg-foreground text-background hover:bg-foreground/90">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-x-6 gap-y-10">
                {products.map((product, i) => (
                    <motion.div key={product._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-1 mt-14">
                    <Button variant="outline" size="sm" className="rounded-sm text-xs" disabled={filters.page === 1} onClick={() => updateFilter('page', filters.page - 1)}>
                      Previous
                    </Button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                      <Button key={p} size="sm" className={`rounded-sm text-xs ${filters.page === p ? 'bg-foreground text-background border-none' : 'bg-transparent border border-border text-foreground'}`} onClick={() => updateFilter('page', p)}>
                        {p}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" className="rounded-sm text-xs" disabled={filters.page === pagination.pages} onClick={() => updateFilter('page', filters.page + 1)}>
                      Next
                    </Button>
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

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading shop...</p>
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
