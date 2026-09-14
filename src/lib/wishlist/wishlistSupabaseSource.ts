"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * The Supabase-backed side of the wishlist data layer (Step 46) — for a
 * real, authenticated user id. Deliberately uses `getSupabaseBrowserClient()`
 * (the publishable-key-only client, Step 39/40's client.ts), not the
 * server client: wishlist toggling is inherently a client-driven,
 * optimistic-UI interaction (a button click), unlike the product catalog's
 * server-rendered reads. This is the first real caller `client.ts` was
 * built for — see its own file comment ("a future Client Component that
 * needs a direct Supabase read has the same safe, RLS-respecting entry
 * point"). Never imports `lib/products/productRepository.ts` (server-only,
 * uses `next/headers`'s `cookies()`) — that would break in a Client
 * Component, so slug↔product-id resolution below is its own small,
 * client-safe query instead of reusing that server-only file.
 *
 * Every function here returns null/false on any failure rather than
 * throwing (Step 46 §17) — never a raw error reaching the UI, and never a
 * fabricated success.
 */

async function resolveProductIdBySlug(slug: string): Promise<string | null> {
  try {
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.from("products").select("id").eq("slug", slug).maybeSingle();
    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

interface WishlistRow {
  products: { slug: string } | { slug: string }[] | null;
}

/** All wishlisted product slugs for this user id. Returns null (not an
 * empty array) if Supabase isn't configured or the read fails — the
 * caller (wishlistRepository.ts) treats that as "the read genuinely
 * couldn't happen", distinct from "this user has zero wishlist items". */
export async function fetchWishlistFromSupabase(userId: string): Promise<string[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = getSupabaseBrowserClient();
    const { data, error } = await client
      .from("wishlist_items")
      .select("products ( slug )")
      .eq("user_id", userId);

    if (error) {
      console.warn("[wishlistSupabaseSource] wishlist read failed:", error.message);
      return null;
    }

    return (data as unknown as WishlistRow[] | null ?? [])
      .map((row) => (Array.isArray(row.products) ? row.products[0]?.slug : row.products?.slug))
      .filter((slug): slug is string => typeof slug === "string");
  } catch {
    console.warn("[wishlistSupabaseSource] wishlist read threw.");
    return null;
  }
}

/** Adds one item, idempotently — relies on the existing
 * `wishlist_items_user_product_key` unique constraint (Step 38, unchanged)
 * via `upsert(..., { ignoreDuplicates: true })`, so calling this twice for
 * the same product never creates a duplicate row (Step 46 §16) and never
 * errors either. */
export async function addWishlistItemInSupabase(userId: string, slug: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const productId = await resolveProductIdBySlug(slug);
  if (!productId) return false;

  try {
    const client = getSupabaseBrowserClient();
    const { error } = await client
      .from("wishlist_items")
      .upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true });

    if (error) {
      console.warn("[wishlistSupabaseSource] wishlist add failed:", error.message);
      return false;
    }
    return true;
  } catch {
    console.warn("[wishlistSupabaseSource] wishlist add threw.");
    return false;
  }
}

export async function removeWishlistItemInSupabase(userId: string, slug: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const productId = await resolveProductIdBySlug(slug);
  if (!productId) return false;

  try {
    const client = getSupabaseBrowserClient();
    const { error } = await client.from("wishlist_items").delete().match({ user_id: userId, product_id: productId });

    if (error) {
      console.warn("[wishlistSupabaseSource] wishlist remove failed:", error.message);
      return false;
    }
    return true;
  } catch {
    console.warn("[wishlistSupabaseSource] wishlist remove threw.");
    return false;
  }
}
