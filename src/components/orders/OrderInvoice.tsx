"use client";

import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GameArtwork } from "@/components/ui/GameArtwork";
import { Logo } from "@/components/ui/Logo";
import { games } from "@/data/games";
import { paymentMethods } from "@/data/paymentMethods";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { formatPrice } from "@/lib/currency/formatPrice";
import { formatShortDate } from "@/lib/formatDate";
import { orderPaymentStatusTranslationKey } from "@/lib/orders/orderPaymentStatusLabels";
import { orderStatusTranslationKey } from "@/lib/orders/orderStatusLabels";
import type { Order } from "@/types/order";

const ROW_GRID = "sm:grid sm:grid-cols-[64px_1fr_72px_100px_110px] sm:items-center sm:gap-4";

/**
 * The printable invoice for a single order (UI-23), used only by
 * `OrderDetailView` (`/orders/[reference]`). Distinct from the shared
 * `OrderSummary` (`checkout/OrderSummary.tsx`, reused across /checkout,
 * /cart, and the order-success screen) which stays a compact list — this is
 * a fuller, letterhead-style document (branding, order + customer meta, a
 * genuine per-line Platform/Unit Price/Line Total breakdown) purpose-built
 * for this one page's invoice requirement and for the browser's own
 * Print/Save-as-PDF flow, so it doesn't need to reshape `OrderSummary`'s
 * existing compact look everywhere else it's used.
 *
 * Every value comes straight from the real, persisted `Order` record
 * (types/order.ts) — nothing here is invented, and nothing resembling a
 * payment credential (card number, CVV, PIN, OTP, token) is ever read or
 * rendered — the `Order` type has no such field to begin with. `platform`
 * is the one field not stored on an order line (see `OrderItem`'s own
 * comment in types/order.ts) and is enriched from the live catalog by slug,
 * purely for display — the same fallback-safe lookup OrderSuccessView/
 * OrderDetailView already do for decorative artwork. Real orders can only
 * ever contain real catalog games (demo wallet/gift-card/top-up products
 * are rejected at order creation — see `api/orders/route.ts`'s own
 * comment), so this resolves correctly unless a game was delisted after
 * the order was placed, in which case the Platform badge is simply omitted
 * rather than guessed.
 *
 * No PDF library is used — "Save as PDF" is the browser's own native print
 * dialog (`window.print()`), which every modern browser can render to a
 * PDF file itself. `print:` utilities below (and the global print rule in
 * globals.css that hides the site header/footer) are the entire "PDF"
 * feature; installing a PDF library was judged unnecessary for this need.
 */
