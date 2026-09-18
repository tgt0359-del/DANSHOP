"use client";

import { CarouselNavButtons } from "@/components/ui/CarouselNavButtons";
import { Container } from "@/components/ui/Container";
import { GameCard } from "@/components/ui/GameCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import { useLanguage } from "@/hooks/useLanguage";
import type { Game } from "@/types/game";

/**
 * Horizontally-scrolling row: roughly 2 cards visible on mobile, 3 on
 * tablet, 4-5 on desktop, with the rest reachable by scrolling (native
 * scroll-snap — no extra library needed).
 *
 * UI-04: `useHorizontalScroll` owns the scroll-container ref and its
 * live `canScrollLeft`/`canScrollRight` state; `CarouselNavButtons`
 * (both shared, reusable — Technical §1/§2) just renders the two
 * buttons wired to it. The buttons sit in `SectionHeading`'s existing
 * `action` slot — already the "beside the heading, aligned right, one
 * row" layout this needs, not a new pattern. `canScroll` (only true once
 * the row actually overflows) hides the whole pair rather than showing
 * two permanently-disabled buttons when every card already fits.
 */
export function TrendingSection({ games }: { games: Game[] }) {
  const { t } = useLanguage();
  const { ref, canScroll, canScrollLeft, canScrollRight, scrollByDirection } = useHorizontalScroll<HTMLDivElement>();

  return (
    <section id="trending" aria-labelledby="trending-heading" className="py-14 sm:py-16 lg:py-20">
      <Reveal>
        <Container>
          <SectionHeading
            id="trending-heading"
            title={t("home.trending.title")}
            description={t("home.trending.subtitle")}
            action={
              canScroll ? (
                <CarouselNavButtons
                  canScrollLeft={canScrollLeft}
                  canScrollRight={canScrollRight}
                  onScrollLeft={() => scrollByDirection("left")}
                  onScrollRight={() => scrollByDirection("right")}
                />
              ) : undefined
            }
          />
        </Container>

        {/*
          This row deliberately lives outside <Container> so it can scroll
          edge-to-edge on wide screens, matching Container's own px-4/sm:px-6
          padding below the lg breakpoint. But Container also centers a
          max-w-7xl (1280px) box via mx-auto — above 1280px wide, that adds
          an extra centering margin this row's flat lg:px-8 didn't replicate,
          so the first card started at the viewport edge while the heading
          above it sat ~80px in. The lg padding below picks whichever is
          larger: the normal 2rem, or (up to 1280px) 2rem plus the same
          centering margin Container gets — so the first card lines up with
          the heading at any width, while still bleeding past 1280px exactly
          as before.

          The matching scroll-p{l,r} below is required, not decorative:
          with scroll-snap-type + snap-start children, browsers treat a
          container's own padding as scrollable-past space and auto-scroll
          to the first snap point at rest, which silently ate the padding
          above (confirmed via scrollLeft, not just visual inspection) —
          scroll-padding tells the snap algorithm that space is part of the
          rest position instead.
        */}
        <div
          ref={ref}
          className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6 lg:pl-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))] lg:pr-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))] scroll-pl-4 scroll-pr-4 sm:scroll-pl-6 sm:scroll-pr-6 lg:scroll-pl-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))] lg:scroll-pr-[max(2rem,calc((100vw_-_1280px)/2_+_2rem))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {games.map((game) => (
            <div key={game.id} className="w-[46vw] shrink-0 snap-start sm:w-[30vw] md:w-60 lg:w-64">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
