"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Minus, Plus, ShieldCheck, ShoppingCart, Trash2, Truck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { GameArtwork } from "@/components/ui/GameArtwork";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { useCart } from "@/hooks/useCart";
import { useCheckoutLines } from "@/hooks/useCheckoutLines";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { formatPrice } from "@/lib/currency/formatPrice";
import { resolveCartLine } from "@/lib/cart/resolveCartLine";
import { formatTopUpInfo } from "@/lib/topup/formatTopUpInfo";

/**
 * The full Cart page (`/cart`, Step 65 §Cart Page Premium UI/UX Polish,
 * enlarged further in UI-31 §Cart and Checkout Visual Polish) — a
 * wide, two-column counterpart to the `CartDrawer` slide-out panel, for
 * shoppers who want to review/edit their cart on its own page instead of in
 * the overlay. Both surfaces read and write the exact same cart: this view
 * resolves each stored `CartItem` via the same `resolveCartLine` the drawer
 * uses, and derives subtotal/discount/total via the same `useCheckoutLines`
 * checkout itself uses — there is no second cart system, no new pricing
 * logic, and no new exchange-rate math. `CartDrawer` (still opened from the
 * header's cart icon) is untouched by this file.
 *
 * The right column reuses the exact `OrderSummary` component `/checkout`
 * already renders (same subtotal/discount/total markup and translation
 * keys), so the drawer, this page, and checkout can never show different
 * numbers for the same cart. `onEditCart` is intentionally omitted here —
 * unlike on `/checkout`, this page already *is* the cart, so an "Edit Cart"
 * link back to itself would be redundant.
 */
export function CartPageView() {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { items, totalQuantity, removeFromCart, updateQuantity } = useCart();
  const { lines: summaryLines, subtotal, totalSavings, total } = useCheckoutLines();

  const lines = useMemo(
    () =>
      items
        .map((item) => {
          const resolved = resolveCartLine(item);
          return resolved ? { ...resolved, slug: item.slug, variantId: item.variantId } : null;
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    [items]
  );

  if (lines.length === 0) {
    return (
      <div className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-foreground">
              <ShoppingCart className="h-9 w-9" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{t("cart.empty")}</h1>
              <p className="text-sm text-secondary sm:text-base">{t("cart.emptyDescription")}</p>
            </div>
            <Link href="/games" prefetch={false} className={buttonClasses("primary", "lg", "mt-1")}>
              {t("cart.continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-14 lg:py-20">
      {/* UI-20.1: a wider, Cart-page-only content width (up to 1360px vs.
          the site's shared 1280px `Container`) — deliberately not using
          `Container` here so every other page's width is untouched; this is
          a page-local wrapper with the same horizontal padding scale. */}
      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-semibold leading-snug text-foreground sm:text-4xl lg:text-5xl">
            {t("actions.cart")}
          </h1>
          <span className="text-lg text-secondary">({totalQuantity})</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-10 lg:mt-12 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_460px]">
          {/* Left column: the editable item list. */}
          <div className="flex flex-col gap-5 sm:gap-6">
            {/* Digital delivery / trust strip — same real, existing copy
                CartDrawer already shows, just reused at page scale. */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3.5 text-xs font-medium text-secondary sm:gap-3 sm:px-6 sm:py-4 sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t("cart.digitalDelivery")}
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t("cart.fastDelivery")}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t("cart.secureCheckout")}
              </span>
            </div>

            {lines.map(({ game, quantity, href, slug, variantId, topUpInfo, platform }) => (
              <div key={game.id} className="flex gap-4 rounded-2xl border border-border bg-white p-5 sm:gap-6 sm:p-7">
                <Link
                  href={href}
                  prefetch={false}
                  aria-label={game.title}
                  className="block h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-32 xl:h-36 xl:w-36"
                >
                  <GameArtwork game={game} className="h-full w-full" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <Link
                      href={href}
                      prefetch={false}
                      className="line-clamp-1 text-base font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:text-lg lg:text-xl"
                    >
                      {game.title}
                    </Link>
                    <Badge variant="subtle" className="mt-1.5 w-fit">
                      {platform}
                    </Badge>
                    {formatTopUpInfo(topUpInfo, t) && (
                      <p className="mt-1.5 line-clamp-1 text-sm text-secondary">{formatTopUpInfo(topUpInfo, t)}</p>
                    )}
                  </div>

                  {/* Price sits on its own line, and the stepper/remove row
                      never has to share horizontal space with it — the same
                      stacking CartDrawer already uses (proven to fit in an
                      even narrower drawer panel) — so nothing is forced onto
                      one line at the narrowest supported widths (360px). */}
                  <div className="mt-3 flex flex-col gap-3 sm:mt-0 sm:items-end">
                    <div className="flex items-baseline gap-2 sm:gap-2.5">
                      <span className="text-base font-semibold text-foreground sm:text-xl">
                        {game.price === 0 ? t("common.free") : formatPrice(game.price, currency)}
                      </span>
                      {/* Original price/discount: only ever shown when the
                          resolved game actually carries a discount (real
                          catalog data, the same `discount > 0` check
                          GameCard already uses) — never hardcoded. Kept
                          deliberately small and muted next to the enlarged
                          current price above. */}
                      {game.discount > 0 && (
                        <span className="text-sm text-secondary line-through">
                          {formatPrice(game.originalPrice, currency)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1 rounded-full border border-border">
                        <button
                          type="button"
                          onClick={() => updateQuantity(slug, quantity - 1, variantId)}
                          disabled={quantity <= 1}
                          aria-label={`${t("cart.decreaseQuantity")} — ${game.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 sm:h-11 sm:w-11"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span
                          className="w-7 text-center text-base font-medium text-foreground sm:w-9"
                          aria-label={`${t("gameDetail.quantityLabel")}: ${quantity}`}
                          aria-live="polite"
                        >
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(slug, quantity + 1, variantId)}
                          aria-label={`${t("cart.increaseQuantity")} — ${game.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:h-11 sm:w-11"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(slug, variantId)}
                        aria-label={`${t("cart.removeItem")} — ${game.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:h-11 sm:w-11"
                      >
                        <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link
              href="/games"
              prefetch={false}
              className="w-fit text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              {t("cart.continueShopping")}
            </Link>
          </div>

          {/* Right column: the shared order summary (enlarged via
              OrderSummary's opt-in `size="lg"` — UI-31 now also opts
              /checkout, /checkout/payment, and /checkout/review into the
              same enlarged presentation, so the whole flow's summary card
              reads consistently) + the primary CTA, now the shared Button
              component's "xl" (56px) size — the same opt-in size UI-31 adds
              for the primary CTA on every other checkout-flow step. */}
          <div className="flex flex-col gap-5 sm:gap-6 lg:sticky lg:top-24 lg:self-start">
            <OrderSummary lines={summaryLines} subtotal={subtotal} totalSavings={totalSavings} total={total} size="lg" />
            <Link href="/checkout" prefetch={false} className={buttonClasses("primary", "xl", "w-full")}>
              {t("cart.checkout")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
