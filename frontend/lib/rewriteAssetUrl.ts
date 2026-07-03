/**
 * Rewrite image/asset URLs so they work in every environment (local dev,
 * production, SSR, and client).
 *
 * Strategy: if the URL points to the backend uploads directory (e.g.
 * http://localhost:8001/uploads/xxx.jpg  or
 * https://my-render-backend.onrender.com/uploads/xxx.jpg),
 * strip the origin and return just the pathname (/uploads/xxx.jpg).
 *
 * The Next.js rewrite in next.config.ts proxies /uploads/* to the real
 * backend, so relative paths work everywhere without CORS issues.
 */
export function rewriteAssetUrl(url: string | undefined): string {
  if (!url) return '';

  // Blob URL — nothing to rewrite
  if (url.startsWith('blob:')) return url;

  // Starts with 'uploads/' (relative path without leading slash) — prepend a leading slash
  if (url.startsWith('uploads/')) {
    return '/' + url;
  }

  // Already a relative path starting with slash — nothing to rewrite
  if (url.startsWith('/')) return url;

  // Absolute URL — extract the pathname so the Next.js proxy handles it
  if (url.startsWith('http')) {
    try {
      const u = new URL(url);
      // Only rewrite URLs that point to /uploads (our backend assets)
      if (u.pathname.startsWith('/uploads')) {
        return u.pathname + u.search;
      }
    } catch {
      // malformed URL — fall through
    }
    return url;
  }

  // Plain filename without slashes (e.g. xxx.jpg) — prepend /uploads/
  if (!url.includes('/')) {
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(url);
    if (hasExtension) {
      return '/uploads/' + url;
    }
  }

  return url;
}

/** Rewrite an array of image URLs (e.g. product.images). */
export function rewriteAssetUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  return urls.map((u) => rewriteAssetUrl(u));
}
