'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, Plus, Save, Trash2, RefreshCw, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ShippingRate {
  _id: string;
  carrierId: string;
  carrierName: string;
  etaMin: number;
  etaMax: number;
  currency: string;
  basePrice: number;
  pricePerKg: number;
  minPrice: number;
  maxPrice: number;
  classMultipliers: {
    standard: number;
    bulky: number;
    fragile: number;
    free: number;
    no_shipping: number;
  };
  isActive: boolean;
  sortOrder: number;
}

const SHIPPING_CLASSES = ['standard', 'bulky', 'fragile', 'free', 'no_shipping'];

const CLASS_LABELS: Record<string, string> = {
  standard: 'Standard',
  bulky: 'Bulky / Heavy',
  fragile: 'Fragile',
  free: 'Free shipping',
  no_shipping: 'No shipping',
};

function RateCard({
  rate,
  onSave,
  onDelete,
}: {
  rate: ShippingRate;
  onSave: (id: string, data: Partial<ShippingRate>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState<ShippingRate>({ ...rate });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (key: string, value: any) => {
    setForm((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const updateMultiplier = (cls: string, value: string) => {
    setForm((p) => ({
      ...p,
      classMultipliers: { ...p.classMultipliers, [cls]: parseFloat(value) || 0 },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(rate._id, form);
    setSaving(false);
    setDirty(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${rate.carrierName}"?`)) return;
    setDeleting(true);
    await onDelete(rate._id);
    setDeleting(false);
  };

  const etaLabel = form.etaMin === form.etaMax
    ? `${form.etaMin} business day${form.etaMin !== 1 ? 's' : ''}`
    : `${form.etaMin}–${form.etaMax} business days`;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden transition-all ${
      form.isActive ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-60'
    }`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-violet-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{form.carrierName}</p>
            <p className="text-xs text-gray-500">{etaLabel} · Base: {form.currency} {form.basePrice.toLocaleString()} · {form.pricePerKg}/kg</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Unsaved</Badge>}
          <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
          </label>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Carrier name</Label>
              <Input value={form.carrierName} onChange={(e) => update('carrierName', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Carrier ID (slug)</Label>
              <Input value={form.carrierId} onChange={(e) => update('carrierId', e.target.value)} className="h-9 text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">ETA min (days)</Label>
              <Input type="number" value={form.etaMin} onChange={(e) => update('etaMin', parseInt(e.target.value) || 1)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">ETA max (days)</Label>
              <Input type="number" value={form.etaMax} onChange={(e) => update('etaMax', parseInt(e.target.value) || 1)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Sort order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => update('sortOrder', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Currency</Label>
              <select
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
                className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3"
              >
                <option value="ETB">ETB</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              Pricing
              <span className="text-xs font-normal text-gray-400">— Final = (basePrice + weight × pricePerKg) × classMultiplier</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Base price ({form.currency})</Label>
                <Input type="number" value={form.basePrice} onChange={(e) => update('basePrice', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Price per kg ({form.currency})</Label>
                <Input type="number" value={form.pricePerKg} onChange={(e) => update('pricePerKg', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Min price ({form.currency})</Label>
                <Input type="number" value={form.minPrice} onChange={(e) => update('minPrice', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Max price (0 = no cap)</Label>
                <Input type="number" value={form.maxPrice} onChange={(e) => update('maxPrice', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
              </div>
            </div>
          </div>

          {/* Class multipliers */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Shipping class multipliers</p>
            <p className="text-xs text-gray-400 mb-3">
              Applied to the weight-based price. 1.0 = no change, 1.5 = 50% more, 0.0 = free.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {SHIPPING_CLASSES.map((cls) => (
                <div key={cls} className="space-y-1.5">
                  <Label className="text-xs text-gray-500">{CLASS_LABELS[cls]}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={(form.classMultipliers as any)[cls] ?? 1.0}
                    onChange={(e) => updateMultiplier(cls, e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {deleting ? 'Deleting…' : 'Delete carrier'}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="bg-violet-600 hover:bg-violet-700 text-xs h-8 px-4"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminShippingPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shipping/admin/rates');
      setRates(res.data.data);
    } catch {
      toast.error('Failed to load shipping rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSave = async (id: string, data: Partial<ShippingRate>) => {
    try {
      await api.put(`/shipping/admin/rates/${id}`, data);
      toast.success('Shipping rate saved');
      fetchRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/shipping/admin/rates/${id}`);
      toast.success('Carrier deleted');
      setRates((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleAddCarrier = async () => {
    setAdding(true);
    try {
      const res = await api.post('/shipping/admin/rates', {
        carrierId: `carrier_${Date.now()}`,
        carrierName: 'New Carrier',
        etaMin: 3,
        etaMax: 7,
        currency: 'ETB',
        basePrice: 5000,
        pricePerKg: 500,
        minPrice: 5000,
        maxPrice: 0,
        classMultipliers: { standard: 1.0, bulky: 1.5, fragile: 1.3, free: 0.0, no_shipping: 0.0 },
        isActive: false,
        sortOrder: rates.length + 1,
      });
      setRates((prev) => [...prev, res.data.data]);
      toast.success('New carrier added — configure and activate it below');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add carrier');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-violet-600" /> Shipping Rates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure carriers, base prices, and weight-based pricing for your products.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRates} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleAddCarrier} disabled={adding} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-1.5" />
            {adding ? 'Adding…' : 'Add Carrier'}
          </Button>
        </div>
      </div>

      {/* Info box */}
      <div className="flex gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-semibold">How shipping prices are calculated</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>If a product has <strong>shippingClass = "Free shipping"</strong> → ETB 0 for that item.</li>
            <li>If a product has a <strong>per-carrier price override</strong> set → that fixed price is used.</li>
            <li>Otherwise: <strong>basePrice + (weight × pricePerKg) × classMultiplier</strong></li>
            <li>The result is clamped between <strong>minPrice</strong> and <strong>maxPrice</strong> (if set).</li>
          </ol>
          <p className="text-xs mt-1">Set weight and shipping class on each product in <strong>Admin → Products → Edit → Shipping tab</strong>.</p>
        </div>
      </div>

      {/* Rate cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No shipping rates configured yet.</p>
          <Button size="sm" onClick={handleAddCarrier} className="mt-4 bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-1.5" /> Add First Carrier
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rates.map((rate) => (
            <motion.div key={rate._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <RateCard rate={rate} onSave={handleSave} onDelete={handleDelete} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
