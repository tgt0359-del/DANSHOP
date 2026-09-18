"use client";

import { Logo } from "@/components/ui/Logo";
import { SettingsButton } from "@/components/layout/SettingsButton";

/**
 * LOGIN-UI-02/BRAND-UNIFY-01 — the minimal top bar `/login` and
 * `/register` both show instead of the normal site header (`AppShell.tsx`
 * skips rendering `Navbar`/`Sidebar` on these two routes — see that
 * file's own comment). Left: the DANSHOP wordmark,
 * itself already a real `<Link href="/">` — clicking it is the page's
 * "back to home" affordance in the top bar, so no separate arrow icon is
 * layered on top of it here (the explicit, labeled "← Back to Home" text
 * link the brief also asks for lives in `AuthFormPanel`, above the card,
 * not duplicated here). Right: the exact same `SettingsButton` every other
 * page's header/sidebar/footer already uses to open the real Language &
 * Currency modal — same behavior, just `tone="inverse"` for this dark bar.
 *
 * Deliberately contains nothing else: no search, no nav links, no
 * wishlist/cart/account icons, no hamburger menu — this is the full
 * "must only show top-left brand + top-right selector" surface the brief
 * asks for.
 */
export function AuthTopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#080B10] px-4 sm:px-6 lg:px-10">
      <Logo tone="inverse" />
      <SettingsButton tone="inverse" />
    </header>
  );
}
