"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fallbackUser, mapUserRow, type UserRow } from "@/lib/users/mapUserRow";
import type { AuthProvider, OAuthProviderId, Session, SignUpResult } from "@/types/auth";
import type { User } from "@/types/user";

/**
 * The real authentication provider (Step 71) — wraps Supabase Auth's own
 * `signUp` / `signInWithPassword` / `signOut` / `getSession` calls
 * (`@supabase/ssr`'s browser client, the same publishable-key-only client
 * `wishlistSupabaseSource.ts`/`recentlyViewedSupabaseSource.ts` already
 * use — never the secret/service-role key, which this file never even
 * imports). Selected over `guestAuthProvider` by `authProvider.ts`'s
 * `getAuthProvider()` whenever a real project is configured.
 *
 * Never logs a password, access token, or refresh token — the few
 * `console.warn` calls below log only a Supabase error's own `.message`
 * (a short, non-sensitive string like "Invalid login credentials"), the
 * same pattern `wishlistSupabaseSource.ts` already established.
 */

const client_ = () => getSupabaseBrowserClient();

function mapSupabaseSession(session: { user: { id: string }; expires_at?: number; expires_in?: number }): Session {
  const expiresAt = session.expires_at
    ? new Date(session.expires_at * 1000).toISOString()
    : new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const createdAt =
    session.expires_at && session.expires_in
      ? new Date((session.expires_at - session.expires_in) * 1000).toISOString()
      : new Date().toISOString();

  return { userId: session.user.id, createdAt, expiresAt };
}

async function fetchProfile(userId: string, email: string): Promise<User> {
  try {
    const client = client_();
    const { data, error } = await client.from("users").select("*").eq("id", userId).maybeSingle();

    if (!error && data) {
      return mapUserRow(data as UserRow);
    }

    // The trigger that creates this row runs asynchronously right after
    // sign-up — one short retry covers the normal case where this read
    // lands a beat before that commit finishes (see fallbackUser's own
    // comment for what happens if it's still missing after that).
    await new Promise((resolve) => setTimeout(resolve, 400));
    const retry = await client.from("users").select("*").eq("id", userId).maybeSingle();
    if (!retry.error && retry.data) {
      return mapUserRow(retry.data as UserRow);
    }

    return fallbackUser(userId, email);
  } catch {
    return fallbackUser(userId, email);
  }
}

