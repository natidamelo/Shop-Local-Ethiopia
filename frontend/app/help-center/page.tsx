'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useSiteSettings } from '@/lib/useSiteSettings';

const ETH_GOLD = '#b8860b';
const ETH_DARK = '#3d2b0e';

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0" style={{ borderColor: '#e8d5b0' }}>
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="text-sm font-semibold" style={{ color: ETH_DARK }}>{q}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: ETH_GOLD }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <p className="pb-4 text-sm leading-relaxed whitespace-pre-line" style={{ color: '#7a5c1e' }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpCenterPage() {
  const { supportPages } = useSiteSettings();
  const page = supportPages?.helpCenter;
  const [search, setSearch] = useState('');

  const sections = (page?.sections ?? []).filter(
    (s) => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: '#fdf6ec' }}>
      <Navbar />
      <div className="pt-16">
        <div className="py-14 text-center" style={{ background: ETH_DARK }}>
          <div className="h-1 w-full flex mb-8">
            <div className="flex-1" style={{ background: '#2d6a2d' }} />
            <div className="flex-1" style={{ background: ETH_GOLD }} />
            <div className="flex-1" style={{ background: '#c0392b' }} />
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: ETH_GOLD }}>
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Help Center</h1>
          {page?.intro && <p className="text-sm mb-6 max-w-lg mx-auto px-4" style={{ color: '#c4a97d' }}>{page.intro}</p>}
          <div className="max-w-lg mx-auto px-4 relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9e7a2e' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for answers..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-amber-400"
              style={{ background: '#fff8ee', color: ETH_DARK }} />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
          {sections.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #e8d5b0' }}>
              <div className="px-6">
                {sections.map((s) => <FAQItem key={s.title} q={s.title} a={s.content} />)}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12 text-sm">No results found{search ? ` for "${search}"` : ''}.</p>
          )}

          <div className="rounded-2xl p-8 text-center mt-8" style={{ background: ETH_DARK }}>
            <h3 className="text-white font-bold text-lg mb-2">Still need help?</h3>
            <p className="text-sm mb-5" style={{ color: '#c4a97d' }}>Our support team is available Mon–Sat, 9 AM – 6 PM EAT</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="mailto:support@shopLocal.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: ETH_GOLD }}>Email Support</a>
              <Link href="/dashboard/orders"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                style={{ border: '2px solid rgba(255,255,255,0.25)', color: '#fff' }}>Track My Order</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
