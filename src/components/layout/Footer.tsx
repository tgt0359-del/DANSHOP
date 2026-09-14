"use client";

import Link from "next/link";
import { Apple, PlayCircle, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SettingsButton } from "@/components/layout/SettingsButton";
import { Logo } from "@/components/ui/Logo";
import { socialLinks } from "@/config/social";
import { paymentMethods } from "@/data/paymentMethods";
import { useLanguage } from "@/hooks/useLanguage";

type FooterLink = { labelKey: string; href: string };

/**
 * DANSHOP premium footer (Step UI-01, refined in UI-30) — reorganized
 * information architecture: About → Purchase → Help → Business → Follow
 * Us, then a Payment Channels row, a Download the App / Reviews pair, and
 * a bottom bar. UI/presentation only — no auth, Supabase, order, payment,
 * or product logic changes; every link/data source below is one this app
 * already has (`socialLinks`, `paymentMethods`, the real marketplace
 * category routes), never an invented URL.
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
 * reason UI-17 first gave.
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
// heading/link typography slightly" request.
const sectionHeadingClass = "text-sm font-semibold leading-snug text-foreground sm:text-base";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-elevated">
      <Container className="py-16 sm:py-20 lg:py-24">
        <Reveal>
          {/* About | Purchase | Help | Business | Follow Us */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-6">
            <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-2">
              <Logo />
              <p className="max-w-xs text-sm leading-relaxed text-secondary sm:text-[15px]">{t("brand.tagline")}</p>
            </div>

            <FooterColumn heading={t("footer.purchaseHeading")} links={purchaseLinks} />
            <FooterColumn heading={t("footer.helpHeading")} links={helpLinks} />
            <FooterColumn heading={t("footer.businessHeading")} links={businessLinks} />

            <div className="flex flex-col gap-4">
              <h3 className={sectionHeadingClass}>{t("footer.followUsHeading")}</h3>
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
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full text-secondary transition-colors duration-200 hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                      </a>
                    );
                  }

                  return (
                    <span
                      key={name}
                      title={accessibleName}
                      className="inline-flex h-12 w-12 cursor-default items-center justify-center rounded-full text-secondary/40"
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

        {/* Payment Channels — the same real `paymentMethods` list and UI
            language the homepage's own Payment Methods section already
            uses (`components/home/PaymentMethods.tsx`), just compact
            enough for a footer row. Display-only, same as that section —
            never claims a provider is actually integrated. */}
        <Reveal>
          <div className="mt-14 border-t border-border pt-12 sm:mt-20 sm:pt-14">
            <h3 className={sectionHeadingClass}>{t("footer.paymentChannelsHeading")}</h3>
            <div className="mt-5 flex flex-wrap gap-3">
              {paymentMethods.map(({ name, icon: Icon }) => (
                <div
                  key={name}
                  className="flex h-12 items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5 text-secondary transition-colors duration-200 hover:border-border-strong"
                >
                  <Icon className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
                  <span className="text-xs font-semibold text-foreground sm:text-sm">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Download the App | Reviews */}
        <Reveal>
          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 border-t border-border pt-12 sm:mt-20 sm:grid-cols-2 sm:pt-14">
            <div>
              <h3 className={sectionHeadingClass}>{t("footer.downloadAppHeading")}</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                <AppBadge icon={PlayCircle} label={t("footer.googlePlayLabel")} />
                <AppBadge icon={Apple} label={t("footer.appStoreLabel")} />
              </div>
            </div>

            <div>
              <h3 className={sectionHeadingClass}>{t("footer.reviewsHeading")}</h3>
              <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-5 py-3.5">
                <div className="flex items-center gap-0.5 text-secondary" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} className="h-4 w-4" strokeWidth={1.5} />
                  ))}
                </div>
                <span className="text-sm font-medium text-secondary sm:text-[15px]">
                  {t("footer.reviewsComingSoon")}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Bottom bar — copyright, quick legal/contact links, and the same
          site-wide Language & Currency control every other trigger opens
          (moved here from the About column, matching this step's
          requested bottom-bar composition). */}
      <div className="border-t border-border py-7">
        <Container className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4 sm:text-left">
            <p className="text-xs text-secondary sm:text-sm">{t("footer.copyright").replace("{year}", String(year))}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-secondary sm:text-sm">
              <Link href="/privacy" prefetch={false} className="hover:text-foreground">
                {t("footer.privacy")}
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/terms" prefetch={false} className="hover:text-foreground">
                {t("footer.terms")}
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/contact" prefetch={false} className="hover:text-foreground">
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

function FooterColumn({ heading, links }: { heading: string; links: readonly FooterLink[] }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4">
      <h3 className={sectionHeadingClass}>{heading}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.labelKey}>
            <Link
              href={link.href}
              prefetch={false}
              className="text-sm text-secondary transition-colors hover:text-foreground sm:text-[15px]"
            >
              {t(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A "Coming Soon" app-store badge — deliberately a non-interactive `<div>`,
 * not a `<button>`/`<a>`: there is no real published app and no real URL
 * to send anyone to, so this must not read as clickable (Step UI-01's
 * explicit "do not create fake download URLs, do not imply the apps are
 * currently downloadable"). Structured so a real link can replace the
 * `<div>` wrapper later — icon/label/sublabel markup stays the same —
 * without redesigning this component.
 */
function AppBadge({ icon: Icon, label }: { icon: typeof Apple; label: string }) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-secondary transition-colors duration-200 hover:border-border-strong">
      <Icon className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden="true" />
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-wide text-secondary">{t("footer.downloadAppComingSoon")}</span>
        <span className="text-sm font-semibold text-foreground sm:text-[15px]">{label}</span>
      </div>
    </div>
  );
}
