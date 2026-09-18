"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SettingsButton } from "@/components/layout/SettingsButton";
import { Logo } from "@/components/ui/Logo";
import { socialLinks } from "@/config/social";
import { PAYMENT_BRAND_LOGOS, PAYMENT_BRAND_LOGOS_LIGHT_BG } from "@/data/paymentBrandLogos";
import { paymentMethods } from "@/data/paymentMethods";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";

type FooterLink = { labelKey: string; href: string };

/**
 * DANSHOP premium footer (Step UI-01, refined in UI-30, simplified in
 * UI-14) — information architecture: About → Purchase → Help → Business →
 * Follow Us, then a Payment Channels row (hidden on the homepage only —
 * see that section's own comment below), then a bottom bar. UI/
 * presentation only — no auth, Supabase, order, payment, or product logic
 * changes; every link/data source below is one this app already has
 * (`socialLinks`, `paymentMethods`, the real marketplace category
 * routes), never an invented URL.
 *
 * UI-14: removed the "Download the App" section (UI-12 had brought it
 * back with real Google Play/App Store badge art, but DANSHOP has no
 * real mobile app and is web-first right now — showing app-store badges
 * for an app that doesn't exist yet no longer earned its place) and the
 * Reviews section (no verified review score/count/platform exists
 * anywhere in this project; an unfilled five-star row with a "coming
 * soon" label risked reading as "there are reviews, just not shown yet"
 * rather than "there is nothing here yet" — removing it entirely is more
 * honest than a placeholder that still resembles a rating). Both can come
 * back once there's a real app to link to / real review data to show —
 * this removes the UI, not the underlying translation keys or brand
 * assets, so re-adding either later is a small, additive change, not a
 * rebuild.
 *
 * "Community" (UI-30's own requested heading order also lists it) is
 * still deliberately NOT rendered — re-checked before this pass, and this
 * project still has no real community destination (forum, Discord,
 * subreddit, ...) anywhere in the app, its data files, or its config.
 * UI-30's own instruction is explicit: "if no real community destination
 * exists, do not invent a fake URL." An empty column with a heading and
 * nothing under it would fail that rule worse than omitting the section
 * outright, so every other requested section is delivered in the
 * requested order and Community remains absent for the same documented
 * reason UI-17 first gave. The Help column's existing "Contact" link
 * already covers UI-14's "Community or Contact" requirement.
 *
 * UI-30 also adds a ninth payment method ("LDB", alongside the existing
 * "Lao QR" — see `data/paymentMethods.ts`), reworks the Follow Us icons so
 * they never render as fake clickable links (every `socialLinks` entry
 * today is still a "#" placeholder — see `config/social.ts` — so all six
 * render as non-interactive, clearly-labeled "Coming soon" glyphs instead
 * of `<a>` tags; the moment a real URL replaces a "#" there, that single
 * entry automatically renders as a real link again, no markup change
 * needed), and scales up spacing/typography slightly across every
 * section for a less sparse, more premium feel — all on the same
 * white/light-gray/black-text base, never a dark footer.
 *
 * KNOWN PRE-EXISTING GAP (not introduced or fixed by this step — a footer
 * redesign is not the place to build 6 new pages): `/help`, `/contact`,
 * `/faq`, `/about`, `/terms`, `/privacy` are referenced here exactly as
 * the previous footer already referenced them, but none of these routes
 * currently exist in the app (each resolves to the not-found page). See
 * this step's final report for the full explanation.
 *
 * PHASE AUTH-UI-01: the footer is still the exact same white/light-gray
 * footer everywhere in the app EXCEPT `/login` and `/register` — same
 * content, same links, same data, same components. On those two routes
 * only, `isAuthPage` (from `usePathname()`) swaps a small, explicit set of
 * color classes to a dark palette matching the dark auth page it now sits
 * directly below, so it no longer turns abruptly white right after that
 * section. This is intentionally NOT a global dark-mode toggle — every
 * other route's footer render is completely untouched (`isAuthPage` is
 * `false` there, so every conditional below resolves to the exact same
 * classes this file already had).
 */

