import type { User } from "@/types/user";

/**
 * A signed-in session — deliberately minimal: no token, no secret, no
 * credential of any kind lives here (Step 36 §10). A real provider would
 * hold its own session/token internally (e.g. an httpOnly cookie it
 * manages); this shape is only what the rest of the app would need to
 * know about a session, not how the provider secures it.
 */
export interface Session {
  userId: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * What `signUpWithPassword` reports right after a successful call. Session
 * is `null` when Supabase's own project settings require email
 * confirmation before a session is issued (Step 71 §2's "if Supabase email
 * confirmation is enabled, respect the existing Supabase behavior — do NOT
 * bypass email verification") — the caller shows a "check your email"
 * message instead of treating this as a signed-in state.
 */
export interface SignUpResult {
  session: Session | null;
  needsEmailConfirmation: boolean;
}

/** The two OAuth providers DANSHOP offers a button for (Step 76 §2/§3/§6
 * — Facebook removed, never re-added here). Not every provider Supabase
 * Auth itself supports — just the ones this app has a UI for. */
export type OAuthProviderId = "google" | "apple";

/**
 * The interface a real authentication provider implements —
 * `lib/auth/supabaseAuthProvider.ts` (Step 71, extended Step 76) is the
 * first real one; `lib/auth/guestAuthProvider.ts` remains the honest "no
 * one is signed in" implementation used whenever Supabase isn't
 * configured (see `lib/auth/authProvider.ts`'s `getAuthProvider()`, which
 * picks between the two).
 *
 * Every method here is a thin wrapper a real implementation puts around
 * Supabase Auth's own `signUp`/`signInWithPassword`/`signInWithOAuth`/
 * `signInWithOtp`/`verifyOtp` calls — this interface does not invent an
 * authentication protocol of its own; it only names the shape the rest of
 * the app calls into. No field or parameter here is ever a raw password
 * hash, OTP code at rest, OAuth token, or secret — those live entirely
 * inside Supabase Auth's own session handling, never stored in this
 * codebase's types or state.
 *
 * `signInWithOAuthProvider` resolves once the browser has been handed off
 * to the provider's consent screen (it never returns a `Session` itself —
 * the session only exists after the visitor comes back through
 * `/auth/callback`, Step 76 §2/§3/§7) and throws if the provider isn't
 * configured in the Supabase project, so the UI can show an honest
 * "unavailable" state instead of redirecting somewhere broken.
 *
 * `sendPhoneOtp`/`verifyPhoneOtp` (Step 76 §4) mirror the email
 * sign-up/sign-in pair: send throws if Supabase's SMS provider isn't
 * configured (same honest-unavailable-state contract as OAuth); verify
 * returns a real `Session` on success, exactly like `signInWithPassword`.
 * Neither this interface nor any implementation of it ever stores an OTP
 * code anywhere — Supabase Auth validates it server-side and the
 * component holding the user's typed digits discards them the instant
 * verification resolves either way.
 *
 * `verifyEmailOtp`/`resendEmailOtp` (Step 82) are the email-signup
 * counterpart of the phone pair above: after `signUpWithPassword` reports
 * `needsEmailConfirmation`, the UI collects the 6-digit code Supabase
 * emailed the new account and calls `verifyEmailOtp` to exchange it for a
 * real session — the same Supabase `verifyOtp({..., type: "signup"})`
 * call a magic-link confirmation would use underneath, just fed the
 * code the visitor typed instead of a clicked link's token. `resendEmailOtp`
 * wraps Supabase's own `resend({type: "signup", ...})`, so a repeated
 * request is still subject to Supabase's own real rate limiting — this
 * interface never invents its own OTP delivery or storage.
 */
export interface AuthProvider {
  getCurrentUser(): Promise<User | null>;
  getSession(): Promise<Session | null>;
  signUpWithPassword(email: string, password: string): Promise<SignUpResult>;
  signInWithPassword(email: string, password: string): Promise<Session>;
  signInWithOAuthProvider(provider: OAuthProviderId): Promise<void>;
  sendPhoneOtp(phoneE164: string): Promise<void>;
  verifyPhoneOtp(phoneE164: string, code: string): Promise<Session>;
  verifyEmailOtp(email: string, code: string): Promise<Session>;
  resendEmailOtp(email: string): Promise<void>;
  signOut(): Promise<void>;
}
