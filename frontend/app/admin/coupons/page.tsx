'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Edit, Tag, X, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { toast } from 'sonner';

const emptyCoupon = {
  code: '', description: '', type: 'percentage', value: '',
  minOrderAmount: '', maxDiscountAmount: '', usageLimit: '',
  endDate: '', isActive: true,
  applicableProducts: [] as { _id: string; name: string; thumbnail?: string }[],
  applicableCategories: [] as { _id: string; name: string }[],
};

// Searchable multi-select for products or categories
function MultiPicker({
  label, placeholder, items, selected, onAdd, onRemove, loading,
  onSearch, searchValue, onSearchChange,
}: {
  label: string;
  placeholder: string;
  items: { _id: string; name: string; thumbnail?: string }[];
  selected: { _id: string; name: string; thumbnail?: string }[];
  onAdd: (item: { _id: string; name: string; thumbnail?: string }) => void;
  onRemove: (id: string) => void;
  loading?: boolean;
  onSearch: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unselected = items.filter((i) => !selected.some((s) => s._id === i._id));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {selected.map((item) => (
            <span key={item._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
              {item.thumbnail && <img src={item.thumbnail} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
              {item.name}
              <button type="button" onClick={() => onRemove(item._id)} className="ml-0.5 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Search input + dropdown */}
      <div className="relative" ref={ref}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <Input
              className="pl-8 pr-8 text-sm"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSearch(); setOpen(true); } }}
              onFocus={() => { if (items.length > 0) setOpen(true); }}
            />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => { onSearch(); setOpen(true); }} disabled={loading}>
            {loading ? '...' : 'Search'}
          </Button>
        </div>
        {open && unselected.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {unselected.map((item) => (
              <button
                key={item._id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20 text-left"
                onClick={() => { onAdd(item); setOpen(false); onSearchChange(''); }}
              >
                {item.thumbnail && <img src={item.thumbnail} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />}
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        )}
        {open && !loading && items.length > 0 && unselected.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500">
            All results already selected.
          </div>
        )}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-gray-400">Leave empty to apply to all {label.toLowerCase()}</p>
      )}
    </div>
  );
}

export default function AdminCouponsPage() {
  const { currency } = useSiteSettings();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyCoupon);
  const [saving, setSaving] = useState(false);

  // Product / category search state
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryResults, setCategoryResults] = useState<any[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.data);
    } catch {}
  };

  const searchProducts = async () => {
    setProductLoading(true);
    try {
      const res = await api.get('/products', { params: { search: productSearch, limit: 20 } });
      const list = res.data.data?.products ?? res.data.data ?? [];
      setProductResults(list.map((p: any) => ({ _id: p._id, name: p.name, thumbnail: p.thumbnail || p.images?.[0] })));
    } catch { setProductResults([]); } finally { setProductLoading(false); }
  };

  const searchCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await api.get('/products/categories');
      const list: any[] = res.data.data ?? [];
      const q = categorySearch.trim().toLowerCase();
      const filtered = q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
      setCategoryResults(filtered.map((c: any) => ({ _id: c._id, name: c.name })));
    } catch { setCategoryResults([]); } finally { setCategoryLoading(false); }
  };

  const preloadCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await api.get('/products/categories');
      const list: any[] = res.data.data ?? [];
      setCategoryResults(list.map((c: any) => ({ _id: c._id, name: c.name })));
    } catch { setCategoryResults([]); } finally { setCategoryLoading(false); }
  };

  const openCreate = () => {
    setEditCoupon(null);
    setForm(emptyCoupon);
    setProductResults([]);
    setProductSearch('');
    setCategorySearch('');
    setShowModal(true);
    preloadCategories();
  };

  const openEdit = (coupon: any) => {
    setEditCoupon(coupon);
    setForm({
      ...coupon,
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      applicableProducts: coupon.applicableProducts ?? [],
      applicableCategories: coupon.applicableCategories ?? [],
    });
    setProductResults([]);
    setProductSearch('');
    setCategorySearch('');
    setShowModal(true);
    preloadCategories();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: parseFloat(form.value),
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        maxDiscountAmount: parseFloat(form.maxDiscountAmount) || 0,
        usageLimit: parseInt(form.usageLimit) || 0,
        applicableProducts: form.applicableProducts.map((p: any) => p._id),
        applicableCategories: form.applicableCategories.map((c: any) => c._id),
      };
      if (editCoupon) {
        await api.put(`/admin/coupons/${editCoupon._id}`, payload);
        toast.success('Coupon updated!');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created!');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons</h1>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" /> Add Coupon
        </Button>
      </div>

      <div className="grid gap-4">
        {coupons.map((coupon) => (
          <div key={coupon._id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Tag className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 dark:text-white font-mono">{coupon.code}</p>
                <Badge className={`text-xs border-0 ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{coupon.description || 'No description'}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                <span>{coupon.type === 'percentage' ? `${coupon.value}% off` : `${formatPrice(coupon.value, currency)} off`}</span>
                {coupon.minOrderAmount > 0 && <span>Min: {formatPrice(coupon.minOrderAmount, currency)}</span>}
                <span>Used: {coupon.usageCount}{coupon.usageLimit > 0 ? `/${coupon.usageLimit}` : ''}</span>
                {coupon.endDate && <span>Expires: {new Date(coupon.endDate).toLocaleDateString()}</span>}
                {coupon.applicableProducts?.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {coupon.applicableProducts.length} product{coupon.applicableProducts.length > 1 ? 's' : ''} only
                  </span>
                )}
                {coupon.applicableCategories?.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    {coupon.applicableCategories.length} categor{coupon.applicableCategories.length > 1 ? 'ies' : 'y'} only
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(coupon)}>
                <Edit className="w-4 h-4 text-blue-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteCoupon(coupon._id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No coupons yet. Create your first one!</p>
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input value={form.code} onChange={(e) => setForm((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p: any) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm((p: any) => ({ ...p, value: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min Order ({currency})</Label>
                <Input type="number" value={form.minOrderAmount} onChange={(e) => setForm((p: any) => ({ ...p, minOrderAmount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input type="number" value={form.usageLimit} onChange={(e) => setForm((p: any) => ({ ...p, usageLimit: e.target.value }))} placeholder="0 = unlimited" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm((p: any) => ({ ...p, endDate: e.target.value }))} />
            </div>
            {/* Product restrictions */}
            <div className="border-t pt-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Restrictions (optional)</p>
              <MultiPicker
                label="Specific products"
                placeholder="Search products by name…"
                items={productResults}
                selected={form.applicableProducts}
                onAdd={(item) => setForm((p: any) => ({ ...p, applicableProducts: [...p.applicableProducts, item] }))}
                onRemove={(id) => setForm((p: any) => ({ ...p, applicableProducts: p.applicableProducts.filter((x: any) => x._id !== id) }))}
                loading={productLoading}
                onSearch={searchProducts}
                searchValue={productSearch}
                onSearchChange={setProductSearch}
              />
              <MultiPicker
                label="Specific categories"
                placeholder="Search categories by name…"
                items={categoryResults}
                selected={form.applicableCategories}
                onAdd={(item) => setForm((p: any) => ({ ...p, applicableCategories: [...p.applicableCategories, item] }))}
                onRemove={(id) => setForm((p: any) => ({ ...p, applicableCategories: p.applicableCategories.filter((x: any) => x._id !== id) }))}
                loading={categoryLoading}
                onSearch={searchCategories}
                searchValue={categorySearch}
                onSearchChange={setCategorySearch}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
              <span className="text-sm">Active</span>
            </label>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700" disabled={saving}>
                {saving ? 'Saving...' : editCoupon ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
