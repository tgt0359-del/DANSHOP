import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fallbackUser, mapUserRow, type UserRow } from "@/lib/users/mapUserRow";
import type { User } from "@/types/user";

/**
 * Server-side session/profile reads (Step 73 §1/§5) — the Server
 * Component/Route Handler counterpart to `supabaseAuthProvider.ts`'s
 * client-side `getCurrentUser()`/`getSession()`. Uses only
 * `getSupabaseServerClient()` (the publishable-key-only server client,
 * `lib/supabase/server.ts`) — never a service-role/secret key.
 *
 * This is foundation only (Step 73 §5's "establish the reusable mechanism
 * only" — no page calls this yet): a future authenticated-only page's
 * Server Component can call `getServerUser()` and `redirect("/login")`
 * when it comes back `null`, checking access before any protected content
 * ever renders (avoiding the flash-of-content a client-only check would
 * have). Every existing public page (`/`, `/games`, `/search`,
 * `/checkout`, product pages, ...) is left untouched — nothing here is
 * wired into any route yet.
 */

/** The current session's user id, or `null` for a guest — safe to call
 * from any Server Component or Route Handler. Never throws: a
 * misconfigured or unreachable Supabase project is treated the same as
 * "no session", matching every other Supabase read in this app's
 * documented graceful-fallback pattern. */
export async function getServerUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = await getSupabaseServerClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/** The current session's full `public.users` profile (Step 73 §6 — the
 * same `auth.users.id === public.users.id` mapping the client-side path
 * already uses, via the shared `mapUserRow`), or `null` for a guest. Falls
 * back to a read-only, non-persisted `User` (never an INSERT — see
 * `mapUserRow.ts`'s own comment) if the profile row genuinely isn't
 * readable yet, the same safety net `supabaseAuthProvider.ts` uses. */
export async function getServerUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = await getSupabaseServerClient();
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) return null;

    const { data, error } = await client.from("users").select("*").eq("id", userData.user.id).maybeSingle();
    if (!error && data) {
      return mapUserRow(data as UserRow);
    }

    return fallbackUser(userData.user.id, userData.user.email ?? "");
  } catch {
    return null;
  }
}
