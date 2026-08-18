'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle2, X, Sparkles } from 'lucide-react';
import { useLanguageStore, translations } from '@/lib/store/languageStore';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { rewriteAssetUrl } from '@/lib/rewriteAssetUrl';
import api from '@/lib/api';

interface PurchaseItem {
  id: string;
  name: string;
  nameAm?: string;
  image?: string;
  price: number;
  slug: string;
  locationEn: string;
  locationAm: string;
  timeAgoEn: string;
  timeAgoAm: string;
}

const fallbackPurchases: PurchaseItem[] = [
  {
    id: '1',
    name: 'Traditional Habesha Kemis (Hand-embroidered)',
    nameAm: 'ባህላዊ የሀበሻ ቀሚስ (በእጅ ጥልፍ)',
    image: '/how-product-made.png',
    price: 4500,
    slug: 'hand-woven-textiles-and-apparel',
    locationEn: 'Addis Ababa, Ethiopia',
    locationAm: 'አዲስ አበባ፣ ኢትዮጵያ',
    timeAgoEn: '2 mins ago',
    timeAgoAm: 'ከ 2 ደቂቃ በፊት',
  },
  {
    id: '2',
    name: 'Authentic Clay Jebena Coffee Ceremony Set',
    nameAm: 'የሸክላ ጀበና እና የቡና ማፍያ ሙሉ ስብስብ',
    price: 2800,
    slug: 'coffee-ceremony-kits',
    locationEn: 'Silver Spring, MD (USA)',
    locationAm: 'ሲልቨር ስፕሪንግ፣ አሜሪካ',
    timeAgoEn: '4 mins ago',
    timeAgoAm: 'ከ 4 ደቂቃ በፊት',
  },
  {
    id: '3',
    name: 'Handmade Colorful Mesob Dining Basket',
    nameAm: 'በእጅ የተሰራ ባለቀለም ባህላዊ መሶብ',
    price: 3200,
    slug: 'artisan-craft-and-home-decor',
    locationEn: 'London, United Kingdom',
    locationAm: 'ለንደን፣ እንግሊዝ',
    timeAgoEn: 'Just now',
    timeAgoAm: 'አሁን',
  },
  {
    id: '4',
    name: 'Premium Ethiopian Highland Leather Bag',
    nameAm: 'ከከፍተኛ ጥራት የኢትዮጵያ ቆዳ የተሰራ ቦርሳ',
    price: 5400,
    slug: 'leather-and-leather-goods',
    locationEn: 'Hawassa, Ethiopia',
    locationAm: 'ሀዋሳ፣ ኢትዮጵያ',
    timeAgoEn: '6 mins ago',
    timeAgoAm: 'ከ 6 ደቂቃ በፊት',
  },
  {
    id: '5',
    name: 'Yirgacheffe Organic Specialty Roasted Coffee',
    nameAm: 'የይርጋጨፌ የተመረጠ የተቆላ ኦርጋኒክ ቡና',
    price: 950,
    slug: 'coffee-ceremony-kits',
    locationEn: 'Frankfurt, Germany',
    locationAm: 'ፍራንክፈርት፣ ጀርመን',
    timeAgoEn: '8 mins ago',
    timeAgoAm: 'ከ 8 ደቂቃ በፊት',
  },
  {
    id: '6',
    name: 'Dorze Handwoven Cotton Netela & Scarf',
    nameAm: 'የዶርዜ ጥጥ በእጅ የተሸመነ ነጠላ እና ሻርፕ',
    price: 1850,
    slug: 'hand-woven-textiles-and-apparel',
    locationEn: 'Toronto, Canada',
    locationAm: 'ቶሮንቶ፣ ካናዳ',
    timeAgoEn: '11 mins ago',
    timeAgoAm: 'ከ 11 ደቂቃ በፊት',
  },
];

const LOCATIONS = [
  { en: 'Addis Ababa, Ethiopia', am: 'አዲስ አበባ፣ ኢትዮጵያ' },
  { en: 'Silver Spring, MD (USA)', am: 'ሲልቨር ስፕሪንግ፣ አሜሪካ' },
  { en: 'London, United Kingdom', am: 'ለንደን፣ እንግሊዝ' },
  { en: 'Bahir Dar, Ethiopia', am: 'ባህር ዳር፣ ኢትዮጵያ' },
  { en: 'Frankfurt, Germany', am: 'ፍራንክፈርት፣ ጀርመን' },
  { en: 'Hawassa, Ethiopia', am: 'ሀዋሳ፣ ኢትዮጵያ' },
  { en: 'Toronto, Canada', am: 'ቶሮንቶ፣ ካናዳ' },
  { en: 'Gondar, Ethiopia', am: 'ጎንደር፣ ኢትዮጵያ' },
  { en: 'Dubai, UAE', am: 'ዱባይ፣ ዩኤኢ' },
];

