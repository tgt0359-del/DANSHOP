import { guestAuthProvider } from "@/lib/auth/guestAuthProvider";
import { supabaseAuthProvider } from "@/lib/auth/supabaseAuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AuthProvider } from "@/types/auth";

/**
 * The one place that decides which `AuthProvider` the rest of the app
 * uses (Step 71) — every caller that used to import `guestAuthProvider`
 * directly (`useCurrentUser.ts`, `WishlistProvider.tsx`, `useOrders.ts`,
 * `useRecentlyViewed.ts`) now imports this instead, so there is exactly
 * one switch, not four separate ones that could disagree.
 *
 * Mirrors the same `isSupabaseConfigured()` graceful-fallback pattern
 * `lib/products/productRepository.ts` and the wishlist/recently-viewed
 * Supabase sources already use: a project with no Supabase env vars set
 * (this app's default, out-of-the-box state) keeps working exactly as
 * before Step 71 — every visitor a guest, nothing broken.
 */
export function getAuthProvider(): AuthProvider {
  return isSupabaseConfigured() ? supabaseAuthProvider : guestAuthProvider;
}
