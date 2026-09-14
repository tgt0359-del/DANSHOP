/**
 * Guest wishlist storage (Step 46) — the browser-local persistence layer,
 * used whenever no authenticated user id exists (today: always — see
 * lib/auth/guestAuthProvider.ts). Mirrors CartProvider.tsx's own
 * readCart/writeCart pattern exactly: try/catch guarded, never throws, so
 * a full/unavailable localStorage (e.g. private browsing) degrades to "no
 * persistence this visit" rather than a crash.
 *
 * Stores product *slugs*, not database ids — the same convention
 * lib/cart/CartProvider.tsx and hooks/useRecentlyViewed.ts already use,
 * since `slug` is the stable, human-meaningful identifier every product
 * page/URL is already keyed on (Step 46 §15).
 */

const STORAGE_KEY = "danshop_wishlist";

export function readWishlistSlugs(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    // Malformed JSON or localStorage unavailable (e.g. privacy mode) — treat as empty.
    return [];
  }
}

function writeWishlistSlugs(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Ignore write failures — the wishlist just won't persist this visit
    // (same philosophy as CartProvider/useRecentlyViewed).
  }
}

/** No-op if already present — this is what prevents a duplicate guest
 * wishlist entry (Step 46 §16). */
export function addWishlistSlugLocally(slug: string): void {
  const current = readWishlistSlugs();
  if (current.includes(slug)) return;
  writeWishlistSlugs([...current, slug]);
}

export function removeWishlistSlugLocally(slug: string): void {
  const current = readWishlistSlugs();
  writeWishlistSlugs(current.filter((existing) => existing !== slug));
}
