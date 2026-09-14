"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { PurchaseTrustBadges } from "@/components/marketplace/PurchaseTrustBadges";
import { WishlistToggleButton } from "@/components/marketplace/WishlistToggleButton";
import { getProductTypeInfo } from "@/data/productTypes";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { recordRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { gameToProduct } from "@/lib/products/productAdapter";
import { useWishlist } from "@/lib/wishlist/WishlistProvider";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/currency/formatPrice";
import type { Game } from "@/types/game";
import type { StockStatus } from "@/types/product";

/**
 * The right-hand info panel on the product detail page: category, title,
 * rating, price, description, stock, quantity, purchase actions, and
 * (Step 51) a Product Information section — the wishlist/purchase
 * controls. A client component only because it needs translated strings
 * (t()) and interactive state — the page itself stays a Server Component
 * so metadata generation keeps working.
 *
 * `stockStatus` comes from `Product` (Step 39's Supabase-backed catalog),
 * not `Game` — `Game` has no stock concept at all, so this is threaded in
 * as its own prop from `app/games/[slug]/page.tsx` (which already fetches
 * `product` for its JSON-LD, Step 40) rather than inventing a field on
 * `Game`/`games.ts` (Step 51 §18 — do not modify catalog data).
 */
export function GameDetailInfo({ game, stockStatus }: { game: Game; stockStatus: StockStatus }) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(game.slug);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // Step 64 §5: guards "Buy Now" against a rapid double-click adding the
  // line twice before navigation to /checkout actually happens — the same
  // guard WalletProductView/TopUpFlowView's own "Buy Now" now has. The
  // check itself lives on a ref, not just the `isNavigatingToCheckout`
  // state below: a state update only takes effect on the next render, so
  // two clicks fired faster than a render (e.g. genuinely simultaneous,
  // not just close together) would both still read the old `false` from
  // their own render's closure. A ref is mutated synchronously, so the
  // very next call — however soon — sees it immediately. The state value
  // still exists purely to visually disable the button.
  const isNavigatingToCheckoutRef = useRef(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);
  const hasDiscount = game.discount > 0;
  const outOfStock = stockStatus === "out_of_stock";
  // Step 64 §1: a translated Product Type badge + (Product Information
  // row) matching WalletProductView's own header — derived via the
  // existing `gameToProduct` adapter (Step 35, already used by
  // Navbar's search suggestions the same way) rather than a new
  // Game→ProductType mapping. `region` comes from the same adapter call —
  // always "Global" for a real game today (see that adapter's own
  // comment), same honest value the Product model already carries.
  const { productType, region } = gameToProduct(game);
  const productTypeInfo = getProductTypeInfo(productType);

  // Record this visit for the /games page's "Recently Viewed" row. Depends
  // on game.slug so it still fires correctly if this component instance is
  // ever reused across a slug change instead of remounted.
  useEffect(() => {
    recordRecentlyViewed(game.slug);
  }, [game.slug]);

  // Brief visual confirmation after adding to cart, then reverts to the
  // normal label — a simple, local alternative to a global toast system.
  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  function handleAddToCart() {
    addToCart(game.slug, quantity);
    setJustAdded(true);
  }

  // "Buy Now" (Step 51 §4) uses the exact same cart system as "Add to
  // Cart" — there is no second/parallel checkout implementation — it just
  // also navigates straight to the existing /checkout route afterward.
  function handleBuyNow() {
    if (isNavigatingToCheckoutRef.current) return;
    isNavigatingToCheckoutRef.current = true;
    setIsNavigatingToCheckout(true);
    addToCart(game.slug, quantity);
    router.push("/checkout");
  }

  function decreaseQuantity() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increaseQuantity() {
    // Step 51 §7: the catalog only has `stockStatus`, never a numeric
    // stock count — there's nothing real to cap the upper bound against,
    // so inventing one (e.g. "max 10") would be exactly the kind of
    // fabricated data this step is told not to add. The only real
    // constraint enforced here is the minimum of 1 (decreaseQuantity).
    setQuantity((prev) => prev + 1);
  }

  const stockLabelKey = stockStatus === "in_stock" ? "inStock" : stockStatus === "low_stock" ? "lowStock" : "outOfStock";

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="subtle" className="w-fit !font-medium">
          {game.platform}
        </Badge>
        {/* UI-25: a Category badge (game.genre) alongside the others, so
            platform/category/region read together as one clear metadata
            cluster at a glance — the same real field already shown further
            down in Product Information, not new data. */}
        <Badge variant="outline" className="w-fit !font-medium">
          {game.genre}
        </Badge>
        {/* Step 64 §1: Product Type + Region badges, matching the same
            three-badge header WalletProductView already shows for every
            wallet/gift-card product — standardizes the header across every
            product-detail template. */}
        {productTypeInfo && (
          <Badge variant="outline" className="w-fit !font-medium">
            {t(productTypeInfo.translationKey)}
          </Badge>
        )}
        <Badge variant="subtle" className="w-fit !font-medium">
          {region}
        </Badge>
        <Badge variant={outOfStock ? "outline" : "subtle"} className="w-fit !font-medium">
          {t(`games.filters.${stockLabelKey}`)}
        </Badge>
      </div>

      {/* UI-25: title capped at `sm:text-3xl` (dropping the old
          `lg:text-4xl` step) — prominent without reading oversized on a
          large desktop screen — and the wishlist toggle moves up here,
          beside the title (matching WalletProductView's own placement),
          out of the purchase-actions row below so Add to Cart/Buy Now
          aren't competing with a third, unrelated action for attention. */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
          {game.title}
        </h1>
        <WishlistToggleButton wishlisted={wishlisted} onToggle={() => toggleWishlist(game.slug)} />
      </div>

      <div
        className="flex items-center gap-1 text-sm text-secondary"
        aria-label={`${t("common.rating")}: ${game.rating}`}
      >
        <Star className="h-4 w-4 fill-secondary text-secondary" aria-hidden="true" />
        <span>{game.rating.toFixed(1)}</span>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <span className="text-2xl font-semibold text-foreground sm:text-3xl">
          {game.price === 0 ? t("common.free") : formatPrice(game.price, currency)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-sm text-secondary line-through">{formatPrice(game.originalPrice, currency)}</span>
            <Badge variant="solid">-{game.discount}%</Badge>
          </>
        )}
      </div>

      <p className="max-w-xl text-sm leading-relaxed text-secondary sm:text-base">{game.description}</p>

      {/* UI-11 §3: a distinct purchase panel — clean white surface, subtle
          border, rounded corners, generous internal spacing — wrapping the
          exact same quantity/Add-to-Cart/Buy-Now/Wishlist controls and
          trust strip that already lived loose in the page flow. Matches
          the bordered purchase-summary card `WalletProductView` already
          gives its own purchase controls, so both product-detail templates
          now share the same "clear, trustworthy purchase area" treatment —
          no control, state, or handler here changed, only the container
          around them. */}
      <div className="mt-2 flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 rounded-full border border-border">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={outOfStock || quantity <= 1}
              aria-label={`${t("cart.decreaseQuantity")} — ${game.title}`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span
              className="w-8 text-center text-sm font-medium text-foreground"
              aria-label={`${t("gameDetail.quantityLabel")}: ${quantity}`}
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={increaseQuantity}
              disabled={outOfStock}
              aria-label={`${t("cart.increaseQuantity")} — ${game.title}`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* UI-25: Add to Cart reads as the clear primary CTA — full-width
            on mobile and the wider (`flex-1`) of the two on desktop, with
            Buy Now staying secondary alongside it. Wishlist no longer lives
            in this row (see the toggle beside the title above). */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={cn(buttonClasses("primary", "lg"), "w-full disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:flex-1")}
          >
            {outOfStock ? (
              <span>{t("games.filters.outOfStock")}</span>
            ) : justAdded ? (
              <>
                <Check className="h-5 w-5" aria-hidden="true" />
                <span>{t("cart.addedToCart")}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                <span>{t("actions.addToCart")}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock || isNavigatingToCheckout}
            className={cn(buttonClasses("secondary", "lg"), "w-full disabled:pointer-events-none disabled:opacity-50 sm:w-auto")}
          >
            <span>{t("home.hero.buyNow")}</span>
          </button>
        </div>

        {/* Trust/purchase info (Step 67 §11) — right below the purchase
            actions, the same "near the purchase panel" placement the wallet/
            top-up templates give it inside their own sticky summary card. */}
        <PurchaseTrustBadges />
      </div>

      {/* Product Information (Step 51 §9, extended Step 64 §6) — real,
          existing fields only: category/genre, platform, and product type
          are all already shown elsewhere on the page in badge form,
          restated here as a clear labeled list. "Delivery: Digital" states
          the format honestly (every product in this catalog is a digital
          good) without claiming any specific delivery time or guarantee
          that isn't already true. */}
      <div className="mt-2 rounded-2xl border border-border p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("gameDetail.productInfo")}</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-secondary">{t("games.filters.categoryLabel")}</dt>
            <dd className="font-medium text-foreground">{game.genre}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-secondary">{t("games.filters.platformLabel")}</dt>
            <dd className="font-medium text-foreground">{game.platform}</dd>
          </div>
          {productTypeInfo && (
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">{t("games.filters.productTypeLabel")}</dt>
              <dd className="font-medium text-foreground">{t(productTypeInfo.translationKey)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-secondary">{t("gameDetail.deliveryLabel")}</dt>
            <dd className="font-medium text-foreground">{t("gameDetail.digitalDelivery")}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-secondary">{t("games.filters.stockLabel")}</dt>
            <dd className="font-medium text-foreground">{t(`games.filters.${stockLabelKey}`)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
