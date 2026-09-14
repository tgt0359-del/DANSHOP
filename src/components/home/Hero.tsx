"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";

/**
 * UI-03.1 (full-width campaign-banner pass) — redesigns the Hero from the
 * previous two-column "text card beside a bordered image card" layout into
 * one full-width campaign banner: the real artwork
 * (`public/images/hero/danshop-games-hero.png`, unchanged — this pass never
 * edits the image itself) fills the whole Hero width, with real HTML text
 * and minimal glass/transparent CTAs overlaid directly on it, matching the
 * "premium gaming campaign banner, not a product card" brief.
 *
 * TEXT PLACEMENT — deliberately bottom-anchored, not centered or top-left:
 * the artwork's own composition already puts a large baked-in "DAN/SHOP" +
 * "GAMES FOR EVERY PLAYER" wordmark in a solid-black band across its lower
 * third (every character/action in the artwork sits in the upper two-
 * thirds instead). That existing dark band is the one genuinely "readable
 * area" of the image, so the real, accessible HTML heading/tagline/CTAs
 * below sit there too — a soft bottom-up black gradient (never a solid
 * box) keeps them legible without ever covering a face, weapon, or the
 * artwork's own wordmark above it. Placing new text there deliberately
 * reads as a distinct caption/action bar under the artwork's own headline,
 * not a second competing headline stacked on top of it.
 *
 * MOBILE (< `sm`, 640px): at very narrow widths a 16:9 crop of this image
 * is short enough (e.g. ~202px tall at 360px wide) that the safe dark band
 * is too thin to comfortably fit a heading + tagline + two buttons without
 * either shrinking to illegible text or spilling onto the artwork above —
 * exactly what "never let text cover an important part of the image"
 * forbids. Since this step's own brief explicitly allows text to sit
 * above/below the image "as appropriate" on mobile, the image renders
 * clean (no overlay at all) below `sm`, and the same real heading/
 * tagline/CTAs render directly below it on the page's own white
 * background instead — using this site's normal solid-button style there
 * (a transparent/glass button tuned for a dark image would be unreadable
 * on white). `sm:` and up always uses the overlay; this is the only
 * breakpoint-dependent structural difference.
 */
const HERO_ARTWORK_IMAGE = "/images/hero/danshop-games-hero.png";
const HERO_ARTWORK_WIDTH = 1672;
const HERO_ARTWORK_HEIGHT = 941;

/** Minimal glass/transparent CTA classes (§3) — deliberately NOT this
 * site's normal solid-black `buttonClasses` (too heavy on top of a busy
 * campaign photo, and explicitly ruled out: "no large solid black
 * buttons"). Primary is a touch more opaque/visible than secondary, per
 * spec; both share the same pill shape, thin white border, light backdrop
 * blur, and a restrained "get slightly brighter" hover — no heavy shadow,
 * no scale/bounce animation. */
const glassPrimaryClass =
  "inline-flex h-11 items-center justify-center rounded-full border border-white/65 bg-white/10 px-6 text-sm font-medium text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 sm:h-12 sm:px-7 sm:text-base";
const glassSecondaryClass =
  "inline-flex h-11 items-center justify-center rounded-full border border-white/35 bg-white/5 px-6 text-sm font-medium text-white backdrop-blur-sm transition-colors duration-200 hover:border-white/55 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 sm:h-12 sm:px-7 sm:text-base";

/**
 * The real heading/tagline/CTA content — written once, rendered twice (the
 * `sm:`+ overlay, and the < `sm` stacked-below block), so the translated
 * copy and routes exist in exactly one place. `tone` only changes styling
 * (white glass-on-image vs. this site's normal dark-on-white), never the
 * content, route, or translation key.
 */