// Purchase — every route here is real and already live (verified live
// during this step): /games/pc and /games/mobile are real dedicated
// pages (not the old anchor-link workaround), and /steam-wallet,
// /top-up, /gift-cards, /dlc, /software are the real marketplace
// category pages the `[category]` route already serves.
const purchaseLinks: readonly FooterLink[] = [
  { labelKey: "nav.games", href: "/games" },
  { labelKey: "nav.pcGames", href: "/games/pc" },
  { labelKey: "nav.mobileGames", href: "/games/mobile" },
  { labelKey: "nav.steam", href: "/steam-wallet" },
  { labelKey: "productTypes.gameTopUp", href: "/top-up" },
  { labelKey: "productTypes.giftCard", href: "/gift-cards" },
  { labelKey: "productTypes.dlc", href: "/dlc" },
  { labelKey: "productTypes.software", href: "/software" },
];

// Help — same hrefs the previous footer already used (see the file-level
// "KNOWN PRE-EXISTING GAP" comment above).
const helpLinks: readonly FooterLink[] = [
  { labelKey: "footer.helpCenter", href: "/help" },
  { labelKey: "footer.contact", href: "/contact" },
  { labelKey: "footer.faq", href: "/faq" },
];

// Business — same hrefs the previous footer's "Company" column already
// used (see the file-level "KNOWN PRE-EXISTING GAP" comment above).
const businessLinks: readonly FooterLink[] = [
  { labelKey: "footer.about", href: "/about" },
  { labelKey: "footer.terms", href: "/terms" },
  { labelKey: "footer.privacy", href: "/privacy" },
];

