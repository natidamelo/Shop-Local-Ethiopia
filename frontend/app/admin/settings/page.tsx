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
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

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
      });
      if (d.logoUrl) setLogoPreview(d.logoUrl);
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
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Site settings saved!');
      setLogoFile(null);
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
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
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

        <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
