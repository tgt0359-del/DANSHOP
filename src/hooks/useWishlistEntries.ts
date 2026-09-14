"use client";

import { useMemo } from "react";
import { resolveGameEntry, type ResolvedGameEntry } from "@/lib/products/resolveGameEntry";
import { useWishlist } from "@/lib/wishlist/WishlistProvider";

/**
 * The wishlisted items, resolved against the real catalog for display
 * (Step 63 — Account & User Experience, §5). Unlike `useRecentlyViewed`,
 * this needs no effect/fetch of its own: `useWishlist()`'s
 * `wishlistedSlugs` is already the live, resolved list of slugs (loaded
 * once by `WishlistProvider` on mount, kept in sync by every
 * `toggleWishlist` call site — `GameCard`, `GameDetailInfo`) — this hook
 * only maps those slugs to something renderable, via the same
 * `resolveGameEntry` `useRecentlyViewed` uses, so a slug that can't be
 * resolved (never happens in practice — see that function's own comment)
 * is silently dropped rather than crashing the Account page.
 */
export function useWishlistEntries(): ResolvedGameEntry[] {
  const { wishlistedSlugs } = useWishlist();

  return useMemo(
    () =>
      wishlistedSlugs
        .map((slug) => resolveGameEntry(slug))
        .filter((entry): entry is ResolvedGameEntry => entry !== undefined),
    [wishlistedSlugs]
  );
}
