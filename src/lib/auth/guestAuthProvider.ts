import type { AuthProvider, Session, SignUpResult } from "@/types/auth";

/**
 * The provider used whenever Supabase isn't configured (see
 * `lib/auth/authProvider.ts`'s `getAuthProvider()`) — reports "no one is
 * signed in" for every query, which is exactly correct when there is no
 * real project to authenticate against, not a stub standing in for a
 * broken feature. Before Step 71 this was the ONLY provider that existed;
 * now `lib/auth/supabaseAuthProvider.ts` is the real one, and this is its
 * honest fallback.
 *
 * Implements the same `AuthProvider` interface (types/auth.ts), so the
 * rest of the app — cart, wishlist, recently viewed, checkout — never has
 * to change to support either provider (see lib/users/README.md).
 */
export const guestAuthProvider: AuthProvider = {
  async getCurrentUser() {
    return null;
  },

  async getSession(): Promise<Session | null> {
    return null;
  },

  async signUpWithPassword(): Promise<SignUpResult> {
    throw new Error(
      "guestAuthProvider.signUpWithPassword is not implemented — no Supabase project is configured in this environment (see .env.example)."
    );
  },

  async signInWithPassword(): Promise<Session> {
    throw new Error(
      "guestAuthProvider.signInWithPassword is not implemented — no Supabase project is configured in this environment (see .env.example)."
    );
  },

  async signInWithOAuthProvider(): Promise<void> {
    throw new Error(
      "guestAuthProvider.signInWithOAuthProvider is not implemented — no Supabase project is configured in this environment (see .env.example)."
    );
  },

  async sendPhoneOtp(): Promise<void> {
    throw new Error(
      "guestAuthProvider.sendPhoneOtp is not implemented — no Supabase project is configured in this environment (see .env.example)."
    );
  },

  async verifyPhoneOtp(): Promise<Session> {
    throw new Error(
      "guestAuthProvider.verifyPhoneOtp is not implemented — no Supabase project is configured in this environment (see .env.example)."
    );
  },

  async verifyEmailOtp(): Promise<Session> {
    throw new Error(
      "guestAuthProvider.verifyEmailOtp is not implemented — no Supabase project is configured in this environment (see .env.example)."
    );
  },

  async resendEmailOtp(): Promise<void> {
    throw new Error(
      "guestAuthProvider.resendEmailOtp is not implemented — no Supabase project is configured in this environment (see .env.example)."
    );
  },

  async signOut(): Promise<void> {
    // Nothing to sign out of — every visitor is already a guest.
  },
};
