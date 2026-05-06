'use client';

import { Truck } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';
import SupportPageLayout from '@/components/layout/SupportPageLayout';

const FALLBACK = [
  { title: 'Free Local Pickup — Addis Ababa', content: 'Pick up your order for free at our store on Bole Road, Addis Ababa. Select "Local Pickup" at checkout. Open Mon–Sat, 9 AM – 6 PM EAT.' },
  { title: 'Domestic Shipping (Ethiopia)', content: 'Addis Ababa: 1–2 business days — ETB 150 (free over ETB 5,000)\nMajor Cities: 2–3 business days — ETB 250 (free over ETB 5,000)\nNationwide: 3–5 business days — ETB 350 (free over ETB 5,000)' },
  { title: 'International Shipping', content: 'DHL Express Worldwide: 3–4 business days\nUPS Worldwide Expedited®: 4 business days\nDHL eCommerce Parcel Standard: 11–19 business days\n\nRates are calculated at checkout based on destination and weight.' },
  { title: 'Important Notes', content: 'Orders placed before 2 PM EAT on business days are processed the same day.\nYou will receive a tracking number by email once your order ships.\nCustoms duties for international orders are the buyer\'s responsibility.' },
];

export default function ShippingInfoPage() {
  const { supportPages } = useSiteSettings();
  return (
    <SupportPageLayout
      title="Shipping Information"
      icon={Truck}
      page={supportPages?.shippingInfo}
      fallbackSections={FALLBACK}
    />
  );
}
