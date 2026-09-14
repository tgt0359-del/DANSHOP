"use client";

import { useEffect, useState } from "react";
import { getAuthProvider } from "@/lib/auth/authProvider";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { resolveGameEntry } from "@/lib/products/resolveGameEntry";
import {
  getRecentlyViewedSlugs,
  recordRecentlyViewedSlug,
} from "@/lib/recentlyViewed/recentlyViewedRepository";
import { writeRecentlyViewedSlugs } from "@/lib/recentlyViewed/recentlyViewedStore";
import type { Game } from "@/types/game";

/**
 * Records a game (or, as of Step 59, any wallet/gift-card/top-up product)
 * as viewed (Step 47: goes through `recentlyViewedRepository.ts` —
 * Supabase-primary for a real user id, local guest storage otherwise —
 * instead of writing directly to localStorage). Called once from a
 * product detail page, fire-and-forget (no `await` at the call site,
 * unchanged — Step 47 §15/§17 keep this function's outward signature and
 * every caller identical to before). The function itself is already fully
 * generic (just a slug); `useRecentlyViewed` below is what previously
 * limited the READ side to real games only — see its own comment.
 */
export function recordRecentlyViewed(slug: string): void {
  if (typeof window === "undefined") return;
  void (async () => {
    // Not a hook (this is a plain function, called imperatively from a
    // product-detail page's effect) — resolves whoever is signed in right
    // now via the shared provider resolver (Step 71's `getAuthProvider()`)
    // rather than reading React context, but reports the exact same
    // `userId`/guest split `useRecentlyViewed` below does.
    const user = await getAuthProvider().getCurrentUser();
    await recordRecentlyViewedSlug(user?.id ?? null, slug);
  })();
}

export interface RecentlyViewedEntry {
  game: Game;
  /** Where this entry should link to — `/games/<slug>` for a real game,
   * or the correct wallet/gift-card/top-up route otherwise (Step 59). */
  href: string;
}

// Step 63: `RecentlyViewedEntry` is structurally identical to
// `resolveGameEntry`'s `ResolvedGameEntry` — kept as its own named type
// here rather than re-exporting that one, since callers of this hook
// already import `RecentlyViewedEntry` by name and there's no reason to
// churn that public surface for an internal implementation detail.

/**
 * The recently-viewed items, resolved against the real `games` data first,
 * then (Step 59 — Gift Card Marketplace, generalizing Step 47's original
 * games-only version rather than building a second recently-viewed
 * system, per that step's own §8 instruction) the merged demo catalog
 * (`data/demoCatalog.ts`) for a wallet/gift-card/top-up product — the
 * exact same two-step resolution `resolveCartLine.ts` already uses for
 * cart lines. Starts empty on every render (server and first client
 * render both show nothing, so there's no hydration mismatch), then
 * resolves once after mount via the repository, silently dropping any
 * slug that matches neither a real game nor a variant-bearing demo
 * product (Step 47 §14, now covering both catalogs) — for the guest path
 * a stale slug is also cleaned out of storage (as before), which can't
 * happen for the Supabase path (a deleted product cascades its
 * recently_viewed_items row away, so a Supabase-sourced slug can never be
 * stale) so no write-back is attempted there.
 */
export function useRecentlyViewed(): RecentlyViewedEntry[] {
  // Step 71: sourced from the reactive `CurrentUserProvider` context
  // instead of a one-off `guestAuthProvider.getCurrentUser()` call, so a
  // live sign-in/sign-out re-resolves this list (Supabase vs. local guest
  // storage) without needing a page refresh.
  const { user: currentUser, status: authStatus } = useCurrentUserContext();
  const [viewedEntries, setViewedEntries] = useState<RecentlyViewedEntry[]>([]);

  useEffect(() => {
    if (authStatus === "loading") return;

    let cancelled = false;

    (async () => {
      const userId = currentUser?.id ?? null;
      const storedSlugs = await getRecentlyViewedSlugs(userId);
      // Step 63: resolution itself now lives in the shared
      // `resolveGameEntry` (real game first, then a variant-bearing demo
      // product) — also used by `useWishlistEntries`, so the two slug-list
      // features can never resolve the same slug two different ways.
      const resolved = storedSlugs
        .map((slug) => resolveGameEntry(slug))
        .filter((entry): entry is RecentlyViewedEntry => entry !== undefined);

      if (!userId && resolved.length !== storedSlugs.length) {
        writeRecentlyViewedSlugs(resolved.map((entry) => entry.game.slug));
      }

      if (cancelled) return;
      setViewedEntries(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, currentUser]);

  return viewedEntries;
}
