"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/config";

/**
 * A Supabase client for browser/Client Component use. Uses only the
 * public project URL and publishable key (see config.ts) — nothing here
 * can ever hold a service-role or other server-only secret (Step 39
 * §1/§9). Marked "use client" so it can only ever be bundled into client
 * code, rather than silently working (and then behaving oddly) if a
 * Server Component imported it by mistake — server code should use
 * lib/supabase/server.ts instead.
 *
 * Memoized to a single module-level instance (Step 71 §19 — "do not
 * duplicate Supabase clients"): before Step 71 this created a fresh
 * client on every call, which was harmless when the only callers were
 * one-off reads (wishlist/recently-viewed toggles). Real authentication
 * changes that — `supabaseAuthProvider.ts` and the account-state React
 * context both need `onAuthStateChange` subscriptions and `getSession()`
 * calls to observe the exact same underlying session, which a single
 * shared `GoTrueClient` instance guarantees; several independent clients
 * each polling/observing their own copy would be wasteful and, in the
 * browser's SDK, is explicitly discouraged. Every existing caller's
 * signature and behavior is unchanged — this only changes what happens
 * *inside* the function.
 */
let cachedClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (cachedClient) return cachedClient;

  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)."
    );
  }

  cachedClient = createBrowserClient(env.url, env.publishableKey);
  return cachedClient;
}