export const supabaseAuthProvider: AuthProvider = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const client = client_();
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) return null;

      return fetchProfile(data.session.user.id, data.session.user.email ?? "");
    } catch {
      return null;
    }
  },

  async getSession(): Promise<Session | null> {
    try {
      const client = client_();
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) return null;
      return mapSupabaseSession(data.session);
    } catch {
      return null;
    }
  },

  async signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
    const client = client_();
    const displayName = email.split("@")[0]?.trim() || email;

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      console.warn("[supabaseAuthProvider] sign-up failed:", error.message);
      throw error;
    }

    // Supabase issues no session yet when the project requires email
    // confirmation (Step 71 §2 — never bypassed): `data.session` is null
    // but `data.user` exists. A duplicate-email sign-up (an account that
    // already exists) also comes back this way in some project
    // configurations — the caller's error mapping treats "no session, no
    // clear error" as "check your email" either way, which is the safe,
    // non-account-enumerating message in both cases.
    if (data.session) {
      return { session: mapSupabaseSession(data.session), needsEmailConfirmation: false };
    }
    return { session: null, needsEmailConfirmation: true };
  },

  async signInWithPassword(email: string, password: string): Promise<Session> {
    const client = client_();
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      console.warn("[supabaseAuthProvider] sign-in failed:", error?.message ?? "no session returned");
      throw error ?? new Error("Sign-in failed — no session was returned.");
    }

    return mapSupabaseSession(data.session);
  },

  async signInWithOAuthProvider(provider: OAuthProviderId): Promise<void> {
    const client = client_();
    // `skipBrowserRedirect: true` lets us hold the resulting authorize URL
    // instead of Supabase-js navigating there itself — necessary because
    // (verified empirically) `signInWithOAuth` only ever *constructs* that
    // URL client-side; it does NOT check whether the provider is actually
    // enabled. That check happens server-side, only once the URL is
    // requested, so navigating there unconditionally would dump an
    // unconfigured provider's raw JSON error
    // (`{"error_code":"validation_failed","msg":"Unsupported provider..."}`)
    // straight into the browser — exactly the unsafe, uncontrolled error
    // surface Step 76 §2/§3 asks this to avoid.
    const redirectTo = `${window.location.origin}/auth/callback?next=/account`;
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error || !data.url) {
      console.warn(`[supabaseAuthProvider] ${provider} sign-in failed:`, error?.message ?? "no redirect URL returned");
      throw error ?? new Error(`${provider} sign-in failed — no redirect URL was returned.`);
    }

    // Pre-flight the authorize URL ourselves with `redirect: "manual"`
    // before ever navigating the browser there. A configured provider
    // makes Supabase respond with a redirect to the real provider consent
    // screen — which `redirect: "manual"` reports back as an opaque
    // redirect (`status: 0`), since cross-origin redirect contents are
    // never inspectable, and that's all we need: "a redirect happened."
    // An unconfigured provider makes Supabase respond directly with its
    // own 400 JSON error instead of redirecting anywhere, which comes
    // back as a normal, readable `cors` response we can catch here.
    let preflightStatus: number;
    try {
      const preflight = await fetch(data.url, { method: "GET", redirect: "manual" });
      preflightStatus = preflight.status;
    } catch (preflightError) {
      console.warn(`[supabaseAuthProvider] ${provider} preflight check failed:`, preflightError);
      throw new Error(`${provider} sign-in could not be verified — network error.`);
    }

    if (preflightStatus !== 0) {
      console.warn(`[supabaseAuthProvider] ${provider} sign-in unavailable — provider not enabled (status ${preflightStatus}).`);
      throw new Error(`${provider} provider is not enabled in this Supabase project.`);
    }

    window.location.href = data.url;
  },

  async sendPhoneOtp(phoneE164: string): Promise<void> {
    const client = client_();
    const { error } = await client.auth.signInWithOtp({ phone: phoneE164 });

    if (error) {
      // Never logs the phone number's own OTP code (there isn't one to
      // log yet at this point — this call only requests that Supabase
      // send it) — only Supabase's own short `.message`, same pattern as
      // every other call in this file.
      console.warn("[supabaseAuthProvider] phone OTP send failed:", error.message);
      throw error;
    }
  },

  async verifyPhoneOtp(phoneE164: string, code: string): Promise<Session> {
    const client = client_();
    const { data, error } = await client.auth.verifyOtp({ phone: phoneE164, token: code, type: "sms" });

    if (error || !data.session) {
      // Logs only Supabase's own error message — never the code the
      // visitor typed, which is the one place an OTP value could
      // plausibly end up in a log if this were written carelessly.
      console.warn("[supabaseAuthProvider] phone OTP verify failed:", error?.message ?? "no session returned");
      throw error ?? new Error("Phone verification failed — no session was returned.");
    }

    return mapSupabaseSession(data.session);
  },

  async verifyEmailOtp(email: string, code: string): Promise<Session> {
    const client = client_();
    // `type: "signup"` is Supabase's own verification-purpose for
    // confirming a brand-new account's email via the 6-digit code its
    // confirmation email carries (the same underlying token a clicked
    // confirmation link would redeem — this just accepts it typed in
    // instead). Never logs `code` — only Supabase's own short error
    // message, same pattern as every other call in this file.
    const { data, error } = await client.auth.verifyOtp({ email, token: code, type: "signup" });

    if (error || !data.session) {
      console.warn("[supabaseAuthProvider] email OTP verify failed:", error?.message ?? "no session returned");
      throw error ?? new Error("Email verification failed — no session was returned.");
    }

    return mapSupabaseSession(data.session);
  },

  async resendEmailOtp(email: string): Promise<void> {
    const client = client_();
    // Wraps Supabase's own resend call — still fully subject to
    // Supabase's own project-level email rate limiting; this never
    // bypasses or replaces that, it only requests a new code the same
    // way the initial sign-up already did.
    const { error } = await client.auth.resend({ type: "signup", email });

    if (error) {
      console.warn("[supabaseAuthProvider] email OTP resend failed:", error.message);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      const client = client_();
      const { error } = await client.auth.signOut();
      if (error) {
        console.warn("[supabaseAuthProvider] sign-out failed:", error.message);
      }
    } catch {
      // Matches guestAuthProvider's own "signing out never throws" contract.
    }
  },
};
