import { addWishlistSlugLocally, readWishlistSlugs, removeWishlistSlugLocally } from "@/lib/wishlist/wishlistStore";
import {
  addWishlistItemInSupabase,
  fetchWishlistFromSupabase,
  removeWishlistItemInSupabase,
} from "@/lib/wishlist/wishlistSupabaseSource";

/**
 * The wishlist service layer (Step 46) — the one place the rest of the
 * app reads/writes wishlist state, never `wishlistStore.ts` or
 * `wishlistSupabaseSource.ts` directly (the same "UI → Repository →
 * storage" seam `lib/products/productRepository.ts` established).
 *
 * `userId: string | null` is the switch: `null` means guest (today, this
 * is every visitor — see lib/auth/guestAuthProvider.ts, which always
 * returns no current user) and uses the local browser store; a real id
 * uses Supabase. Unlike the product catalog's `getProducts()`, a failed
 * Supabase read does NOT fall back to local storage here — a signed-in
 * user's wishlist is their own, and silently substituting whatever a
 * browser's local guest storage happens to hold (which could belong to a
 * different person's earlier, pre-login browsing on that device) would be
 * a real correctness bug, not a helpful fallback. It degrades to "empty"
 * instead (Step 46 §17: never breaks the UI, never fabricates data).
 */

export async function getWishlist(userId: string | null): Promise<string[]> {
  if (userId) {
    const remote = await fetchWishlistFromSupabase(userId);
    return remote ?? [];
  }
  return readWishlistSlugs();
}

/** Returns whether the write is believed to have succeeded — the guest
 * path always does (matching CartProvider's "ignore write failures"
 * philosophy: the in-memory state is still correct for this visit even if
 * persisting it failed); the Supabase path reports real success/failure
 * so the caller (WishlistProvider) can revert an optimistic UI update. */
export async function addToWishlist(userId: string | null, slug: string): Promise<boolean> {
  if (userId) {
    return addWishlistItemInSupabase(userId, slug);
  }
  addWishlistSlugLocally(slug);
  return true;
}

export async function removeFromWishlist(userId: string | null, slug: string): Promise<boolean> {
  if (userId) {
    return removeWishlistItemInSupabase(userId, slug);
  }
  removeWishlistSlugLocally(slug);
  return true;
}
