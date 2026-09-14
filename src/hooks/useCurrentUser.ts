"use client";

import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import type { User } from "@/types/user";

/**
 * The signed-in user, if any (Step 71) — a thin convenience wrapper over
 * `CurrentUserProvider`'s shared context for callers that only need the
 * user itself, not the loading/authenticated status or the sign-in/out
 * actions (`useCurrentUserContext()` directly, for those). Reactive: it
 * updates the moment a sign-in/sign-up/sign-out completes anywhere in the
 * app, since it reads the same context every other auth-aware piece of UI
 * does — not a separate fetch of its own.
 */
export function useCurrentUser(): User | null {
  return useCurrentUserContext().user;
}
