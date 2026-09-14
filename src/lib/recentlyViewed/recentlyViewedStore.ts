/**
 * Guest "recently viewed" storage (Step 47) — the browser-local
 * persistence layer, used whenever no authenticated user id exists (today:
 * always — see lib/auth/guestAuthProvider.ts). This is the same
 * `danshop_recently_viewed` key and exact read/write/move-to-front/cap-at-6
 * logic that previously lived directly inside hooks/useRecentlyViewed.ts —
 * extracted here, byte-compatible with whatever's already stored, so this
 * refactor doesn't invalidate any existing browser's data.
 */

const STORAGE_KEY = "danshop_recently_viewed";
export const MAX_RECENTLY_VIEWED = 6;

export function readRecentlyViewedSlugs(): string[] {
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

export function writeRecentlyViewedSlugs(slugs: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Ignore write failures — recently-viewed just won't persist this visit
    // (same philosophy as CartProvider/wishlistStore).
  }
}

/** Moves the slug to the front if already present (no duplicate entry —
 * Step 47 §13), otherwise adds it, capped at MAX_RECENTLY_VIEWED (oldest
 * dropped) — Step 47 §11/§12, unchanged from the pre-Step-47 behavior. */
export function recordRecentlyViewedLocally(slug: string): void {
  const current = readRecentlyViewedSlugs();
  const next = [slug, ...current.filter((existing) => existing !== slug)].slice(0, MAX_RECENTLY_VIEWED);
  writeRecentlyViewedSlugs(next);
}
