import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/config";

/**
 * A Supabase client for server-side use (Server Components, Route
 * Handlers). Uses the same public publishable key as the browser client
 * (see client.ts, config.ts) — never a service-role/secret key, which
 * this file never imports. A future server-only *privileged* client — for
 * the order/payment write path that Step 38's RLS design already assumes
 * will exist, using a `SUPABASE_SERVICE_ROLE_KEY` that is never
 * `NEXT_PUBLIC_`-prefixed and never imported by client code — would be a
 * separate function in this same file, not a replacement for this one.
 *
 * `setAll` (Step 73 §1/§5): real authentication exists as of Step 71, so
 * this now actually forwards Supabase's session-refresh cookie writes
 * instead of the pre-Step-71 no-op. Wrapped in try/catch per Supabase's
 * own documented Next.js pattern: a plain Server Component's `cookies()`
 * is read-only and throws on `.set()` — the only current caller
 * (`app/games/[slug]/page.tsx`'s product-catalog read) is exactly that,
 * so this stays a safe, harmless no-op there, while a future Route
 * Handler or Server Action (which *can* set cookies) gets a real,
 * working session refresh instead of a silent no-op forever.
 */
export async function getSupabaseServerClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a plain Server Component, where the cookie store
          // is read-only — safe to ignore (see file comment above).
        }
      },
    },
  });
}

/**
 * A cookie-free, session-free Supabase client for reading genuinely
 * PUBLIC data only (Step 78) — today, exactly the product catalog
 * (`products`/`product_images`/`categories`), whose RLS policies are
 * `using (true)` and never depend on `auth.uid()` (see
 * supabase/migrations/20260907000000_danshop_full_schema.sql's "Public
 * catalog reading" section). Still only the public publishable key —
 * never a service-role/secret key — the difference from
 * `getSupabaseServerClient()` above is purely *how* the client is built,
 * not what it's allowed to do.
 *
 * Deliberately does NOT call `next/headers`'s `cookies()` at all, which is
 * exactly what makes it safe to use from a route Next.js is trying to
 * render statically at build time. `getSupabaseServerClient()`'s
 * `cookies()` read forces Next.js to treat the calling route as dynamic —
 * verified directly (Step 78): every product-catalog read was silently
 * throwing `DYNAMIC_SERVER_USAGE` ("Route ... couldn't be rendered
 * statically because it used `cookies`") and falling back to the local
 * catalog on *every* build, for *every* route, real Supabase misconfiguration
 * or outage or not — not a data or permissions problem, a client-construction
 * one. Switching the product-catalog read path
 * (`lib/products/productSupabaseSource.ts`) to this client fixes that at
 * the root, and lets statically-generated pages read the real catalog too
 * instead of being permanently frozen on the local fallback from their
 * one build-time attempt.
 *
 * Never use this for anything that depends on *who* is asking — its
 * `auth.uid()` is always null, since it never looks for a session at all.
 * User-specific reads (profile, orders, wishlist, ...) still need
 * `getSupabaseServerClient()`, which correctly resolves the visitor's own
 * session from their request's cookies.
 */
export function getSupabasePublicServerClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)."
    );
  }

  return createClient(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
