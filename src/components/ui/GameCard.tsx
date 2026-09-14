"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GameArtwork } from "@/components/ui/GameArtwork";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { useWishlist } from "@/lib/wishlist/WishlistProvider";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/currency/formatPrice";
import { formatShortDate } from "@/lib/formatDate";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import type { Game } from "@/types/game";

/**
 * The reusable game card used across every homepage section, the games
 * catalog, account order/wishlist lists, and Recently Viewed.
 *
 * UI-06: the badge/wishlist positioning, hover treatment, price weight, and
 * single (rather than doubled) discount indicator that this component's own
 * `unified` prop used to gate — added in UI-03.4 specifically to keep that
 * visual language scoped to the Games page only, so every other consumer
 * kept rendering the older, busier variant — are now this component's one,
 * unconditional design. UI-06 asks for the same minimal/premium card
 * language site-wide ("Games cards, Gift Cards cards, Homepage product
 * cards, other existing marketplace product cards"), so there is no longer
 * a surface that should render differently here. `unified` survives only
 * for the one thing that's still legitimately page-specific — see its own
 * comment below.
 */
export function GameCard({
  game,
  showReleaseDate = false,
  className,
  href,
  size = "default",
  unified = false,
}: {
  game: Game;
  /** Show the release date instead of the star rating (used by "New Releases"). */
  showReleaseDate?: boolean;
  className?: string;
  /** Overrides the default `/games/<slug>` link (Step 59) — used by
   * `RecentlyViewed` for a wallet/gift-card/top-up entry, which needs its
   * own route instead. Every pre-existing call site omits this and keeps
   * the original real-game behavior. */
  href?: string;
  /** UI-03.2 §2: opt-in larger internal typography/padding for the Games
   * page's own "Trending Games" row — real responsive sizing (not a CSS
   * `transform: scale()` on the whole card). The row's own wider card slot
   * (set by its caller, not this component) is what makes the artwork
   * itself noticeably bigger. */
  size?: "default" | "lg";
  /** UI-03.5 §1 / UI-03.7: the ONLY thing this prop still controls — a
   * taller 4:3 image area for the Games page's own "All Games" grid
   * (`unified && !isLg`), vs. the 16:10 ratio every other surface (and
   * Trending, which stays intentionally larger without switching ratio)
   * keeps. UI-06 §2's "Gift Cards should ... preserve their existing
   * product-card proportions" reflects the same principle this mirrors on
   * `CategoryProductCard`'s own `tallImage` prop: image *proportions* stay
   * page-specific by design; the surrounding card chrome (every other
   * class in this component) does not. */
  unified?: boolean;
}) {
  const { t, locale } = useLanguage();
  const { currency } = useCurrency();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(game.slug);
  const hasDiscount = game.discount > 0;
  const resolvedHref = href ?? `/games/${game.slug}`;
  const isLg = size === "lg";

  const releaseDateLabel = showReleaseDate
    ? t("home.newReleases.releasedOn").replace("{date}", formatShortDate(game.releaseDate, locale))
    : null;

  // UI-06 §9 / UI-10 §4: a compact circular button with a clean white
  // surface, subtle border, and its own shadow — always positioned inside
  // the image's own top-right corner. UI-10 §4 gives this an explicit
  // 36–40px target (was 32px/h-8) and an 18–20px icon (was 16px/h-4) — sized
  // to the low end of both ranges, which reads as "compact" while still
  // meeting the stated minimum. Wishlist state/click logic
  // (`toggleWishlist`) is untouched.
  const wishlistButton = (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={() => toggleWishlist(game.slug)}
      aria-label={t("actions.wishlist")}
      aria-pressed={wishlisted}
      className="absolute right-2.5 top-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
    >
      <Heart className={cn("h-[18px] w-[18px]", wishlisted && "fill-black")} />
    </motion.button>
  );

  return (
    <motion.div
      // UI-06 §11: one restrained hover treatment everywhere — a small 2px
      // lift plus a soft shadow/border change, not the previous dramatic
      // 4px lift some surfaces had or the flat no-lift other surfaces had.
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow duration-200 hover:border-foreground/15 hover:shadow-md",
        className
      )}
    >
      {/* UI-03.5 §1: a noticeably taller image area — 4:3 instead of
          16:10 — but ONLY for the "All Games" grid (`unified && !isLg`);
          Trending's own `unified && isLg` cards keep the original 16:10
          untouched, and every non-`unified` call site (homepage,
          RecentlyViewed, account) keeps 16:10 too. `GameArtwork` already
          fills its container responsively (`preserveAspectRatio="xMidYMid
          slice"`, a "cover" fit with no stretching/distortion), so widening
          the box's own aspect-ratio is the correct, non-destructive way to
          grow it. */}
      <div className={cn("relative overflow-hidden", unified && !isLg ? "aspect-[4/3]" : "aspect-[16/10]")}>
        <Link href={resolvedHref} prefetch={false} className="block h-full w-full" aria-label={game.title}>
          <GameArtwork
            game={game}
            className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </Link>

        {/* UI-06 §10: one compact discount badge, secondary to the image —
            no second, redundant discount indicator anywhere on the card
            (see the price row below). */}
        {hasDiscount && (
          <div className="pointer-events-none absolute left-2.5 top-2.5">
            <Badge variant="solid">-{game.discount}%</Badge>
          </div>
        )}
        {wishlistButton}
      </div>

      <div className={cn("flex flex-1 flex-col gap-2", isLg ? "p-5" : "p-4")}>
        {/* UI-10 §6/§14: translated via the same `platformTranslationKey`
            map the filter checkboxes already use for this exact value set
            ("PC"/"Mobile"/"PC & Mobile") — was rendering the raw English
            value regardless of locale (e.g. always "Mobile", never Lao's
            "ມືຖື" or Thai's "มือถือ"), a real gap against "must support
            Lao/English/Thai" that this step's own platform-badge section
            calls out. */}
        <Badge variant="subtle" className="w-fit !font-medium">
          {t(platformTranslationKey[game.platform])}
        </Badge>

        {/* UI-06 §5/§12: clamps to 2 lines (was 1) instead of overflowing
            or forcing tiny text, with a matching `min-h` (2 real lines at
            this size/font's own default line-height) so a short 1-line
            title and a long 2-line title still leave every card in the
            same grid row aligned — no ugly per-card height jump. */}
        <Link
          href={resolvedHref}
          prefetch={false}
          className={cn(
            "line-clamp-2 font-medium tracking-tight text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
            isLg ? "min-h-[3.5rem] text-lg" : "min-h-[3rem] text-base"
          )}
        >
          {game.title}
        </Link>

        {showReleaseDate ? (
          <p className="text-xs text-secondary">{releaseDateLabel}</p>
        ) : (
          <div className="flex items-center gap-1 text-xs text-secondary" aria-label={`${t("common.rating")}: ${game.rating}`}>
            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" aria-hidden="true" />
            <span>{game.rating.toFixed(1)}</span>
          </div>
        )}

        <div className="mt-auto flex items-end gap-2 pt-1">
          <span className={cn("font-semibold tracking-tight text-foreground", isLg ? "text-lg" : "text-base")}>
            {game.price === 0 ? t("common.free") : formatPrice(game.price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-secondary line-through">{formatPrice(game.originalPrice, currency)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
