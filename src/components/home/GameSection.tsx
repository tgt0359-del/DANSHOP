"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GameCard } from "@/components/ui/GameCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/hooks/useLanguage";
import type { Game } from "@/types/game";

/**
 * Shared responsive grid used by "Popular PC Games", "Popular Mobile Games",
 * "Best Deals", and "New Releases" — same layout, different data and title.
 *
 * Takes translation *keys*, not resolved text, and resolves them itself —
 * that way the page that composes these sections can stay a plain server
 * component while all user-facing text still goes through the translation
 * system.
 */
export function GameSection({
  id,
  titleKey,
  subtitleKey,
  games,
  showReleaseDate = false,
  viewAllHref,
}: {
  id: string;
  titleKey: string;
  subtitleKey?: string;
  games: Game[];
  showReleaseDate?: boolean;
  /** Route to the real games catalog (src/app/games). Always the plain,
   * unfiltered "/games" today — the catalog page filters via local UI
   * state, not URL query params, so a query string here would be silently
   * ignored rather than actually pre-filtering the view. */
  viewAllHref?: string;
}) {
  const { t } = useLanguage();
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className="py-14 sm:py-16 lg:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            id={headingId}
            title={t(titleKey)}
            description={subtitleKey ? t(subtitleKey) : undefined}
            action={
              viewAllHref ? (
                <Link
                  href={viewAllHref}
                  prefetch={false}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("common.viewAll")}
                </Link>
              ) : undefined
            }
          />
          {/* UI-07 §4: `xl:grid-cols-4` (was `lg:grid-cols-4`) matches the
              exact breakpoint the Games/Gift Cards catalog grids already
              use — 3 comfortably-sized columns from 1024-1279px instead of
              a cramped 4, only going to 4 once there's the same amount of
              room those pages require. `unified` (UI-06's shared-card prop
              — after that step it only ever changes the image's own aspect
              ratio) gives this grid the same 4:3 image treatment as the
              Games page's own "All Games" grid, so homepage product
              listings and the catalog's product listing now share one
              image ratio — see `GameCard`'s own doc comment for why the
              homepage's *Trending* row (a different component, kept at
              16:10) intentionally does not follow suit: it mirrors the
              Games page's own Trending row, which stays 16:10 too. */}
          <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} showReleaseDate={showReleaseDate} unified />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
