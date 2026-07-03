'use client';

import Link from 'next/link';
import { Package, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';

export default function Footer() {
  const { siteName, logoUrl, tagline, contactEmail, contactPhone, contactAddress } = useSiteSettings();

  return (
    <footer className="text-[var(--white)]/90 bg-[var(--eth-footer-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-7 h-7 object-contain" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--gold-500)' }}>
                  <Package className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-base font-bold text-[var(--white)]">{siteName}</span>
            </Link>
            <p className="text-[11px] leading-snug max-w-xs text-[var(--white)]/70">
              {tagline || 'Premium Ethiopian cultural products. Quality guaranteed.'}
            </p>
            <div className="flex gap-1.5">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--white)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-500)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <Icon className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[var(--white)] font-semibold text-xs mb-1.5">Quick Links</h3>
            <ul className="space-y-0.5">
              {[
                { href: '/shop', label: 'Shop' },
                { href: '/shop?featured=true', label: 'Featured' },
                { href: '/shop?type=digital', label: 'Digital' },
                { href: '/cart', label: 'Cart' },
                { href: '/dashboard', label: 'Account' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[11px] text-[var(--white)]/75 hover:text-[var(--gold-500)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[var(--white)] font-semibold text-xs mb-1.5">Support</h3>
            <ul className="space-y-0.5">
              {[
                { href: '/help-center', label: 'Help Center' },
                { href: '/track-order', label: 'Track Order' },
                { href: '/returns', label: 'Returns' },
                { href: '/shipping-info', label: 'Shipping' },
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[11px] text-[var(--white)]/75 hover:text-[var(--gold-500)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Payments */}
          <div>
            <h3 className="text-[var(--white)] font-semibold text-xs mb-1.5">Contact</h3>
            <ul className="space-y-1">
              <li className="flex items-center gap-2 text-[11px]">
                <Mail className="w-3 h-3 flex-shrink-0 text-[var(--gold-500)]" />
                <span>{contactEmail}</span>
              </li>
              <li className="flex items-center gap-2 text-[11px]">
                <Phone className="w-3 h-3 flex-shrink-0 text-[var(--gold-500)]" />
                <span>{contactPhone}</span>
              </li>
              <li className="flex items-start gap-2 text-[11px]">
                <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-[var(--gold-500)]" />
                <span>{contactAddress}</span>
              </li>
            </ul>
            <p className="text-[var(--white)]/80 text-[11px] font-medium mt-1.5 mb-1">We Accept</p>
            <div className="flex flex-wrap gap-1">
              {['Stripe', 'PayPal', 'Flutterwave', 'Chapa', 'Telebirr', 'CBE'].map((method) => (
                <span key={method} className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-[var(--white)]/70">
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 flex flex-col sm:flex-row justify-between items-center gap-1.5 text-[10px] border-t border-white/10 text-[var(--white)]/40">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <p>Built with Next.js, Node.js & MongoDB</p>
        </div>
      </div>
    </footer>
  );
}
