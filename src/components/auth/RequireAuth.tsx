"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";

/**
 * The reusable foundation for protecting a future authenticated-only
 * Client Component page (Step 73 §5 — "establish the reusable mechanism
 * only"). Not used by any route yet: every existing page (`/`, `/games`,
 * `/search`, `/checkout`, product pages, `/account` — which already
 * handles guest vs. authenticated itself rather than redirecting, ...)
 * stays exactly as it is. A future page opts in with:
 *
 *   export default function SomeProtectedPage() {
 *     return <RequireAuth><SomeProtectedView /></RequireAuth>;
 *   }
 *
 * Reads the same shared `CurrentUserProvider` context every other
 * auth-aware piece of UI already uses — no second/duplicated auth check.
 * While `status` is `"loading"` (still resolving) or `"guest"` (redirect
 * in flight), renders nothing rather than a flash of the protected
 * content — the redirect itself happens in an effect, matching this
 * app's existing `LoginView`/`RegisterView` "already signed in → redirect
 * away" pattern (Step 72), just the mirror image of it.
 *
 * A companion server-side check (`lib/auth/serverAuth.ts`'s
 * `getServerUser()`) exists for a future Server Component page that wants
 * to redirect before any protected content is ever sent to the browser at
 * all — the stronger of the two, preferred when a route can be a Server
 * Component. This one covers the Client Component case.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useCurrentUserContext();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") return null;

  return <>{children}</>;
}
