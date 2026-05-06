'use client';

import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { SupportPageData } from '@/lib/useSiteSettings';

const ETH_GOLD = '#b8860b';
const ETH_DARK = '#3d2b0e';
const ETH_GREEN = '#2d6a2d';

export default function SupportPageLayout({
  title,
  icon: Icon,
  page,
  fallbackSections,
}: {
  title: string;
  icon: LucideIcon;
  page?: SupportPageData;
  fallbackSections: { title: string; content: string }[];
}) {
  const sections = page?.sections?.length ? page.sections : fallbackSections;
  const intro = page?.intro;

  return (
    <div className="min-h-screen" style={{ background: '#fdf6ec' }}>
      <Navbar />
      <div className="pt-16">
        <div className="py-14 text-center" style={{ background: ETH_DARK }}>
          <div className="h-1 w-full flex mb-8">
            <div className="flex-1" style={{ background: ETH_GREEN }} />
            <div className="flex-1" style={{ background: ETH_GOLD }} />
            <div className="flex-1" style={{ background: '#c0392b' }} />
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: ETH_GOLD }}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">{title}</h1>
          {intro && (
            <p className="text-sm max-w-xl mx-auto px-4" style={{ color: '#c4a97d' }}>{intro}</p>
          )}
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #e8d5b0' }}>
            <div className="divide-y" style={{ borderColor: '#e8d5b0' }}>
              {sections.map((section, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="px-6 py-6">
                  <h2 className="font-bold mb-3 text-base" style={{ color: ETH_DARK }}>{section.title}</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#7a5c1e' }}>
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
