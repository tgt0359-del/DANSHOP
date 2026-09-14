"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GameArtwork } from "@/components/ui/GameArtwork";
import { useCart } from "@/hooks/useCart";
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
 * The whole card is clickable (image, title, background all open the
 * product detail route). The Wishlist and Add to Cart controls are real
 * buttons that stop propagation, so they never trigger navigation.
 * Wishlist/cart logic (`toggleWishlist`, `addToCart`) is the existing
 * provider logic — nothing about persistence changes here.
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
   * own route instead. When set, the card is a non-game entry and the
   * Add to Cart shortcut is hidden (those products pick a denomination on
   * their own detail page first). */
  href?: string;
  /** Opt-in larger internal typography/padding for the Games page's own
   * "Trending Games" row. */
  size?: "default" | "lg";
  /** A taller 4:3 image area for the Games page's own "All Games" grid
   * (`unified && !isLg`), vs. the 16:10 ratio every other surface keeps. */
  unified?: boolean;
}) {
  const { t, locale } = useLanguage();
  const { currency } = useCurrency();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();
  const wishlisted = isWishlisted(game.slug);
  const hasDiscount = game.discount > 0;
  const resolvedHref = href ?? `/games/${game.slug}`;
  const isLg = size === "lg";
  const canQuickAdd = href === undefined;

  const releaseDateLabel = showReleaseDate
    ? t("home.newReleases.releasedOn").replace("{date}", formatShortDate(game.releaseDate, locale))
    : null;

  function openDetail(event: React.MouseEvent<HTMLElement>) {
    // Only the card surface itself navigates; nested links/buttons handle
    // their own clicks (and stop propagation where they must not navigate).
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;
    router.push(resolvedHref);
  }

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={openDetail}
      className={cn(
        "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-[background-color,border-color,box-shadow] duration-200 hover:border-border-strong hover:bg-surface-hover hover:shadow-xl hover:shadow-black/30",
        className
      )}
    >
      <div className={cn("relative overflow-hidden", unified && !isLg ? "aspect-[4/3]" : "aspect-[16/10]")}>
        <Link href={resolvedHref} prefetch={false} className="block h-full w-full" aria-label={game.title} tabIndex={-1}>
          <GameArtwork
            game={game}
            className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <Badge variant="platform">{t(platformTranslationKey[game.platform])}</Badge>
          {hasDiscount && <Badge variant="discount">-{game.discount}%</Badge>}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={(event) => {
            event.stopPropagation();
            toggleWishlist(game.slug);
          }}
          aria-label={t("actions.wishlist")}
          aria-pressed={wishlisted}
          className={cn(
            "absolute right-2.5 top-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-background/70 text-white backdrop-blur-md transition-colors hover:border-white/25 hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            wishlisted && "border-primary/40 text-primary"
          )}
        >
          <Heart className={cn("h-[18px] w-[18px]", wishlisted && "fill-primary")} />
        </motion.button>
      </div>

      <div className={cn("flex flex-1 flex-col gap-2", isLg ? "p-5" : "p-4")}>
        <Link
          href={resolvedHref}
          prefetch={false}
          className={cn(
            "line-clamp-2 font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated",
            isLg ? "min-h-[3.5rem] text-lg" : "min-h-[2.75rem] text-[15px]"
          )}
        >
          {game.title}
        </Link>

        {showReleaseDate ? (
          <p className="text-xs text-secondary">{releaseDateLabel}</p>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-secondary" aria-label={`${t("common.rating")}: ${game.rating}`}>
            <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
            <span className="font-medium text-foreground/80">{game.rating.toFixed(1)}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{game.genre}</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex min-w-0 flex-col">
            {hasDiscount && (
              <span className="text-xs text-muted line-through">{formatPrice(game.originalPrice, currency)}</span>
            )}
            <span className={cn("font-bold tracking-tight text-foreground", isLg ? "text-xl" : "text-lg")}>
              {game.price === 0 ? t("common.free") : formatPrice(game.price, currency)}
            </span>
          </div>

          {canQuickAdd && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={(event) => {
                event.stopPropagation();
                addToCart(game.slug, 1);
              }}
              aria-label={`${t("actions.addToCart")}: ${game.title}`}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary-soft px-3 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden min-[400px]:inline">{t("actions.addToCart")}</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
