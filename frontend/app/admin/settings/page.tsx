'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Settings2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';
import { rewriteAssetUrl } from '@/lib/rewriteAssetUrl';

export default function AdminSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const defaultWhyChoose = [
    { title: 'Secure Payments', desc: 'Stripe, PayPal, Flutterwave, Telebirr & CBE Birr supported.' },
    { title: 'Fast Delivery', desc: 'Same-day in Addis Ababa, nationwide within 3–10 days.' },
    { title: 'Easy Returns', desc: '30-day hassle-free returns on all physical products.' },
    { title: '24/7 Support', desc: 'Round-the-clock support via chat, email, and phone.' },
    { title: 'Global Reach', desc: 'Multi-currency shopping from anywhere in the world.' },
    { title: 'Instant Digital', desc: 'Instant delivery for courses, downloads & software.' },
  ];
  const defaultBazarRules = [
    'Arrive at least 30 minutes before the bazar opens to set up your table.',
    'Keep your table tidy and do not block aisles or other vendors.',
    'Prices must be clearly displayed for all products or services.',
    'No counterfeit, illegal, or inappropriate items are allowed.',
    'Follow all instructions from the organizing team during setup and closing.',
  ];
  const [form, setForm] = useState({
    siteName: 'Shop Local Ethiopia',
    logoUrl: '',
    tagline: 'premium Ethiopian cultural products',
    trustBadges: ['Free shipping over ETB 1000', 'Secure checkout', '30-day returns'] as [string, string, string],
    contactEmail: 'support@shopLocal.com',
    contactPhone: '+251 911 959219',
    contactAddress: 'Addis Ababa, Ethiopia',
    whyChooseHeading: 'Why Choose',
    whyChooseSubtitle: 'The best shopping experience for Ethiopian cultural products.',
    whyChooseFeatures: defaultWhyChoose,
    welcomeCouponCode: 'WELCOME10',
    welcomeDiscount: '10%',
    bazarRules: defaultBazarRules,
    navLinks: [] as { label: string; href: string }[],
    whyChooseUsPage: {
      heritageBadgeText: 'Our Heritage & Values',
      title: 'Why Choose',
      subtitle: '',
      ourStoryTitle: 'Our Story: Preserving Culture & Craft',
      ourStoryParagraphs: [] as string[],
      missionTitle: 'Our Core Mission',
      missionItems: [] as { title: string; desc: string }[],
      loomImageUrl: '',
      loomImageCaption: '',
      craftsmanshipBadgeText: 'Traditional Craftsmanship',
      craftsmanshipTitle: 'How Our Products Are Made',
      craftsmanshipDesc: '',
      craftsmanshipSteps: [] as { step: string; title: string; desc: string }[],
      promiseTitle: 'Our Promise to You',
      promiseSubtitle: '',
      promiseItems: [] as { icon: string; title: string; desc: string }[],
    }
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loomImageFile, setLoomImageFile] = useState<File | null>(null);
  const [loomImagePreview, setLoomImagePreview] = useState<string>('');

  useEffect(() => {
    api.get('/admin/settings').then((r) => {
      const d = r.data.data;
      const badges = Array.isArray(d.trustBadges) && d.trustBadges.length >= 3
        ? [d.trustBadges[0], d.trustBadges[1], d.trustBadges[2]]
        : ['Free shipping over ETB 1000', 'Secure checkout', '30-day returns'];
      const features = Array.isArray(d.whyChooseFeatures) && d.whyChooseFeatures.length >= 6
        ? d.whyChooseFeatures.slice(0, 6).map((f: any) => ({ title: f.title ?? '', desc: f.desc ?? '' }))
        : defaultWhyChoose;
      const rules = Array.isArray(d.bazarRules) && d.bazarRules.length
        ? d.bazarRules
        : defaultBazarRules;
      const defaultNavLinks = [
        { href: '/shop', label: 'Shop' },
        { href: '/shop/hand-woven-textiles-and-apparel', label: 'Textiles & Apparel' },
        { href: '/shop/artisan-craft-and-home-decor', label: 'Artisan & Decor' },
        { href: '/shop?featured=true', label: 'Featured' },
        { href: '/bazar-vendor-apply', label: 'Join Bazar as Vendor' },
      ];
      const navLinks = Array.isArray(d.navLinks) && d.navLinks.length
        ? d.navLinks
        : defaultNavLinks;

      const wcUs = d.whyChooseUsPage || {};
      const wcUsPage = {
        heritageBadgeText: wcUs.heritageBadgeText ?? 'Our Heritage & Values',
        title: wcUs.title ?? 'Why Choose',
        subtitle: wcUs.subtitle ?? 'We connect local Ethiopian artisans with the global marketplace, preserving traditions...',
        ourStoryTitle: wcUs.ourStoryTitle ?? 'Our Story: Preserving Culture & Craft',
        ourStoryParagraphs: Array.isArray(wcUs.ourStoryParagraphs) ? wcUs.ourStoryParagraphs : [
          'Every basket, jewelry piece, and woven garment on our platform tells a story that dates back generations. In the fast-paced world of mass production, local Ethiopian artisans keep the spirit of handmade creation alive.',
          'Shop Local Ethiopia was founded to bridge the gap between rural master craftsmen and buyers who appreciate unique, high-quality products. By purchasing from us, you directly support local communities, providing sustainable incomes for weavers, potters, and designers across the country.',
          'We are dedicated to fair-trade principles. Our partnership guarantees that the artisans who create these masterpieces are paid fairly and treated with the respect their incredible skills deserve.'
        ],
        missionTitle: wcUs.missionTitle ?? 'Our Core Mission',
        missionItems: Array.isArray(wcUs.missionItems) && wcUs.missionItems.length ? wcUs.missionItems : [
          { title: 'Authenticity Guarantee', desc: '100% genuine cultural items direct from the source.' },
          { title: 'Empowering Communities', desc: 'Providing sustainable livelihood for local rural artisans.' },
          { title: 'Preserving Heritage', desc: 'Keeping age-old Ethiopian handcraft techniques alive.' }
        ],
        loomImageUrl: wcUs.loomImageUrl ?? '/how-product-made.png',
        loomImageCaption: wcUs.loomImageCaption ?? 'An artisan hand-weaving traditional Ethiopian cotton fabric on a wooden loom.',
        craftsmanshipBadgeText: wcUs.craftsmanshipBadgeText ?? 'Traditional Craftsmanship',
        craftsmanshipTitle: wcUs.craftsmanshipTitle ?? 'How Our Products Are Made',
        craftsmanshipDesc: wcUs.craftsmanshipDesc ?? 'Our textiles, like the traditional Habesha Kemis, are made using hand-spun local cotton. Master weavers (known locally as Shemane) spend days on wooden handlooms, weaving the threads into fine garments.',
        craftsmanshipSteps: Array.isArray(wcUs.craftsmanshipSteps) && wcUs.craftsmanshipSteps.length ? wcUs.craftsmanshipSteps : [
          { step: '1', title: 'Spinning Raw Cotton', desc: 'Raw, organic cotton is cleaned and spun by hand into delicate threads.' },
          { step: '2', title: 'Natural Dyeing', desc: 'Threads are dyed using natural extracts from flowers, roots, and leaves.' },
          { step: '3', title: 'Handloom Weaving', desc: 'Using a traditional wooden loom, the weaver manually intertwines the patterns (Tibeb).' },
          { step: '4', title: 'Intricate Finishing', desc: 'Garments are finished with hand-embroidery and final detail inspections.' }
        ],
        promiseTitle: wcUs.promiseTitle ?? 'Our Promise to You',
        promiseSubtitle: wcUs.promiseSubtitle ?? 'We build trust through high-quality materials, secure transactions, and a seamless shopping experience.',
        promiseItems: Array.isArray(wcUs.promiseItems) && wcUs.promiseItems.length ? wcUs.promiseItems : [
          { icon: 'Shield', title: 'Secure Local Payments', desc: 'Shop easily with Telebirr, CBE Birr, Chapa, Stripe, or PayPal.' },
          { icon: 'Truck', title: 'Reliable Shipping', desc: 'Same-day delivery in Addis Ababa, and global DHL shipping.' },
          { icon: 'Heart', title: 'Community Support', desc: 'Over 80% of every sale goes directly to the creating artisan.' },
          { icon: 'Users', title: '24/7 Dedicated Support', desc: 'Our customer support team is always ready to assist you.' }
        ]
      };

      setForm({
        siteName: d.siteName || 'Shop Local Ethiopia',
        logoUrl: d.logoUrl || '',
        tagline: d.tagline || 'premium Ethiopian cultural products',
        trustBadges: badges as [string, string, string],
        contactEmail: d.contactEmail ?? 'support@shopLocal.com',
        contactPhone: d.contactPhone ?? '+251 911 959219',
        contactAddress: d.contactAddress ?? 'Addis Ababa, Ethiopia',
        whyChooseHeading: d.whyChooseHeading ?? 'Why Choose',
        whyChooseSubtitle: d.whyChooseSubtitle ?? 'The best shopping experience for Ethiopian cultural products.',
        whyChooseFeatures: features,
        welcomeCouponCode: d.welcomeCouponCode || 'WELCOME10',
        welcomeDiscount: d.welcomeDiscount || '10%',
        bazarRules: rules,
        navLinks,
        whyChooseUsPage: wcUsPage,
      });
      if (d.logoUrl) setLogoPreview(d.logoUrl);
      if (wcUsPage.loomImageUrl) setLoomImagePreview(wcUsPage.loomImageUrl);
    }).catch(() => {});
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image (PNG, JPG, GIF, WebP)');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const onLoomImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image (PNG, JPG, GIF, WebP)');
      return;
    }
    setLoomImageFile(file);
    setLoomImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let logoUrl = form.logoUrl;
      if (logoFile) {
        const fd = new FormData();
        fd.append('image', logoFile);
        const up = await api.post('/upload/image', fd);
        logoUrl = up.data.data.url;
      }
      let loomImageUrl = form.whyChooseUsPage.loomImageUrl;
      if (loomImageFile) {
        const fd = new FormData();
        fd.append('image', loomImageFile);
        const up = await api.post('/upload/image', fd);
        loomImageUrl = up.data.data.url;
      }
      await api.put('/admin/settings', {
        siteName: form.siteName,
        logoUrl,
        tagline: form.tagline,
        trustBadges: form.trustBadges,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        contactAddress: form.contactAddress,
        whyChooseHeading: form.whyChooseHeading,
        whyChooseSubtitle: form.whyChooseSubtitle,
        whyChooseFeatures: form.whyChooseFeatures,
        welcomeCouponCode: form.welcomeCouponCode,
        welcomeDiscount: form.welcomeDiscount,
        bazarRules: form.bazarRules,
        navLinks: form.navLinks,
        whyChooseUsPage: { ...form.whyChooseUsPage, loomImageUrl },
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Site settings saved!');
      setLogoFile(null);
      setLoomImageFile(null);
      router.push('/admin');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Settings2 className="w-7 h-7 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Site settings</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your branding, footer contact details, homepage &quot;Why Choose&quot; section, product trust badges, bazar rules,
          and welcome popup discount in one place.
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-xl space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Branding</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Update your shop name, logo, and short tagline. These appear across your entire site.
          </p>

          <div className="space-y-2">
            <Label>Site name</Label>
            <Input
              value={form.siteName}
              onChange={(e) => setForm((p) => ({ ...p, siteName: e.target.value }))}
              placeholder="Shop Local Ethiopia"
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/50">
                {logoPreview ? (
                  <img src={rewriteAssetUrl(logoPreview)} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-300 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20">
                    <Upload className="w-4 h-4" /> Upload image
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  or paste logo URL below (e.g. http://localhost:8001/uploads/1771608418988-869861871.jpg)
                </p>
                <Input
                  value={form.logoUrl}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, logoUrl: e.target.value }));
                    if (!logoFile) setLogoPreview(e.target.value);
                  }}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short tagline (optional)</Label>
            <Input
              value={form.tagline}
              onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
              placeholder="premium Ethiopian cultural products"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Footer contact</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Email, phone, and address shown in the site footer.</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Contact email</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                placeholder="support@shopLocal.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact phone</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                placeholder="+251 911 959219"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact address</Label>
              <Input
                value={form.contactAddress}
                onChange={(e) => setForm((p) => ({ ...p, contactAddress: e.target.value }))}
                placeholder="Addis Ababa, Ethiopia"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Why Choose section (homepage)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Heading and subtitle appear above the six feature cards. Title is shown as &quot;{form.whyChooseHeading} [Site Name]?&quot;</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Heading (e.g. Why Choose)</Label>
              <Input
                value={form.whyChooseHeading}
                onChange={(e) => setForm((p) => ({ ...p, whyChooseHeading: e.target.value }))}
                placeholder="Why Choose"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Input
                value={form.whyChooseSubtitle}
                onChange={(e) => setForm((p) => ({ ...p, whyChooseSubtitle: e.target.value }))}
                placeholder="The best shopping experience for Ethiopian cultural products."
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Feature cards (title + description):</p>
            {form.whyChooseFeatures.map((f, i) => (
              <div key={i} className="space-y-1.5 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <Label>Feature {i + 1} title</Label>
                <Input
                  value={f.title}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    whyChooseFeatures: p.whyChooseFeatures.map((ff, j) => j === i ? { ...ff, title: e.target.value } : ff),
                  }))}
                  placeholder="e.g. Secure Payments"
                />
                <Label>Feature {i + 1} description</Label>
                <Input
                  value={f.desc}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    whyChooseFeatures: p.whyChooseFeatures.map((ff, j) => j === i ? { ...ff, desc: e.target.value } : ff),
                  }))}
                  placeholder="Short description"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Why Choose Us Page (/why-choose-us)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize the standalone Why Choose Us page, including the story, loom image, weaving steps, and core promise pillars.</p>
          
          <div className="space-y-4">
            {/* Hero Header */}
            <div className="space-y-1.5">
              <Label>Heritage Badge Text</Label>
              <Input
                value={form.whyChooseUsPage?.heritageBadgeText || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, heritageBadgeText: e.target.value }
                }))}
                placeholder="Our Heritage & Values"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Page Title Prefix (e.g. Why Choose)</Label>
              <Input
                value={form.whyChooseUsPage?.title || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, title: e.target.value }
                }))}
                placeholder="Why Choose"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Page Subtitle</Label>
              <Input
                value={form.whyChooseUsPage?.subtitle || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, subtitle: e.target.value }
                }))}
                placeholder="We connect local artisans..."
              />
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Our Story */}
            <div className="space-y-1.5">
              <Label>Our Story Title</Label>
              <Input
                value={form.whyChooseUsPage?.ourStoryTitle || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, ourStoryTitle: e.target.value }
                }))}
                placeholder="Our Story: Preserving Culture & Craft"
              />
            </div>

            {/* Our Story Paragraphs */}
            <div className="space-y-2">
              <Label>Our Story Paragraphs (HTML allowed for strong/em tags)</Label>
              {(form.whyChooseUsPage?.ourStoryParagraphs || []).map((para, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={para}
                    onChange={(e) => setForm((p) => ({
                      ...p,
                      whyChooseUsPage: {
                        ...p.whyChooseUsPage,
                        ourStoryParagraphs: p.whyChooseUsPage.ourStoryParagraphs.map((pp, j) => j === i ? e.target.value : pp)
                      }
                    }))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm((p) => ({
                      ...p,
                      whyChooseUsPage: {
                        ...p.whyChooseUsPage,
                        ourStoryParagraphs: p.whyChooseUsPage.ourStoryParagraphs.filter((_, j) => j !== i)
                      }
                    }))}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: {
                    ...p.whyChooseUsPage,
                    ourStoryParagraphs: [...(p.whyChooseUsPage.ourStoryParagraphs || []), '']
                  }
                }))}
              >
                + Add Paragraph
              </Button>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Core Mission items */}
            <div className="space-y-1.5">
              <Label>Mission List Title</Label>
              <Input
                value={form.whyChooseUsPage?.missionTitle || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, missionTitle: e.target.value }
                }))}
                placeholder="Our Core Mission"
              />
            </div>
            {(form.whyChooseUsPage?.missionItems || []).map((item, i) => (
              <div key={i} className="space-y-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold">Mission Item {i + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm((p) => ({
                      ...p,
                      whyChooseUsPage: {
                        ...p.whyChooseUsPage,
                        missionItems: p.whyChooseUsPage.missionItems.filter((_, j) => j !== i)
                      }
                    }))}
                    className="text-red-500 text-xs"
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  value={item.title}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    whyChooseUsPage: {
                      ...p.whyChooseUsPage,
                      missionItems: p.whyChooseUsPage.missionItems.map((m, j) => j === i ? { ...m, title: e.target.value } : m)
                    }
                  }))}
                  placeholder="Title (e.g. Authenticity Guarantee)"
                />
                <Input
                  value={item.desc}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    whyChooseUsPage: {
                      ...p.whyChooseUsPage,
                      missionItems: p.whyChooseUsPage.missionItems.map((m, j) => j === i ? { ...m, desc: e.target.value } : m)
                    }
                  }))}
                  placeholder="Description"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm((p) => ({
                ...p,
                whyChooseUsPage: {
                  ...p.whyChooseUsPage,
                  missionItems: [...(p.whyChooseUsPage.missionItems || []), { title: '', desc: '' }]
                }
              }))}
            >
              + Add Mission Item
            </Button>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Weaving Loom Image Section */}
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Loom Image & Weaving Steps</h3>
            <div className="space-y-2">
              <Label>Loom Image</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-32 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/50">
                  {loomImagePreview ? (
                    <img src={rewriteAssetUrl(loomImagePreview)} alt="Loom" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Label htmlFor="loom-image-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-300 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-xs font-semibold">
                      <Upload className="w-3.5 h-3.5" /> Upload Loom Image
                    </Label>
                    <input
                      id="loom-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onLoomImageChange}
                    />
                  </div>
                  <Input
                    value={form.whyChooseUsPage?.loomImageUrl || ''}
                    onChange={(e) => setForm((p) => ({
                      ...p,
                      whyChooseUsPage: { ...p.whyChooseUsPage, loomImageUrl: e.target.value }
                    }))}
                    placeholder="or paste loom image URL"
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Loom Image Caption / Alt Text</Label>
              <Input
                value={form.whyChooseUsPage?.loomImageCaption || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, loomImageCaption: e.target.value }
                }))}
                placeholder="An artisan hand-weaving..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Craftsmanship Section Badge</Label>
              <Input
                value={form.whyChooseUsPage?.craftsmanshipBadgeText || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, craftsmanshipBadgeText: e.target.value }
                }))}
                placeholder="Traditional Craftsmanship"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Craftsmanship Section Title</Label>
              <Input
                value={form.whyChooseUsPage?.craftsmanshipTitle || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, craftsmanshipTitle: e.target.value }
                }))}
                placeholder="How Our Products Are Made"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Craftsmanship Description</Label>
              <Input
                value={form.whyChooseUsPage?.craftsmanshipDesc || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, craftsmanshipDesc: e.target.value }
                }))}
                placeholder="Our textiles, like..."
              />
            </div>

            {/* Weaving Steps */}
            {(form.whyChooseUsPage?.craftsmanshipSteps || []).map((step, i) => (
              <div key={i} className="space-y-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold">Weaving Step {i + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm((p) => ({
                      ...p,
                      whyChooseUsPage: {
                        ...p.whyChooseUsPage,
                        craftsmanshipSteps: p.whyChooseUsPage.craftsmanshipSteps.filter((_, j) => j !== i)
                      }
                    }))}
                    className="text-red-500 text-xs"
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <Label className="text-xs">Step Number</Label>
                    <Input
                      value={step.step}
                      onChange={(e) => setForm((p) => ({
                        ...p,
                        whyChooseUsPage: {
                          ...p.whyChooseUsPage,
                          craftsmanshipSteps: p.whyChooseUsPage.craftsmanshipSteps.map((s, j) => j === i ? { ...s, step: e.target.value } : s)
                        }
                      }))}
                      placeholder="e.g. 1"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Step Title</Label>
                    <Input
                      value={step.title}
                      onChange={(e) => setForm((p) => ({
                        ...p,
                        whyChooseUsPage: {
                          ...p.whyChooseUsPage,
                          craftsmanshipSteps: p.whyChooseUsPage.craftsmanshipSteps.map((s, j) => j === i ? { ...s, title: e.target.value } : s)
                        }
                      }))}
                      placeholder="e.g. Spinning Raw Cotton"
                    />
                  </div>
                </div>
                <Label className="text-xs">Step Description</Label>
                <Input
                  value={step.desc}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    whyChooseUsPage: {
                      ...p.whyChooseUsPage,
                      craftsmanshipSteps: p.whyChooseUsPage.craftsmanshipSteps.map((s, j) => j === i ? { ...s, desc: e.target.value } : s)
                    }
                  }))}
                  placeholder="Weaving step description"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm((p) => ({
                ...p,
                whyChooseUsPage: {
                  ...p.whyChooseUsPage,
                  craftsmanshipSteps: [...(p.whyChooseUsPage.craftsmanshipSteps || []), { step: ((p.whyChooseUsPage.craftsmanshipSteps || []).length + 1).toString(), title: '', desc: '' }]
                }
              }))}
            >
              + Add Weaving Step
            </Button>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Promise Pillars */}
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Our Promise Section (Core Pillars)</h3>
            <div className="space-y-1.5">
              <Label>Promise Section Title</Label>
              <Input
                value={form.whyChooseUsPage?.promiseTitle || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, promiseTitle: e.target.value }
                }))}
                placeholder="Our Promise to You"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Promise Section Subtitle</Label>
              <Input
                value={form.whyChooseUsPage?.promiseSubtitle || ''}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  whyChooseUsPage: { ...p.whyChooseUsPage, promiseSubtitle: e.target.value }
                }))}
                placeholder="We build trust..."
              />
            </div>
            {(form.whyChooseUsPage?.promiseItems || []).map((pillar, i) => (
              <div key={i} className="space-y-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <Label className="text-xs font-semibold">Promise Pillar {i + 1}</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <Label className="text-xs">Icon (Lucide)</Label>
                    <select
                      value={pillar.icon}
                      onChange={(e) => setForm((p) => ({
                        ...p,
                        whyChooseUsPage: {
                          ...p.whyChooseUsPage,
                          promiseItems: p.whyChooseUsPage.promiseItems.map((pr, j) => j === i ? { ...pr, icon: e.target.value } : pr)
                        }
                      }))}
                      className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-1 text-xs"
                    >
                      {['Shield', 'Truck', 'Heart', 'Users', 'Sparkles', 'Award'].map((iconName) => (
                        <option key={iconName} value={iconName} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                          {iconName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={pillar.title}
                      onChange={(e) => setForm((p) => ({
                        ...p,
                        whyChooseUsPage: {
                          ...p.whyChooseUsPage,
                          promiseItems: p.whyChooseUsPage.promiseItems.map((pr, j) => j === i ? { ...pr, title: e.target.value } : pr)
                        }
                      }))}
                      placeholder="Pillar title"
                    />
                  </div>
                </div>
                <Label className="text-xs">Description</Label>
                <Input
                  value={pillar.desc}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    whyChooseUsPage: {
                      ...p.whyChooseUsPage,
                      promiseItems: p.whyChooseUsPage.promiseItems.map((pr, j) => j === i ? { ...pr, desc: e.target.value } : pr)
                    }
                  }))}
                  placeholder="Pillar description"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Trust badges (product page)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">These three lines appear under the price on each product page (e.g. Free shipping, Secure checkout, Returns).</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Badge 1 (e.g. Free shipping)</Label>
              <Input
                value={form.trustBadges[0]}
                onChange={(e) => setForm((p) => ({ ...p, trustBadges: [e.target.value, p.trustBadges[1], p.trustBadges[2]] }))}
                placeholder="Free shipping over ETB 1000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Badge 2 (e.g. Secure checkout)</Label>
              <Input
                value={form.trustBadges[1]}
                onChange={(e) => setForm((p) => ({ ...p, trustBadges: [p.trustBadges[0], e.target.value, p.trustBadges[2]] }))}
                placeholder="Secure checkout"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Badge 3 (e.g. Returns)</Label>
              <Input
                value={form.trustBadges[2]}
                onChange={(e) => setForm((p) => ({ ...p, trustBadges: [p.trustBadges[0], p.trustBadges[1], e.target.value] }))}
                placeholder="30-day returns"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Bazar rules (vendor application)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            These bullet points are shown above the &quot;Do you agree with the bazar rules?&quot; checkbox on the bazar vendor application page.
          </p>
          <div className="space-y-3">
            {form.bazarRules.map((rule, index) => (
              <div key={index} className="space-y-1.5">
                <Label>Rule {index + 1}</Label>
                <Input
                  value={rule}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      bazarRules: p.bazarRules.map((r, i) => (i === index ? e.target.value : r)),
                    }))
                  }
                  placeholder={`Rule ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Welcome popup coupon */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Welcome popup discount</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Shown in the "Claim your discount" popup for new visitors. After entering their email, customers see this coupon code.
              Create the actual coupon in <a href="/admin/coupons" className="text-violet-600 underline">Admin → Coupons</a> first.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Coupon code</Label>
              <Input
                value={form.welcomeCouponCode}
                onChange={(e) => setForm((p) => ({ ...p, welcomeCouponCode: e.target.value.toUpperCase() }))}
                placeholder="WELCOME10"
                className="font-mono uppercase"
              />
              <p className="text-xs text-gray-400">Must match an active coupon in Admin → Coupons</p>
            </div>
            <div className="space-y-1.5">
              <Label>Discount display text</Label>
              <Input
                value={form.welcomeDiscount}
                onChange={(e) => setForm((p) => ({ ...p, welcomeDiscount: e.target.value }))}
                placeholder="10%"
              />
              <p className="text-xs text-gray-400">Shown in the popup e.g. "10%" or "ETB 500"</p>
            </div>
          </div>
          {/* Live preview */}
          <div className="p-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-sm">
            <p className="text-amber-800 dark:text-amber-300 font-medium mb-1">Preview</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs">
              Tab: <strong>Claim your {form.welcomeDiscount || '10%'} off</strong>
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
              Modal headline: <strong>Get {form.welcomeDiscount || '10%'} off your first order</strong>
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
              Code revealed after email: <strong className="font-mono">{form.welcomeCouponCode || 'WELCOME10'}</strong>
            </p>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Navigation menu links</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customize the main links that appear in your header and mobile navigation.
          </p>
          <div className="space-y-3">
            {form.navLinks.map((link, index) => (
              <div key={index} className="flex gap-2 items-end p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex-1 space-y-1">
                  <Label>Link label</Label>
                  <Input
                    value={link.label}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        navLinks: p.navLinks.map((l, i) => (i === index ? { ...l, label: e.target.value } : l)),
                      }))
                    }
                    placeholder="e.g. Shop"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label>Link URL/Path</Label>
                  <Input
                    value={link.href}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        navLinks: p.navLinks.map((l, i) => (i === index ? { ...l, href: e.target.value } : l)),
                      }))
                    }
                    placeholder="e.g. /shop"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      navLinks: p.navLinks.filter((_, i) => i !== index),
                    }))
                  }
                  className="text-red-500 hover:text-red-700 p-2 shrink-0"
                >
                  Delete
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  navLinks: [...p.navLinks, { label: '', href: '' }],
                }))
              }
              className="w-full border-dashed"
            >
              + Add new link
            </Button>
          </div>
        </div>

        <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
