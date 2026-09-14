"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/hooks/useLanguage";
import { getCategories } from "@/data/games";

/**
 * Real genre-category links (Step 44) — deliberately a new, separate
 * section from `CategoryGrid` above it, not a change to any of that
 * component's 7 existing tiles. Those tiles (Popular Games, PC Games,
 * Mobile Games, Steam, Game Top-Up, New Games, Promotions) are a curated,
 * thematic set that mostly doesn't correspond to any single product
 * genre — "PC Games" means "playable on PC" (a platform concept spanning
 * many genres), not one category. Repointing any of them at a single
 * `/games/category/[slug]` page would misrepresent what that tile means
 * and hide most of its actual results, so none of them were changed.
 * This section instead links the real 13 genres (the same ones seeded
 * into Supabase's `categories` table) each to their own, genuinely
 * corresponding category page.
 */
export function CategoryLinks() {
  const { t } = useLanguage();
  const categories = getCategories();

  return (
    <section aria-labelledby="category-links-heading" className="pb-14 sm:pb-16 lg:pb-20">
      <Container>
        <Reveal>
          <SectionHeading id="category-links-heading" title={t("category.browseByCategory")} />
          <div className="mt-6 flex flex-wrap gap-2.5">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/games/category/${category.slug}`}
                prefetch={false}
                className="rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
