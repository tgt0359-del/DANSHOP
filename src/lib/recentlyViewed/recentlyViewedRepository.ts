import { readRecentlyViewedSlugs, recordRecentlyViewedLocally } from "@/lib/recentlyViewed/recentlyViewedStore";
import {
  fetchRecentlyViewedFromSupabase,
  recordRecentlyViewedInSupabase,
} from "@/lib/recentlyViewed/recentlyViewedSupabaseSource";

/**
 * The recently-viewed service layer (Step 47) — the one place the rest of
 * the app reads/records recently-viewed state, never
 * `recentlyViewedStore.ts` or `recentlyViewedSupabaseSource.ts` directly.
 * Same "UI → Repository → storage" seam Step 46's wishlist established,
 * and the same `userId: string | null` switch: `null` (guest — every
 * visitor today, see lib/auth/guestAuthProvider.ts) uses the local browser
 * store; a real id uses Supabase.
 *
 * Like wishlist, a failed Supabase read degrades to *empty*, never to
 * local data — a signed-in user's recently-viewed list is their own, and
 * substituting whatever a browser's local guest storage holds could show
 * a different person's browsing history on a shared device.
 */

export async function getRecentlyViewedSlugs(userId: string | null): Promise<string[]> {
  if (userId) {
    const remote = await fetchRecentlyViewedFromSupabase(userId);
    return remote ?? [];
  }
  return readRecentlyViewedSlugs();
}

export async function recordRecentlyViewedSlug(userId: string | null, slug: string): Promise<void> {
  if (userId) {
    await recordRecentlyViewedInSupabase(userId, slug);
    return;
  }
  recordRecentlyViewedLocally(slug);
}