// Shared heading treatment for every footer section — slightly larger than
// the previous flat `text-sm` on wider screens, per UI-30's "scale up
// heading/link typography slightly" request. Now a function of `isAuthPage`
// (PHASE AUTH-UI-01) instead of a flat constant — every call site already
// passes it through.
function sectionHeadingClass(isAuthPage: boolean) {
  return cn("text-sm font-semibold leading-snug sm:text-base", isAuthPage ? "text-white" : "text-foreground");
}

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  // UI-07: the homepage's own `components/home/PaymentMethods.tsx`
  // section now shows the same real logos (real logo on top, name
  // below, in its light card grid) — this row is the one the user
  // flagged as a visible duplicate when scrolling the homepage, so it's
  // skipped ONLY on "/". Every other route (checkout, product pages,
  // `/login`, `/register`, ...) still gets this row exactly as before —
  // none of them have their own payment-method display, so this stays
  // their only one.
  const isHomePage = pathname === "/";

  return (
    <footer className={cn("border-t", isAuthPage ? "border-white/10 bg-[#080B10]" : "border-border bg-white")}>
      <Container className="py-16 sm:py-20 lg:py-24">
        <Reveal>
          {/* About | Purchase | Help | Business | Follow Us */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-6">
            <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-2">
              <Logo tone={isAuthPage ? "inverse" : "default"} />
              <p className={cn("max-w-xs text-sm leading-relaxed sm:text-[15px]", isAuthPage ? "text-neutral-400" : "text-secondary")}>
                {t("brand.tagline")}
              </p>
            </div>

            <FooterColumn heading={t("footer.purchaseHeading")} links={purchaseLinks} isAuthPage={isAuthPage} />
            <FooterColumn heading={t("footer.helpHeading")} links={helpLinks} isAuthPage={isAuthPage} />
            <FooterColumn heading={t("footer.businessHeading")} links={businessLinks} isAuthPage={isAuthPage} />

            <div className="flex flex-col gap-4">
              <h3 className={sectionHeadingClass(isAuthPage)}>{t("footer.followUsHeading")}</h3>
              <div className="flex flex-wrap items-center gap-3">
                {socialLinks.map(({ name, href, icon: Icon }) => {
                  // Every entry today is still the "#" placeholder (see
                  // config/social.ts) — UI-30 explicitly forbids rendering
                  // those as fake clickable links. Render a non-interactive,
                  // clearly-labeled "Coming soon" glyph instead; the day a
                  // real URL replaces "#" for one entry, it automatically
                  // renders as a genuine link below, no markup change needed.
                  const isLive = href !== "#";
                  const accessibleName = isLive ? name : `${name} — ${t("cart.comingSoon")}`;

                  if (isLive) {
                    return (
                      <a
                        key={name}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={accessibleName}
                        aria-label={accessibleName}
                        className={cn(
                          "inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                          isAuthPage
                            ? "text-neutral-400 hover:bg-white/10 hover:text-white focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-[#080B10]"
                            : "text-secondary hover:bg-surface hover:text-foreground focus-visible:ring-black"
                        )}
                      >
                        <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                      </a>
                    );
                  }

                  return (
                    <span
                      key={name}
                      title={accessibleName}
                      className={cn(
                        "inline-flex h-12 w-12 cursor-default items-center justify-center rounded-full",
                        isAuthPage ? "text-neutral-600" : "text-secondary/40"
                      )}
                    >
                      <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden="true" />
                      <span className="sr-only">{accessibleName}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Payment Channels — the same real `paymentMethods` list the
            homepage's own Payment Methods section also uses
            (`components/home/PaymentMethods.tsx`), just compact enough
            for a footer row. Display-only, same as that section — never
            claims a provider is actually integrated.

            UI-12: chips are now the same light `bg-white`/`border-border`
            card language every other white surface on the site uses
            (was a fixed dark `#11151B` pill on every page, including
            this white footer — this task's own "ไม่ใช้ dark footer"
            direction). `PAYMENT_BRAND_LOGOS_LIGHT_BG` swaps in Visa's
            light-card-safe mark (its default asset is reversed-white,
            built for a dark pill); every other logo already reads fine
            on white, and the homepage's own Payment Methods section
            already proved that on the exact same list. Lao QR (no real
            asset anywhere) gets the same dashed-circle placeholder that
            section uses — never a fake logo. The name is now always
            shown next to the logo (was logo-only, name as a fallback
            when no logo existed) so every chip reads the same way.

            UI-07: skipped entirely on "/" — see `isHomePage`'s own
            comment above for why. */}
        {!isHomePage && (
          <Reveal>
            <div className={cn("mt-14 border-t pt-12 sm:mt-20 sm:pt-14", isAuthPage ? "border-white/10" : "border-border")}>
              <h3 className={sectionHeadingClass(isAuthPage)}>{t("footer.paymentChannelsHeading")}</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                {paymentMethods.map(({ name }) => {
                  const logoSrc = PAYMENT_BRAND_LOGOS_LIGHT_BG[name] ?? PAYMENT_BRAND_LOGOS[name];
                  return (
                    <div
                      key={name}
                      className={cn(
                        "flex h-11 items-center gap-2 rounded-xl border px-3.5 transition-colors duration-200 sm:h-12",
                        isAuthPage
                          ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                          : "border-border bg-white hover:border-foreground/20 hover:bg-surface"
                      )}
                    >
                      <span className="relative h-5 w-8 shrink-0 sm:h-6 sm:w-9">
                        {logoSrc ? (
                          <Image src={logoSrc} alt={name} fill unoptimized sizes="36px" className="object-contain" />
                        ) : (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "block h-5 w-5 rounded-full border border-dashed sm:h-6 sm:w-6",
                              isAuthPage ? "border-white/20" : "border-border"
                            )}
                          />
                        )}
                      </span>
                      <span className={cn("text-xs font-semibold sm:text-sm", isAuthPage ? "text-white" : "text-foreground")}>
                        {name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        )}

      </Container>

      {/* Bottom bar — copyright, quick legal/contact links, and the same
          site-wide Language & Currency control every other trigger opens
          (moved here from the About column, matching this step's
          requested bottom-bar composition). */}
      <div className={cn("border-t py-7", isAuthPage ? "border-white/10" : "border-border")}>
        <Container className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4 sm:text-left">
            <p className={cn("text-xs sm:text-sm", isAuthPage ? "text-neutral-500" : "text-secondary")}>
              {t("footer.copyright").replace("{year}", String(year))}
            </p>
            <div
              className={cn(
                "flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs sm:text-sm",
                isAuthPage ? "text-neutral-500" : "text-secondary"
              )}
            >
              <Link href="/privacy" prefetch={false} className={isAuthPage ? "hover:text-white" : "hover:text-foreground"}>
                {t("footer.privacy")}
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/terms" prefetch={false} className={isAuthPage ? "hover:text-white" : "hover:text-foreground"}>
                {t("footer.terms")}
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/contact" prefetch={false} className={isAuthPage ? "hover:text-white" : "hover:text-foreground"}>
                {t("footer.contact")}
              </Link>
            </div>
          </div>
          <SettingsButton />
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
  isAuthPage,
}: {
  heading: string;
  links: readonly FooterLink[];
  isAuthPage: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4">
      <h3 className={sectionHeadingClass(isAuthPage)}>{heading}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.labelKey}>
            <Link
              href={link.href}
              prefetch={false}
              className={cn(
                "text-sm transition-colors sm:text-[15px]",
                isAuthPage ? "text-neutral-400 hover:text-white" : "text-secondary hover:text-foreground"
              )}
            >
              {t(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