export default function RecentPurchaseToast() {
  const [purchases, setPurchases] = useState<PurchaseItem[]>(fallbackPurchases);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { language } = useLanguageStore();
  const { currency } = useSiteSettings();
  const t = translations[language];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real products from backend to enrich live purchases
  useEffect(() => {
    api
      .get('/products?limit=8&sort=-rating')
      .then((res) => {
        const products = res.data?.data || [];
        if (products.length > 0) {
          const dynamicList: PurchaseItem[] = products.map((p: any, idx: number) => {
            const loc = LOCATIONS[idx % LOCATIONS.length];
            const timeAgoEn = idx === 0 ? 'Just now' : `${idx * 3 + 1} mins ago`;
            const timeAgoAm = idx === 0 ? 'አሁን' : `ከ ${idx * 3 + 1} ደቂቃ በፊት`;
            return {
              id: p._id || String(idx),
              name: p.name,
              image: p.thumbnail || p.images?.[0] || '',
              price: p.price || 1500,
              slug: p.slug || p._id,
              locationEn: loc.en,
              locationAm: loc.am,
              timeAgoEn,
              timeAgoAm,
            };
          });
          setPurchases(dynamicList);
        }
      })
      .catch(() => {});
  }, []);

  // Cycle through notifications every 18 seconds (show for 6.5s, hide for 11.5s)
  useEffect(() => {
    if (isDismissed) return;

    // Initial popup delay on page load
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    const interval = setInterval(() => {
      if (isPaused) return;

      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % purchases.length);
        setIsVisible(true);
      }, 1000);
    }, 16000);

    // Auto-hide each single toast after 6.5 seconds
    const hideInterval = setInterval(() => {
      if (isPaused) return;
      setIsVisible(false);
    }, 16000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
      clearInterval(hideInterval);
    };
  }, [isDismissed, isPaused, purchases.length]);

  if (isDismissed || purchases.length === 0) return null;

  const current = purchases[currentIndex] || purchases[0];
  const location = language === 'am' ? current.locationAm : current.locationEn;
  const timeAgo = language === 'am' ? current.timeAgoAm : current.timeAgoEn;
  const productName = (language === 'am' && current.nameAm) ? current.nameAm : current.name;

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-sm w-full pointer-events-none hidden sm:block">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="pointer-events-auto relative overflow-hidden rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all group hover:shadow-gold-500/10"
            style={{
              background: 'var(--eth-card-bg)',
              borderColor: 'var(--eth-border)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            }}
          >
            {/* Top glowing accent line */}
            <div className="absolute top-0 inset-x-0 h-1 flex">
              <div className="flex-1 bg-[#2d6a2d]" />
              <div className="flex-1 bg-[#b8860b]" />
              <div className="flex-1 bg-[#c0392b]" />
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                setTimeout(() => setIsDismissed(true), 300);
              }}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <Link href={`/shop/${current.slug}`} className="flex items-center gap-3.5">
              {/* Product Thumbnail / Icon */}
              <div
                className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border flex items-center justify-center shadow-inner"
                style={{
                  borderColor: 'var(--eth-border)',
                  background: 'var(--eth-icon-bg)',
                }}
              >
                {current.image ? (
                  <img
                    src={rewriteAssetUrl(current.image)}
                    alt={productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <ShoppingBag className="w-6 h-6" style={{ color: 'var(--eth-gold)' }} />
                )}
                <div className="absolute bottom-0.5 right-0.5 bg-emerald-600 rounded-full p-0.5 shadow">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              {/* Purchase Details */}
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--eth-text-muted)' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {t.someoneIn} <strong className="font-semibold text-emerald-600 dark:text-emerald-400">{location}</strong>
                  </span>
                </div>

                <p
                  className="text-xs font-bold truncate mt-0.5 group-hover:text-[var(--gold-500)] transition-colors"
                  style={{ color: 'var(--eth-text-primary)' }}
                >
                  {productName}
                </p>

                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="font-bold" style={{ color: 'var(--gold-500)' }}>
                    {formatPrice(current.price, currency)}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--eth-text-muted)' }}>
                    {timeAgo} • {t.verifiedBuyer}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
