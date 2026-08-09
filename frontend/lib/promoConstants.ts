/** Shared key used to track promo modal dismissal in localStorage.
 *  Bump this version whenever you want to reset the dismissed state for all users
 *  (e.g. after changing the promo offer). Must be kept in sync with authStore logout. */
export const PROMO_DISMISSED_KEY = 'promo_v4_dismissed_at';
