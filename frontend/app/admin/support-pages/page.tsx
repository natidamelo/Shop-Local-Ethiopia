'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  HelpCircle, RefreshCw, Truck, Shield, FileText, Plus, Trash2,
  Save, RotateCcw, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { SupportPages, SupportPageData, SupportPageSection } from '@/lib/useSiteSettings';
import Link from 'next/link';

// ── Default content (mirrors the hardcoded pages) ────────────────────────────
const DEFAULTS: SupportPages = {
  helpCenter: {
    intro: 'Find answers to common questions about orders, shipping, payments, returns, and more.',
    sections: [
      { title: 'How do I place an order?', content: 'Browse our shop, add items to your cart, and proceed to checkout. You can pay with Stripe, PayPal, Flutterwave, Chapa, Telebirr, or CBE Birr.' },
      { title: 'How do I track my order?', content: 'Once your order ships, you will receive an email with a tracking number. You can also view order status in your Account → Orders dashboard.' },
      { title: 'What payment methods do you accept?', content: 'We accept Stripe (Visa/Mastercard/Amex), PayPal, Flutterwave, Chapa (Telebirr, CBE Birr, Awash, Dashen), and local bank transfers.' },
      { title: 'How long does delivery take?', content: 'Within Addis Ababa: 1–2 business days. Nationwide Ethiopia: 3–5 business days. International: 4–19 business days depending on carrier.' },
      { title: 'What is your return policy?', content: 'We offer a 30-day hassle-free return policy on all physical products. Items must be unused, in original packaging, and accompanied by proof of purchase.' },
    ],
  },
  returns: {
    intro: '30-day hassle-free returns on all physical products. Digital downloads are non-refundable once accessed.',
    sections: [
      { title: 'Eligible for Return', content: 'Unused items in original packaging\nItems returned within 30 days of delivery\nProducts with manufacturing defects\nWrong item received\nDamaged items (with photo evidence)' },
      { title: 'Not Eligible', content: 'Digital downloads once accessed\nCustomised or personalised items\nItems returned after 30 days\nUsed or washed clothing\nItems without original packaging' },
      { title: 'How to Start a Return', content: 'Go to Account → Orders, select the order, and click "Request Return". Our team will review and send you a prepaid return label within 2 business days.' },
      { title: 'Refund Timeline', content: 'Refunds are processed within 5–7 business days after we receive the returned item. The amount will be credited to your original payment method.' },
    ],
  },
  shippingInfo: {
    intro: 'Fast, reliable delivery across Ethiopia and worldwide. Free local pickup available in Addis Ababa.',
    sections: [
      { title: 'Free Local Pickup — Addis Ababa', content: 'Pick up your order for free at our store on Bole Road, Addis Ababa. Select "Local Pickup" at checkout. Open Mon–Sat, 9 AM – 6 PM EAT.' },
      { title: 'Domestic Shipping (Ethiopia)', content: 'Addis Ababa: 1–2 business days — ETB 150 (free over ETB 5,000)\nMajor Cities: 2–3 business days — ETB 250 (free over ETB 5,000)\nNationwide: 3–5 business days — ETB 350 (free over ETB 5,000)' },
      { title: 'International Shipping', content: 'DHL Express Worldwide: 3–4 business days\nUPS Worldwide Expedited®: 4 business days\nDHL eCommerce Parcel Standard: 11–19 business days\n\nRates are calculated at checkout based on destination and weight.' },
      { title: 'Important Notes', content: 'Orders placed before 2 PM EAT on business days are processed the same day.\nYou will receive a tracking number by email once your order ships.\nCustoms duties for international orders are the buyer\'s responsibility.' },
    ],
  },
  privacy: {
    intro: 'Shop Local Ethiopia is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.',
    sections: [
      { title: '1. Information We Collect', content: 'We collect your name, email, phone, delivery address, and payment information (processed securely by our payment partners). We also collect device and usage data via cookies.' },
      { title: '2. How We Use Your Information', content: 'To process and fulfil orders, communicate with you, improve our services, detect fraud, comply with legal obligations, and send marketing emails if you have opted in.' },
      { title: '3. Sharing Your Information', content: 'We do not sell your personal information. We share it only with shipping carriers, payment processors, and service providers who assist in operating our website.' },
      { title: '4. Cookies', content: 'We use cookies to keep you signed in, remember your cart, analyse site traffic, and deliver relevant content. You can control cookies through your browser settings.' },
      { title: '5. Your Rights', content: 'You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at support@shopLocal.com.' },
      { title: '6. Contact', content: 'For questions about this Privacy Policy, email us at support@shopLocal.com.' },
    ],
  },
  terms: {
    intro: 'Please read these Terms of Service carefully before using Shop Local Ethiopia.',
    sections: [
      { title: '1. Acceptance of Terms', content: 'By using our website and services, you agree to be bound by these Terms of Service and our Privacy Policy.' },
      { title: '2. Use of Our Services', content: 'You may use our services only for lawful purposes. You agree not to violate any laws, attempt unauthorised access, or transmit harmful content.' },
      { title: '3. Orders and Payment', content: 'By placing an order, you represent that you are authorised to use the payment method provided and that the payment information is accurate.' },
      { title: '4. Returns and Refunds', content: 'Our return policy allows returns within 30 days of delivery for eligible items. Please refer to our Returns page for full details.' },
      { title: '5. Intellectual Property', content: 'All content on this website is the property of Shop Local Ethiopia and is protected by copyright and intellectual property laws.' },
      { title: '6. Governing Law', content: 'These terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Disputes shall be resolved in the courts of Addis Ababa.' },
    ],
  },
};

