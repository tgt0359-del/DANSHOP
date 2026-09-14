"use client";

import { useEffect, useState, type ElementType, type ReactNode } from "react";
import Link from "next/link";
import {
  Heart,
  History,
  LogIn,
  LogOut,
  Package,
  PackageOpen,
  Settings as SettingsIcon,
  User,
} from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GameCard } from "@/components/ui/GameCard";
import { Reveal } from "@/components/ui/Reveal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SettingsButton } from "@/components/layout/SettingsButton";
import { useLanguage } from "@/hooks/useLanguage";
import { useOrders } from "@/hooks/useOrders";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useWishlistEntries } from "@/hooks/useWishlistEntries";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { cn } from "@/lib/cn";
import { localeMeta } from "@/lib/i18n/config";
import { CURRENCIES } from "@/types/currency";

const CARD_GRID = "mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4";

/** UI-15 §3: the quick-nav's own section ids — a plain constant (not
 * derived from the translated `quickNav` array below, which is rebuilt
 * every render) so the active-section effect has one stable id list to
 * observe, regardless of the current locale. */
const SECTION_IDS = ["overview", "orders", "wishlist", "recently-viewed", "settings"] as const;

/** One dashboard tile — same bordered-white-card language `OrderCard` and
 * `SettingsModal` already use, just reused as a section container here
 * instead of a list item or a dialog. `scroll-mt-24` keeps a hash-anchor
 * jump (from the header's Account menu, or this page's own quick-nav
 * pills) from landing a section flush against the sticky header.
 *
 * UI-14 §1: `size`/`subtitle` are opt-in-only (the same seam this codebase
 * uses everywhere a visual change must stay scoped to one consumer — see
 * `GameCard`'s own `unified`/`size` props) — every existing section
 * (Overview/Orders/Settings) omits them and renders pixel-identical to
 * before. Only the Wishlist section below passes `size="lg"`, since the
 * header's own Wishlist icon deep-links straight to `/account#wishlist`
 * (Sidebar does too) — for a visitor arriving there, this section IS "the
 * Wishlist page" in practice, so it gets a real page-level heading (the
 * same scale Gift Cards' own `<h1>` uses, not Games' larger one — "do not
 * make the header oversized") plus a short muted subtitle, instead of the
 * small dashboard-tile label every other section still uses. */
function AccountSection({
  id,
  title,
  subtitle,
  size = "default",
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  size?: "default" | "lg";
  children: ReactNode;
}) {
  const isLg = size === "lg";
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 rounded-2xl border border-border bg-white p-5 sm:p-6"
    >
      <h2
        id={`${id}-heading`}
        className={cn(
          "font-semibold text-foreground",
          isLg ? "text-2xl leading-snug sm:text-3xl" : "text-lg"
        )}
      >
        {title}
      </h2>
      {subtitle && <p className="mt-1.5 max-w-md text-sm text-secondary">{subtitle}</p>}
      {children}
    </section>
  );
}

/** The empty state for the Wishlist/Recently Viewed sections — same shape
 * as Order History's own empty state (icon in a circle, title, body, one
 * CTA), just without that state's own border/background since it already
 * sits inside an `AccountSection` card.
 *
 * UI-14 §4: `secondaryCtaHref`/`secondaryCtaLabel` are opt-in — only the
 * Wishlist section's empty state passes them (a "Gift Cards" link, reusing
 * the existing `nav.giftCards` translation exactly as-is rather than
 * inventing a new "Browse Gift Cards" string) — Recently Viewed's own
 * empty-state call omits them and renders exactly as before, one CTA only. */
