"use client";

import Link from "next/link";
import { BadgePercent, Gamepad2, Monitor, Smartphone, Sparkles, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/hooks/useLanguage";

// Quick links into the site's main areas. Where a matching section already
// exists on this page, the card jumps straight to it (a real, working
// anchor) instead of a placeholder route. "steam" has no matching section
// anywhere, so it falls back to the real catalog rather than a route like
// "/games/steam", which would incorrectly match /games/[slug] and show
// "Game Not Found". "topup" now links to the real /top-up category page
// Step 57 built (see data/marketplaceCategories.ts) — previously this
// pointed at "/topup" (no hyphen), a route that was never built, so it
// fell through to the site's general not-found page.
const categories: { key: string; icon: LucideIcon; href: string }[] = [
  { key: "popularGames", icon: TrendingUp, href: "#trending" },
  { key: "topup", icon: Wallet, href: "/top-up" },
  { key: "pcGames", icon: Monitor, href: "#pc-games" },
  { key: "mobileGames", icon: Smartphone, href: "#mobile-games" },
  { key: "steam", icon: Gamepad2, href: "/games" },
  { key: "newGames", icon: Sparkles, href: "#new-releases" },
  { key: "promotions", icon: BadgePercent, href: "#deals" },
];

/**
 * Compact quick-link tiles into the site's main areas — minimal, one per
 * key section. UI-01: previously each card carried its own distinct hue
 * tint (7 different colors across the row), which read as busier and more
 * "many accent colors" than this pass's restrained monochrome direction
 * asks for — every tile now shares the same neutral surface/border
 * treatment (matching `MarketplaceCategories`' already-monochrome icon
 * tiles below on this same page), differentiated only by icon + label,
 * with hover conveyed by motion/border/shadow instead of color.
 */
export function CategoryGrid() {
  const { t } = useLanguage();

  return (
    <section id="categories" aria-labelledby="categories-heading" className="py-14 sm:py-16 lg:py-20">
      <Container>
        <Reveal>
          <SectionHeading id="categories-heading" title={t("home.categories.title")} />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map(({ key, icon: Icon, href }) => (
              <Link
                key={key}
                href={href}
                prefetch={false}
                className="group flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-elevated p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium leading-snug text-foreground">
                  {t(`home.categories.${key}`)}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
