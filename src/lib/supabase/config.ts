export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

/**
 * Reads the public Supabase project URL and publishable key from
 * environment variables. Both are safe to expose to the browser by design
 * — Row Level Security, not secrecy of this key, is what protects data
 * (see supabase/README.md's RLS strategy from Step 38). This project has
 * no server-only Supabase secret anywhere yet; if one is ever added (e.g.
 * a service-role key for a future privileged write path), it must live in
 * a plain (non-`NEXT_PUBLIC_`) environment variable read only from
 * server-only code — never here, never in anything a Client Component
 * imports.
 *
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the current Supabase naming
 * (dashboard: API Settings → Project API keys → "publishable" key) — the
 * successor to the older "anon" key naming, filling the same role.
 *
 * Returns null if either variable is missing or empty, so callers can
 * fall back gracefully instead of crashing (Step 39 §3/§8) — this project
 * runs perfectly well with no Supabase project configured at all, which
 * is its normal state until a real one is connected.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
