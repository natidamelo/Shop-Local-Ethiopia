'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store/authStore';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { toast } from 'sonner';

const STORAGE_KEY = 'promo_v3_dismissed_at'; // bumped to invalidate old dismissals
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MODAL_DELAY_MS = 3000;
const TAB_DELAY_MS   = 800;

function readDismissed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export default function SignUpPromoModal() {
  const { isAuthenticated } = useAuthStore();
  const { siteName, logoUrl, welcomeCouponCode, welcomeDiscount } = useSiteSettings();
  const router = useRouter();

  const [mounted, setMounted]       = useState(false);
  const [dismissed, setDismissed]   = useState(false); // React-tracked dismissal state
  const [tabVisible, setTabVisible] = useState(false);
  const [open, setOpen]             = useState(false);
  const [email, setEmail]           = useState('');
  const [submitted, setSubmitted]   = useState(false);

  // On mount: read localStorage once
  useEffect(() => {
    setDismissed(readDismissed());
    setMounted(true);
  }, []);

  // When auth changes (login / logout): re-evaluate dismissal from localStorage
  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated) {
      // Logged in — hide everything
      setTabVisible(false);
      setOpen(false);
    } else {
      // Logged out — re-read localStorage (logout() clears it)
      const wasDismissed = readDismissed();
      setDismissed(wasDismissed);
    }
  }, [isAuthenticated, mounted]);

  // Show tab / modal whenever conditions are right
  useEffect(() => {
    if (!mounted || isAuthenticated || dismissed) return;

    setTabVisible(false);
    setOpen(false);

    const tabTimer = setTimeout(() => setTabVisible(true), TAB_DELAY_MS);
    const modalTimer = setTimeout(() => {
      setTabVisible(false);
      setOpen(true);
    }, MODAL_DELAY_MS);

    return () => {
      clearTimeout(tabTimer);
      clearTimeout(modalTimer);
    };
  }, [mounted, isAuthenticated, dismissed]);

  /** X on modal → close modal, show tab again */
  const closeModal = () => {
    setOpen(false);
    setTabVisible(true);
  };

  /** "No thanks" / tab × → dismiss for 7 days */
  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setDismissed(true);
    setOpen(false);
    setTabVisible(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubmitted(true);
    localStorage.setItem('promo_email', email);
  };

  if (!mounted || isAuthenticated || dismissed) return null;

  return (
    <>
      {/* ── Sticky bottom-left tab ─────────────────────────────────── */}
      <AnimatePresence>
        {tabVisible && !open && (
          <motion.div
            key="tab"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="fixed bottom-28 left-0 z-[59] flex items-stretch shadow-lg"
          >
            {/* × dismiss button */}
            <button
              onClick={dismiss}
              title="Don't show for 7 days"
              className="flex items-center justify-center w-7 bg-[#d6c49a] hover:bg-[#c8b48a] text-[#3d2b0e] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Main label — click to open modal */}
            <button
              onClick={() => { setTabVisible(false); setOpen(true); }}
              className="px-5 py-3.5 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap hover:brightness-95 transition-all"
              style={{ background: '#e8d5b0', color: '#3d2b0e' }}
            >
              Claim your {welcomeDiscount} off
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black cursor-pointer"
              onClick={closeModal}
            />

            {/* Panel */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="relative w-full max-w-3xl pointer-events-auto bg-white shadow-2xl overflow-hidden flex" style={{ borderRadius: '4px', minHeight: '480px' }}>

                {/* ── Left: image panel ── */}
                <div
                  className="hidden sm:flex relative w-[42%] flex-shrink-0 flex-col justify-end overflow-hidden"
                  style={{
                    backgroundImage: `url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#2d1a06',
                  }}
                >
                  {/* Fallback decorative pattern shown when image loads */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(135deg, #3d2b0e 0%, #6b4a1a 40%, #2d1a06 100%)',
                      zIndex: 0,
                    }}
                  />
                  {/* Decorative circles */}
                  <div className="absolute top-6 right-6 w-32 h-32 rounded-full opacity-10" style={{ background: '#e8d5b0' }} />
                  <div className="absolute top-16 right-16 w-20 h-20 rounded-full opacity-10" style={{ background: '#b8860b' }} />
                  <div className="absolute bottom-32 left-4 w-16 h-16 rounded-full opacity-10" style={{ background: '#e8d5b0' }} />
                  {/* Gradient overlay on top of image */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,16,8,0.92) 0%, rgba(26,16,8,0.3) 55%, rgba(26,16,8,0.15) 100%)', zIndex: 1 }} />
                  {/* Discount badge + text */}
                  <div className="relative z-10 p-7">
                    <div className="inline-flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-[#e8d5b0] mb-4"
                      style={{ background: 'rgba(184,134,11,0.9)', boxShadow: '0 4px 24px rgba(184,134,11,0.4)' }}>
                      <span className="text-3xl font-black text-white leading-none">{welcomeDiscount}</span>
                      <span className="text-[10px] font-bold text-amber-100 uppercase tracking-widest mt-0.5">OFF</span>
                    </div>
                    <p className="text-white text-sm font-semibold leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
                      Authentic Ethiopian<br />handmade crafts
                    </p>
                    <p className="text-amber-300 text-xs mt-1.5 opacity-90">✦ Free shipping on first order</p>
                  </div>
                </div>

                {/* ── Right: form panel ── */}
                <div className="flex-1 flex flex-col justify-center px-8 py-10 relative">

                  {/* Close button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {!submitted ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Brand */}
                      <div className="flex flex-col items-start gap-0.5 mb-6">
                        {logoUrl ? (
                          <img src={logoUrl} alt={siteName} className="h-10 w-auto object-contain mb-1" />
                        ) : (
                          <span className="text-xl font-bold" style={{ color: '#1a1008', fontFamily: 'Georgia, serif' }}>
                            {siteName}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-px w-8" style={{ background: '#b8860b' }} />
                          <span className="text-[10px] tracking-widest uppercase text-gray-400">Exclusive offer</span>
                        </div>
                      </div>

                      {/* Headline */}
                      <h2 className="text-3xl font-black mb-2 leading-tight" style={{ color: '#1a1008', fontFamily: 'Georgia, serif' }}>
                        Get {welcomeDiscount} Off<br />Your First Order
                      </h2>
                      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Join thousands of customers who love authentic Ethiopian crafts. Enter your email to unlock your exclusive discount.
                      </p>

                      {/* Perks */}
                      <div className="flex flex-col gap-2 mb-6">
                        {['Exclusive discount code', 'New arrivals & restocks', 'Members-only offers'].map((perk) => (
                          <div key={perk} className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f5e6c8' }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3 5.5L6.5 2" stroke="#b8860b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            {perk}
                          </div>
                        ))}
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          required
                          autoFocus
                          className="w-full px-4 py-3 text-sm border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 text-gray-900 placeholder-gray-400 transition-all"
                          style={{ borderRadius: '2px' }}
                        />
                        <button
                          type="submit"
                          className="w-full py-3.5 text-sm font-bold text-white uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98]"
                          style={{ background: 'linear-gradient(135deg, #b8860b 0%, #d4a017 100%)', borderRadius: '2px' }}
                        >
                          Claim My {welcomeDiscount} Off →
                        </button>
                      </form>

                      <button
                        onClick={dismiss}
                        className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        No thanks, I'll pay full price
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      className="text-center"
                    >
                      {/* Success icon */}
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg, #f5e6c8, #fdf3dc)' }}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                          <circle cx="14" cy="14" r="13" stroke="#b8860b" strokeWidth="1.5" />
                          <path d="M8 14.5L12 18.5L20 10" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-black mb-1" style={{ color: '#1a1008', fontFamily: 'Georgia, serif' }}>
                        You're In!
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Use this code at checkout to get <strong className="text-gray-700">{welcomeDiscount} off</strong>:
                      </p>
                      {/* Coupon code */}
                      <button
                        onClick={() => { navigator.clipboard?.writeText(welcomeCouponCode); toast.success('Code copied!'); }}
                        className="w-full py-4 px-4 border-2 border-dashed font-mono font-black text-xl tracking-[0.2em] transition-all hover:bg-amber-50 active:scale-[0.98] group"
                        style={{ borderColor: '#b8860b', color: '#b8860b', borderRadius: '2px' }}
                        title="Click to copy"
                      >
                        {welcomeCouponCode}
                      </button>
                      <p className="text-xs text-gray-400 mt-2">
                        👆 Click to copy · Valid on your first order
                      </p>
                      <button
                        onClick={() => {
                          dismiss();
                          router.push(isAuthenticated ? '/shop' : `/register?coupon=${encodeURIComponent(welcomeCouponCode)}`);
                        }}
                        className="mt-6 w-full py-3 text-sm font-semibold text-white uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #b8860b 0%, #d4a017 100%)', borderRadius: '2px' }}
                      >
                        {isAuthenticated ? 'Start Shopping →' : 'Create Account to Use Code →'}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
