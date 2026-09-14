"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAuthProvider } from "@/lib/auth/authProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OAuthProviderId, SignUpResult } from "@/types/auth";
import type { User } from "@/types/user";

export type AuthStatus = "loading" | "guest" | "authenticated";

interface CurrentUserContextValue {
  user: User | null;
  status: AuthStatus;
  signUpWithPassword: (email: string, password: string) => Promise<SignUpResult>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithOAuthProvider: (provider: OAuthProviderId) => Promise<void>;
  sendPhoneOtp: (phoneE164: string) => Promise<void>;
  verifyPhoneOtp: (phoneE164: string, code: string) => Promise<void>;
  verifyEmailOtp: (email: string, code: string) => Promise<void>;
  resendEmailOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

/**
 * The one, site-wide "who is signed in" state (Step 71) — mounted once in
 * `app/layout.tsx` (matching every other cross-cutting provider:
 * `CartProvider`, `WishlistProvider`, ...), above `WishlistProvider` in
 * the tree so wishlist/recently-viewed can react to a login/logout the
 * instant it happens rather than only on the next full page load.
 *
 * `getAuthProvider()` (`lib/auth/authProvider.ts`) picks Supabase's real
 * provider when configured, `guestAuthProvider` otherwise — this
 * component doesn't know or care which one is active; it just calls the
 * same three methods either way.
 *
 * Subscribes to Supabase's own `onAuthStateChange` (only when a project
 * is configured — `guestAuthProvider` never changes) so every consumer —
 * the header's account icon, the Account page, `WishlistProvider`,
 * `useOrders`, `useRecentlyViewed` — updates together the moment a
 * sign-in, sign-up, or sign-out completes, in this tab or another one
 * sharing the same session storage. No custom session storage is built
 * here (Step 71 §9) — this only ever *reads* Supabase's own session via
 * `getSession()`/`onAuthStateChange`.
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const provider = getAuthProvider();
        const current = await provider.getCurrentUser();
        if (cancelled) return;
        setUser(current);
        setStatus(current ? "authenticated" : "guest");
      } catch {
        if (cancelled) return;
        setUser(null);
        setStatus("guest");
      }
    }

    void refresh();

    if (!isSupabaseConfigured()) {
      return () => {
        cancelled = true;
      };
    }

    const client = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
    const provider = getAuthProvider();
    return provider.signUpWithPassword(email, password);
  }

  async function signInWithPassword(email: string, password: string): Promise<void> {
    const provider = getAuthProvider();
    await provider.signInWithPassword(email, password);
    // onAuthStateChange (above) also fires and refreshes `user`/`status`
    // on its own — this direct call just avoids a visible flash of stale
    // state between the sign-in resolving and that event arriving.
    const current = await provider.getCurrentUser();
    setUser(current);
    setStatus(current ? "authenticated" : "guest");
  }

  async function signInWithOAuthProvider(provider: OAuthProviderId): Promise<void> {
    // No state to refresh here — a successful call navigates the browser
    // away entirely (see supabaseAuthProvider.ts); the session only
    // exists once the visitor comes back through `/auth/callback`, at
    // which point this provider's own `onAuthStateChange` subscription
    // (above) picks it up automatically on the next page load.
    await getAuthProvider().signInWithOAuthProvider(provider);
  }

  async function sendPhoneOtp(phoneE164: string): Promise<void> {
    await getAuthProvider().sendPhoneOtp(phoneE164);
  }

  async function verifyPhoneOtp(phoneE164: string, code: string): Promise<void> {
    const provider = getAuthProvider();
    await provider.verifyPhoneOtp(phoneE164, code);
    // Same "avoid a flash of stale state" reasoning as signInWithPassword.
    const current = await provider.getCurrentUser();
    setUser(current);
    setStatus(current ? "authenticated" : "guest");
  }

  async function verifyEmailOtp(email: string, code: string): Promise<void> {
    const provider = getAuthProvider();
    await provider.verifyEmailOtp(email, code);
    // Same "avoid a flash of stale state" reasoning as signInWithPassword.
    const current = await provider.getCurrentUser();
    setUser(current);
    setStatus(current ? "authenticated" : "guest");
  }

  async function resendEmailOtp(email: string): Promise<void> {
    await getAuthProvider().resendEmailOtp(email);
  }

  async function signOut(): Promise<void> {
    const provider = getAuthProvider();
    await provider.signOut();
    setUser(null);
    setStatus("guest");
  }

  return (
    <CurrentUserContext.Provider
      value={{
        user,
        status,
        signUpWithPassword,
        signInWithPassword,
        signInWithOAuthProvider,
        sendPhoneOtp,
        verifyPhoneOtp,
        verifyEmailOtp,
        resendEmailOtp,
        signOut,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUserContext(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUserContext must be used within a CurrentUserProvider");
  }
  return context;
}
