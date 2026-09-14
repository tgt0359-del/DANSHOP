/**
 * Shared "is this nav link the current page" logic (Step 82 Part B) —
 * extracted from `Sidebar.tsx`'s own pre-existing `isActive` (Step 57/61)
 * so the header's horizontal nav (previously had no active-state logic at
 * all) uses the exact same rules instead of a second, potentially-drifting
 * copy. Every branch below is unchanged from the Sidebar's original.
 *
 * - `/` (Home) only matches the exact home route — a nested page should
 *   never make Home look active.
 * - `/games` also matches a nested games route (`/games/<slug>`,
 *   `/games/category/<category>`) so a game detail or games-category page
 *   keeps "Games" highlighted — EXCEPT the three routes that have their
 *   own separate nav entry (`/games/pc`, `/games/mobile`,
 *   `/games/console`), which must never also light up "Games".
 * - `/orders` matches its own detail route (`/orders/<reference>`).
 * - `/top-up` matches its own per-product flow route (`/top-up/<slug>`,
 *   Step 58) — the one marketplace category with a sub-route of its own.
 * - An anchor link (`/#section`) is a same-page scroll target, not a
 *   distinct route — there's no reliable pathname to match, so it's never
 *   marked active.
 * - Everything else (Steam Wallet, Gift Cards, DLC, Software, ...) is an
 *   exact match only: their products live under the shared
 *   `/product/<slug>` template, which belongs to no single category, so
 *   visiting one deliberately does NOT light up any specific nav item —
 *   avoids marking an unrelated menu item active.
 */
export function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/games") {
    return (
      pathname === "/games" ||
      (pathname.startsWith("/games/") &&
        !pathname.startsWith("/games/pc") &&
        !pathname.startsWith("/games/mobile") &&
        !pathname.startsWith("/games/console"))
    );
  }
  if (href === "/orders") return pathname === "/orders" || pathname.startsWith("/orders/");
  if (href === "/top-up") return pathname === "/top-up" || pathname.startsWith("/top-up/");
  if (href.startsWith("/#")) return false;
  return pathname === href;
}
