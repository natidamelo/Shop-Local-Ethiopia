'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Truck, Heart, Sparkles, Award, Users, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useSiteSettings } from '@/lib/useSiteSettings';

const PILLAR_ICONS: Record<string, any> = {
  Shield,
  Truck,
  Heart,
  Users,
  Sparkles,
  Award,
};

export default function WhyChooseAsPage() {
  const { siteName, whyChooseUsPage } = useSiteSettings();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--eth-cream)' }}>
      <Navbar />

      <main className="pt-24 pb-20">
        {/* ── HERO HEADER ────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ background: 'var(--eth-gold-light)', color: 'var(--eth-gold-muted)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {whyChooseUsPage.heritageBadgeText}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: 'var(--eth-text-primary)' }}
          >
            {whyChooseUsPage.title} {siteName}?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--eth-text-secondary)' }}
          >
            {whyChooseUsPage.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 64 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-1 mx-auto mt-6 rounded"
            style={{ background: 'var(--eth-gold)' }}
          />
        </section>

        {/* ── OUR STORY (SHORT STORY) ────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--eth-text-primary)' }}>
                {whyChooseUsPage.ourStoryTitle}
              </h2>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--eth-text-secondary)' }}>
                {whyChooseUsPage.ourStoryParagraphs.map((p, idx) => (
                  <p key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="p-8 rounded-2xl border animate-pulse-subtle"
              style={{ background: 'var(--eth-card-bg)', borderColor: 'var(--eth-border)' }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--eth-gold-muted)' }}>
                {whyChooseUsPage.missionTitle}
              </h3>
              <ul className="space-y-4">
                {whyChooseUsPage.missionItems.map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center mt-1 flex-shrink-0" style={{ background: 'var(--eth-gold-light)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--eth-gold-muted)' }}>✓</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: 'var(--eth-text-primary)' }}>{item.title}</h4>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--eth-text-muted)' }}>{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ── HOW PRODUCTS ARE MADE SECTION ────────────────────────────────── */}
        <section className="py-20 mb-20" style={{ background: 'var(--eth-section-bg)', borderTop: '1px solid var(--eth-border)', borderBottom: '1px solid var(--eth-border)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Image Column */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative group rounded-2xl overflow-hidden shadow-lg border"
                style={{ borderColor: 'var(--eth-border)' }}
              >
                {whyChooseUsPage.loomImageUrl && (
                  <img
                    src={whyChooseUsPage.loomImageUrl}
                    alt={whyChooseUsPage.loomImageCaption}
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                  <p className="text-xs text-white/90 font-medium italic">
                    {whyChooseUsPage.loomImageCaption}
                  </p>
                </div>
              </motion.div>

              {/* Text Column */}
              <motion.div
                variants={fadeIn}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--eth-gold-muted)' }}>
                  <Award className="w-4 h-4" /> {whyChooseUsPage.craftsmanshipBadgeText}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--eth-text-primary)' }}>
                  {whyChooseUsPage.craftsmanshipTitle}
                </h2>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--eth-text-secondary)' }}>
                  {whyChooseUsPage.craftsmanshipDesc}
                </p>
                <div className="space-y-4">
                  {whyChooseUsPage.craftsmanshipSteps.map((s, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm" style={{ background: 'var(--eth-gold)' }}>
                        {s.step || (idx + 1).toString()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: 'var(--eth-text-primary)' }}>{s.title}</h4>
                        <p className="text-xs" style={{ color: 'var(--eth-text-muted)' }}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── CORE PILLARS (GRID OF CARDS) ─────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: 'var(--eth-text-primary)' }}>
              {whyChooseUsPage.promiseTitle}
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--eth-text-muted)' }}>
              {whyChooseUsPage.promiseSubtitle}
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {whyChooseUsPage.promiseItems.map((pillar, idx) => {
              const IconComp = PILLAR_ICONS[pillar.icon] ?? Shield;
              return (
                <motion.div
                  key={idx}
                  variants={fadeIn}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-xl border flex flex-col items-center text-center transition-all duration-300"
                  style={{ background: 'var(--eth-card-bg)', borderColor: 'var(--eth-border)' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm" style={{ background: 'var(--eth-gold-light)' }}>
                    <IconComp className="w-6 h-6" style={{ color: 'var(--eth-gold-muted)' }} />
                  </div>
                  <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--eth-text-primary)' }}>{pillar.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--eth-text-secondary)' }}>{pillar.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ── CALL TO ACTION ────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 sm:p-12 rounded-2xl text-center shadow-md relative overflow-hidden"
            style={{ background: 'var(--eth-dark)' }}
          >
            {/* Background design elements */}
            <div className="absolute top-0 left-0 w-full h-1 flex">
              <div className="flex-1" style={{ background: 'var(--eth-green)' }} />
              <div className="flex-1" style={{ background: 'var(--eth-gold)' }} />
              <div className="flex-1" style={{ background: 'var(--eth-red)' }} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
              Bring Authentic Ethiopian Heritage to Your Home
            </h2>
            <p className="text-sm max-w-xl mx-auto mb-8" style={{ color: 'var(--eth-text-secondary)' }}>
              Explore our collection of hand-woven garments, artisan decor, and traditional jewelry. Supported by verified secure checkouts.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <ButtonLink href="/shop" style={{ background: 'var(--eth-gold)', color: '#fff' }} className="px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 inline-flex items-center gap-2 transition-opacity">
                Shop Our Collection <ArrowRight className="w-4 h-4" />
              </ButtonLink>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Simple Helper Button Link
function ButtonLink({ href, style, className, children }: { href: string; style?: React.CSSProperties; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={style} className={className}>
      {children}
    </Link>
  );
}
