'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shop/ProductCard';
import api from '@/lib/api';
import Link from 'next/link';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(query);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(query);
    if (query.trim()) {
      setPage(1);
      fetchResults(query, 1, true);
    } else {
      setProducts([]);
      setTotal(0);
    }
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchResults = async (q: string, p: number, reset = false) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: { search: q, page: p, limit: 12 },
      });
      const data = res.data.data;
      const newProducts = data.products || [];
      setProducts((prev) => (reset ? newProducts : [...prev, ...newProducts]));
      setTotal(data.total || 0);
      setHasMore(p < (data.totalPages || 1));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchResults(query, next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back + Search bar */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
          <Link href="/shop">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => { setInputValue(''); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="bg-violet-600 hover:bg-violet-700 px-5">
            Search
          </Button>
        </form>
      </div>

      {/* Results header */}
      {query && (
        <div className="mb-6">
          {loading && products.length === 0 ? (
            <p className="text-sm text-gray-500">Searching for &quot;{query}&quot;…</p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {total > 0
                ? `${total} result${total !== 1 ? 's' : ''} for `
                : 'No results for '}
              <span className="font-semibold text-gray-900 dark:text-white">&quot;{query}&quot;</span>
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!query && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Search for products</h2>
          <p className="text-gray-500 text-sm">Enter a keyword above to find handmade Ethiopian textiles and crafts.</p>
        </div>
      )}

      {/* No results */}
      {query && !loading && products.length === 0 && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No products found</h2>
          <p className="text-gray-500 text-sm mb-6">Try a different search term or browse our shop.</p>
          <Button asChild className="bg-violet-600 hover:bg-violet-700">
            <Link href="/shop">Browse all products</Link>
          </Button>
        </div>
      )}

      {/* Product grid */}
      {products.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence>
              {products.map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Loading skeletons for pagination */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && (
            <div className="text-center mt-10">
              <Button variant="outline" onClick={loadMore} className="px-8">
                Load more results
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-16">
        <Suspense fallback={
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Skeleton className="h-12 w-full rounded-xl mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