const PAGE_TABS = [
  { key: 'helpCenter' as const,  label: 'Help Center',  icon: HelpCircle,  href: '/help-center' },
  { key: 'returns' as const,     label: 'Returns',      icon: RefreshCw,   href: '/returns' },
  { key: 'shippingInfo' as const, label: 'Shipping',    icon: Truck,       href: '/shipping-info' },
  { key: 'privacy' as const,     label: 'Privacy',      icon: Shield,      href: '/privacy' },
  { key: 'terms' as const,       label: 'Terms',        icon: FileText,    href: '/terms' },
];

// ── Section editor ────────────────────────────────────────────────────────────
function SectionEditor({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  section: SupportPageSection;
  index: number;
  total: number;
  onChange: (patch: Partial<SupportPageSection>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Section {index + 1}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30">
            <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30">
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Title / Question</Label>
        <Input value={section.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Section heading..." />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Content <span className="text-gray-400">(use new lines to separate bullet points)</span></Label>
        <Textarea value={section.content} onChange={(e) => onChange({ content: e.target.value })} rows={4} placeholder="Section content..." />
      </div>
    </div>
  );
}

// ── Page editor panel ─────────────────────────────────────────────────────────
function PageEditor({
  pageKey,
  data,
  onChange,
  href,
}: {
  pageKey: keyof SupportPages;
  data: SupportPageData;
  onChange: (d: SupportPageData) => void;
  href: string;
}) {
  const updateSection = (i: number, patch: Partial<SupportPageSection>) => {
    const sections = [...data.sections];
    sections[i] = { ...sections[i], ...patch };
    onChange({ ...data, sections });
  };

  const removeSection = (i: number) => {
    onChange({ ...data, sections: data.sections.filter((_, idx) => idx !== i) });
  };

  const moveSection = (i: number, dir: -1 | 1) => {
    const sections = [...data.sections];
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    [sections[i], sections[j]] = [sections[j], sections[i]];
    onChange({ ...data, sections });
  };

  const addSection = () => {
    onChange({ ...data, sections: [...data.sections, { title: 'New Section', content: '' }] });
  };

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Page Introduction</h3>
          <Link href={href} target="_blank"
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline">
            <ExternalLink className="w-3 h-3" /> Preview page
          </Link>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Intro text (shown below the page title)</Label>
          <Textarea
            value={data.intro ?? ''}
            onChange={(e) => onChange({ ...data, intro: e.target.value })}
            rows={2}
            placeholder="Brief description shown at the top of the page..."
          />
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Sections <span className="text-xs text-gray-400 font-normal ml-1">({data.sections.length})</span>
          </h3>
          <Button variant="outline" size="sm" onClick={addSection} className="gap-1 text-xs">
            <Plus className="w-3 h-3" /> Add Section
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {pageKey === 'helpCenter' ? 'Each section is a FAQ question + answer.' : 'Each section is a content block with a heading and body text.'}
        </p>
        <div className="space-y-3">
          {data.sections.map((section, i) => (
            <SectionEditor
              key={i}
              section={section}
              index={i}
              total={data.sections.length}
              onChange={(patch) => updateSection(i, patch)}
              onRemove={() => removeSection(i)}
              onMove={(dir) => moveSection(i, dir)}
            />
          ))}
          {data.sections.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No sections yet. Click "Add Section" to start.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────
export default function SupportPagesAdminPage() {
  const queryClient = useQueryClient();
  const [pages, setPages] = useState<SupportPages>(DEFAULTS);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then((r) => {
        const sp = r.data.data?.supportPages;
        if (sp) {
          // Merge saved data with defaults (so new pages get default content)
          const merged: SupportPages = {};
          for (const tab of PAGE_TABS) {
            const saved = sp[tab.key];
            merged[tab.key] = saved && saved.sections?.length > 0
              ? saved
              : DEFAULTS[tab.key];
          }
          setPages(merged);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const updatePage = (key: keyof SupportPages, data: SupportPageData) => {
    setPages((prev) => ({ ...prev, [key]: data }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings', { supportPages: pages });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setHasChanges(false);
      toast.success('Support pages saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPages(DEFAULTS);
    setHasChanges(true);
    toast.info('Reset to defaults — save to apply');
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
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Pages</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Edit Help Center, Returns, Shipping, Privacy & Terms</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading || !hasChanges}
            className="gap-1.5 bg-violet-600 hover:bg-violet-700">
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">You have unsaved changes</span>
        </div>
      )}

      <Tabs defaultValue="helpCenter">
        <TabsList className="w-full flex-wrap h-auto gap-1">
          {PAGE_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PAGE_TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-4">
            <PageEditor
              pageKey={tab.key}
              data={pages[tab.key] ?? DEFAULTS[tab.key]!}
              onChange={(d) => updatePage(tab.key, d)}
              href={tab.href}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
