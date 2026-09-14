"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { OrderSummary, type OrderSummaryLine } from "@/components/checkout/OrderSummary";
import { games } from "@/data/games";
import { paymentMethods } from "@/data/paymentMethods";
import { useCurrency } from "@/hooks/useCurrency";
import { useLastOrder } from "@/hooks/useLastOrder";
import { useLanguage } from "@/hooks/useLanguage";
import { formatPrice } from "@/lib/currency/formatPrice";
import { formatShortDate } from "@/lib/formatDate";
import { getEmailDeliveryStatus } from "@/lib/email/emailDeliveryStatus";
import { readLastOrderEmailStatus } from "@/lib/email/lastOrderEmailStatus";
import { orderPaymentStatusTranslationKey } from "@/lib/orders/orderPaymentStatusLabels";
import { orderStatusTranslationKey } from "@/lib/orders/orderStatusLabels";

/**
 * Order confirmation — the checkout flow's last step (/checkout/success).
 * Shows the real, persisted Order record created the instant "Place Order"
 * succeeded (see OrderReviewView and lib/orders/orderRepository.ts) — not
 * the live cart, which has already been cleared by this point. A direct
 * visit with no order in this browser's order store (a fresh session,
 * cleared storage, or a refresh after the order history was cleared) shows
 * a plain fallback instead of fabricating order data.
 *
 * UI-21 (Order Confirmation / Invoice polish): widened to a proper
 * two-column invoice layout (order + customer info on the left, the
 * itemized `OrderSummary` — reusing its `size="lg"` from the Cart page work
 * — on the right) and now also surfaces payment status and the order date,
 * which this view previously omitted even though the `Order` record (see
 * types/order.ts) and `OrderDetailView` (its `/orders/[reference]` sibling)
 * already carry/show both. No new data, no new business logic — purely
 * presenting fields this record already has.
 *
 * There is deliberately no "Download Invoice" button: no PDF/export system
 * exists anywhere in this project (confirmed by search before writing this
 * file), and a real system prohibition for this step is inventing one — see
 * the emailConfirmationPending copy below for the same "don't claim a
 * capability that doesn't exist yet" rule applied to email delivery.
 *
 * Phase 29: the email-status sentence is now derived from the REAL
 * `emailDeliveryStatus` the order-creation response carried (see
 * `lastOrderEmailStatus.ts`), in every environment — "confirmation email
 * sent" only ever renders when that status genuinely is "sent"/"queued".
 * In this project's own environment today (no provider configured) that
 * can never happen, so the restrained "not sent yet" copy is what actually
 * shows — exactly as honest as before, just now provably tied to a real
 * result instead of always being a static placeholder.
 *
 * PHASE 34 (Real Order Email Notification Foundation): the raw stored
 * status is now classified through the shared, pure
 * `getEmailDeliveryStatus()` (`emailDeliveryStatus.ts`) into exactly the
 * three states Phase §6 asks for — "sent" / "not_configured" / "failed" —
 * instead of an inline two-way ternary here. A genuine provider failure
 * now reads as its own honest `checkout.emailConfirmationFailed` sentence
 * ("your order is confirmed, but the email didn't go out") rather than the
 * same copy used for "no provider connected yet," while the raw
 * dev-only badge below still shows the untranslated technical status for
 * debugging. No change to the underlying send logic (`lib/email/*`) —
 * this is presentation-only, sharing one classifier instead of
 * reimplementing the mapping per surface.
 */
