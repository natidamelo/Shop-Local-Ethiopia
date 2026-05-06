'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store/authStore';
import api from '@/lib/api';
import { toast } from 'sonner';

const ADDRESS_LABELS = [
  { value: 'Home', label: 'Home' },
  { value: 'Work', label: 'Work' },
  { value: 'Office', label: 'Office' },
  { value: 'Shop', label: 'Shop' },
  { value: 'Other', label: 'Other' },
];

function getFullAddress(addr: Address): string {
  const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean);
  return parts.join(', ');
}

function showMapForLabel(label: string): boolean {
  const l = (label || '').toLowerCase();
  return l === 'office' || l === 'shop';
}

interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

const emptyAddress: Omit<Address, '_id'> = {
  label: 'Home',
  street: '',
  city: '',
  state: '',
  country: 'Ethiopia',
  zipCode: '',
  isDefault: false,
};

export default function AddressesPage() {
  const { user, fetchProfile } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile().then(() => {});
  }, []);

  useEffect(() => {
    setAddresses(user?.addresses || []);
    setLoading(false);
  }, [user?.addresses]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyAddress);
    setShowModal(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr._id);
    setForm({
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      country: addr.country,
      zipCode: addr.zipCode,
      isDefault: addr.isDefault,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/users/addresses/${editingId}`, form);
        toast.success('Address updated');
      } else {
        await api.post('/users/addresses', form);
        toast.success('Address added');
      }
      await fetchProfile();
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    try {
      await api.put(`/users/addresses/${id}`, { isDefault: true });
      await fetchProfile();
      toast.success('Default address updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Remove this address?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      await fetchProfile();
      toast.success('Address removed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <>
      <Navbar />
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Addresses</h1>
          <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" /> Add Address
          </Button>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center text-gray-500">
            Loading addresses...
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
            <MapPin className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No addresses yet</h2>
            <p className="text-gray-500 text-sm mb-6">Add an address for faster checkout and delivery.</p>
            <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" /> Add your first address
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {addr.street}, {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zipCode}
                      </p>
                      <p className="text-sm text-gray-500">{addr.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!addr.isDefault && (
                      <Button variant="outline" size="sm" onClick={() => setDefault(addr._id)}>
                        <Check className="w-4 h-4 mr-1" /> Set default
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(addr)}>
                      <Pencil className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteAddress(addr._id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {showMapForLabel(addr.label) && getFullAddress(addr) && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-700/50">
                      📍 Pinned at this address — {addr.label}
                    </p>
                    <iframe
                      title={`Map for ${addr.label}`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(getFullAddress(addr))}&z=17&output=embed`}
                      className="w-full h-64 sm:h-80 border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Address' : 'Add Address'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.label}
                onValueChange={(v) => setForm((p) => ({ ...p, label: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  {ADDRESS_LABELS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Street address</Label>
              <Input
                value={form.street}
                onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))}
                placeholder="123 Main Street"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Addis Ababa"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>State / Region</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  placeholder="Addis Ababa"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP / Postal code</Label>
                <Input
                  value={form.zipCode}
                  onChange={(e) => setForm((p) => ({ ...p, zipCode: e.target.value }))}
                  placeholder="1000"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Set as default address</span>
            </label>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