function EmptyState({
  icon: Icon,
  title,
  body,
  ctaHref,
  ctaLabel,
  secondaryCtaHref,
  secondaryCtaLabel,
}: {
  icon: ElementType;
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
}) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-foreground">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-secondary">{body}</p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <Link href={ctaHref} prefetch={false} className={buttonClasses("secondary", "sm")}>
          {ctaLabel}
        </Link>
        {secondaryCtaHref && secondaryCtaLabel && (
          <Link href={secondaryCtaHref} prefetch={false} className={buttonClasses("ghost", "sm")}>
            {secondaryCtaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * The DANSHOP Account dashboard (Step 63, connected to real authentication
 * in Step 71) — a minimal, single-page marketplace account experience
 * built entirely on data/state this app already has: `useOrders` (Order
 * History), `useWishlistEntries` (`WishlistProvider`), `useRecentlyViewed`,
 * and the same Language/Currency settings modal every other trigger in the
 * app already opens (`SettingsButton`). No new storage, no new
 * wishlist/orders/recently-viewed system — this page only arranges
 * existing pieces into one place, and (as of Step 71) branches its
 * overview section on the real, shared `CurrentUserProvider` state instead
 * of always showing the guest block.
 *
 * The "Orders"/"Wishlist"/"Recently Viewed" sections below don't need
 * their own guest/authenticated branch: `useOrders`/`useWishlistEntries`/
 * `useRecentlyViewed` already source from Supabase vs. local guest storage
 * automatically based on the same current user (see those hooks' own Step
 * 71 comments) — this page just renders whatever they return, exactly as
 * it did before this step.
 */
export function AccountView() {
  const { t } = useLanguage();
  const { user, status: authStatus, signOut } = useCurrentUserContext();
  const { status: ordersStatus, orders } = useOrders();
  const wishlistEntries = useWishlistEntries();
  const recentlyViewedEntries = useRecentlyViewed();

  const quickNav: { id: string; label: string }[] = [
    { id: "overview", label: t("account.overviewTitle") },
    { id: "orders", label: t("account.myOrders") },
    { id: "wishlist", label: t("actions.wishlist") },
    { id: "recently-viewed", label: t("games.recentlyViewed") },
    { id: "settings", label: t("settings.title") },
  ];

  // UI-15 §3/§12: which section is currently in view, so the matching
  // quick-nav pill can show a real active state (darker text, stronger
  // weight, a restrained tint) and `aria-current` — neither existed
  // before this step; every pill rendered identically regardless of
  // scroll position. An IntersectionObserver (not a scroll listener) is
  // the standard, cheap way to track this — among the sections currently
  // intersecting the "active band" (just below the sticky header, above
  // the bottom ~55% of the viewport), the one nearest the top wins,
  // matching how a reader's eye actually lands on a section right after
  // it scrolls into place.
  const [activeSection, setActiveSection] = useState<string>(SECTION_IDS[0]);

  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((closest, entry) =>
          entry.boundingClientRect.top < closest.boundingClientRect.top ? entry : closest
        );
        setActiveSection(topMost.target.id);
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <Container>
        {/* UI-16 §1: 1152px (Tailwind's max-w-6xl) — inside the 1100–1200px
            target range, up from the previous 1024px (max-w-5xl), which
            read as noticeably narrower than this same content needs on a
            wide desktop screen. */}
        <div className="mx-auto max-w-6xl">
          {/* UI-15 §2 / UI-16 §2: a short muted subtitle under the page
              heading — matching the same "title + one-line description"
              header pattern the Games/Gift Cards pages and (UI-14) this
              page's own Wishlist section already use. Kept close together
              (`mt-1`, tightened from `mt-1.5`) per UI-16's own "keep the
              title/subtitle close together". */}
          <h1 className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">{t("actions.account")}</h1>
          <p className="mt-1 max-w-md text-sm text-secondary">{t("account.pageDescription")}</p>

          {/* Same-page hash jumps (Step 57 already uses this exact pattern
              for "/#deals"/"/#new-releases" — a plain <a>, not next/link,
              since there's no route change, just a scroll).
              UI-16 §3: an underline-tab treatment (a bottom border row,
              each tab's own 2px indicator) replaces UI-15's rounded-full
              chip style — "avoid oversized pill buttons" — while keeping
              the exact same routes/anchors/`activeSection` tracking and
              `aria-current="location"` from that step untouched. Still
              `flex flex-wrap` (the pre-existing wrapping behavior, not a
              new horizontal-scroll container UI-16 §3 says only to add if
              the architecture already had one) — already keeps this
              unusable-tabs-on-mobile risk at zero, verified at every
              required width below. */}
          {/* No shared bottom-border line under the whole row (kept to
              each tab's own indicator only) — at narrow widths this list
              wraps onto a second line (the pre-existing behavior), and a
              single full-width line only under the first row read as a
              stray divider slicing the wrapped tabs in two rather than
              "grounding" a tab bar. */}
          <nav aria-label={t("actions.account")} className="mt-5 flex flex-wrap gap-x-5 gap-y-1">
            {quickNav.map((item) => {
              const isActive = item.id === activeSection;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "-mb-px border-b-2 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                    isActive
                      ? "border-foreground font-semibold text-foreground"
                      : "border-transparent font-medium text-secondary hover:text-foreground"
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <Reveal className="mt-6 flex flex-col gap-6">
            {/* Account overview — Step 71: a real guest/authenticated
                branch instead of always showing the guest block. `loading`
                (CurrentUserProvider hasn't resolved a session yet, e.g. on
                first paint) reuses the guest layout's shape so nothing
                shifts once the real state arrives a moment later. */}
            {/* UI-16 §7/§8: same p-5/sm:p-6 padding every other
                `AccountSection` card already uses (was p-6/sm:p-8, a small
                but real inconsistency against "consistent internal
                padding" — this was the one card not built through that
                shared wrapper). */}
            <section
              id="overview"
              aria-labelledby="overview-heading"
              className="scroll-mt-24 rounded-2xl border border-border bg-white p-5 sm:p-6"
            >
              {authStatus === "authenticated" && user ? (
                <>
                  {/* Step 72 §5: the deterministic default avatar (the
                      user's own initials on DANSHOP black) — swaps
                      automatically for a real image once `avatarUrl` is
                      ever populated by a future upload feature; nothing
                      here needs to change for that. */}
                  <UserAvatar user={user} size="lg" />
                  <h2 id="overview-heading" className="mt-4 text-xl font-semibold text-foreground">
                    {user.displayName}
                  </h2>

                  <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-secondary">{t("account.emailLabel")}</dt>
                      <dd className="font-medium text-foreground">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-secondary">{t("account.displayNameLabel")}</dt>
                      <dd className="font-medium text-foreground">{user.displayName}</dd>
                    </div>
                    <div>
                      <dt className="text-secondary">{t("account.preferredLanguageLabel")}</dt>
                      <dd className="font-medium text-foreground">
                        {localeMeta[user.preferredLanguage].flag} {localeMeta[user.preferredLanguage].label}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-secondary">{t("account.preferredCurrencyLabel")}</dt>
                      <dd className="font-medium text-foreground">
                        {CURRENCIES[user.preferredCurrency].symbol} {CURRENCIES[user.preferredCurrency].code}
                      </dd>
                    </div>
                    {/* UI-15 §4: a compact order/wishlist summary right in
                        the Overview card — real counts only, from the exact
                        same `orders`/`wishlistEntries` this page already
                        fetches for its own Orders/Wishlist sections below
                        (no new data source, no invented numbers). Skipped
                        while `orders` is still loading so it never
                        flashes "0 orders placed" before the real count
                        arrives. */}
                    {ordersStatus !== "loading" && (
                      <div>
                        <dt className="text-secondary">{t("account.myOrders")}</dt>
                        <dd className="font-medium text-foreground">
                          {t("account.ordersCount").replace("{count}", String(orders.length))}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-secondary">{t("actions.wishlist")}</dt>
                      <dd className="font-medium text-foreground">
                        {t("account.wishlistCount").replace("{count}", String(wishlistEntries.length))}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5">
                    <Button type="button" variant="secondary" onClick={() => void signOut()}>
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      {t("actions.logout")}
                    </Button>
                  </div>
                </>
              ) : (
                /* UI-16 §4: the guest card was full-width content
                   left-aligned in a wide card, which on a spacious desktop
                   screen left a lot of empty space to the right of a
                   fairly short message — "too wide relative to the amount
                   of content". Centered, narrower (`max-w-sm`) content
                   fixes that without shrinking the card itself, and
                   visually groups icon → heading → description → actions
                   the same way `EmptyState` already does elsewhere on this
                   page — one consistent "empty/guest state" rhythm instead
                   of two different ones. Every string/route/button variant
                   is unchanged; only the layout wrapping them changed. No
                   "Forgot password?" link was added here — that control
                   only makes sense attached to the login form itself
                   (`LoginView.tsx`, where it already exists), not a bare
                   navigation card with no form to forget the password
                   *from*; adding it here would mean either a dead link or
                   new logic, both out of this step's scope. */
                <div className="mx-auto flex max-w-sm flex-col items-center py-2 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-foreground">
                    <User className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h2 id="overview-heading" className="mt-4 text-xl font-semibold text-foreground">
                    {t("account.guestHeading")}
                  </h2>
                  <p className="mt-1.5 text-sm text-secondary">{t("account.guestDescription")}</p>

                  {/* Step 72 §1/§4: the primary guest entry points now go
                      straight to the dedicated premium pages instead of
                      opening a form inside a modal — the header's account
                      dropdown still opens the (now slimmed-down) modal, a
                      shorter path that's appropriate for that smaller
                      surface, but this full page can link directly. */}
                  <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Link href="/login" prefetch={false} className={buttonClasses("primary", "md")}>
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      {t("actions.signIn")}
                    </Link>
                    <Link href="/register" prefetch={false} className={buttonClasses("secondary", "md")}>
                      {t("auth.signUpSubmit")}
                    </Link>
                  </div>
                  <Link
                    href="/games"
                    prefetch={false}
                    className="mt-3 inline-block text-sm font-medium text-secondary underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    {t("cart.continueShopping")}
                  </Link>
                </div>
              )}
            </section>

            {/* Orders — navigates to the real Order History page (§4)
                rather than re-rendering order data here.
                UI-15 §6: an explicit empty state (icon/title/body/CTA,
                the same `EmptyState` shape Wishlist/Recently Viewed already
                use) once orders are confirmed loaded and there really are
                none — was previously just "0 orders placed" plus a button
                into an empty history page. Reuses the dedicated Order
                History page's own existing `orders.emptyTitle`/
                `orders.emptyDescription` copy and `PackageOpen` icon
                (see `OrderHistoryView.tsx`) rather than inventing new
                strings, so the two pages describe "no orders" identically. */}
            <AccountSection id="orders" title={t("account.myOrders")}>
              {ordersStatus === "loading" ? (
                <p className="mt-1 flex items-center gap-2 text-sm text-secondary">
                  <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("orders.loading")}
                </p>
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={PackageOpen}
                  title={t("orders.emptyTitle")}
                  body={t("orders.emptyDescription")}
                  ctaHref="/games"
                  ctaLabel={t("account.browseGames")}
                  secondaryCtaHref="/gift-cards"
                  secondaryCtaLabel={t("nav.giftCards")}
                />
              ) : (
                <>
                  <p className="mt-1 flex items-center gap-2 text-sm text-secondary">
                    <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t("account.ordersCount").replace("{count}", String(orders.length))}
                  </p>
                  <Link href="/orders" prefetch={false} className={buttonClasses("secondary", "sm", "mt-4")}>
                    {t("account.viewOrderHistory")}
                  </Link>
                </>
              )}
            </AccountSection>

            {/* Wishlist — UI-14: the header's own Wishlist icon (and the
                Sidebar's) deep-link straight to `/account#wishlist`, so for
                a visitor landing here this section IS "the Wishlist page"
                — `size="lg"` + `subtitle` give it a real page-level header
                (§1), reusing the existing `account.wishlistEmptyBody`
                translation as that subtitle (already reads naturally
                whether or not the list is actually empty — "Save products
                you like by tapping the heart icon — they'll show up
                here.") rather than inventing a new translation key.
                `unified` on each card (§2/§5) matches the taller image
                ratio the Games "All Games" grid and Gift Cards' own main
                grid already use for their product listings — the same
                shared `GameCard` design system, not a new one — while
                Recently Viewed below keeps the original 16:10 unchanged,
                since this step is scoped to Wishlist presentation only.
                Still the real WishlistProvider state, rendered with the
                same GameCard (and its wishlist heart) used everywhere
                else, so removing an item here works exactly like removing
                it from a product card anywhere in the app (§3). */}
            <AccountSection
              id="wishlist"
              title={t("actions.wishlist")}
              // Only shown once there's a grid to caption — when the list
              // is empty, the EmptyState block below already states this
              // exact same "tap the heart icon" explanation as its own
              // body text, so showing it twice in a row would be pure
              // repetition rather than "short muted subtitle" (§1).
              subtitle={wishlistEntries.length > 0 ? t("account.wishlistEmptyBody") : undefined}
              size="lg"
            >
              {wishlistEntries.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title={t("account.wishlistEmptyTitle")}
                  body={t("account.wishlistEmptyBody")}
                  ctaHref="/games"
                  ctaLabel={t("account.browseGames")}
                  secondaryCtaHref="/gift-cards"
                  secondaryCtaLabel={t("nav.giftCards")}
                />
              ) : (
                <>
                  <p className="mt-1 text-sm text-secondary">
                    {t("account.wishlistCount").replace("{count}", String(wishlistEntries.length))}
                  </p>
                  <div className={CARD_GRID}>
                    {wishlistEntries.map(({ game, href }) => (
                      <GameCard key={game.id} game={game} href={href} unified />
                    ))}
                  </div>
                </>
              )}
            </AccountSection>

            {/* Recently Viewed — the same `useRecentlyViewed` hook the
                homepage row already uses (§6), just in a grid instead of a
                horizontal scroller, and with an explicit empty state
                instead of hiding the whole section. */}
            <AccountSection id="recently-viewed" title={t("games.recentlyViewed")}>
              {recentlyViewedEntries.length === 0 ? (
                <EmptyState
                  icon={History}
                  title={t("account.recentlyViewedEmptyTitle")}
                  body={t("account.recentlyViewedEmptyBody")}
                  ctaHref="/games"
                  ctaLabel={t("account.browseGames")}
                />
              ) : (
                <div className={CARD_GRID}>
                  {recentlyViewedEntries.map(({ game, href }) => (
                    <GameCard key={game.id} game={game} href={href} />
                  ))}
                </div>
              )}
            </AccountSection>

            {/* Settings — opens the exact same site-wide Language &
                Currency modal every other trigger already opens (§7); no
                second settings UI/state. */}
            <AccountSection id="settings" title={t("settings.title")}>
              <p className="mt-1 flex items-center gap-2 text-sm text-secondary">
                <SettingsIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t("account.settingsDescription")}
              </p>
              <div className="mt-4">
                <SettingsButton />
              </div>
            </AccountSection>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
