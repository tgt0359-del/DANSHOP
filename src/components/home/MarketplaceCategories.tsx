"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getMarketplaceCategories } from "@/data/marketplaceCategories";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * The homepage's marketplace category discovery section (Step 57 §5) — a
 * clean grid of icon + label cards, one per entry in the centralized
 * `marketplaceCategories` registry (§2/§19: no separate hardcoded
 * category list here either). Deliberately additive: `CategoryGrid`'s 7
 * existing curated tiles (Popular Games, Top Up, PC Games, ...) and
 * `CategoryLinks`'s genre-browse links are untouched — this is a third,
 * new section rather than a rewrite of either already-approved one, kept
 * in DANSHOP's own plain icon-tile visual language (Lucide icons, no
 * emoji, no third-party logos — Step 57's own "do not use copyrighted
 * brand logos" and "use DANSHOP's own visual style").
 */
export function MarketplaceCategories() {
  const { t } = useLanguage();
  const categories = getMarketplaceCategories();

  return (
    <section aria-labelledby="marketplace-categories-heading" className="pb-14 sm:pb-16 lg:pb-20">
      <Container>
        <Reveal>
          <SectionHeading id="marketplace-categories-heading" title={t("marketplace.discoverTitle")} />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  href={category.route}
                  prefetch={false}
                  // UI-07 §8/§11: same restrained hover as `CategoryGrid`'s
                  // tiles just above this section — a small lift, a subtle
                  // border-color change, and the lighter `shadow-sm` (was
                  // `shadow-md`, a step stronger than this page's other
                  // hover treatments) — one consistent "card/chip" feel
                  // across both category sections instead of two slightly
                  // different ones.
                  className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-surface-elevated p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium leading-snug text-foreground sm:text-sm">{t(category.nameKey)}</span>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
