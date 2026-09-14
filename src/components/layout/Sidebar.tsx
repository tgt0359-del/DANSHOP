"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Grid3X3,
  Heart,
  Home as HomeIcon,
  Receipt,
  ShoppingCart,
  Sparkles,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";
import { SettingsButton } from "@/components/layout/SettingsButton";
import { getMarketplaceCategoriesByGroup, type MarketplaceCategoryGroup } from "@/data/marketplaceCategories";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";
import { isNavLinkActive } from "@/lib/navigation/isNavLinkActive";

type SidebarLink = { key: string; label: string; href: string; icon: LucideIcon };

const GROUP_ORDER: MarketplaceCategoryGroup[] = ["shop", "topup", "digital"];
const GROUP_HEADING_KEY: Record<MarketplaceCategoryGroup, string> = {
  shop: "sidebar.groupShop",
  topup: "sidebar.groupTopUp",
  digital: "sidebar.groupDigital",
};

/** One sidebar nav row — extracted since Step 57 now renders these from
 * three different sources (top links, grouped marketplace categories,
 * bottom links) that would otherwise repeat this exact markup 3 times. */
function SidebarNavLink({ link, active, onClose }: { link: SidebarLink; active: boolean; onClose: () => void }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onClose}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        active
          ? "border-foreground bg-surface font-semibold text-foreground"
          : "border-transparent font-medium text-secondary hover:bg-surface hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{link.label}</span>
    </Link>
  );
}

/**
 * Site-wide navigation drawer — hidden by default, opened by the header's
 * toggle button, at every breakpoint. This is the site's one navigation
 * drawer: it replaces the old mobile-only drawer rather than running
 * alongside it, so there's never a second, competing menu system. Modeled
 * directly on that same proven pattern (backdrop + sliding panel, Escape to
 * close, body scroll lock) — just sliding in from the left with this
 * sidebar's own link set instead.
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  // Step 57 §4: Home stays first, on its own — everything else below is
  // either a real marketplace category (grouped SHOP/TOP UP/DIGITAL,
  // sourced from the same centralized registry the Header nav and
  // homepage discovery section use — §19, no separate hardcoded list) or
  // one of the pre-existing extras (Order History, Deals, New Releases,
  // the genre "Categories" anchor) that aren't product-type categories
  // and so aren't part of that registry.
  const topLinks: SidebarLink[] = [{ key: "home", label: t("sidebar.home"), href: "/", icon: HomeIcon }];

  const bottomLinks: SidebarLink[] = [
    { key: "orders", label: t("sidebar.orderHistory"), href: "/orders", icon: Receipt },
    { key: "deals", label: t("nav.deals"), href: "/#deals", icon: Tag },
    { key: "newReleases", label: t("home.newReleases.title"), href: "/#new-releases", icon: Sparkles },
    { key: "categories", label: t("home.categories.title"), href: "/#categories", icon: Grid3X3 },
  ];

  // Step 61: Digital Wallets moved into the `marketplaceCategories`
  // registry itself (now that `productType` there is optional — see that
  // file's own comment), so it renders through the grouped-categories loop
  // below like every other category — no more special-cased bottomLink.
  //
  // Step 82 Part B: the matching rules themselves moved to
  // `lib/navigation/isNavLinkActive.ts` so the header's horizontal nav can
  // share the exact same logic instead of a second, drifting copy — see
  // that file for the full reasoning behind each route's rule.
  function isActive(href: string) {
    return isNavLinkActive(pathname, href);
  }

  // Close on Escape, and lock page scroll while the drawer is open — same
  // behavior the old mobile drawer had.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            key="sidebar-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("sidebar.navLabel")}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <Logo onClick={onClose} />
              <IconButton icon={<X className="h-5 w-5" />} aria-label={t("actions.close")} onClick={onClose} />
            </div>

            <nav className="flex flex-col gap-1 p-2">
              {topLinks.map((link) => (
                <SidebarNavLink key={link.key} link={link} active={isActive(link.href)} onClose={onClose} />
              ))}

              {GROUP_ORDER.map((group) => {
                const categories = getMarketplaceCategoriesByGroup(group);
                if (categories.length === 0) return null;
                return (
                  <div key={group} className="mt-2">
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-secondary">
                      {t(GROUP_HEADING_KEY[group])}
                    </p>
                    {categories.map((category) => (
                      <SidebarNavLink
                        key={category.id}
                        link={{ key: category.id, label: t(category.nameKey), href: category.route, icon: category.icon }}
                        active={isActive(category.route)}
                        onClose={onClose}
                      />
                    ))}
                  </div>
                );
              })}

              <div className="mt-2 border-t border-border pt-2">
                {bottomLinks.map((link) => (
                  <SidebarNavLink key={link.key} link={link} active={isActive(link.href)} onClose={onClose} />
                ))}
              </div>
            </nav>

            <div className="mt-auto flex flex-col gap-1 border-t border-border p-2">
              {/* Presentational, matching the header's own Wishlist/Cart icon buttons —
                  neither has a real backing page or shared state today. */}
              <button
                type="button"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <Heart className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{t("actions.wishlist")}</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{t("actions.cart")}</span>
              </button>

              <div className="mt-1 border-t border-border pt-2">
                <SettingsButton className="w-full justify-between" />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