function HeroContent({ tone }: { tone: "overlay" | "stacked" }) {
  const { t } = useLanguage();
  const isOverlay = tone === "overlay";

  return (
    <>
      {/* §2 / "รักษาข้อความ localization เดิม: DANSHOP, Games for every
          player": the literal brand wordmark (unchanged, not a translation
          key — a proper noun, matching Logo/footer usage) plus the same
          real `brand.tagline` copy already used everywhere else in the
          app (its EN string reads "Your digital game marketplace"; the
          artwork's own baked-in "GAMES FOR EVERY PLAYER" line is the
          image's separate, fixed design element — this HTML text is not
          meant to literally restate it, just to keep DANSHOP's real
          heading/tagline present as real, accessible text per §2/§5 of
          the original Hero step). No translation key changed. */}
      <h1
        className={cn(
          "font-bold leading-[1.05] tracking-[-0.02em]",
          isOverlay ? "text-2xl text-white sm:text-3xl lg:text-4xl" : "text-4xl text-foreground sm:text-5xl"
        )}
      >
        DANSHOP
      </h1>
      <p
        className={cn(
          "mt-2 max-w-md text-sm sm:text-base",
          isOverlay ? "text-white/85" : "mt-3 text-secondary"
        )}
      >
        {t("brand.tagline")}
      </p>

      <div className={cn("flex flex-wrap items-center gap-3", isOverlay ? "mt-4 sm:mt-5" : "mt-6")}>
        <Link
          href="/games"
          prefetch={false}
          className={isOverlay ? glassPrimaryClass : buttonClasses("primary", "lg")}
        >
          {t("home.hero.shopNow")}
        </Link>
        <Link
          href="/games"
          prefetch={false}
          className={isOverlay ? glassSecondaryClass : buttonClasses("secondary", "lg")}
        >
          {t("home.hero.viewAllProducts")}
        </Link>
      </div>
    </>
  );
}

export function Hero() {
  const { t } = useLanguage();
  const artworkAlt = t("home.hero.subheading");

  return (
    <section aria-label={artworkAlt} className="bg-white">
      <Container className="py-6 sm:py-8 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative aspect-video w-full overflow-hidden rounded-2xl"
        >
          {/* Full-width real campaign artwork (§1) — same file, untouched;
              `object-cover` fills the fixed 16:9 box without stretching or
              squeezing (the asset's own real ratio, 1.7768, is already
              within a fraction of a percent of 16:9, so cover crops
              nothing visually meaningful). No border/white card frame
              around it (§1's "no thick white card border") — just the
              same subtle corner rounding every other rounded element on
              this site uses. */}
          <Image
            src={HERO_ARTWORK_IMAGE}
            alt={artworkAlt}
            width={HERO_ARTWORK_WIDTH}
            height={HERO_ARTWORK_HEIGHT}
            priority
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="h-full w-full object-cover"
          />

          {/* Soft bottom-up gradient (§2 — "overlay สีดำ...แบบโปร่งใสเบามาก",
              never a solid box) — fully transparent over the top two-thirds
              (every character/action stays untouched) and only darkens the
              lower band where the real HTML text below sits, matching the
              image's own already-dark lower third. `sm:`+ only: below that,
              the overlay content doesn't render at all (see HeroContent's
              own comment), so darkening the image there would serve no
              purpose. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-black/75 via-black/15 to-transparent sm:block"
          />

          {/* `sm:`+ overlay content — bottom-anchored, left-aligned (the
              artwork's own wordmark is centered, so this reads as a
              distinct caption/action bar rather than a stacked duplicate
              headline directly over it — see this file's top comment). */}
          <div className="absolute inset-x-0 bottom-0 hidden p-5 sm:block sm:p-7 lg:p-10">
            <HeroContent tone="overlay" />
          </div>
        </motion.div>

        {/* < `sm` (mobile): the image above renders with no overlay at all
            (see this file's top comment for why) — the same real content
            follows directly below it on the page's own white background,
            using this site's normal solid CTA style instead of the
            glass-on-image one. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
          className="mt-6 sm:hidden"
        >
          <HeroContent tone="stacked" />
        </motion.div>
      </Container>
    </section>
  );
}
