'use client';

import { Shield } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';
import SupportPageLayout from '@/components/layout/SupportPageLayout';

const FALLBACK = [
  { title: '1. Information We Collect', content: 'We collect your name, email, phone, delivery address, and payment information (processed securely by our payment partners). We also collect device and usage data via cookies.' },
  { title: '2. How We Use Your Information', content: 'To process and fulfil orders, communicate with you, improve our services, detect fraud, comply with legal obligations, and send marketing emails if you have opted in.' },
  { title: '3. Sharing Your Information', content: 'We do not sell your personal information. We share it only with shipping carriers, payment processors, and service providers who assist in operating our website.' },
  { title: '4. Cookies', content: 'We use cookies to keep you signed in, remember your cart, analyse site traffic, and deliver relevant content. You can control cookies through your browser settings.' },
  { title: '5. Your Rights', content: 'You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at support@shopLocal.com.' },
  { title: '6. Contact', content: 'For questions about this Privacy Policy, email us at support@shopLocal.com.' },
];

export default function PrivacyPage() {
  const { supportPages } = useSiteSettings();
  return (
    <SupportPageLayout
      title="Privacy Policy"
      icon={Shield}
      page={supportPages?.privacy}
      fallbackSections={FALLBACK}
    />
  );
}
