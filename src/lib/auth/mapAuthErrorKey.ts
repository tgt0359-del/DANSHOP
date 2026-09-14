/**
 * Maps a thrown sign-in/sign-up error to one of `auth.error*`'s localized
 * message keys (Step 71 §18, extracted for reuse by `/login`/`/register`
 * in Step 72 — same rule everywhere, not a second copy) — never surfaces a
 * raw Supabase error message, stack trace, or any credential to the
 * visitor. Only inspects `error.message` (a short, non-sensitive string
 * like "Invalid login credentials" or "Password should be at least 6
 * characters" — Supabase's own `AuthError.message`), never anything from a
 * token/session/password.
 */
export function mapAuthErrorKey(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("not configured")) return "auth.errorUnavailable";
  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "auth.errorInvalidCredentials";
  }
  // A real, expected outcome when the project requires email confirmation
  // (Step 71 §2 / Step 73 — never bypassed): the account exists, but
  // hasn't verified its email yet. Distinct from "wrong password" so the
  // visitor knows exactly what to do next, instead of a generic message.
  if (message.includes("email") && message.includes("not confirmed")) return "auth.errorEmailNotConfirmed";
  if (message.includes("already registered") || message.includes("already exists")) {
    return "auth.errorEmailInUse";
  }
  // Step 82: an account that tries to verify/resend a code after it's
  // already been confirmed — Supabase reports this distinctly from a
  // wrong/expired code, so it gets its own message pointing the visitor
  // to sign in instead of retrying a code that will never arrive.
  if (message.includes("already confirmed") || message.includes("already verified")) {
    return "auth.otpErrorAlreadyVerified";
  }
  // Step 82: `verifyOtp`'s own error for a wrong OR expired 6-digit code —
  // Supabase reports both the same way ("Token has expired or is
  // invalid"), so this app does too rather than guessing which one it was.
  if (message.includes("token") && (message.includes("expired") || message.includes("invalid"))) {
    return "auth.otpErrorInvalid";
  }
  if (message.includes("rate limit") || (message.includes("security purposes") && message.includes("second"))) {
    return "auth.errorRateLimited";
  }
  // Supabase's own project-level email validation (e.g. rejecting a
  // disposable/placeholder-looking domain) reports this as "Email address
  // ... is invalid" — reuses the same message as the client-side format
  // check just above the field, since it means the same thing to a
  // visitor either way.
  if (message.includes("email") && message.includes("invalid")) return "auth.emailInvalid";
  if (message.includes("password")) return "auth.errorWeakPassword";
  if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) {
    return "auth.errorNetwork";
  }
  return "auth.errorGeneric";
}
