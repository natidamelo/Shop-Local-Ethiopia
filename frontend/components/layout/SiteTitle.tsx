'use client';

import { useEffect } from 'react';
import { useSiteSettings } from '@/lib/useSiteSettings';

/**
 * Updates the browser tab title to use the site name from settings.
 * Renders nothing.
 */
export default function SiteTitle() {
  const { siteName } = useSiteSettings();

  useEffect(() => {
    document.title = siteName ? `${siteName} - Your Premium Online Store` : 'ShopL - Your Premium Online Store';
  }, [siteName]);

  return null;
}
