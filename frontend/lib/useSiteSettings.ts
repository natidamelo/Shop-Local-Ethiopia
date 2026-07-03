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

export interface NavLink {
  label: string;
  href: string;
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
  navLinks: NavLink[];
  whyChooseUsPage: WhyChooseUsPageSettings;
}

export interface WhyChooseUsMissionItem {
  title: string;
  desc: string;
}

export interface WhyChooseUsStep {
  step: string;
  title: string;
  desc: string;
}

export interface WhyChooseUsPromise {
  icon: string;
  title: string;
  desc: string;
}

export interface WhyChooseUsPageSettings {
  heritageBadgeText: string;
  title: string;
  subtitle: string;
  ourStoryTitle: string;
  ourStoryParagraphs: string[];
  missionTitle: string;
  missionItems: WhyChooseUsMissionItem[];
  loomImageUrl: string;
  loomImageCaption: string;
  craftsmanshipBadgeText: string;
  craftsmanshipTitle: string;
  craftsmanshipDesc: string;
  craftsmanshipSteps: WhyChooseUsStep[];
  promiseTitle: string;
  promiseSubtitle: string;
  promiseItems: WhyChooseUsPromise[];
}

const whyChooseUsPageDefaults: WhyChooseUsPageSettings = {
  heritageBadgeText: 'Our Heritage & Values',
  title: 'Why Choose',
  subtitle: 'We connect local Ethiopian artisans with the global marketplace, preserving centuries-old traditions and offering you authentic, high-quality handmade products.',
  ourStoryTitle: 'Our Story: Preserving Culture & Craft',
  ourStoryParagraphs: [
    'Every basket, jewelry piece, and woven garment on our platform tells a story that dates back generations. In the fast-paced world of mass production, local Ethiopian artisans keep the spirit of handmade creation alive.',
    'Shop Local Ethiopia was founded to bridge the gap between rural master craftsmen and buyers who appreciate unique, high-quality products. By purchasing from us, you directly support local communities, providing sustainable incomes for weavers, potters, and designers across the country.',
    'We are dedicated to fair-trade principles. Our partnership guarantees that the artisans who create these masterpieces are paid fairly and treated with the respect their incredible skills deserve.'
  ],
  missionTitle: 'Our Core Mission',
  missionItems: [
    { title: 'Authenticity Guarantee', desc: '100% genuine cultural items direct from the source.' },
    { title: 'Empowering Communities', desc: 'Providing sustainable livelihood for local rural artisans.' },
    { title: 'Preserving Heritage', desc: 'Keeping age-old Ethiopian handcraft techniques alive.' }
  ],
  loomImageUrl: '/how-product-made.png',
  loomImageCaption: 'An artisan hand-weaving traditional Ethiopian cotton fabric on a wooden loom.',
  craftsmanshipBadgeText: 'Traditional Craftsmanship',
  craftsmanshipTitle: 'How Our Products Are Made',
  craftsmanshipDesc: 'Our textiles, like the traditional Habesha Kemis, are made using hand-spun local cotton. Master weavers (known locally as Shemane) spend days on wooden handlooms, weaving the threads into fine garments.',
  craftsmanshipSteps: [
    { step: '1', title: 'Spinning Raw Cotton', desc: 'Raw, organic cotton is cleaned and spun by hand into delicate threads.' },
    { step: '2', title: 'Natural Dyeing', desc: 'Threads are dyed using natural extracts from flowers, roots, and leaves.' },
    { step: '3', title: 'Handloom Weaving', desc: 'Using a traditional wooden loom, the weaver manually intertwines the patterns (Tibeb).' },
    { step: '4', title: 'Intricate Finishing', desc: 'Garments are finished with hand-embroidery and final detail inspections.' }
  ],
  promiseTitle: 'Our Promise to You',
  promiseSubtitle: 'We build trust through high-quality materials, secure transactions, and a seamless shopping experience.',
  promiseItems: [
    { icon: 'Shield', title: 'Secure Local Payments', desc: 'Shop easily with Telebirr, CBE Birr, Chapa, Stripe, or PayPal.' },
    { icon: 'Truck', title: 'Reliable Shipping', desc: 'Same-day delivery in Addis Ababa, and global DHL shipping.' },
    { icon: 'Heart', title: 'Community Support', desc: 'Over 80% of every sale goes directly to the creating artisan.' },
    { icon: 'Users', title: '24/7 Dedicated Support', desc: 'Our customer support team is always ready to assist you.' }
  ]
};

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
  navLinks: [
    { href: '/shop', label: 'Shop' },
    { href: '/shop/hand-woven-textiles-and-apparel', label: 'Textiles & Apparel' },
    { href: '/shop/artisan-craft-and-home-decor', label: 'Artisan & Decor' },
    { href: '/shop?featured=true', label: 'Featured' },
    { href: '/bazar-vendor-apply', label: 'Join Bazar as Vendor' },
  ],
  whyChooseUsPage: whyChooseUsPageDefaults,
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

  const whyChooseUsPageRaw: WhyChooseUsPageSettings = {
    ...whyChooseUsPageDefaults,
    ...(data?.whyChooseUsPage || {}),
  };

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
    navLinks: Array.isArray(data?.navLinks) && data.navLinks.length > 0
      ? data.navLinks
      : defaults.navLinks,
    whyChooseUsPage: {
      ...whyChooseUsPageRaw,
      loomImageUrl: rewriteAssetUrl(whyChooseUsPageRaw.loomImageUrl),
    },
    isLoading,
  };
}

export { heroDefaults, defaultTestimonials };
