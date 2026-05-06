'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { toast } from 'sonner';

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category') || '';
  const { currency } = useSiteSettings();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryName, setCategoryName] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [search, categorySlug]);

  useEffect(() => {
    if (!categorySlug) {
      setCategoryName(null);
      return;
    }
    api.get('/products/categories')
      .then((res) => {
        const list = res.data?.data ?? [];
        const cat = list.find((c: { slug: string }) => c.slug === categorySlug);
        setCategoryName(cat ? cat.name : null);
      })
      .catch(() => setCategoryName(null));
  }, [categorySlug]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (categorySlug) params.set('category', categorySlug);
      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          {categorySlug && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Category: <span className="font-medium text-gray-700 dark:text-gray-300">{categoryName ?? categorySlug}</span>
            </p>
          )}
        </div>
        <Button onClick={() => router.push('/admin/products/new')} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-10 w-full" /></td></tr>
                ))
              ) : products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs capitalize">{product.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{formatPrice(product.price, product.currency ?? currency)}</p>
                    {product.comparePrice > product.price && (
                      <p className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice, product.currency ?? currency)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.type === 'digital' ? (
                      <span className="text-sm text-gray-500">∞</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{product.stock}</span>
                        {product.stockStatus === 'out_of_stock' ? (
                          <Badge className="text-xs border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Out</Badge>
                        ) : product.stockStatus === 'low_stock' ? (
                          <Badge className="text-xs border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Low</Badge>
                        ) : (
                          <Badge className="text-xs border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">OK</Badge>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {product.rating?.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs border-0 ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/admin/products/new?edit=${product._id}`)}>
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteProduct(product._id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
