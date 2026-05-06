'use client';

import { useQuery } from '@tanstack/react-query';
import api from './api';
import { rewriteAssetUrl } from './rewriteAssetUrl';

export interface HeroButton {
  text: string;
  link: string;
  style: 'primary' | 'outline';
}

export interface HeroStat {
  value: string;
  label: string;
}

export type HeroImageObjectFit = 'cover' | 'contain' | 'fill';
export type HeroImagePosition = 'center' | 'top' | 'bottom' | 'left' | 'right';
export type HeroMediaType = 'image' | 'video';

export interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
  rating: number;
}

export interface HeroSettings {
  badge1: string;
  badge2: string;
  headlineLine1: string;
  headlineLine2: string;
  headlineLine3: string;
  description: string;
  buttons: HeroButton[];
  socialProofText: string;
  heroImageUrl: string;
  heroImageObjectFit: HeroImageObjectFit;
  heroImagePosition: HeroImagePosition;
  heroImageScale: number; // 50–150, 100 = normal
  heroMediaType: HeroMediaType; // 'image' | 'video'
  heroVideoUrl: string; // URL or uploaded video
  heroVideoAutoplay: boolean;
  heroVideoLoop: boolean;
  heroVideoMuted: boolean;
  showProductCards: boolean;
  stats: HeroStat[];
  ctaBannerTitle: string;
  ctaBannerDescription: string;
}

export interface SupportPageSection {
  title: string;
  content: string;
}

export interface SupportPageData {
  intro?: string;
  sections: SupportPageSection[];
}

export interface SupportPages {
  helpCenter?: SupportPageData;
  returns?: SupportPageData;
  shippingInfo?: SupportPageData;
  privacy?: SupportPageData;
  terms?: SupportPageData;
}

export type CurrencyCode = 'USD' | 'ETB';

export interface WhyChooseFeature {
  title: string;
  desc: string;
}

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  tagline: string;
  currency: CurrencyCode;
  hero: HeroSettings;
  testimonials: Testimonial[];
  trustBadges: [string, string, string];
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  whyChooseHeading: string;
  whyChooseSubtitle: string;
  whyChooseFeatures: WhyChooseFeature[];
  /** Welcome popup coupon code shown after email submit */
  welcomeCouponCode: string;
  /** Display text for the discount e.g. "10%" or "ETB 500" */
  welcomeDiscount: string;
  supportPages: SupportPages;
}

