"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { addToWishlist, getWishlist, removeFromWishlist } from "@/lib/wishlist/wishlistRepository";

type WishlistContextValue = {
  wishlistedSlugs: string[];
  isWishlisted: (slug: string) => boolean;
  toggleWishlist: (slug: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

/**
 * Site-wide wishlist state (Step 46) — every wishlist heart button
 * (`GameCard`, `GameDetailInfo`) reads and writes this same context, so
 * toggling a product on one page is reflected everywhere it appears,
 * exactly like `CartProvider`. Before this step, wishlist state was a
 * plain per-component `useState` (never shared, never persisted, reset on
 * every navigation) — this replaces that with the real, persistent data
 * layer (`wishlistRepository.ts`) while keeping the exact same heart-icon
 * UI and instant-toggle feel (Step 46 §13).
 *
 * `userId` (Step 71) comes from the shared `CurrentUserProvider` context —
 * `null` for a guest (every visitor, until Step 71) uses the local guest
 * store; a real, authenticated id uses Supabase. Re-resolves whenever that
 * context's user changes (a live sign-in or sign-out), not just once on
 * mount — the exact activation this file's Step 46 comment already
 * anticipated ("would activate automatically the moment a real auth
 * provider starts returning a real user id").
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, status } = useCurrentUserContext();
  const userId = user?.id ?? null;
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    // Wait for CurrentUserProvider to resolve who's signed in before
    // reading a wishlist — reading too early would always see `userId:
    // null` (guest) even for a returning signed-in visitor, briefly
    // showing the wrong list before flipping to the right one.
    if (status === "loading") return;

    let cancelled = false;

    (async () => {
      const initial = await getWishlist(userId);
      if (cancelled) return;
      // Syncing from an external source (guest storage/Supabase) on mount
      // and on every auth change, matching CartProvider/LanguageProvider's
      // own pattern.
      setSlugs(initial);
    })();

    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  function isWishlisted(slug: string): boolean {
    return slugs.includes(slug);
  }

  async function toggleWishlist(slug: string) {
    const wasWishlisted = slugs.includes(slug);

    // Optimistic update — instant feedback, same as the old local useState.
    setSlugs((prev) => (wasWishlisted ? prev.filter((existing) => existing !== slug) : [...prev, slug]));

    const succeeded = wasWishlisted
      ? await removeFromWishlist(userId, slug)
      : await addToWishlist(userId, slug);

    if (!succeeded) {
      // Only the Supabase path can genuinely fail this way (Step 46 §17) —
      // revert the optimistic update rather than leave the UI showing a
      // state that was never actually saved.
      setSlugs((prev) => (wasWishlisted ? [...prev, slug] : prev.filter((existing) => existing !== slug)));
    }
  }

  return (
    <WishlistContext.Provider value={{ wishlistedSlugs: slugs, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
