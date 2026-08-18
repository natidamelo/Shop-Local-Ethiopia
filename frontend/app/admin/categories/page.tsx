'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, GripVertical, Save, X, FolderOpen, ImageIcon, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'sonner';

type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  // Form state
  const [form, setForm] = useState({ name: '', slug: '', description: '', image: '', isActive: true, sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/categories');
      const cats = res.data?.data ?? [];
      setCategories(cats);
      // Fetch product counts per category
      const counts: Record<string, number> = {};
      await Promise.all(
        cats.map(async (cat: Category) => {
          try {
            const pRes = await api.get(`/products?category=${cat.slug}&limit=1`);
            counts[cat._id] = pRes.data?.pagination?.total ?? 0;
          } catch {
            counts[cat._id] = 0;
          }
        })
      );
      setProductCounts(counts);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat._id);
    setAddingNew(false);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      isActive: cat.isActive,
      sortOrder: cat.sortOrder || 0,
    });
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const startAdd = () => {
    setAddingNew(true);
    setEditingId(null);
    setForm({ name: '', slug: '', description: '', image: '', isActive: true, sortOrder: categories.length });
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddingNew(false);
    setDeleteConfirm(null);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: editingId ? f.slug : slugify(name), // Auto-slug only for new categories
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    setSaving(true);
    try {
      if (addingNew) {
        await api.post('/products/categories', form);
        toast.success(`Category "${form.name}" created!`);
      } else if (editingId) {
        await api.put(`/products/categories/${editingId}`, form);
        toast.success(`Category "${form.name}" updated!`);
      }
      cancelEdit();
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/products/categories/${id}`);
      toast.success('Category deleted');
      setDeleteConfirm(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your product categories. Drag to reorder, click to edit.
          </p>
        </div>
        <Button
          onClick={startAdd}
          disabled={addingNew}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Add New Category Form */}
      <AnimatePresence>
        {addingNew && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-200 dark:border-violet-800 p-6"
          >
            <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-4">
              New Category
            </h3>
            <CategoryForm
              form={form}
              onNameChange={handleNameChange}
              onFormChange={setForm}
              onSave={handleSave}
              onCancel={cancelEdit}
              saving={saving}
              nameRef={nameRef}
              isNew
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-1"></div>
          <div className="col-span-3">Category</div>
          <div className="col-span-2">Slug</div>
          <div className="col-span-2">Products</div>
          <div className="col-span-1">Order</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-gray-900 dark:text-white font-medium mb-1">No categories yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first product category</p>
            <Button onClick={startAdd} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Category
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {categories.map((cat) => (
              <div key={cat._id}>
                {editingId === cat._id ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 bg-violet-50/50 dark:bg-violet-900/10 border-l-4 border-violet-500"
                  >
                    <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-4">
                      Editing: {cat.name}
                    </h3>
                    <CategoryForm
                      form={form}
                      onNameChange={handleNameChange}
                      onFormChange={setForm}
                      onSave={handleSave}
                      onCancel={cancelEdit}
                      saving={saving}
                      nameRef={nameRef}
                    />
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                    {/* Drag handle */}
                    <div className="col-span-1 flex items-center">
                      <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 cursor-grab" />
                    </div>

                    {/* Name + image */}
                    <div className="col-span-3 flex items-center gap-3">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{cat.name}</span>
                    </div>

                    {/* Slug */}
                    <div className="col-span-2">
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                        {cat.slug}
                      </code>
                    </div>

                    {/* Product count */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {productCounts[cat._id] ?? '—'} products
                      </span>
                    </div>

                    {/* Sort order */}
                    <div className="col-span-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{cat.sortOrder}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          cat.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {deleteConfirm === cat._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(cat._id)}
                            className="p-2 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-all"
                            title="Confirm delete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(cat._id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Inline form component ─── */

function CategoryForm({
  form,
  onNameChange,
  onFormChange,
  onSave,
  onCancel,
  saving,
  nameRef,
  isNew,
}: {
  form: { name: string; slug: string; description: string; image: string; isActive: boolean; sortOrder: number };
  onNameChange: (name: string) => void;
  onFormChange: (fn: (prev: typeof form) => typeof form) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  nameRef: React.RefObject<HTMLInputElement | null>;
  isNew?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={nameRef}
            type="text"
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Ethiopian Coffee"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            URL Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => onFormChange((f) => ({ ...f, slug: e.target.value }))}
            placeholder="e.g. ethiopian-coffee"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onFormChange((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of the category…"
            rows={3}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        {/* Image URL + Sort Order + Status */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Image URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.image}
                onChange={(e) => onFormChange((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://..."
                className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              />
              {form.image && (
                <img src={form.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => onFormChange((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
              <button
                type="button"
                onClick={() => onFormChange((f) => ({ ...f, isActive: !f.isActive }))}
                className={`w-full px-3 py-2.5 text-sm rounded-xl border font-medium transition-all ${
                  form.isActive
                    ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {form.isActive ? '✓ Active' : '✗ Inactive'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={onSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : isNew ? 'Create Category' : 'Save Changes'}
        </Button>
        <Button variant="outline" onClick={onCancel} className="rounded-xl">
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}
