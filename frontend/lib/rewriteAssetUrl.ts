/**
 * Rewrite image URLs that use localhost/127.0.0.1 so they work when the site is
 * opened from another device (e.g. phone at 192.168.1.5:3000). On the phone,
 * "localhost" points to the phone itself, so images from your PC backend won't load.
 */
export function rewriteAssetUrl(url: string | undefined): string {
  if (typeof window === 'undefined' || !url || !url.startsWith('http')) return url || '';
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const backendOrigin = apiUrl ? new URL(apiUrl).origin : window.location.origin;
      return `${backendOrigin}${u.pathname}${u.search}`;
    }
  } catch {
    // ignore
  }
  return url;
}

/** Rewrite an array of image URLs (e.g. product.images). */
export function rewriteAssetUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  return urls.map((u) => rewriteAssetUrl(u));
}
