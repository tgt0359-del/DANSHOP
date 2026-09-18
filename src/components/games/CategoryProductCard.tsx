"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/currency/formatPrice";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import type { Product } from "@/types/product";

/**
 * A product card for the category browsing page (Step 44). Deliberately
 * separate from `GameCard` (which takes a `Game`, not a `Product`, and
 * renders `GameArtwork`'s procedural placeholder instead of a real image
 * URL): this page's field list explicitly includes "product images", so
 * this card renders the actual `product.image` — the real, existing
 * placehold.co URL every product already has (Step 39.6's seed and the
 * local `gameToProduct` fallback both supply the same URL, so this works
 * identically whether `product` came from Supabase or the local fallback).
 *
 * No wishlist/cart controls here on purpose — this page's job is
 * browsing/discovery; buying and wishlisting stay on the product detail
 * page this card links to (`/games/${product.slug}`, unchanged, Step 44
 * §6), matching how `GameCard` itself only adds a wishlist button, never
 * an "Add to Cart" one, for the same reason.
 *
 * `isDemo` (Step 57 §8): set for products from `data/demoProducts.ts` that
 * have no real product-detail page to link to and must never "imply that
 * they are actually purchasable". A demo card renders as plain,
 * non-interactive content with a visible "Demo" badge instead of a working
 * link. As of the Wallet/Gift Card Product Detail step, this is no longer
 * every demo product: one with denominations (see
 * `data/productVariants.ts`) gets a real `/product/<slug>` detail page and
 * IS clickable — its caller passes `isDemo={false}` and the `href` prop
 * below instead. `href` overrides the default `/games/<slug>` link (real
 * catalog games only ever use the default).
 *
 * `tallImage` (UI-03.5 §2): opt-in-only, same seam `GameCard`'s own
 * `unified` prop already uses — this component is shared far beyond Gift
 * Cards (Wallets, Search results, Top-Up, every marketplace category page,
 * Related Products, `/games/pc|mobile|console`), so the taller 4:3 image
 * area this step asks for can't be the new default without also resizing
 * every one of those unrelated surfaces. Only `GiftCardMarketplaceView`'s
 * two call sites (Popular + the main results grid) pass it; every other
 * call site omits it and keeps the original 16:10 image exactly as before.
 */
export function CategoryProductCard({
  product,
  isDemo = false,
  href,
  showPriceFrom = false,
  tallImage = false,
}: {
  product: Product;
  isDemo?: boolean;
  href?: string;
  /** Prefixes the price with "From" (Step 57) — set for a product with
   * multiple denominations, whose `product.price` is its lowest variant's
   * price, not a single fixed price. */
  showPriceFrom?: boolean;
  /** See this component's own doc comment above — only the Gift Cards
   * marketplace opts in. */
  tallImage?: boolean;
}) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const hasDiscount = product.isOnSale && product.originalPrice != null && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / (product.originalPrice as number)) * 100)
    : 0;
  const resolvedHref = href ?? `/games/${product.slug}`;

  const image = (
    // A real, external placehold.co URL from the catalog data, not a
    // local asset Next's image optimizer would help with.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image}
      alt={product.name}
      // UI-15 §1: a subtle 1.03 zoom (was 1.05) — matches `GameCard`'s own
      // hover scale exactly, within this task's "around 1.02–1.04" range.
      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
      loading="lazy"
    />
  );

  return (
    // UI-06 §11 / UI-10 §3: same restrained hover treatment as `GameCard`
    // — a small lift plus a soft shadow/border change, nothing dramatic.
    // `shadow-sm` (was `shadow-md`) now matches `GameCard`'s own hover
    // shadow exactly, so every product card on the site elevates the same
    // small, quiet amount on hover regardless of which of the two card
    // components rendered it.
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-sm">
      {/* UI-03.5 §2: same 4:3 (vs 16:10) taller image area as the Games
          "All Games" grid, opt-in via `tallImage` only — see this
          component's own doc comment for why every other call site keeps
          16:10. `object-cover` on the real `<img>` below already handles
          the taller box correctly (crops to fill, no stretching). */}
      <div className={cn("relative overflow-hidden", tallImage ? "aspect-[4/3]" : "aspect-[16/10]")}>
        {isDemo ? (
          <div className="block h-full w-full">{image}</div>
        ) : (
          <Link href={resolvedHref} prefetch={false} className="block h-full w-full" aria-label={product.name}>
            {image}
          </Link>
        )}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5">
          {hasDiscount && <Badge variant="solid">-{discountPercent}%</Badge>}
          {isDemo && <Badge variant="outline" className="bg-white">{t("marketplace.demoBadge")}</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* UI-10 §6/§14: translated via the shared `platformTranslationKey`
            map (the same one the filter checkboxes already use for this
            exact `Platform` type) — was rendering the raw English value
            regardless of locale, a real gap against "must support Lao/
            English/Thai" this step's platform-badge section calls out. */}
        <Badge variant="subtle" className="w-fit !font-medium">
          {t(platformTranslationKey[product.platform])}
        </Badge>

        {/* UI-06 §5/§12: clamps to 2 lines (was 1) with a matching `min-h`
            (2 real lines at text-base's own default line-height), so a
            short 1-line title and a long 2-line title still leave every
            card in the same grid row aligned. */}
        {isDemo ? (
          <span className="line-clamp-2 min-h-[3rem] text-base font-medium tracking-tight text-foreground">
            {product.name}
          </span>
        ) : (
          <Link
            href={resolvedHref}
            prefetch={false}
            title={product.name}
            className="line-clamp-2 min-h-[3rem] text-base font-medium tracking-tight text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            {product.name}
          </Link>
        )}

        <div
          className="flex items-center gap-1 text-xs text-secondary"
          aria-label={`${t("common.rating")}: ${product.rating}`}
        >
          <Star className="h-3.5 w-3.5 fill-secondary text-secondary" aria-hidden="true" />
          <span>{product.rating.toFixed(1)}</span>
        </div>

        {/* UI-14: `flex-wrap` (was a single non-wrapping row) — matches
            `GameCard`'s own fix: a discounted price in a long-digit
            currency (LAK amounts routinely run 6-7 digits) plus its
            crossed-out original price can together exceed a narrow
            card's row width; wrapping the original price to its own
            line keeps both fully readable instead of clipping. */}
        <div className="mt-auto flex flex-wrap items-end gap-x-2 gap-y-0.5 pt-1">
          {/* `min-w-0`: without it, a flex item's default `min-width:
              auto` keeps this "From ₭1,259,790"-style composite span at
              its full intrinsic width even inside a `flex-wrap` row,
              which defeats the wrap above for exactly the long-LAK-price
              case it's meant to catch — this lets the span itself shrink
              so its own text can wrap onto a second line instead. A
              shrunk span still needs somewhere valid to break, though:
              the "From" label and the price number are two adjacent
              inline nodes with no space between them (only a CSS
              margin, which isn't a text break opportunity), so a `<wbr />`
              — a standard, invisible, zero-width break hint — is what
              actually lets the browser wrap between them when needed,
              without changing anything about how this reads when it
              doesn't need to wrap. */}
          <span className="min-w-0 text-base font-semibold text-foreground">
            {showPriceFrom && (
              <>
                <span className="mr-1 text-xs font-normal text-secondary">{t("wallet.from")}</span>
                <wbr />
              </>
            )}
            {product.price === 0 ? t("common.free") : formatPrice(product.price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-secondary line-through">
              {formatPrice(product.originalPrice as number, currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
