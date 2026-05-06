'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Palette, Type, MousePointerClick, BarChart3, Image as ImageIcon,
  Upload, Plus, Trash2, Eye, EyeOff, Save, RotateCcw, GripVertical,
  MapPin, Star, ShoppingBag, ArrowRight, Truck, Sparkles, MessageCircle,
  Video, PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { HeroSettings, HeroButton, HeroStat, HeroImageObjectFit, HeroImagePosition, HeroMediaType, Testimonial } from '@/lib/useSiteSettings';
import { heroDefaults, defaultTestimonials } from '@/lib/useSiteSettings';

const ETH_GOLD = '#b8860b';
const ETH_DARK = '#7a5c1e';
const ETH_GREEN = '#2d6a2d';
const ETH_RED = '#c0392b';
const ETH_CREAM = '#fdf6ec';
const ETH_WARM = '#fff8ee';
const ETH_BORDER = '#e8d5b0';
const ETH_MUTED = '#9e7a2e';

export default function HeroEditorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hero, setHero] = useState<HeroSettings>(heroDefaults);
  const [siteName, setSiteName] = useState('ShopL');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState('');
  const [heroVideoFile, setHeroVideoFile] = useState<File | null>(null);
  const [heroVideoPreview, setHeroVideoPreview] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonials);

  useEffect(() => {
    api.get('/admin/settings')
      .then((r) => {
        const d = r.data.data;
        setSiteName(d.siteName || 'ShopL');
        if (d.hero) {
          setHero({ ...heroDefaults, ...d.hero });
          if (d.hero.heroImageUrl) setHeroImagePreview(d.hero.heroImageUrl);
          if (d.hero.heroVideoUrl) setHeroVideoPreview(d.hero.heroVideoUrl);
        }
        if (Array.isArray(d.testimonials) && d.testimonials.length > 0) {
          setTestimonials(d.testimonials.map((t: any) => ({
            name: t.name || '',
            role: t.role || '',
            text: t.text || '',
            avatar: t.avatar || (t.name ? String(t.name).charAt(0).toUpperCase() : '?'),
            rating: typeof t.rating === 'number' ? Math.min(5, Math.max(1, t.rating)) : 5,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const update = (patch: Partial<HeroSettings>) => {
    setHero((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  const updateButton = (idx: number, patch: Partial<HeroButton>) => {
    setHero((prev) => {
      const buttons = [...prev.buttons];
      buttons[idx] = { ...buttons[idx], ...patch };
      return { ...prev, buttons };
    });
    setHasChanges(true);
  };

  const addButton = () => {
    if (hero.buttons.length >= 3) return;
    update({ buttons: [...hero.buttons, { text: 'New Button', link: '/', style: 'outline' }] });
  };

  const removeButton = (idx: number) => {
    update({ buttons: hero.buttons.filter((_, i) => i !== idx) });
  };

  const updateStat = (idx: number, patch: Partial<HeroStat>) => {
    setHero((prev) => {
      const stats = [...prev.stats];
      stats[idx] = { ...stats[idx], ...patch };
      return { ...prev, stats };
    });
    setHasChanges(true);
  };

  const addStat = () => {
    if (hero.stats.length >= 6) return;
    update({ stats: [...hero.stats, { value: '0', label: 'New Stat' }] });
  };

  const removeStat = (idx: number) => {
    update({ stats: hero.stats.filter((_, i) => i !== idx) });
  };

  const updateTestimonial = (idx: number, patch: Partial<Testimonial>) => {
    setTestimonials((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      if (patch.name && !patch.avatar) next[idx].avatar = next[idx].avatar || String(next[idx].name).charAt(0).toUpperCase();
      return next;
    });
    setHasChanges(true);
  };

  const addTestimonial = () => {
    if (testimonials.length >= 8) return;
    setTestimonials((prev) => [...prev, { name: 'New Customer', role: 'Customer', text: 'Great products and service!', avatar: '?', rating: 5 }]);
    setHasChanges(true);
  };

  const removeTestimonial = (idx: number) => {
    setTestimonials((prev) => prev.filter((_, i) => i !== idx));
    setHasChanges(true);
  };

  const onHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setHeroImageFile(file);
    setHeroImagePreview(URL.createObjectURL(file));
    setHasChanges(true);
  };

  const onHeroVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    setHeroVideoFile(file);
    setHeroVideoPreview(URL.createObjectURL(file));
    update({ heroMediaType: 'video' });
    setHasChanges(true);
  };

  const handleReset = () => {
    setHero(heroDefaults);
    setHeroImageFile(null);
    setHeroImagePreview(heroDefaults.heroImageUrl || '');
    setHeroVideoFile(null);
    setHeroVideoPreview(heroDefaults.heroVideoUrl || '');
    setTestimonials(defaultTestimonials);
    setHasChanges(true);
    toast.info('Reset to defaults — save to apply');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let heroImageUrl = hero.heroImageUrl;
      if (heroImageFile) {
        const fd = new FormData();
        fd.append('image', heroImageFile);
        const up = await api.post('/upload/image', fd);
        heroImageUrl = up.data.data.url;
      }

      let heroVideoUrl = hero.heroVideoUrl;
      if (heroVideoFile) {
        const fd = new FormData();
        fd.append('video', heroVideoFile);
        const up = await api.post('/upload/video', fd);
        heroVideoUrl = up.data.data.url;
      }

      await api.put('/admin/settings', { hero: { ...hero, heroImageUrl, heroVideoUrl }, testimonials });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setHasChanges(false);
      setHeroImageFile(null);
      setHeroVideoFile(null);
      toast.success('Hero section and testimonials saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hero Page Editor</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customize your homepage hero section — WordPress style</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1.5">
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="gap-1.5 bg-violet-600 hover:bg-violet-700"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Publish'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">You have unsaved changes</span>
        </div>
      )}

      <div className={`grid gap-6 ${showPreview ? 'xl:grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>
        {/* ── EDIT PANEL ─── */}
        <div className="space-y-4">
          <Tabs defaultValue="content">
            <TabsList className="w-full">
              <TabsTrigger value="content" className="gap-1.5"><Type className="w-3.5 h-3.5" /> Content</TabsTrigger>
              <TabsTrigger value="buttons" className="gap-1.5"><MousePointerClick className="w-3.5 h-3.5" /> Buttons</TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Media</TabsTrigger>
              <TabsTrigger value="testimonials" className="gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Testimonials</TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Stats & CTA</TabsTrigger>
            </TabsList>

            {/* ── Content Tab ─── */}
            <TabsContent value="content" className="mt-4 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-violet-600" />
                  </span>
                  Badges
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Badge 1</Label>
                    <Input value={hero.badge1} onChange={(e) => update({ badge1: e.target.value })} placeholder="Made in Ethiopia · ሱቅ" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Badge 2</Label>
                    <Input value={hero.badge2} onChange={(e) => update({ badge2: e.target.value })} placeholder="✦ Authentic Handmade" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Type className="w-3.5 h-3.5 text-violet-600" />
                  </span>
                  Headline
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Each line appears on a separate row. Line 2 is gold, line 3 has a green accent.</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Line 1</Label>
                    <Input value={hero.headlineLine1} onChange={(e) => update({ headlineLine1: e.target.value })} placeholder="Discover" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Line 2 <Badge variant="outline" className="ml-1 text-[10px]">Gold accent</Badge></Label>
                    <Input value={hero.headlineLine2} onChange={(e) => update({ headlineLine2: e.target.value })} placeholder="Culture," />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Line 3 <Badge variant="outline" className="ml-1 text-[10px]">Green accent on last word</Badge></Label>
                    <Input value={hero.headlineLine3} onChange={(e) => update({ headlineLine3: e.target.value })} placeholder="Wear Heritage" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  </span>
                  Description & Social Proof
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={hero.description}
                      onChange={(e) => update({ description: e.target.value })}
                      rows={3}
                      placeholder="Describe what your store offers..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Social Proof Text</Label>
                    <Input value={hero.socialProofText} onChange={(e) => update({ socialProofText: e.target.value })} placeholder="50,000+ happy customers" />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Buttons Tab ─── */}
            <TabsContent value="buttons" className="mt-4 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <MousePointerClick className="w-3.5 h-3.5 text-violet-600" />
                    </span>
                    CTA Buttons
                  </h3>
                  <Button variant="outline" size="sm" onClick={addButton} disabled={hero.buttons.length >= 3} className="gap-1 text-xs">
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Up to 3 call-to-action buttons in the hero section.</p>

                <div className="space-y-3">
                  {hero.buttons.map((btn, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Button {idx + 1}</span>
                        </div>
                        {hero.buttons.length > 1 && (
                          <button onClick={() => removeButton(idx)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Label</Label>
                          <Input value={btn.text} onChange={(e) => updateButton(idx, { text: e.target.value })} placeholder="Shop Now" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Link</Label>
                          <Input value={btn.link} onChange={(e) => updateButton(idx, { link: e.target.value })} placeholder="/shop" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Style</Label>
                        <div className="flex gap-2">
                          {(['primary', 'outline'] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => updateButton(idx, { style: s })}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                                btn.style === s
                                  ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                                  : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {s === 'primary' ? 'Filled' : 'Outline'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── Media Tab ─── */}
            <TabsContent value="media" className="mt-4 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <ImageIcon className="w-3.5 h-3.5 text-violet-600" />
                  </span>
                  Hero Image
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload a hero image for the full-width banner. It appears as both the background and the right-side showcase.
                </p>
                <div className="space-y-3">
                  <div className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/50">
                    {heroImagePreview ? (
                      <img
                        src={heroImagePreview}
                        alt="Hero"
                        className="w-full h-full"
                        style={{
                          objectFit: hero.heroImageObjectFit ?? 'cover',
                          objectPosition: hero.heroImagePosition ?? 'center',
                          transform: `scale(${(hero.heroImageScale ?? 100) / 100})`,
                        }}
                      />
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">No hero image set</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Label htmlFor="hero-img-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-300 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-sm">
                      <Upload className="w-4 h-4" /> Upload
                    </Label>
                    <input id="hero-img-upload" type="file" accept="image/*" className="hidden" onChange={onHeroImageChange} />
                    {heroImagePreview && (
                      <Button variant="outline" size="sm" onClick={() => {
                        setHeroImageFile(null);
                        setHeroImagePreview('');
                        update({ heroImageUrl: '' });
                      }} className="text-red-500 gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Or paste image URL</Label>
                    <Input
                      value={hero.heroImageUrl}
                      onChange={(e) => {
                        update({ heroImageUrl: e.target.value });
                        if (!heroImageFile) setHeroImagePreview(e.target.value);
                      }}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Image size & fit */}
                  {heroImagePreview && (
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Image size & fit</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Fit</Label>
                          <select
                            value={hero.heroImageObjectFit ?? 'cover'}
                            onChange={(e) => update({ heroImageObjectFit: e.target.value as HeroImageObjectFit })}
                            className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 px-3"
                          >
                            <option value="cover">Cover (fill, crop if needed)</option>
                            <option value="contain">Contain (fit inside)</option>
                            <option value="fill">Fill (stretch)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Position</Label>
                          <select
                            value={hero.heroImagePosition ?? 'center'}
                            onChange={(e) => update({ heroImagePosition: e.target.value as HeroImagePosition })}
                            className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 px-3"
                          >
                            <option value="center">Center</option>
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Zoom ({hero.heroImageScale ?? 100}%)</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={50}
                            max={150}
                            value={hero.heroImageScale ?? 100}
                            onChange={(e) => update({ heroImageScale: parseInt(e.target.value, 10) })}
                            className="flex-1 h-2 rounded-full appearance-none bg-gray-200 dark:bg-gray-600 accent-violet-600"
                          />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">
                            {hero.heroImageScale ?? 100}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Media Type Selector ── */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <PlayCircle className="w-3.5 h-3.5 text-violet-600" />
                  </span>
                  Hero Media Type
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose whether to show an image or a video as the hero background and right-side showcase.</p>
                <div className="flex gap-3">
                  {(['image', 'video'] as HeroMediaType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => update({ heroMediaType: type })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                        (hero.heroMediaType ?? 'image') === type
                          ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                          : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      {type === 'image' ? 'Image' : 'Video'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Hero Video ── */}
              {(hero.heroMediaType ?? 'image') === 'video' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Video className="w-3.5 h-3.5 text-violet-600" />
                    </span>
                    Hero Video
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Upload a video or paste a direct video URL (.mp4, .webm). It will play as the hero background and right-side showcase.
                  </p>
                  <div className="space-y-3">
                    {/* Video preview */}
                    <div className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/50">
                      {heroVideoPreview ? (
                        <video
                          src={heroVideoPreview}
                          className="w-full h-full object-cover rounded-lg"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="text-center p-6">
                          <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">No hero video set</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Label htmlFor="hero-video-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-300 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-sm">
                        <Upload className="w-4 h-4" /> Upload Video
                      </Label>
                      <input id="hero-video-upload" type="file" accept="video/*" className="hidden" onChange={onHeroVideoChange} />
                      {heroVideoPreview && (
                        <Button variant="outline" size="sm" onClick={() => {
                          setHeroVideoFile(null);
                          setHeroVideoPreview('');
                          update({ heroVideoUrl: '' });
                        }} className="text-red-500 gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Or paste video URL (.mp4, .webm)</Label>
                      <Input
                        value={hero.heroVideoUrl}
                        onChange={(e) => {
                          update({ heroVideoUrl: e.target.value });
                          if (!heroVideoFile) setHeroVideoPreview(e.target.value);
                        }}
                        placeholder="https://example.com/video.mp4"
                      />
                    </div>

                    {/* Video playback options */}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Playback Options</Label>
                      {([
                        { key: 'heroVideoAutoplay' as const, label: 'Autoplay', desc: 'Start playing automatically' },
                        { key: 'heroVideoLoop' as const, label: 'Loop', desc: 'Repeat the video continuously' },
                        { key: 'heroVideoMuted' as const, label: 'Muted', desc: 'Play without sound (required for autoplay)' },
                      ]).map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                          </div>
                          <button
                            onClick={() => update({ [key]: !hero[key] })}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              hero[key] ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <div
                              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                              style={{ left: hero[key] ? '22px' : '2px' }}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5 text-violet-600" />
                  </span>
                  Product Cards
                </h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Show Product Cards</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Display top-rated products in the hero</p>
                  </div>
                  <button
                    onClick={() => update({ showProductCards: !hero.showProductCards })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      hero.showProductCards ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                      style={{ left: hero.showProductCards ? '22px' : '2px' }}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>ON:</strong> Product cards (top-rated items from your store) show on the right.
                  <br />
                  <strong>OFF + hero image set:</strong> Your uploaded hero image shows instead.
                </p>
              </div>
            </TabsContent>

            {/* ── Testimonials Tab (What Our Customers Say) ─── */}
            <TabsContent value="testimonials" className="mt-4 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <MessageCircle className="w-3.5 h-3.5 text-violet-600" />
                    </span>
                    What Our Customers Say
                  </h3>
                  <Button variant="outline" size="sm" onClick={addTestimonial} disabled={testimonials.length >= 8} className="gap-1 text-xs">
                    <Plus className="w-3 h-3" /> Add Testimonial
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  These appear on the homepage in the &quot;What Our Customers Say&quot; section. Customers can also rate and review products on each product page (Reviews tab).
                </p>
                <div className="space-y-3">
                  {testimonials.map((t, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Testimonial {idx + 1}</span>
                        {testimonials.length > 1 && (
                          <button onClick={() => removeTestimonial(idx)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={t.name}
                            onChange={(e) => updateTestimonial(idx, { name: e.target.value, avatar: e.target.value ? String(e.target.value).charAt(0).toUpperCase() : t.avatar })}
                            placeholder="Abebe Girma"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Role / Title</Label>
                          <Input value={t.role} onChange={(e) => updateTestimonial(idx, { role: e.target.value })} placeholder="Business Owner" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Quote</Label>
                        <Textarea
                          value={t.text}
                          onChange={(e) => updateTestimonial(idx, { text: e.target.value })}
                          rows={3}
                          placeholder="Great products and service!"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Avatar letter</Label>
                          <Input
                            className="w-12 text-center"
                            value={t.avatar}
                            onChange={(e) => updateTestimonial(idx, { avatar: e.target.value.slice(0, 1).toUpperCase() })}
                            placeholder="A"
                            maxLength={1}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Rating (1–5)</Label>
                          <select
                            value={t.rating}
                            onChange={(e) => updateTestimonial(idx, { rating: parseInt(e.target.value, 10) })}
                            className="h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── Stats & CTA Tab ─── */}
            <TabsContent value="stats" className="mt-4 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
                    </span>
                    Stats Bar
                  </h3>
                  <Button variant="outline" size="sm" onClick={addStat} disabled={hero.stats.length >= 6} className="gap-1 text-xs">
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gold statistics bar below the hero. Up to 6 items.</p>

                <div className="space-y-2">
                  {hero.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input value={stat.value} onChange={(e) => updateStat(idx, { value: e.target.value })} placeholder="50K+" className="text-sm" />
                        <Input value={stat.label} onChange={(e) => updateStat(idx, { label: e.target.value })} placeholder="Happy Customers" className="text-sm" />
                      </div>
                      {hero.stats.length > 1 && (
                        <button onClick={() => removeStat(idx)} className="text-red-500 hover:text-red-700 p-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  </span>
                  CTA Banner (Bottom)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">The call-to-action banner at the bottom of the homepage.</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Title (use \n for new line)</Label>
                    <Input value={hero.ctaBannerTitle} onChange={(e) => update({ ctaBannerTitle: e.target.value })} placeholder="Ready to Explore\nEthiopian Culture?" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={hero.ctaBannerDescription}
                      onChange={(e) => update({ ctaBannerDescription: e.target.value })}
                      rows={2}
                      placeholder="Join customers and discover..."
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── LIVE PREVIEW ─── */}
        {showPreview && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Live Preview</span>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
              {/* Mini Hero Banner Preview */}
              <div className="relative overflow-hidden" style={{ background: '#3d2b0e' }}>
                {/* Flag stripe */}
                <div className="h-0.5 w-full flex">
                  <div className="flex-1" style={{ background: ETH_GREEN }} />
                  <div className="flex-1" style={{ background: ETH_GOLD }} />
                  <div className="flex-1" style={{ background: ETH_RED }} />
                </div>

                {/* Background media */}
                {(hero.heroMediaType ?? 'image') === 'video' && heroVideoPreview ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <video
                      src={heroVideoPreview}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, #3d2b0e 45%, #3d2b0e99 60%, transparent 75%)' }} />
                  </div>
                ) : heroImagePreview && (hero.heroMediaType ?? 'image') === 'image' ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={heroImagePreview}
                      alt=""
                      className="w-full h-full"
                      style={{
                        objectFit: hero.heroImageObjectFit ?? 'cover',
                        objectPosition: hero.heroImagePosition ?? 'center',
                        transform: `scale(${(hero.heroImageScale ?? 100) / 100})`,
                      }}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, #3d2b0e 45%, #3d2b0e99 60%, transparent 75%)' }} />
                  </div>
                ) : null}

                {/* Diagonal accent when no media */}
                {!(hero.heroMediaType === 'video' ? heroVideoPreview : heroImagePreview) && (
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(155deg, #3d2b0e 55%, ${ETH_GOLD}22 55%)` }} />
                )}

                <div className="relative px-5 py-8" style={{ zIndex: 2 }}>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    {/* Left text */}
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {hero.badge1 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-semibold rounded-full" style={{ background: 'rgba(184,134,11,0.2)', color: ETH_GOLD, border: '1px solid rgba(184,134,11,0.35)' }}>
                            <MapPin className="w-1.5 h-1.5" /> {hero.badge1}
                          </span>
                        )}
                        {hero.badge2 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[8px] font-semibold rounded-full" style={{ background: 'rgba(45,106,45,0.2)', color: '#7dcc7d', border: '1px solid rgba(45,106,45,0.35)' }}>
                            {hero.badge2}
                          </span>
                        )}
                      </div>
                      <div>
                        <h1 className="font-extrabold leading-[1.1] tracking-tight text-base text-white">
                          {hero.headlineLine1}<br />
                          <span style={{ color: ETH_GOLD }}>{hero.headlineLine2}</span>{' '}
                          {(() => {
                            const words = hero.headlineLine3.split(' ');
                            if (words.length <= 1) return <span style={{ color: ETH_GOLD }}>{hero.headlineLine3}</span>;
                            return <><span className="text-white">{words.slice(0, -1).join(' ')}</span>{' '}<span style={{ color: ETH_GOLD }}>{words[words.length - 1]}</span></>;
                          })()}
                        </h1>
                        <div className="mt-1 flex gap-0.5">
                          <div className="h-0.5 w-6 rounded-full" style={{ background: ETH_GOLD }} />
                          <div className="h-0.5 w-3 rounded-full" style={{ background: ETH_GREEN }} />
                          <div className="h-0.5 w-1.5 rounded-full" style={{ background: ETH_RED }} />
                        </div>
                      </div>
                      <p className="text-[8px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {hero.description.length > 100 ? hero.description.slice(0, 100) + '...' : hero.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {hero.buttons.map((btn, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 px-2.5 py-1 text-[8px] font-bold rounded"
                            style={btn.style === 'primary'
                              ? { background: ETH_GOLD, color: '#fff' }
                              : { border: '1px solid rgba(255,255,255,0.35)', color: '#fff', background: 'transparent' }
                            }
                          >
                            {btn.style === 'primary' && <ShoppingBag className="w-2 h-2" />}
                            {btn.text}
                            {btn.style === 'outline' && <ArrowRight className="w-2 h-2" />}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                          {['A','B','C'].map((l, i) => (
                            <div key={i} className="w-3.5 h-3.5 rounded-full border flex items-center justify-center text-white text-[5px] font-bold"
                              style={{ borderColor: '#3d2b0e', background: i % 2 === 0 ? ETH_GOLD : ETH_GREEN }}>
                              {l}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="flex gap-px">
                            {[1,2,3,4,5].map(i => <Star key={i} className="w-1.5 h-1.5 fill-amber-400 text-amber-400" />)}
                          </div>
                          <p className="text-[6px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{hero.socialProofText}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right — hero media preview */}
                    <div className="relative flex justify-end overflow-hidden rounded-lg" style={{ aspectRatio: '3/4', maxHeight: '180px' }}>
                      {(hero.heroMediaType ?? 'image') === 'video' && heroVideoPreview ? (
                        <video
                          src={heroVideoPreview}
                          className="rounded-lg shadow-lg w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : heroImagePreview && (hero.heroMediaType ?? 'image') === 'image' ? (
                        <img
                          src={heroImagePreview}
                          alt="Hero"
                          className="rounded-lg shadow-lg w-full h-full"
                          style={{
                            objectFit: hero.heroImageObjectFit ?? 'cover',
                            objectPosition: hero.heroImagePosition ?? 'center',
                            transform: `scale(${(hero.heroImageScale ?? 100) / 100})`,
                          }}
                        />
                      ) : (
                        <div className="w-full rounded-lg flex items-center justify-center" style={{ aspectRatio: '3/4', maxHeight: '180px', background: 'rgba(184,134,11,0.08)', border: '1px dashed rgba(184,134,11,0.2)' }}>
                          <div className="text-center space-y-1">
                            <div className="text-2xl">☕ 🧺 📿</div>
                            <p className="text-[7px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                              {(hero.heroMediaType ?? 'image') === 'video' ? 'Hero video' : 'Hero image'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Feature Icons Bar */}
              <div style={{ background: ETH_WARM, borderBottom: `1px solid ${ETH_BORDER}` }}>
                <div className="px-4 py-2 flex justify-between">
                  {[
                    { icon: Truck, label: 'Free Delivery' },
                    { icon: Star, label: 'Returns' },
                    { icon: Sparkles, label: '24/7 Support' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#f5e6c8' }}>
                        <f.icon className="w-2.5 h-2.5" style={{ color: ETH_GOLD }} />
                      </div>
                      <span className="text-[7px] font-bold" style={{ color: '#3d2b0e' }}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Stats Bar Preview */}
              <div style={{ background: ETH_GOLD }}>
                <div className="px-5 py-3">
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(hero.stats.length, 4)}, 1fr)` }}>
                    {hero.stats.slice(0, 4).map((s, i) => (
                      <div key={i} className="text-center">
                        <div className="text-sm font-extrabold text-white">{s.value}</div>
                        <div className="text-[8px] font-medium" style={{ color: '#f5e6c8' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mini CTA Banner Preview */}
              <div className="py-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${ETH_GOLD} 0%, #8b6914 50%, ${ETH_GREEN} 100%)` }}>
                <div className="text-center px-5 space-y-1.5">
                  <div className="text-lg">☕ 🧺 📿</div>
                  <h2 className="text-xs font-extrabold text-white leading-tight whitespace-pre-line">
                    {hero.ctaBannerTitle.replace(/\\n/g, '\n')}
                  </h2>
                  <p className="text-[8px]" style={{ color: '#f5e6c8' }}>
                    {hero.ctaBannerDescription.length > 80 ? hero.ctaBannerDescription.slice(0, 80) + '...' : hero.ctaBannerDescription}
                  </p>
                  <div className="flex gap-1.5 justify-center pt-0.5">
                    <span className="px-2.5 py-0.5 text-[8px] font-bold rounded" style={{ background: ETH_CREAM, color: ETH_DARK }}>Create Account</span>
                    <span className="px-2.5 py-0.5 text-[8px] font-bold rounded" style={{ border: '1px solid rgba(255,255,255,0.5)', color: '#fff' }}>Browse</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
