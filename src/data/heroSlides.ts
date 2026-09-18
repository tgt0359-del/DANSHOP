/**
 * UI-03.1 (full-width responsive Hero) — the Hero's content as a small,
 * data-driven array instead of values hardcoded inline in `Hero.tsx`,
 * specifically so a second/third campaign slide can be added later
 * without restructuring the component. Every field that needs to change
 * per-slide lives here: the image (path + its real intrinsic
 * width/height, required by `next/image`), and translation KEYS (never
 * pre-resolved strings — the actual text is resolved by `t()` at render
 * time, so the same slide data renders correctly in Lao/English/Thai).
 *
 * UI-03.2 (Hero carousel): `Hero.tsx` now reads this whole array (not
 * just `[0]`) and lets Previous/Next/dot controls move between entries —
 * but this array still holds exactly one real, already-approved slide.
 * No placeholder/fake campaign data — every field below is a real asset
 * path or an existing translation key already used elsewhere in this
 * app, never invented copy or a made-up price/promo. See this file's own
 * "how to add a slide" note below for what a real 2nd/3rd/4th entry
 * needs.
 */
export interface HeroSlide {
  id: string;
  imageSrc: string;
  /** The image's own real intrinsic pixel dimensions (required by
   * `next/image` for a non-`fill` image) — not a display size. */
  imageWidth: number;
  imageHeight: number;
  /** Translation key for the image's `alt` text. */
  altKey: string;
  /** Small brand/campaign label shown above the heading (UI-03.2 §9) —
   * plain text, not a translation key. For the one slide today this is
   * just the brand name itself, "DANSHOP" — the same literal, untranslated
   * wordmark `Logo.tsx` already renders in the Header/Sidebar/Footer, not
   * new hardcoded copy. A future promotional slide (e.g. a seasonal sale)
   * could instead put its own short label here ("SUMMER SALE"), which is
   * exactly why this is per-slide data rather than fixed JSX in
   * `Hero.tsx`. */
  eyebrow: string;
  /** Translation key for the short heading. */
  headingKey: string;
  /** Translation key for the supporting tagline line. */
  taglineKey: string;
  primaryCta: { labelKey: string; href: string };
  secondaryCta: { labelKey: string; href: string };
}

export const heroSlides: readonly HeroSlide[] = [
  {
    id: "danshop-launch",
    imageSrc: "/images/hero/danshop-games-hero.png",
    imageWidth: 1672,
    imageHeight: 941,
    altKey: "home.hero.subheading",
    eyebrow: "DANSHOP",
    headingKey: "home.hero.subheading",
    taglineKey: "brand.tagline",
    primaryCta: { labelKey: "home.hero.shopNow", href: "/games" },
    secondaryCta: { labelKey: "home.hero.viewAllProducts", href: "/games" },
  },

  // UI-03.2: to add a real 2nd/3rd/4th campaign later — 1) drop its
  // artwork into `public/images/hero/` (an existing project image, never
  // a placeholder or an external/Google Images URL), 2) add its real
  // pixel width/height here (required by `next/image`), 3) add real
  // translated copy for its `altKey`/`headingKey`/`taglineKey` (and
  // CTA label keys, if they differ from the shop-now/view-all pair
  // above) to all three locale files, keyed however fits — nothing in
  // `Hero.tsx` needs to change; it already renders whichever entry is
  // active by index. `eyebrow` does NOT need a translation key unless a
  // future slide wants one that actually differs per language.
];
