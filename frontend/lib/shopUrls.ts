/**
 * Category/product URL structure: /shop/[category]/[productSlug]
 * Use these helpers everywhere so links stay consistent.
 */

export const SHOP_PATH = '/shop';

/** URL for the main shop (all products) */
export function getShopUrl(): string {
  return SHOP_PATH;
}

/** URL for a category listing: /shop/[categorySlug] */
export function getCategoryUrl(category: { slug: string } | string): string {
  const slug = typeof category === 'string' ? category : category.slug;
  return `${SHOP_PATH}/${encodeURIComponent(slug)}`;
}

/** URL for a product: /shop/[categorySlug]/[productSlug]. Pass product with category populated (name, slug). */
export function getProductUrl(product: {
  slug: string;
  category?: { slug: string } | string | null;
}): string {
  const categorySlug =
    product.category == null
      ? 'uncategorized'
      : typeof product.category === 'string'
        ? product.category
        : (product.category as { slug: string }).slug ?? 'uncategorized';
  return `${SHOP_PATH}/${encodeURIComponent(categorySlug)}/${encodeURIComponent(product.slug)}`;
}

/** Build product URL when you only have categorySlug and productSlug */
export function getProductUrlFromSlugs(categorySlug: string, productSlug: string): string {
  return `${SHOP_PATH}/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`;
}
