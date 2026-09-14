"use client";

import { GameCard } from "@/components/ui/GameCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

/**
 * A compact row of the games this browser has previously opened — hidden
 * entirely until at least one exists, so a first-time visitor never sees an
 * empty section. Reuses GameCard at a smaller fixed width rather than a
 * different card style, in a horizontally-scrolling row contained to this
 * section (same technique as the homepage's Trending row, just simpler:
 * no full-bleed edge-to-edge sizing needed for a secondary section here).
 */
export function RecentlyViewed() {
  const { t } = useLanguage();
  const entries = useRecentlyViewed();

  if (entries.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recently-viewed-heading" className="mt-8">
      <h2 id="recently-viewed-heading" className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
        {t("games.recentlyViewed")}
      </h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {entries.map(({ game, href }) => (
          <div key={game.id} className="w-40 shrink-0 sm:w-48">
            <GameCard game={game} href={href} />
          </div>
        ))}
      </div>
    </section>
  );
}