export function OrderSuccessView() {
  const { t, locale } = useLanguage();
  const { currency } = useCurrency();
  const order = useLastOrder();
  // Phase 29: the real, honest outcome of this order's confirmation-email
  // attempt ("sent", "not_configured", "queued", "failed", ...) — read
  // after mount, same hydration-safe pattern every other client-storage
  // read in this app already uses. Drives the customer-facing sentence
  // below in EVERY environment (never claims "sent" unless this genuinely
  // says so); the separate raw "[Dev]" label further down additionally
  // gates on `NODE_ENV` so that raw technical word never appears in a
  // production build.
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external source (sessionStorage) on mount, matching useLastOrder's own identical pattern
    setEmailStatus(readLastOrderEmailStatus());
  }, []);

  if (!order) {
    return (
      <div className="py-16 sm:py-24">
        <Container>
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold text-foreground">{t("checkout.noRecentOrder")}</p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link href="/games" prefetch={false} className={buttonClasses("primary", "lg", "w-full sm:w-auto")}>
                {t("cart.continueShopping")}
              </Link>
              <Link href="/" prefetch={false} className={buttonClasses("secondary", "lg", "w-full sm:w-auto")}>
                {t("gameDetail.backToHome")}
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const selectedMethod = paymentMethods.find((method) => method.name === order.paymentMethod);
  const PaymentIcon = selectedMethod?.icon;
  // PHASE 34: classified once, via the shared `getEmailDeliveryStatus()`
  // (see its own comment) — exactly one of "sent" / "not_configured" /
  // "failed", never a fabricated claim in any branch.
  const emailUiStatus = getEmailDeliveryStatus(emailStatus);

  // The order record's own productName/unitPrice are the source of truth
  // for what was actually ordered (correct even if the live catalog
  // changes later); `id`/`genre` are only looked up from the catalog for
  // the decorative artwork pattern, with a neutral fallback if a game is
  // ever delisted.
  const orderLines: OrderSummaryLine[] = order.items.map((item) => {
    const catalogGame = games.find((game) => game.slug === item.productSlug);
    return {
      game: {
        id: catalogGame?.id ?? item.productId,
        slug: item.productSlug,
        title: item.productName,
        genre: catalogGame?.genre ?? "Other",
        price: item.unitPrice,
      },
      quantity: item.quantity,
      topUpInfo: item.topUpInfo,
    };
  });

  return (
    <div className="py-12 sm:py-14 lg:py-20">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-foreground">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-3xl font-semibold leading-snug text-foreground sm:text-4xl">
              {t("checkout.successTitle")}
            </h1>
            <p className="mt-2.5 text-base text-secondary sm:text-lg">{t("checkout.successMessage")}</p>
            {/* PHASE 34: honest, status-derived via the shared
                `getEmailDeliveryStatus()` classifier — exactly one of
                three sentences, never a fabricated claim: "sent" only for
                a genuine sent/queued result, "failed" only for a genuine
                provider failure, and the original "not connected yet"
                copy for not_configured (and the brief pre-hydration
                instant before emailStatus has loaded). */}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-secondary">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {emailUiStatus === "sent"
                ? t("checkout.emailConfirmationSent")
                : emailUiStatus === "failed"
                  ? t("checkout.emailConfirmationFailed")
                  : t("checkout.emailConfirmationPending")}
            </p>
            {/* Dev-only raw technical label — never rendered in a
                production build, never localized (a developer-facing debug
                note, not customer-facing copy, the same "logs stay in
                English" convention this app's own console.info/warn calls
                already follow), and clearly marked "[Dev]" so it can never
                be mistaken for the customer-facing sentence above. */}
            {process.env.NODE_ENV !== "production" && emailStatus && (
              <p className="mt-2 rounded-full border border-dashed border-border bg-surface px-3 py-1 font-mono text-[11px] text-secondary">
                [Dev] Email delivery: {emailStatus}
              </p>
            )}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px] lg:gap-8 xl:grid-cols-[1fr_460px]">
            {/* Left column: order details + customer info. */}
            <div className="flex flex-col gap-6">
              <section
                aria-label={t("checkout.orderDetails")}
                className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8"
              >
                <dl className="flex flex-col gap-4 text-sm sm:text-base">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-secondary">{t("checkout.orderNumber")}</dt>
                    <dd className="text-base font-semibold text-foreground sm:text-lg">
                      {/* UI-23: clickable straight to the real order-detail
                          page (/orders/[reference]) — the same destination
                          "View Order Details" below already links to, just
                          reachable directly from the reference itself too. */}
                      <Link
                        href={`/orders/${order.orderReference}`}
                        prefetch={false}
                        className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        {order.orderReference}
                      </Link>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-secondary">{t("orders.orderDate")}</dt>
                    <dd className="font-medium text-foreground">
                      {formatShortDate(order.createdAt.slice(0, 10), locale)}
                    </dd>
                  </div>
                  {/* Status and Payment Status: rendered as distinct pill
                      badges (the same monochrome Badge component used
                      elsewhere — outline variant, no invented color-coding)
                      so the two are visually unmistakable from each other
                      and from the plain-text rows around them. */}
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-secondary">{t("checkout.status")}</dt>
                    <dd>
                      <Badge variant="outline">{t(orderStatusTranslationKey[order.orderStatus])}</Badge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-secondary">{t("orders.paymentStatusLabel")}</dt>
                    <dd>
                      <Badge variant="outline">{t(orderPaymentStatusTranslationKey[order.paymentStatus])}</Badge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-secondary">{t("checkout.paymentMethod")}</dt>
                    <dd className="flex items-center gap-2 font-medium text-foreground">
                      {PaymentIcon && <PaymentIcon className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />}
                      <span className="truncate">{order.paymentMethod}</span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-base sm:text-xl">
                    <dt className="font-semibold text-foreground">{t("checkout.total")}</dt>
                    <dd className="font-semibold text-foreground">{formatPrice(order.total, currency)}</dd>
                  </div>
                </dl>
              </section>

              <section
                aria-labelledby="order-success-customer-heading"
                className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8"
              >
                <h2 id="order-success-customer-heading" className="text-base font-semibold text-foreground sm:text-lg">
                  {t("checkout.customerInfo")}
                </h2>
                <dl className="mt-5 flex flex-col gap-4 text-sm sm:text-base">
                  <div>
                    <dt className="text-secondary">{t("checkout.fullName")}</dt>
                    <dd className="font-medium text-foreground">{order.customer.fullName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-secondary">{t("checkout.email")}</dt>
                    <dd className="break-all font-medium text-foreground">{order.customer.email || "—"}</dd>
                  </div>
                </dl>
              </section>
            </div>

            {/* Right column: the itemized invoice — same shared OrderSummary
                /checkout and /cart already use, at the same enlarged `"lg"`
                scale the Cart page introduced, so this page's biggest
                content block is never the least readable one. */}
            <div>
              <OrderSummary
                lines={orderLines}
                subtotal={order.subtotal}
                totalSavings={order.discount}
                total={order.total}
                size="lg"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/games" prefetch={false} className={buttonClasses("primary", "xl", "w-full sm:flex-1")}>
              {t("cart.continueShopping")}
            </Link>
            <Link
              href={`/orders/${order.orderReference}`}
              prefetch={false}
              className={buttonClasses("secondary", "xl", "w-full sm:flex-1")}
            >
              {t("checkout.viewOrderDetails")}
            </Link>
            <Link href="/" prefetch={false} className={buttonClasses("secondary", "xl", "w-full sm:flex-1")}>
              {t("gameDetail.backToHome")}
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
