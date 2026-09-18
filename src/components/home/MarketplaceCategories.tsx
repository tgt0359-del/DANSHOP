"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getMarketplaceCategories } from "@/data/marketplaceCategories";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * The homepage's marketplace category discovery section (Step 57 §5) — a
 * clean grid of category cards, one per entry in the centralized
 * `marketplaceCategories` registry (§2/§19: no separate hardcoded
 * category list here either). Deliberately additive: `CategoryGrid`'s 7
 * existing curated tiles (Popular Games, Top Up, PC Games, ...) and
 * `CategoryLinks`'s genre-browse links are untouched — this is a third,
 * new section rather than a rewrite of either already-approved one, kept
 * in DANSHOP's own plain icon-tile visual language (Lucide icons, no
 * emoji, no third-party logos — Step 57's own "do not use copyrighted
 * brand logos" and "use DANSHOP's own visual style").
 *
 * UI-05: each entry's `descriptionKey` already existed in the registry
 * (translated in all 3 locales, used on each category's own page) but was
 * never surfaced here — now shown as a short second line per card, plus a
 * quiet arrow affordance, without adding any new data or route.
 */
export function MarketplaceCategories() {
  const { t } = useLanguage();
  const categories = getMarketplaceCategories();

  return (
    <section aria-labelledby="marketplace-categories-heading" className="pb-14 sm:pb-16 lg:pb-20">
      <Container>
        <Reveal>
          <SectionHeading id="marketplace-categories-heading" title={t("marketplace.discoverTitle")} />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  href={category.route}
                  prefetch={false}
                  // UI-05: same restrained hover as before (small lift,
                  // subtle border-color change, a light `shadow-sm` only on
                  // hover, never at rest) — `h-full` + `flex-col` on a grid
                  // item that stretches by default keeps every card in a
                  // row the same height regardless of description length,
                  // and the arrow/description are content, not a second
                  // competing control (§11).
                  className="group relative flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-white p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:p-6"
                >
                  <ArrowRight
                    className="absolute right-4 top-4 h-4 w-4 text-secondary/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-secondary sm:right-5 sm:top-5"
                    aria-hidden="true"
                  />
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-foreground transition-colors duration-200 group-hover:bg-black group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="flex flex-1 flex-col justify-center gap-1">
                    <span className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                      {t(category.nameKey)}
                    </span>
                    <span className="line-clamp-2 text-xs leading-snug text-secondary sm:text-sm">
                      {t(category.descriptionKey)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
