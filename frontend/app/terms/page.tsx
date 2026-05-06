'use client';

import { FileText } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';
import SupportPageLayout from '@/components/layout/SupportPageLayout';

const FALLBACK = [
  { title: '1. Acceptance of Terms', content: 'By using our website and services, you agree to be bound by these Terms of Service and our Privacy Policy.' },
  { title: '2. Use of Our Services', content: 'You may use our services only for lawful purposes. You agree not to violate any laws, attempt unauthorised access, or transmit harmful content.' },
  { title: '3. Orders and Payment', content: 'By placing an order, you represent that you are authorised to use the payment method provided and that the payment information is accurate.' },
  { title: '4. Returns and Refunds', content: 'Our return policy allows returns within 30 days of delivery for eligible items. Please refer to our Returns page for full details.' },
  { title: '5. Intellectual Property', content: 'All content on this website is the property of Shop Local Ethiopia and is protected by copyright and intellectual property laws.' },
  { title: '6. Governing Law', content: 'These terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Disputes shall be resolved in the courts of Addis Ababa.' },
];

export default function TermsPage() {
  const { supportPages } = useSiteSettings();
  return (
    <SupportPageLayout
      title="Terms of Service"
      icon={FileText}
      page={supportPages?.terms}
      fallbackSections={FALLBACK}
    />
  );
}
