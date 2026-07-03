'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, User, Store, Mail, Phone, Package, CheckCircle2, Image as ImageIcon, Video, Globe2, ArrowLeft, Lock, CalendarClock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';
import { rewriteAssetUrl } from '@/lib/rewriteAssetUrl';

type VendorType = 'enterprise' | 'individual';
type TableType = 'full' | 'half';

interface TablePricing {
  fullTablePrice: number;
  halfTablePrice: number;
  currency: string;
  priceNote: string;
}

interface RegistrationStatus {
  isOpen: boolean;
  scheduledOpenAt: string | null;
  scheduledCloseAt: string | null;
  closedMessage: string;
  pricing?: TablePricing;
  rules?: string[];
   posterUrl?: string;
}

const DEFAULT_BAZAR_RULES: string[] = [
  'Arrive at least 30 minutes before the bazar opens to set up your table.',
  'Keep your table tidy and do not block aisles or other vendors.',
  'Prices must be clearly displayed for all products or services.',
  'No counterfeit, illegal, or inappropriate items are allowed.',
  'Follow all instructions from the organizing team during setup and closing.',
];

export default function BazarVendorApplyPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchProfile } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [regStatus, setRegStatus] = useState<RegistrationStatus | null>(null);
  const [regStatusLoading, setRegStatusLoading] = useState(true);

  const [form, setForm] = useState({
    vendorType: 'enterprise' as VendorType,
    tableType: 'full' as TableType,
    displayName: '',
    salesPersonName: '',
    productType: '',
    productShortDescription: '',
    hasPreviousBazarExperience: 'no',
    previousBazarDetails: '',
    email: '',
    phone: '',
    photoLinks: '',
    videoLink: '',
    socialLinks: '',
    agreeToRules: false,
    needElectricity: 'no',
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Check if registration is open
  useEffect(() => {
    api.get('/settings/bazar-registration')
      .then((res) => setRegStatus(res.data.data))
      .catch(() => setRegStatus({ isOpen: true, scheduledOpenAt: null, scheduledCloseAt: null, closedMessage: '' }))
      .finally(() => setRegStatusLoading(false));
  }, []);

  // Require login and prefill user data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/bazar-vendor-apply');
      return;
    }

    if (!user) {
      fetchProfile().catch(() => {});
      return;
    }

    setForm((prev) => ({
      ...prev,
      vendorType: prev.vendorType || 'individual',
      displayName: prev.displayName || user.name || '',
      salesPersonName: prev.salesPersonName || user.name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
    }));
  }, [isAuthenticated, user, fetchProfile, router]);

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      const res = await api.post('/vendor-media/photos', formData);
      const uploaded = res.data?.data || [];
      const urls: string[] = uploaded.map((item: any) => item.url).filter(Boolean);
      if (urls.length) {
        setForm((prev) => {
          const existing = prev.photoLinks?.trim() || '';
          const combined = [...(existing ? existing.split(',').map((p) => p.trim()).filter(Boolean) : []), ...urls];
          const unique = Array.from(new Set(combined));
          return { ...prev, photoLinks: unique.join(', ') };
        });
        toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} uploaded`);
      } else {
        toast.error('Upload failed, no URLs returned');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to upload photo';
      toast.error(message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleVideoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      const res = await api.post('/vendor-media/videos', formData);
      const uploaded = res.data?.data || [];
      const urls: string[] = uploaded.map((item: any) => item.url).filter(Boolean);
      if (urls.length) {
        setForm((prev) => {
          const existing = prev.videoLink?.trim() || '';
          const combined = [...(existing ? existing.split(',').map((p) => p.trim()).filter(Boolean) : []), ...urls];
          const unique = Array.from(new Set(combined));
          return { ...prev, videoLink: unique.join(', ') };
        });
        toast.success(`${urls.length} video${urls.length > 1 ? 's' : ''} uploaded`);
      } else {
        toast.error('Upload failed, no URLs returned');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to upload video';
      toast.error(message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreeToRules) {
      toast.error('You must agree to the bazar rules.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        vendorType: form.vendorType,
        tableType: form.tableType,
        displayName: form.displayName,
        salesPersonName: form.salesPersonName,
        productType: form.productType,
        productShortDescription: form.productShortDescription,
        hasPreviousBazarExperience: form.hasPreviousBazarExperience === 'yes',
        previousBazarDetails: form.previousBazarDetails,
        email: form.email,
        phone: form.phone,
        photoLinks: form.photoLinks
          ? form.photoLinks
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
        videoLink: form.videoLink,
        socialLinks: form.socialLinks,
        agreeToRules: form.agreeToRules,
        needElectricity: form.needElectricity === 'yes',
      };

      await api.post('/vendor-applications', payload);
      setSubmitted(true);
      toast.success('Your application has been submitted. We will review it soon.');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to submit application';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (regStatusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950 flex items-center justify-center px-4 py-12">
        <p className="text-sm text-gray-500 animate-pulse">Loading registration status…</p>
      </div>
    );
  }

  // Derive schedule from dates (client time) so messaging and open state are consistent
  const now = new Date();
  const openAt = regStatus?.scheduledOpenAt ? new Date(regStatus.scheduledOpenAt) : null;
  const closeAt = regStatus?.scheduledCloseAt ? new Date(regStatus.scheduledCloseAt) : null;
  const isBeforeOpen = openAt ? now < openAt : false;
  const isAfterClose = closeAt ? now > closeAt : false;
  const hasSchedule = !!(openAt || closeAt);
  const inWindowByClient = hasSchedule
    ? (!openAt || now >= openAt) && (!closeAt || now <= closeAt)
    : false;
  const effectivelyOpen = regStatus ? (hasSchedule ? inWindowByClient : regStatus.isOpen) : false;

  const rulesToShow = (regStatus?.rules && regStatus.rules.length > 0 ? regStatus.rules : DEFAULT_BAZAR_RULES);

  if (regStatus && !effectivelyOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-amber-100/80 dark:border-amber-900/40"
        >
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registration Closed</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {regStatus.closedMessage || 'Vendor registration is currently closed. Please check back later.'}
          </p>
          {isAfterClose && closeAt && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200">
              <CalendarClock className="w-4 h-4 flex-shrink-0" />
              <span>
                Closed on{' '}
                <span className="font-semibold" suppressHydrationWarning>
                  {closeAt.toLocaleString()}
                </span>
              </span>
            </div>
          )}
          {isBeforeOpen && openAt && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200">
              <CalendarClock className="w-4 h-4 flex-shrink-0" />
              <span>
                Opens on{' '}
                <span className="font-semibold" suppressHydrationWarning>
                  {openAt.toLocaleString()}
                </span>
              </span>
            </div>
          )}
          <div className="mt-6">
            <Button variant="outline" onClick={() => router.push('/')} className="px-6">
              Back to home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 max-w-lg w-full rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb  -4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Application received</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
            Thank you for applying to join our bazar. Our team will review your information and contact you by email or
            phone after approval, including payment details if required.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push('/')} className="px-6">
              Go to home
            </Button>
            <Button onClick={() => setSubmitted(false)} className="px-6 bg-amber-600 hover:bg-amber-700 text-white">
              Submit another vendor
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-amber-100/80 dark:border-amber-900/40"
        >
          <div className="grid md:grid-cols-5">
            {/* Left: intro */}
            <div className="md:col-span-2 bg-gradient-to-b from-amber-700 via-amber-800 to-gray-900 text-amber-50 p-8 md:p-10 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/60 text-xs font-medium mb-4 border border-amber-500/40">
                  <Store className="w-3.5 h-3.5" />
                  Bazar Vendor Registration
                </div>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                  Join our <span className="text-amber-200">bazar</span> as a vendor
                </h1>
                <p className="mt-3 text-sm text-amber-100/90">
                  Fill in this form to apply as an enterprise or individual vendor. Our admin team will review your
                  application and approve or disapprove it. Approved vendors will receive payment instructions.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-amber-100/90">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                    Enterprise name or individual vendor details
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                    Product / service type and short description
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                    Previous bazar experience, media links, and social media
                  </li>
                </ul>

                {/* Optional poster image */}
                {regStatus?.posterUrl && (
                  <div className="mt-6 rounded-xl overflow-hidden border border-amber-600/40 bg-amber-900/40">
                    <img
                      src={rewriteAssetUrl(regStatus.posterUrl)}
                      alt="Bazar poster"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Registration window dates */}
                {(regStatus?.scheduledOpenAt || regStatus?.scheduledCloseAt) && (
                  <div className="mt-6 rounded-xl bg-amber-900/50 border border-amber-600/40 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-amber-200 uppercase tracking-wide">Registration window</p>
                    {regStatus.scheduledOpenAt && (
                      <div className="flex items-center gap-2 text-xs text-amber-100/90">
                        <CalendarClock className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                        <span>
                          Opens:{' '}
                          <span className="font-semibold text-emerald-200" suppressHydrationWarning>
                            {new Date(regStatus.scheduledOpenAt).toLocaleString()}
                          </span>
                        </span>
                      </div>
                    )}
                    {regStatus.scheduledCloseAt && (
                      <div className="flex items-center gap-2 text-xs text-amber-100/90">
                        <CalendarClock className="w-3.5 h-3.5 text-red-300 flex-shrink-0" />
                        <span>
                          Closes:{' '}
                          <span className="font-semibold text-red-200" suppressHydrationWarning>
                            {new Date(regStatus.scheduledCloseAt).toLocaleString()}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-8 pt-4 border-t border-amber-800/50 text-[11px] text-amber-200/90">
                By submitting this form you confirm that the information is accurate and you accept our bazar rules.
              </div>
            </div>

            {/* Right: form */}
            <div className="md:col-span-3 p-6 md:p-8 space-y-5">
              {/* Registration deadline banner */}
              {regStatus?.scheduledCloseAt && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-xs text-amber-800 dark:text-amber-200">
                  <CalendarClock className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                  <span>
                    Registration closes on{' '}
                    <span className="font-semibold" suppressHydrationWarning>
                      {new Date(regStatus.scheduledCloseAt).toLocaleString()}
                    </span>
                    . Submit your application before the deadline.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-amber-700"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to main page
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Vendor type & name */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Vendor Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleChange('vendorType', 'enterprise')}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                          form.vendorType === 'enterprise'
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        Enterprise
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange('vendorType', 'individual')}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                          form.vendorType === 'individual'
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        Individual
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {form.vendorType === 'enterprise' ? 'Enterprise / shop name' : 'Vendor full name'}
                    </Label>
                    <div className="relative">
                      <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        className="pl-9"
                        placeholder={form.vendorType === 'enterprise' ? 'Example Trading Plc' : 'Abebe Kebede'}
                        value={form.displayName}
                        onChange={(e) => handleChange('displayName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sales person / contact */}
                <div className="space-y-2">
                  <Label className="text-sm">Sales person / contact at the table</Label>
                  <Input
                    placeholder="Person who will stand at the bazar table"
                    value={form.salesPersonName}
                    onChange={(e) => handleChange('salesPersonName', e.target.value)}
                  />
                  <p className="text-[11px] text-gray-400">
                    Optional, but helpful if someone else (not the owner) will be present during the bazar.
                  </p>
                </div>

                {/* Product info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Product / service type</Label>
                    <div className="relative">
                      <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        className="pl-9"
                        placeholder="e.g. Traditional cloth, coffee, handmade crafts, beauty service"
                        value={form.productType}
                        onChange={(e) => handleChange('productType', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Table size at the bazar</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Full table option */}
                      <button
                        type="button"
                        onClick={() => handleChange('tableType', 'full')}
                        className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                          form.tableType === 'full'
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400'
                        }`}
                      >
                        <span className="text-xs font-semibold">Full table</span>
                        {regStatus?.pricing && regStatus.pricing.fullTablePrice > 0 ? (
                          <span className={`text-[11px] font-bold ${form.tableType === 'full' ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500'}`}>
                            {regStatus.pricing.currency} {regStatus.pricing.fullTablePrice.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Price TBD</span>
                        )}
                      </button>

                      {/* Half table option */}
                      <button
                        type="button"
                        onClick={() => handleChange('tableType', 'half')}
                        className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                          form.tableType === 'half'
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400'
                        }`}
                      >
                        <span className="text-xs font-semibold">Half table</span>
                        {regStatus?.pricing && regStatus.pricing.halfTablePrice > 0 ? (
                          <span className={`text-[11px] font-bold ${form.tableType === 'half' ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500'}`}>
                            {regStatus.pricing.currency} {regStatus.pricing.halfTablePrice.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Price TBD</span>
                        )}
                      </button>
                    </div>

                    {/* Selected price summary */}
                    {regStatus?.pricing && (regStatus.pricing.fullTablePrice > 0 || regStatus.pricing.halfTablePrice > 0) && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-xs text-amber-800 dark:text-amber-200">
                        <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                        <span>
                          Selected:{' '}
                          <span className="font-semibold">
                            {form.tableType === 'full' ? 'Full table' : 'Half table'} —{' '}
                            {regStatus.pricing.currency}{' '}
                            {(form.tableType === 'full'
                              ? regStatus.pricing.fullTablePrice
                              : regStatus.pricing.halfTablePrice
                            ).toLocaleString()}
                          </span>
                          {regStatus.pricing.priceNote && (
                            <span className="ml-1 text-amber-700/80 dark:text-amber-300/80">· {regStatus.pricing.priceNote}</span>
                          )}
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] text-gray-500 mt-1">
                      Note: very large or bulky products (for example leather goods displays, big furniture, large
                      decor pieces, etc.) are <span className="font-semibold text-amber-700">not allowed on a half table</span>.
                      If your setup takes a lot of space, please choose a full table.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Previous bazar participation?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleChange('hasPreviousBazarExperience', 'no')}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          form.hasPreviousBazarExperience === 'no'
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400'
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange('hasPreviousBazarExperience', 'yes')}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          form.hasPreviousBazarExperience === 'yes'
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400'
                        }`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Short description of your products / services</Label>
                  <Textarea
                    rows={3}
                    placeholder="Describe briefly what you sell or offer. This helps us plan the bazar layout."
                    value={form.productShortDescription}
                    onChange={(e) => handleChange('productShortDescription', e.target.value)}
                    required
                  />
                </div>

                {form.hasPreviousBazarExperience === 'yes' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Previous bazar details (optional)</Label>
                    <Textarea
                      rows={2}
                      placeholder="Which bazar, year, location, or booth number?"
                      value={form.previousBazarDetails}
                      onChange={(e) => handleChange('previousBazarDetails', e.target.value)}
                    />
                  </div>
                )}

                {/* Contact */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Email address</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        className="pl-9"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Phone / WhatsApp</Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        className="pl-9"
                        placeholder="+251 9..."
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Media / social */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Product photo links (optional)</Label>
                    <div className="relative">
                      <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        className="pl-9 text-xs"
                        placeholder="Paste 1–3 image URLs, separated by commas"
                        value={form.photoLinks}
                        onChange={(e) => handleChange('photoLinks', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="vendor-photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e.target.files)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px]"
                        onClick={() => document.getElementById('vendor-photo-upload')?.click()}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? 'Uploading photo...' : 'Upload photo'}
                      </Button>
                      <p className="text-[11px] text-gray-400">
                        or paste 1–3 image URLs above
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Video or social media</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Video className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          className="pl-9 text-xs"
                          placeholder="Short promo video or link (YouTube, TikTok, etc.)"
                          value={form.videoLink}
                          onChange={(e) => handleChange('videoLink', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                        id="vendor-video-upload"
                        type="file"
                        accept="video/*"
                        multiple
                          className="hidden"
                          onChange={(e) => handleVideoUpload(e.target.files)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px]"
                          onClick={() => document.getElementById('vendor-video-upload')?.click()}
                          disabled={uploadingVideo}
                        >
                          {uploadingVideo ? 'Uploading video...' : 'Upload video'}
                        </Button>
                        <p className="text-[11px] text-gray-400">
                          or paste a video link above
                        </p>
                      </div>
                      <div className="relative">
                        <Globe2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          className="pl-9 text-xs"
                          placeholder="Social media profile(s) or links (Instagram / Facebook / TikTok, etc.)"
                          value={form.socialLinks}
                          onChange={(e) => handleChange('socialLinks', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional yes/no */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Do you need electricity at your booth?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleChange('needElectricity', 'no')}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          form.needElectricity === 'no'
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400'
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange('needElectricity', 'yes')}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          form.needElectricity === 'yes'
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400'
                        }`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Do you agree with the bazar rules?</Label>
                    <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-900/20 p-3 max-h-40 overflow-y-auto">
                      <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-100 mb-1">
                        Please read these bazar rules:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-900/90 dark:text-amber-100/90">
                        {rulesToShow.map((rule, index) => (
                          <li key={index}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="agree-rules"
                        type="checkbox"
                        checked={form.agreeToRules}
                        onChange={(e) => handleChange('agreeToRules', e.target.checked)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        required
                      />
                      <label htmlFor="agree-rules" className="text-xs text-gray-600 dark:text-gray-300">
                        I have read and agree to the bazar rules and policies.
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-gray-400 max-w-xs">
                    After approval, you will receive a confirmation with payment instructions and any additional
                    requirements for your booth.
                  </p>
                  <Button
                    type="submit"
                    disabled={submitting || !form.agreeToRules}
                    className="px-6 h-10 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-sm"
                  >
                    {submitting ? 'Submitting...' : 'Submit application'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