/** Format a price for display. Use currency from useSiteSettings() or pass explicitly. */
export function formatPrice(amount: number | undefined | null, currency: CurrencyCode = 'ETB'): string {
  if (amount == null || Number.isNaN(amount)) return currency === 'ETB' ? 'ETB 0' : '$0.00';
  const n = Number(amount);
  if (currency === 'ETB') {
    return `ETB ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `$${n.toFixed(2)}`;
}

const heroDefaults: HeroSettings = {
  badge1: 'Made in Ethiopia · ሱቅ',
  badge2: '✦ Authentic Handmade',
  headlineLine1: 'Discover',
  headlineLine2: 'Culture,',
  headlineLine3: 'Wear Heritage',
  description:
    'Explore authentic Ethiopian cultural clothing, handmade crafts, traditional jewelry, and artisan objects. Pay with Telebirr, CBE Birr, Stripe, or PayPal.',
  buttons: [
    { text: 'Shop Now', link: '/shop', style: 'primary' },
    { text: 'Get Started', link: '/register', style: 'outline' },
  ],
  socialProofText: '50,000+ happy customers',
  heroImageUrl: '',
  heroImageObjectFit: 'cover',
  heroImagePosition: 'center',
  heroImageScale: 100,
  heroMediaType: 'image',
  heroVideoUrl: '',
  heroVideoAutoplay: true,
  heroVideoLoop: true,
  heroVideoMuted: true,
  showProductCards: true,
  stats: [
    { value: '50K+', label: 'Happy Customers' },
    { value: '5K+', label: 'Handmade Items' },
    { value: '200+', label: 'Local Artisans' },
    { value: '4.9', label: 'Average Rating' },
  ],
  ctaBannerTitle: 'Ready to Explore\nEthiopian Culture?',
  ctaBannerDescription:
    'Join 50,000+ customers and discover authentic handmade cultural products from Ethiopia.',
};

const defaultTestimonials: Testimonial[] = [
  { name: 'Abebe Girma', role: 'Business Owner', text: 'ShopL has the most beautiful Ethiopian cultural clothing I\'ve ever seen online. Outstanding quality!', avatar: 'A', rating: 5 },
  { name: 'Sara Tadesse', role: 'Fashion Designer', text: 'Amazing handcrafted jewelry and habesha kemis. Telebirr & CBE payment makes it so convenient!', avatar: 'S', rating: 5 },
  { name: 'Michael Johnson', role: 'Cultural Enthusiast', text: 'Best place for authentic Ethiopian handmade objects. Fast shipping and excellent service.', avatar: 'M', rating: 5 },
  { name: 'Fatima Ahmed', role: 'Entrepreneur', text: 'The variety of cultural products and payment options is unmatched. Highly recommend ShopL!', avatar: 'F', rating: 5 },
];

const defaultTrustBadges: [string, string, string] = ['Free shipping over ETB 1000', 'Secure checkout', '30-day returns'];

const defaults: SiteSettings = {
  siteName: 'Shop Local Ethiopia',
  logoUrl: '',
  tagline: 'premium Ethiopian cultural products',
  currency: 'ETB',
  hero: heroDefaults,
  testimonials: defaultTestimonials,
  trustBadges: defaultTrustBadges,
  contactEmail: 'support@shopLocal.com',
  contactPhone: '+251 911 959219',
  contactAddress: 'Addis Ababa, Ethiopia',
  whyChooseHeading: 'Why Choose',
  whyChooseSubtitle: 'The best shopping experience for Ethiopian cultural products.',
  welcomeCouponCode: 'WELCOME10',
  welcomeDiscount: '10%',
  supportPages: {},
  whyChooseFeatures: [
    { title: 'Secure Payments', desc: 'Stripe, PayPal, Flutterwave, Telebirr & CBE Birr supported.' },
    { title: 'Fast Delivery', desc: 'Same-day in Addis Ababa, nationwide within 3–10 days.' },
    { title: 'Easy Returns', desc: '30-day hassle-free returns on all physical products.' },
    { title: '24/7 Support', desc: 'Round-the-clock support via chat, email, and phone.' },
    { title: 'Global Reach', desc: 'Multi-currency shopping from anywhere in the world.' },
    { title: 'Instant Digital', desc: 'Instant delivery for courses, downloads & software.' },
  ],
};

export function useSiteSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: SiteSettings }>('/settings');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: defaults,
  });

  const heroRaw: HeroSettings = {
    ...heroDefaults,
    ...(data?.hero || {}),
  };

  const hero: HeroSettings = {
    ...heroRaw,
    heroImageUrl: rewriteAssetUrl(heroRaw.heroImageUrl),
    heroVideoUrl: rewriteAssetUrl(heroRaw.heroVideoUrl),
  };

  const testimonials: Testimonial[] = Array.isArray(data?.testimonials) && data.testimonials.length > 0
    ? data.testimonials.map((t: any) => ({
        name: t.name || '',
        role: t.role || '',
        text: t.text || '',
        avatar: t.avatar || (t.name ? String(t.name).charAt(0).toUpperCase() : '?'),
        rating: typeof t.rating === 'number' ? Math.min(5, Math.max(1, t.rating)) : 5,
      }))
    : defaultTestimonials;

  const currency: CurrencyCode = (data?.currency === 'USD' || data?.currency === 'ETB') ? data.currency : 'ETB';

  const trustBadges: [string, string, string] = Array.isArray(data?.trustBadges) && data.trustBadges.length >= 3
    ? [data.trustBadges[0], data.trustBadges[1], data.trustBadges[2]]
    : defaultTrustBadges;

  return {
    siteName: data?.siteName ?? defaults.siteName,
    logoUrl: rewriteAssetUrl(data?.logoUrl ?? defaults.logoUrl),
    tagline: data?.tagline ?? defaults.tagline,
    currency,
    hero,
    testimonials,
    trustBadges,
    contactEmail: data?.contactEmail ?? defaults.contactEmail,
    contactPhone: data?.contactPhone ?? defaults.contactPhone,
    contactAddress: data?.contactAddress ?? defaults.contactAddress,
    whyChooseHeading: data?.whyChooseHeading ?? defaults.whyChooseHeading,
    whyChooseSubtitle: data?.whyChooseSubtitle ?? defaults.whyChooseSubtitle,
    whyChooseFeatures:
      Array.isArray(data?.whyChooseFeatures) && data.whyChooseFeatures.length >= 6
        ? data.whyChooseFeatures.map((f: any) => ({ title: f.title ?? '', desc: f.desc ?? '' }))
        : defaults.whyChooseFeatures,
    welcomeCouponCode: data?.welcomeCouponCode ?? defaults.welcomeCouponCode,
    welcomeDiscount: data?.welcomeDiscount ?? defaults.welcomeDiscount,
    supportPages: (data?.supportPages ?? {}) as SupportPages,
    isLoading,
  };
}

export { heroDefaults, defaultTestimonials };
