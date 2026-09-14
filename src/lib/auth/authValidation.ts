/**
 * Shared client-side auth-form validation constants (Step 72) — extracted
 * from the original modal (Step 71) so `/login`, `/register`, and anything
 * else that needs them read the exact same rule, never a second copy.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Matches Supabase's own project default (6 characters) — see
 * `supabaseAuthProvider.ts`'s file comment. Checking this client-side is
 * just an early, friendlier version of the same rule Supabase itself will
 * enforce on submit; it isn't a separate password policy. */
export const MIN_PASSWORD_LENGTH = 6;
