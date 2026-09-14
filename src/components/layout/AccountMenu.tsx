"use client";

import Link from "next/link";
import { LogIn, LogOut, Package, Settings, User, Heart, History } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthModal } from "@/lib/auth/AuthModalProvider";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { cn } from "@/lib/cn";

interface AccountMenuLink {
  key: string;
  label: string;
  href: string;
  icon: typeof User;
}

/**
 * The header's account dropdown (Step 63 §1/§10) — anchored under the
 * Navbar's account icon, `open` and closing are entirely owned by the
 * caller (`Navbar`'s `accountMenuOpen` state + its blur/Escape handlers),
 * matching `SearchSuggestions`'s own "dumb, controlled" shape rather than
 * managing its own visibility.
 *
 * Deliberately a plain list of real links (not a `role="menu"`/`menuitem"`
 * widget) — the WAI-ARIA menu pattern is for application-style action
 * menus with its own roving-tabindex/arrow-key contract, not a list of
 * page navigation links a user should be able to just Tab through like any
 * other link list. `Sidebar` (this app's other nav drawer) already uses
 * this same plain-`<nav>`-of-`<Link>`s shape for the same reason.
 *
 * Step 71 §17: the bottom action and heading now correctly reflect
 * whichever of the two real states this visitor is in — Guest (a "Sign
 * In" button that opens the shared `AuthModal`, same as before this step
 * just linked nowhere real) or Authenticated Customer (the account's
 * email and a real "Log Out" action). Every link above stays real page
 * navigation either way — nothing here fabricates a signed-in destination
 * that doesn't exist.
 */
export function AccountMenu({ open, onClose, id }: { open: boolean; onClose: () => void; id: string }) {
  const { t } = useLanguage();
  const { user, signOut } = useCurrentUserContext();
  const { openAuthModal } = useAuthModal();

  if (!open) return null;

  const links: AccountMenuLink[] = [
    { key: "account", label: t("actions.account"), href: "/account", icon: User },
    { key: "orders", label: t("account.myOrders"), href: "/orders", icon: Package },
    { key: "wishlist", label: t("actions.wishlist"), href: "/account#wishlist", icon: Heart },
    { key: "recentlyViewed", label: t("games.recentlyViewed"), href: "/account#recently-viewed", icon: History },
    { key: "settings", label: t("settings.title"), href: "/account#settings", icon: Settings },
  ];

  async function handleLogout() {
    onClose();
    await signOut();
  }

  return (
    <div
      id={id}
      className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-xl"
    >
      <p className="truncate border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary">
        {user ? user.email : t("account.menuHeading")}
      </p>

      <nav aria-label={t("actions.account")} className="flex flex-col p-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.key}
              href={link.href}
              prefetch={false}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary transition-colors",
                "hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>{t("actions.logout")}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              openAuthModal("signIn");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{t("actions.signIn")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
