"use client";

import { GameArtwork } from "@/components/ui/GameArtwork";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/currency/formatPrice";
import { formatTopUpInfo } from "@/lib/topup/formatTopUpInfo";
import type { TopUpInfo } from "@/types/topUp";

/** The only fields this component (and the GameArtwork it renders) actually
 * reads. A real `Game` object satisfies this structurally (it's a superset),
 * so the live cart's lines (see useCheckoutLines) pass in unchanged; a
 * placed Order's lines (see /checkout/success) are reconstructed from the
 * order record's own snapshot instead of needing a full Game.
 * `topUpInfo` (Step 58) is undefined for every non-Top-Up line. */
export interface OrderSummaryLine {
  game: { id: string; slug: string; title: string; genre: string; price: number };
  quantity: number;
  topUpInfo?: TopUpInfo;
}

interface OrderSummaryProps {
  lines: OrderSummaryLine[];
  subtotal: number;
  totalSavings: number;
  total: number;
  /** Omit to hide the "Edit Cart" link — e.g. on /checkout/success, where
   * the order is already placed and the cart it came from no longer exists. */
  onEditCart?: () => void;
  /** Opt-in, larger presentation — UI-20.1 (Cart Page Layout Enlargement):
   * the `/cart` page renders this same summary at a bigger scale (more
   * padding, larger type, a more prominent Total) to fill its wider sidebar
   * column. Omit (or `"default"`) to get the exact original sizing every
   * checkout-flow screen already renders — this prop changes nothing for
   * any of those existing call sites.
   *
   * The enlargement itself only takes effect at `xl:` (1280px+) — exactly
   * where the Cart page's own sidebar column widens to match (see
   * `CartPageView`'s `xl:grid-cols-[1fr_460px]`). Below that, `"lg"` renders
   * identically to `"default"`: at the narrower 380px sidebar width Cart
   * still uses between 1024–1279px, the bigger type has no extra room and
   * was clipping long titles (e.g. "Crimson Horizon") — staging the size
   * bump to where the extra width actually exists avoids that. */
  size?: "default" | "lg";
}

/**
 * The checkout flow's order summary — shared across /checkout,
 * /checkout/payment, /checkout/review, /checkout/success, and /cart so
 * every step can never show different totals. Resolves nothing itself; the
 * caller passes already-resolved lines (see useCheckoutLines for the live
 * cart, or a placed Order's items for a finished order) so there's exactly
 * one place computing them.
 */
export function OrderSummary({ lines, subtotal, totalSavings, total, onEditCart, size = "default" }: OrderSummaryProps) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const isLg = size === "lg";

  return (
    <section
      aria-labelledby="checkout-summary-heading"
      className={cn("rounded-2xl border border-border bg-white p-5 sm:p-6", isLg && "xl:p-8")}
    >
      <div className="flex items-center justify-between">
        <h2
          id="checkout-summary-heading"
          className={cn("text-base font-semibold text-foreground", isLg && "xl:text-xl")}
        >
          {t("checkout.orderSummary")}
        </h2>
        {onEditCart && (
          <button
            type="button"
            onClick={onEditCart}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            {t("checkout.editCart")}
          </button>
        )}
      </div>

      <div className={cn("mt-4 flex flex-col gap-4", isLg && "xl:mt-5 xl:gap-5")}>
        {lines.map(({ game, quantity, topUpInfo }) => (
          <div key={game.id} className="flex gap-3">
            <div className={cn("h-14 w-20 shrink-0 overflow-hidden rounded-lg", isLg && "xl:h-16 xl:w-24")}>
              <GameArtwork game={game} className="h-full w-full" />
            </div>
            <div className="flex flex-1 items-start justify-between gap-2">
              <div>
                <p className={cn("line-clamp-1 text-sm font-medium text-foreground", isLg && "xl:text-base")}>
                  {game.title}
                </p>
                {formatTopUpInfo(topUpInfo, t) && (
                  <p className="line-clamp-1 text-xs text-secondary">{formatTopUpInfo(topUpInfo, t)}</p>
                )}
                <p className={cn("text-xs text-secondary", isLg && "xl:text-sm")}>
                  {t("checkout.qty").replace("{count}", String(quantity))}
                </p>
              </div>
              <p className={cn("shrink-0 text-sm font-medium text-foreground", isLg && "xl:text-base")}>
                {game.price === 0
                  ? t("common.free")
                  : quantity > 1
                    ? `${formatPrice(game.price, currency)} × ${quantity}`
                    : formatPrice(game.price, currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm",
          isLg && "xl:mt-6 xl:gap-3 xl:pt-5 xl:text-base"
        )}
      >
        <div className="flex items-center justify-between text-secondary">
          <span>{t("cart.subtotal")}</span>
          <span>{formatPrice(subtotal, currency)}</span>
        </div>
        {totalSavings > 0 && (
          <div className="flex items-center justify-between text-secondary">
            <span>{t("checkout.discount")}</span>
            <span>-{formatPrice(totalSavings, currency)}</span>
          </div>
        )}
        <div
          className={cn(
            "flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-foreground",
            isLg && "xl:pt-3 xl:text-xl"
          )}
        >
          <span>{t("checkout.total")}</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
      </div>
    </section>
  );
}
