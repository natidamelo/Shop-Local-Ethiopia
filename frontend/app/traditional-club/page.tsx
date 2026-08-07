'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Bell, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const LAUNCH_DATE = new Date('2025-12-01T00:00:00');

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export default function TraditionalClubPage() {
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  const units = [
    { label: 'Days', value: days },
    { label: 'Hours', value: hours },
    { label: 'Minutes', value: minutes },
    { label: 'Seconds', value: seconds },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #16294D 60%, #1E3A63 100%)' }}>
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-3xl w-full text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            style={{ background: 'rgba(184,134,11,0.15)', border: '1px solid rgba(184,134,11,0.4)', color: '#f5c842' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Exclusive Membership · Coming Soon
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-extrabold text-white leading-tight mb-4"
          >
            Traditional
            <span className="block" style={{ color: '#f5c842' }}>Club</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-white/60 max-w-xl mx-auto mb-12 leading-relaxed"
          >
            An exclusive membership experience celebrating authentic Ethiopian culture —
            early access, curated collections, artisan stories, and members-only drops.
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4 sm:gap-8 mb-14"
          >
            {units.map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white mb-2"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
                >
                  {String(value).padStart(2, '0')}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/40">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Email signup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-10"
          >
            {submitted ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                <Star className="w-4 h-4 fill-current" />
                You're on the list! We'll notify you at launch.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
                <div className="relative flex-1 w-full">
                  <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      focusRingColor: '#f5c842',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-[#0A1628] transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #f5c842, #b8860b)' }}
                >
                  Notify Me
                </button>
              </form>
            )}
            <p className="text-xs text-white/30 mt-3">No spam. We'll only reach out when Traditional Club launches.</p>
          </motion.div>

          {/* Features preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
          >
            {[
              { emoji: '🎁', title: 'Members-Only Drops', desc: 'First access to limited artisan collections' },
              { emoji: '🧵', title: 'Artisan Stories', desc: 'Behind-the-scenes from Ethiopian craftspeople' },
              { emoji: '✨', title: 'Exclusive Discounts', desc: 'Special pricing only for club members' },
            ].map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-2xl text-left"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="text-2xl mb-3">{f.emoji}</div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Back to shop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Shop
            </Link>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
