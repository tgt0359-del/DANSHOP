"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MAX_RECENTLY_VIEWED } from "@/lib/recentlyViewed/recentlyViewedStore";

/**
 * The Supabase-backed side of the recently-viewed data layer (Step 47) —
 * for a real, authenticated user id. Uses `getSupabaseBrowserClient()`,
 * the same choice Step 46's wishlist made and for the same reason:
 * recording a view fires from a Client Component's effect
 * (`GameDetailInfo`), not a server render, so the publishable-key-only
 * browser client is the correct one — never the server client, which
 * would break outside a real request context.
 *
 * Every function here returns null/false on any failure rather than
 * throwing (Step 47 §16) — never a raw error reaching the UI.
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

interface RecentlyViewedRow {
  products: { slug: string } | { slug: string }[] | null;
}

/** The user's recently-viewed product slugs, newest first (Step 47 §12),
 * capped server-side at MAX_RECENTLY_VIEWED (Step 47 §11) so this never
 * needs to over-fetch and trim client-side. Returns null (not an empty
 * array) if Supabase isn't configured or the read fails. */
export async function fetchRecentlyViewedFromSupabase(userId: string): Promise<string[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = getSupabaseBrowserClient();
    const { data, error } = await client
      .from("recently_viewed_items")
      .select("products ( slug )")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(MAX_RECENTLY_VIEWED);

    if (error) {
      console.warn("[recentlyViewedSupabaseSource] read failed:", error.message);
      return null;
    }

    return (data as unknown as RecentlyViewedRow[] | null ?? [])
      .map((row) => (Array.isArray(row.products) ? row.products[0]?.slug : row.products?.slug))
      .filter((slug): slug is string => typeof slug === "string");
  } catch {
    console.warn("[recentlyViewedSupabaseSource] read threw.");
    return null;
  }
}

/**
 * Records a view: upserts on the existing `recently_viewed_items_user_product_key`
 * unique constraint (Step 38, unchanged) — a repeat view of the same
 * product updates `viewed_at` (bumping it to the front, Step 47 §13)
 * instead of creating a duplicate row, exactly the behavior Step 38's own
 * schema comment anticipated for this table. Unlike wishlist's upsert
 * (Step 46, `ignoreDuplicates: true`), this one deliberately omits that
 * flag so the conflicting row's `viewed_at` *does* get updated.
 *
 * After upserting, trims any rows beyond the MAX_RECENTLY_VIEWED most
 * recent for this user — the cap is an application-layer concern, not a
 * database constraint (see supabase/README.md's design notes), so the
 * write side enforces it the same way the local guest store's `.slice()`
 * always has, rather than only capping at read time and letting old rows
 * accumulate forever.
 */
export async function recordRecentlyViewedInSupabase(userId: string, slug: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const productId = await resolveProductIdBySlug(slug);
  if (!productId) return false;

  try {
    const client = getSupabaseBrowserClient();
    const { error: upsertError } = await client
      .from("recently_viewed_items")
      .upsert(
        { user_id: userId, product_id: productId, viewed_at: new Date().toISOString() },
        { onConflict: "user_id,product_id" }
      );

    if (upsertError) {
      console.warn("[recentlyViewedSupabaseSource] record failed:", upsertError.message);
      return false;
    }

    // Trim anything beyond the cap — best-effort: if this part fails, the
    // read side's own .limit() still keeps the UI correct either way.
    const { data: existing, error: listError } = await client
      .from("recently_viewed_items")
      .select("id")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false });

    if (!listError && existing && existing.length > MAX_RECENTLY_VIEWED) {
      const idsToRemove = existing.slice(MAX_RECENTLY_VIEWED).map((row) => row.id as string);
      await client.from("recently_viewed_items").delete().in("id", idsToRemove);
    }

    return true;
  } catch {
    console.warn("[recentlyViewedSupabaseSource] record threw.");
    return false;
  }
}
