'use client';

import Link from 'next/link';
import { Package, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';

export default function Footer() {
  const { siteName, logoUrl, tagline, contactEmail, contactPhone, contactAddress } = useSiteSettings();

  return (
    <footer className="text-[var(--white)]/90 bg-[var(--eth-footer-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 space-y-1">
            <Link href="/" className="flex items-center gap-1.5">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-6 h-6 object-contain" />
              ) : (
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--gold-500)' }}>
                  <Package className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <span className="text-sm font-bold text-[var(--white)]">{siteName}</span>
            </Link>
            <p className="text-[10px] leading-snug max-w-xs text-[var(--white)]/70">
              {tagline || 'Premium Ethiopian cultural products. Quality guaranteed.'}
            </p>
            <div className="flex gap-1">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--white)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-500)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <Icon className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[var(--white)] font-semibold text-[11px] mb-1">Quick Links</h3>
            <ul className="space-y-0">
              {[
                { href: '/shop', label: 'Shop' },
                { href: '/shop?featured=true', label: 'Featured' },
                { href: '/shop?type=digital', label: 'Digital' },
                { href: '/cart', label: 'Cart' },
                { href: '/dashboard', label: 'Account' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[10px] text-[var(--white)]/75 hover:text-[var(--gold-500)] transition-colors leading-normal">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[var(--white)] font-semibold text-[11px] mb-1">Support</h3>
            <ul className="space-y-0">
              {[
                { href: '/help-center', label: 'Help Center' },
                { href: '/track-order', label: 'Track Order' },
                { href: '/returns', label: 'Returns' },
                { href: '/shipping-info', label: 'Shipping' },
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[10px] text-[var(--white)]/75 hover:text-[var(--gold-500)] transition-colors leading-normal">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Payments */}
          <div>
            <h3 className="text-[var(--white)] font-semibold text-[11px] mb-1">Contact</h3>
            <ul className="space-y-0.5">
              <li className="flex items-center gap-1.5 text-[10px]">
                <Mail className="w-2.5 h-2.5 flex-shrink-0 text-[var(--gold-500)]" />
                <span>{contactEmail}</span>
              </li>
              <li className="flex items-center gap-1.5 text-[10px]">
                <Phone className="w-2.5 h-2.5 flex-shrink-0 text-[var(--gold-500)]" />
                <span>{contactPhone}</span>
              </li>
              <li className="flex items-start gap-1.5 text-[10px]">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0 mt-0.5 text-[var(--gold-500)]" />
                <span>{contactAddress}</span>
              </li>
            </ul>
            <p className="text-[var(--white)]/80 text-[10px] font-medium mt-1 mb-0.5">We Accept</p>
            <div className="flex flex-wrap gap-1">
              {['Stripe', 'PayPal', 'Flutterwave', 'Chapa', 'Telebirr', 'CBE'].map((method) => (
                <span key={method} className="text-[8px] px-1 py-0 rounded bg-white/10 text-[var(--white)]/70">
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 flex flex-col sm:flex-row justify-between items-center gap-1 text-[9px] border-t border-white/10 text-[var(--white)]/40">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <p>Built with Next.js, Node.js & MongoDB</p>
        </div>
      </div>
    </footer>
  );
}
