import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * The OAuth code-exchange callback (Step 76 §2/§3/§7) — where Supabase
 * sends a visitor back after Google/Apple's own consent screen. The
 * browser client's PKCE flow (the default for `@supabase/ssr`) needs this
 * server-side step to trade the returned `code` for a real session: the
 * PKCE code verifier lives in a cookie only server-side code can read
 * back out safely, so this can't be done from the client alone. Uses
 * `getSupabaseServerClient()` (the publishable-key-only server client,
 * Step 73's real cookie-writing `setAll` — this Route Handler is exactly
 * the context that fix was for) — never a service-role/secret key.
 *
 * Not reachable in normal use today: neither provider is actually
 * configured in this project yet (Step 76 §2/§3's "foundation only"), so
 * nothing currently redirects here except a manual visit. It exists so
 * the moment a provider IS configured in the Supabase dashboard, sign-in
 * completes correctly with no further code changes — the same
 * "foundation ready, not wired to anything live" shape Step 73's
 * `RequireAuth`/`getServerUser()` already established.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code && isSupabaseConfigured()) {
    try {
      const client = await getSupabaseServerClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      // Never forwards the raw error to a URL param — that would put
      // provider/session details somewhere visible in browser history.
      console.warn("[auth/callback] code exchange failed:", error.message);
    } catch {
      console.warn("[auth/callback] code exchange threw.");
    }
  }

  return NextResponse.redirect(`${origin}/login?auth_error=1`);
}