export function OrderInvoice({ order }: { order: Order }) {
  const { t, locale } = useLanguage();
  const { currency } = useCurrency();

  const selectedMethod = paymentMethods.find((method) => method.name === order.paymentMethod);
  const PaymentIcon = selectedMethod?.icon;

  const lines = order.items.map((item) => {
    const catalogGame = games.find((game) => game.slug === item.productSlug);
    return {
      key: `${item.productId}-${item.productSlug}`,
      game: {
        id: catalogGame?.id ?? item.productId,
        slug: item.productSlug,
        title: item.productName,
        genre: catalogGame?.genre ?? "Other",
        price: item.unitPrice,
      },
      platform: catalogGame?.platform,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    };
  });

  return (
    <section
      aria-labelledby="order-invoice-heading"
      className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8 print:rounded-none print:border-none print:p-0"
    >
      {/* Letterhead — DANSHOP branding on one side, invoice identity on the other. */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <Logo />
        <div className="text-right">
          <h2 id="order-invoice-heading" className="text-lg font-semibold text-foreground sm:text-xl">
            {t("orders.invoiceTitle")}
          </h2>
          <p className="mt-1 text-sm text-secondary">{order.orderReference}</p>
          <p className="text-sm text-secondary">{formatShortDate(order.createdAt.slice(0, 10), locale)}</p>
        </div>
      </div>

      {/* Order meta + customer info, side by side on wider screens. */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-secondary">{t("checkout.status")}</dt>
            <dd className="font-medium text-foreground">{t(orderStatusTranslationKey[order.orderStatus])}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-secondary">{t("orders.paymentStatusLabel")}</dt>
            <dd className="font-medium text-foreground">{t(orderPaymentStatusTranslationKey[order.paymentStatus])}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-secondary">{t("checkout.paymentMethod")}</dt>
            <dd className="flex items-center gap-2 font-medium text-foreground">
              {PaymentIcon && <PaymentIcon className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />}
              <span className="truncate">{order.paymentMethod}</span>
            </dd>
          </div>
        </dl>

        <dl className="flex flex-col gap-1 text-sm sm:text-right">
          <dt className="text-secondary">{t("checkout.customerInfo")}</dt>
          <dd className="font-medium text-foreground">{order.customer.fullName || "—"}</dd>
          <dd className="break-all text-secondary">{order.customer.email || "—"}</dd>
        </dl>
      </div>

      {/* Line items. A real <table> isn't used (matching how every other
          list in this app — CartPageView, OrderSummary, OrderCard — is
          built from flex/grid rows, not <table>): the column-header row
          and each item row share the exact same grid template, and each
          item row's own field groups switch to `sm:contents` so their
          children become that row's real grid cells, without needing an
          actual <table>/<tr>/<td>. */}
      <div className="mt-8">
        <div
          className={`hidden border-b border-border pb-3 text-xs font-medium uppercase tracking-wide text-secondary ${ROW_GRID}`}
        >
          <span aria-hidden="true" />
          <span>{t("orders.productLabel")}</span>
          <span className="text-right">{t("gameDetail.quantityLabel")}</span>
          <span className="text-right">{t("wallet.unitPrice")}</span>
          <span className="text-right">{t("checkout.total")}</span>
        </div>

        <ul className="flex flex-col divide-y divide-border">
          {lines.map((line) => (
            <li key={line.key} className={`flex flex-col gap-3 py-4 break-inside-avoid ${ROW_GRID}`}>
              <div className="flex items-center gap-3 sm:contents">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-16">
                  <GameArtwork game={line.game} className="h-full w-full" />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium text-foreground sm:text-base">{line.game.title}</p>
                  {line.platform && (
                    <Badge variant="subtle" className="mt-1 w-fit">
                      {line.platform}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm sm:contents">
                <span className="text-secondary sm:hidden">{t("gameDetail.quantityLabel")}</span>
                <span className="font-medium text-foreground sm:text-right sm:font-normal sm:text-secondary">
                  {line.quantity}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm sm:contents">
                <span className="text-secondary sm:hidden">{t("wallet.unitPrice")}</span>
                <span className="font-medium text-foreground sm:text-right sm:font-normal sm:text-secondary">
                  {formatPrice(line.unitPrice, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm sm:contents">
                <span className="text-secondary sm:hidden">{t("checkout.total")}</span>
                <span className="font-semibold text-foreground sm:text-right">
                  {formatPrice(line.totalPrice, currency)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Totals — the same real, existing subtotal/discount/total figures
          the order record itself carries (no new pricing math). */}
      <div className="mt-2 flex flex-col gap-2 border-t border-border pt-6 text-sm sm:ml-auto sm:w-72">
        <div className="flex items-center justify-between text-secondary">
          <span>{t("cart.subtotal")}</span>
          <span>{formatPrice(order.subtotal, currency)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex items-center justify-between text-secondary">
            <span>{t("checkout.discount")}</span>
            <span>-{formatPrice(order.discount, currency)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border pt-3 text-xl font-semibold text-foreground">
          <span>{t("checkout.total")}</span>
          <span>{formatPrice(order.total, currency)}</span>
        </div>
      </div>

      <div className="mt-8 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface-elevated px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          {t("orders.printInvoice")}
        </button>
      </div>
    </section>
  );
}
