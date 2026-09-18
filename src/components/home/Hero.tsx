"use client";

import { useCallback, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { buttonClasses } from "@/components/ui/Button";
import { CarouselNavButtons } from "@/components/ui/CarouselNavButtons";
import { Container } from "@/components/ui/Container";
import { heroSlides } from "@/data/heroSlides";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";

/**
 * UI-03.2 (Hero Multiple Images / Minimal Carousel) — builds real
 * slide-switching on top of UI-03.1's two-column brand layout, reading
 * the whole `heroSlides` array instead of a fixed `[0]`. With today's
 * single real slide, `canGoPrevious`/`canGoNext` are both false and
 * `heroSlides.length > 1` is false, so `CarouselNavButtons` and the dot
 * row both render nothing — the Hero looks and behaves exactly like
 * UI-03.1 until a second slide is added, per this step's own "if there's
 * only one image, the system should work normally" requirement.
 *
 * Reuses `CarouselNavButtons` (the same circular Previous/Next pair the
 * homepage's product rows already use) rather than a second, near-
 * identical button pair — its two new optional `ariaLabelLeft`/
 * `ariaLabelRight` props (this step) let this caller supply "previous/
 * next slide" wording instead of that component's default "scroll
 * left/right" labels, with every existing caller unaffected since both
 * props are optional and fall back to the original label.
 *
 * Left/right index state lives here (not in a hook) — `useHorizontalScroll`
 * tracks a scroll container's pixel position; this is a plain array index
 * with no DOM measurement involved, so it doesn't fit that hook and
 * doesn't need one of its own.
 */
export function Hero() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const slideCount = heroSlides.length;
  const activeSlide = heroSlides[activeIndex];
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < slideCount - 1;

  const goToPrevious = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1));
  }, []);
  const goToNext = useCallback(() => {
    setActiveIndex((index) => Math.min(slideCount - 1, index + 1));
  }, [slideCount]);

  // UI-03.2 §8: ArrowLeft/ArrowRight while focus is anywhere inside the
  // Hero (a CTA link, a nav button, a dot) also change slides — a real
  // keyboard shortcut on top of the buttons themselves already being
  // reachable/activatable by keyboard as plain `<button>`s.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowLeft") {
        goToPrevious();
      } else if (event.key === "ArrowRight") {
        goToNext();
      }
    },
    [goToPrevious, goToNext]
  );

  const artworkAlt = t(activeSlide.altKey);
  const heading = t(activeSlide.headingKey);
  const tagline = t(activeSlide.taglineKey);
  const primaryLabel = t(activeSlide.primaryCta.labelKey);
  const secondaryLabel = t(activeSlide.secondaryCta.labelKey);

  return (
    <section aria-label={artworkAlt} className="bg-white" onKeyDown={handleKeyDown}>
      <Container className="py-10 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`text-${activeSlide.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {/* Small brand/campaign eyebrow — plain text, not a
                  translation key (see `heroSlides.ts`'s own doc comment).
                  Same typography `SectionHeading`'s `eyebrow` slot already
                  uses elsewhere on the site. Kept tiny and muted so it
                  never competes with the heading or the artwork's own
                  baked-in wordmark. */}
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{activeSlide.eyebrow}</p>
              <h1 className="mt-3 text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl lg:text-5xl">
                {heading}
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-secondary">{tagline}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={activeSlide.primaryCta.href} prefetch={false} className={buttonClasses("primary", "lg")}>
                  {primaryLabel}
                </Link>
                <Link
                  href={activeSlide.secondaryCta.href}
                  prefetch={false}
                  className={buttonClasses("secondary", "lg")}
                >
                  {secondaryLabel}
                </Link>
              </div>

              {/* Previous/Next + dots — both hidden entirely with only one
                  slide (§6/§7's own "hide controls" requirement), so this
                  whole block renders nothing extra today. Sits under the
                  CTAs rather than on top of the artwork, keeping the image
                  free of any button/indicator chrome (§10's "no product
                  metadata on the image"). */}
              {slideCount > 1 && (
                <div className="mt-6 flex items-center gap-4">
                  <CarouselNavButtons
                    canScrollLeft={canGoPrevious}
                    canScrollRight={canGoNext}
                    onScrollLeft={goToPrevious}
                    onScrollRight={goToNext}
                    ariaLabelLeft={t("actions.previousSlide")}
                    ariaLabelRight={t("actions.nextSlide")}
                  />
                  <div className="flex items-center gap-1.5">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        aria-current={index === activeIndex}
                        aria-label={t("actions.goToSlide").replace("{number}", String(index + 1))}
                        onClick={() => setActiveIndex(index)}
                        className={cn(
                          "rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                          index === activeIndex ? "h-2 w-5 bg-foreground" : "h-2 w-2 bg-border hover:bg-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Campaign artwork — its own column, never a product-card frame
              (no border, no shadow beyond a very light one, no price/
              wishlist/badge chrome). `rounded-3xl` (vs. every product
              card's `rounded-2xl`) is a deliberate, small differentiator
              so this reads as its own "brand" surface rather than an
              oversized card. `object-cover` on the fixed 16:9 box fills it
              without stretching (the asset's real ratio, 1.7768, is
              already within a fraction of a percent of 16:9) — unchanged
              image file, unchanged crop. */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`image-${activeSlide.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative aspect-video w-full overflow-hidden rounded-3xl shadow-sm"
            >
              <Image
                src={activeSlide.imageSrc}
                alt={artworkAlt}
                width={activeSlide.imageWidth}
                height={activeSlide.imageHeight}
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
