'use client';

import { RefreshCw } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';
import SupportPageLayout from '@/components/layout/SupportPageLayout';

const FALLBACK = [
  { title: 'Eligible for Return', content: 'Unused items in original packaging\nItems returned within 30 days of delivery\nProducts with manufacturing defects\nWrong item received\nDamaged items (with photo evidence)' },
  { title: 'Not Eligible', content: 'Digital downloads once accessed\nCustomised or personalised items\nItems returned after 30 days\nUsed or washed clothing\nItems without original packaging' },
  { title: 'How to Start a Return', content: 'Go to Account → Orders, select the order, and click "Request Return". Our team will review and send you a prepaid return label within 2 business days.' },
  { title: 'Refund Timeline', content: 'Refunds are processed within 5–7 business days after we receive the returned item. The amount will be credited to your original payment method.' },
];

export default function ReturnsPage() {
  const { supportPages } = useSiteSettings();
  return (
    <SupportPageLayout
      title="Returns & Refunds"
      icon={RefreshCw}
      page={supportPages?.returns}
      fallbackSections={FALLBACK}
    />
  );
}
