'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Upload, X, Image as ImageIcon, Eye, Save, Globe, Calendar,
  ChevronDown, ChevronUp, Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link2, Quote, Minus,
  Undo, Redo, Type, Strikethrough
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import api from '@/lib/api';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { getProductUrl } from '@/lib/shopUrls';
import { toast } from 'sonner';

type EditorMode = 'visual' | 'text';

function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = '280px',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (editorRef.current && mode === 'visual') {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [mode]);

  const updateWordCount = useCallback((text: string) => {
    const stripped = text.replace(/<[^>]*>/g, '').trim();
    setWordCount(stripped ? stripped.split(/\s+/).length : 0);
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      updateWordCount(html);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleImageInsert = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const handleLinkInsert = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const ToolbarButton = ({ onClick, title, children, className = '' }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Toolbar Row 1: Media buttons + mode toggle */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-2 py-1.5 bg-gray-50 dark:bg-gray-800/80">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2.5 bg-white dark:bg-gray-700"
            onClick={handleImageInsert}
          >
            Add Media
          </Button>
        </div>
        <div className="flex items-center gap-0.5 bg-gray-200 dark:bg-gray-700 rounded p-0.5">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-2.5 py-0.5 text-xs rounded transition-colors ${
              mode === 'visual'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-2.5 py-0.5 text-xs rounded transition-colors ${
              mode === 'text'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Text
          </button>
        </div>
      </div>

      {/* Toolbar Row 2: Formatting */}
      {mode === 'visual' && (
        <div className="flex items-center gap-0.5 flex-wrap border-b border-gray-200 dark:border-gray-700 px-2 py-1 bg-gray-50 dark:bg-gray-800/80">
          <select
            className="h-7 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 px-1 mr-1"
            onChange={(e) => execCommand('formatBlock', e.target.value)}
            defaultValue=""
          >
            <option value="">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="h5">Heading 5</option>
            <option value="h6">Heading 6</option>
            <option value="pre">Preformatted</option>
          </select>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          <ToolbarButton onClick={() => execCommand('bold')} title="Bold (Ctrl+B)">
            <Bold className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('italic')} title="Italic (Ctrl+I)">
            <Italic className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('underline')} title="Underline (Ctrl+U)">
            <Underline className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Strikethrough">
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} title="Blockquote">
            <Quote className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('insertHorizontalRule')} title="Horizontal line">
            <Minus className="w-3.5 h-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bulleted list">
            <List className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered list">
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Align left">
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Align center">
            <AlignCenter className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('justifyRight')} title="Align right">
            <AlignRight className="w-3.5 h-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          <ToolbarButton onClick={handleLinkInsert} title="Insert link">
            <Link2 className="w-3.5 h-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          <ToolbarButton onClick={() => execCommand('undo')} title="Undo">
            <Undo className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('redo')} title="Redo">
            <Redo className="w-3.5 h-3.5" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Area */}
      {mode === 'visual' ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="prose prose-sm dark:prose-invert max-w-none px-4 py-3 outline-none overflow-y-auto"
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            updateWordCount(e.target.value);
          }}
          className="w-full px-4 py-3 outline-none resize-y bg-white dark:bg-gray-800 font-mono text-sm text-gray-800 dark:text-gray-200"
          style={{ minHeight }}
          placeholder={placeholder}
        />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/80">
        <span className="text-xs text-gray-400">Word count: {wordCount}</span>
        <span className="text-xs text-gray-400" suppressHydrationWarning>
          {new Date().toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

const emptyProduct = {
  name: '', description: '', shortDescription: '', type: 'physical', price: '', comparePrice: '',
  stock: '', sku: '', category: '', tags: '', isFeatured: false, isActive: true,
  thumbnail: '', images: '', downloadable: false,
  weight: '', length: '', width: '', height: '',
  currency: 'ETB' as 'ETB' | 'USD',
  colors: [] as { name: string; hex: string; image?: string }[],
  shippingClass: 'standard',
  shippingOverrides: {} as Record<string, string>,
};

export default function AddEditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { currency: siteCurrency } = useSiteSettings();

  const [form, setForm] = useState<any>({ ...emptyProduct });
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [publishOpen, setPublishOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [colorsOpen, setColorsOpen] = useState(true);
  const [imageOpen, setImageOpen] = useState(true);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#b8860b');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.data.data)).catch(() => {});
    if (editId) {
      api.get(`/products/${editId}`).then((r) => {
        const product = r.data.data.product || r.data.data;
        setEditProduct(product);
        const images = product.images || [];
        setForm({
          name: product.name,
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          type: product.type,
          price: product.price,
          comparePrice: product.comparePrice || '',
          stock: product.stock,
          sku: product.sku || '',
          category: product.category?._id || '',
          tags: product.tags?.join(', ') || '',
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          thumbnail: product.thumbnail || '',
          images: images.join(', ') || '',
          downloadable: false,
          weight: product.weight || '',
          length: product.dimensions?.length || '',
          width: product.dimensions?.width || '',
          height: product.dimensions?.height || '',
          currency: product.currency === 'USD' ? 'USD' : 'ETB',
          colors: product.colors || [],
          shippingClass: product.shippingClass || 'standard',
          shippingOverrides: product.shippingOverrides || {},
        });
        setImagePreviews(images);
      }).catch(() => {
        toast.error('Failed to load product');
        router.push('/admin/products');
      });
    }
  }, [editId]);

  const handleSave = async (e?: React.FormEvent, asDraft = false) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : 0,
        stock: parseInt(form.stock) || 0,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        images: form.images ? form.images.split(',').map((i: string) => i.trim()).filter(Boolean) : [],
        colors: form.colors || [],
        isActive: asDraft ? false : form.isActive,
        weight: form.weight ? parseFloat(form.weight) : 0,
        dimensions: {
          length: form.length ? parseFloat(form.length) : 0,
          width: form.width ? parseFloat(form.width) : 0,
          height: form.height ? parseFloat(form.height) : 0,
        },
        shippingClass: form.shippingClass || 'standard',
        shippingOverrides: form.shippingOverrides || {},
      };
      delete payload.downloadable;
      delete payload.length;
      delete payload.width;
      delete payload.height;

      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('images', file));
      const res = await api.post('/upload/images', formData);
      const uploadedUrls = res.data.data.map((img: any) => img.url);
      const newImages = [...imagePreviews, ...uploadedUrls];
      setImagePreviews(newImages);
      setForm((p: any) => ({
        ...p,
        images: newImages.join(', '),
        thumbnail: p.thumbnail || uploadedUrls[0],
      }));
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newImages);
    const removedUrl = imagePreviews[index];
    setForm((p: any) => ({
      ...p,
      images: newImages.join(', '),
      thumbnail: p.thumbnail === removedUrl ? (newImages[0] || '') : p.thumbnail,
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleImageUpload(e.dataTransfer.files);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddingCategory(true);
    try {
      const res = await api.post('/products/categories', { name });
      const created = res.data.data;
      setCategories((prev) => [...prev, created]);
      setForm((p: any) => ({ ...p, category: created._id }));
      setNewCategoryName('');
      setShowAddCategory(false);
      toast.success(`Category "${created.name}" created`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setAddingCategory(false);
    }
  };


  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => router.push('/admin/products')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editProduct ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Name */}
            <div>
              <Input
                value={form.name}
                onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))}
                placeholder="Product name"
                className="text-lg h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 font-medium"
                required
              />
            </div>

            {/* Description Editor */}
            <div>
              <RichTextEditor
                value={form.description}
                onChange={(val) => setForm((p: any) => ({ ...p, description: val }))}
                placeholder="Enter product description..."
                minHeight="280px"
              />
            </div>

            {/* Product Data Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Product data</span>
                <span className="text-sm text-gray-500 ml-2">—</span>
                <Select value={form.type} onValueChange={(v) => setForm((p: any) => ({ ...p, type: v }))}>
                  <SelectTrigger className="inline-flex w-auto h-7 text-xs ml-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Simple product</SelectItem>
                    <SelectItem value="digital">Digital product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
                <label className="inline-flex items-center gap-1.5 ml-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.downloadable}
                    onChange={(e) => setForm((p: any) => ({ ...p, downloadable: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Downloadable</span>
                </label>
              </div>

              <Tabs defaultValue="general" className="w-full">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <TabsList className="bg-transparent rounded-none border-0 h-auto p-0 w-full justify-start">
                    <TabsTrigger
                      value="general"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
                    >
                      General
                    </TabsTrigger>
                    <TabsTrigger
                      value="inventory"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
                    >
                      Inventory
                    </TabsTrigger>
                    <TabsTrigger
                      value="shipping"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
                    >
                      Shipping
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="general" className="p-4 space-y-4">
                  <div className="space-y-2 mb-4">
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Currency</Label>
                    <select
                      value={form.currency ?? 'ETB'}
                      onChange={(e) => setForm((p: any) => ({ ...p, currency: e.target.value as 'ETB' | 'USD' }))}
                      className="w-full max-w-xs h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 px-3"
                    >
                      <option value="ETB">ETB (Ethiopian Birr)</option>
                      <option value="USD">USD (US Dollar)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Regular price ({form.currency ?? 'ETB'})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm((p: any) => ({ ...p, price: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Sale price ({form.currency ?? 'ETB'})</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={form.comparePrice}
                          onChange={(e) => setForm((p: any) => ({ ...p, comparePrice: e.target.value }))}
                          placeholder="0.00"
                        />
                        <button type="button" className="text-xs text-violet-600 hover:text-violet-700 whitespace-nowrap underline">
                          Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="inventory" className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-gray-400">SKU</Label>
                      <Input
                        value={form.sku}
                        onChange={(e) => setForm((p: any) => ({ ...p, sku: e.target.value }))}
                        placeholder="Stock keeping unit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Stock quantity</Label>
                      <Input
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm((p: any) => ({ ...p, stock: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="shipping" className="p-4 space-y-5">
                  {/* Weight */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={form.weight}
                      onChange={(e) => setForm((p: any) => ({ ...p, weight: e.target.value }))}
                      placeholder="e.g. 0.350"
                    />
                    <p className="text-xs text-gray-400">Used to calculate shipping cost automatically.</p>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Dimensions (cm) — L × W × H</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        type="number"
                        step="0.1"
                        value={form.length}
                        onChange={(e) => setForm((p: any) => ({ ...p, length: e.target.value }))}
                        placeholder="Length"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        value={form.width}
                        onChange={(e) => setForm((p: any) => ({ ...p, width: e.target.value }))}
                        placeholder="Width"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        value={form.height}
                        onChange={(e) => setForm((p: any) => ({ ...p, height: e.target.value }))}
                        placeholder="Height"
                      />
                    </div>
                  </div>

                  {/* Shipping class */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Shipping class</Label>
                    <select
                      value={form.shippingClass || 'standard'}
                      onChange={(e) => setForm((p: any) => ({ ...p, shippingClass: e.target.value }))}
                      className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 px-3"
                    >
                      <option value="standard">Standard</option>
                      <option value="bulky">Bulky / Heavy</option>
                      <option value="fragile">Fragile</option>
                      <option value="free">Free shipping</option>
                      <option value="no_shipping">No shipping (local pickup)</option>
                    </select>
                    <p className="text-xs text-gray-400">
                      "Free shipping" overrides all rates to ETB 0. "No shipping" hides shipping methods.
                    </p>
                  </div>

                  {/* Per-carrier price overrides */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">Per-carrier price overrides (ETB)</Label>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Leave blank to use weight-based rates from Shipping Settings. Fill in to force a fixed price for this product.
                      </p>
                    </div>
                    {[
                      { id: 'ups_expedited', label: 'UPS Worldwide Expedited®' },
                      { id: 'dhl_standard', label: 'DHL eCommerce Parcel Standard' },
                      { id: 'dhl_express', label: 'DHL Express Worldwide' },
                    ].map((carrier) => (
                      <div key={carrier.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300 w-52 flex-shrink-0">{carrier.label}</span>
                        <Input
                          type="number"
                          step="1"
                          value={(form.shippingOverrides || {})[carrier.id] ?? ''}
                          onChange={(e) => setForm((p: any) => ({
                            ...p,
                            shippingOverrides: {
                              ...(p.shippingOverrides || {}),
                              [carrier.id]: e.target.value,
                            },
                          }))}
                          placeholder="e.g. 8257"
                          className="max-w-[140px]"
                        />
                        {(form.shippingOverrides || {})[carrier.id] && (
                          <button
                            type="button"
                            onClick={() => setForm((p: any) => {
                              const overrides = { ...(p.shippingOverrides || {}) };
                              delete overrides[carrier.id];
                              return { ...p, shippingOverrides: overrides };
                            })}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Short Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Product short description</span>
              </div>
              <div className="p-0">
                <RichTextEditor
                  value={form.shortDescription}
                  onChange={(val) => setForm((p: any) => ({ ...p, shortDescription: val }))}
                  placeholder="Enter a short description for this product..."
                  minHeight="150px"
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Right 1/3 */}
          <div className="space-y-4">
            {/* Publish Box */}
            <SidebarSection title="Publish" open={publishOpen} onToggle={() => setPublishOpen(!publishOpen)}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => handleSave(undefined, true)}
                    disabled={saving}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => {
                      if (editProduct) {
                        window.open(getProductUrl(editProduct), '_blank');
                      }
                    }}
                    disabled={!editProduct}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>
                </div>

                <div className="space-y-2 text-sm border-t border-b border-gray-100 dark:border-gray-700 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5" />
                      Status:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {form.isActive ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Visibility:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {form.isActive ? 'Public' : 'Hidden'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Publish:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Immediately</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Catalog visibility:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Shop and search results</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {editProduct && (
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:text-red-600 underline"
                      onClick={() => router.push('/admin/products')}
                    >
                      Move to Trash
                    </button>
                  )}
                  <Button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700 text-white ml-auto h-9 px-6"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editProduct ? 'Update' : 'Publish'}
                  </Button>
                </div>
              </div>
            </SidebarSection>

            {/* Categories */}
            <SidebarSection title="Categories" open={categoriesOpen} onToggle={() => setCategoriesOpen(!categoriesOpen)}>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-xs text-gray-400">No categories found</p>
                ) : (
                  categories.map((cat) => (
                    <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={form.category === cat._id}
                        onChange={() => setForm((p: any) => ({ ...p, category: cat._id }))}
                        className="rounded-full border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                    </label>
                  ))
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3">
                {showAddCategory ? (
                  <div className="space-y-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="text-sm h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                        if (e.key === 'Escape') {
                          setShowAddCategory(false);
                          setNewCategoryName('');
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                        onClick={handleAddCategory}
                        disabled={addingCategory || !newCategoryName.trim()}
                      >
                        {addingCategory ? 'Adding...' : 'Add'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setShowAddCategory(false);
                          setNewCategoryName('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                  >
                    + Add New Category
                  </button>
                )}
              </div>
            </SidebarSection>

            {/* Tags */}
            <SidebarSection title="Tags" open={tagsOpen} onToggle={() => setTagsOpen(!tagsOpen)}>
              <div className="space-y-2">
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((p: any) => ({ ...p, tags: e.target.value }))}
                  placeholder="Add tags (comma-separated)"
                  className="text-sm"
                />
                {form.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.split(',').map((tag: string, i: number) => tag.trim() && (
                      <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                        {tag.trim()}
                        <button
                          type="button"
                          onClick={() => {
                            const tags = form.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
                            tags.splice(i, 1);
                            setForm((p: any) => ({ ...p, tags: tags.join(', ') }));
                          }}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </SidebarSection>

            {/* Colors */}
            <SidebarSection title="Colors" open={colorsOpen} onToggle={() => setColorsOpen(!colorsOpen)}>
              <div className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add colors, then assign each gallery photo a color below.
                </p>

                {/* Existing colors list */}
                {(form.colors || []).length > 0 && (
                  <div className="space-y-1.5">
                    {(form.colors as { name: string; hex: string; image?: string }[]).map((c, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                        <span className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0" style={{ background: c.hex }} />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{c.name}</span>
                        {c.image && (
                          <div className="w-7 h-7 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                            <img src={c.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setForm((p: any) => ({ ...p, colors: p.colors.filter((_: any, j: number) => j !== i) }))}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new color */}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5 bg-white dark:bg-gray-700 flex-shrink-0"
                    title="Pick color"
                  />
                  <Input
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="e.g. Bronze/Ivory"
                    className="text-sm h-9 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const name = newColorName.trim();
                        if (!name) return;
                        setForm((p: any) => ({ ...p, colors: [...(p.colors || []), { name, hex: newColorHex, image: '' }] }));
                        setNewColorName('');
                        setNewColorHex('#b8860b');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-3 text-xs bg-violet-600 hover:bg-violet-700 flex-shrink-0"
                    onClick={() => {
                      const name = newColorName.trim();
                      if (!name) return;
                      setForm((p: any) => ({ ...p, colors: [...(p.colors || []), { name, hex: newColorHex, image: '' }] }));
                      setNewColorName('');
                      setNewColorHex('#b8860b');
                    }}
                    disabled={!newColorName.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </SidebarSection>

            {/* Product Image */}
            <SidebarSection title="Product Image" open={imageOpen} onToggle={() => setImageOpen(!imageOpen)}>
              <div className="space-y-3">
                {form.thumbnail ? (
                  <div className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <img src={form.thumbnail} alt="Product" className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('thumbnail-upload') as HTMLInputElement;
                          input?.click();
                        }}
                        className="text-xs text-violet-600 hover:text-violet-700 underline"
                      >
                        Click the image to edit or update
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((p: any) => ({ ...p, thumbnail: '' }))}
                      className="text-xs text-red-500 hover:text-red-600 underline"
                    >
                      Remove product image
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      handleDrop(e);
                    }}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-violet-500 transition-colors cursor-pointer"
                    onClick={() => {
                      const input = document.getElementById('thumbnail-upload') as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs text-violet-600 hover:text-violet-700 underline">
                      Set product image
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  id="thumbnail-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files[0]) {
                      const fd = new FormData();
                      fd.append('images', files[0]);
                      api.post('/upload/images', fd).then((res) => {
                        const url = res.data.data[0]?.url;
                        if (url) {
                          setForm((p: any) => ({ ...p, thumbnail: url }));
                          if (!imagePreviews.includes(url)) {
                            const newImages = [...imagePreviews, url];
                            setImagePreviews(newImages);
                            setForm((p: any) => ({ ...p, images: newImages.join(', '), thumbnail: url }));
                          }
                        }
                      }).catch(() => toast.error('Upload failed'));
                    }
                  }}
                />
              </div>
            </SidebarSection>

            {/* Product Gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Product Gallery</span>
                {(form.colors || []).length > 0 && (
                  <span className="ml-2 text-xs font-medium text-amber-600">← use the dropdown under each photo to link it to a color</span>
                )}
              </div>
              <div className="p-4 space-y-3">
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {imagePreviews.map((url, index) => {
                      const isThumbnail = form.thumbnail === url;
                      const hasColors = (form.colors || []).length > 0;
                      const assignedColor = (form.colors || []).find((c: { image?: string }) => c.image === url);
                      const needsColor = hasColors && !assignedColor;
                      return (
                        <div key={index} className="relative group flex flex-col gap-1">
                          {/* Image */}
                          <div
                            className={`aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer border-2 transition-colors ${
                              isThumbnail
                                ? 'border-violet-500'
                                : assignedColor
                                ? 'border-amber-400'
                                : needsColor
                                ? 'border-dashed border-orange-300'
                                : 'border-transparent hover:border-gray-300'
                            }`}
                            onClick={() => setForm((p: any) => ({ ...p, thumbnail: url }))}
                            title="Click to set as cover image"
                          >
                            <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                            {assignedColor && (
                              <span
                                className="absolute bottom-1.5 left-1.5 w-4 h-4 rounded-full border-2 border-white shadow"
                                style={{ background: assignedColor.hex }}
                              />
                            )}
                          </div>

                          {/* Cover badge */}
                          {isThumbnail && (
                            <span className="absolute top-1 left-1 bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                              Cover
                            </span>
                          )}

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {/* Color assignment dropdown */}
                          {hasColors && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {assignedColor ? `Color: ${assignedColor.name}` : '⚠ Assign color'}
                              </span>
                              <select
                                value={assignedColor?.name || ''}
                                onChange={(e) => {
                                  const selectedName = e.target.value;
                                  setForm((p: any) => {
                                    const colors = (p.colors as { name: string; hex: string; image?: string }[]).map((c) => {
                                      if (c.name === selectedName) return { ...c, image: url };
                                      if (c.image === url) return { ...c, image: '' };
                                      return c;
                                    });
                                    return { ...p, colors };
                                  });
                                }}
                                className={`w-full text-xs rounded border bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 truncate ${
                                  assignedColor
                                    ? 'border-amber-400 font-medium'
                                    : 'border-orange-300 dark:border-orange-500'
                                }`}
                              >
                                <option value="">— pick a color —</option>
                                {(form.colors as { name: string; hex: string; image?: string }[]).map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-violet-500 transition-colors cursor-pointer"
                >
                  <input
                    type="file"
                    id="gallery-upload"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    disabled={uploadingImages}
                  />
                  <label htmlFor="gallery-upload" className="cursor-pointer">
                    <Upload className="w-6 h-6 mx-auto mb-1.5 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {uploadingImages ? 'Uploading...' : 'Add product gallery images'}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Options</span>
              </div>
              <div className="p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((p: any) => ({ ...p, isFeatured: e.target.checked }))}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Featured product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active (visible in store)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
