"use client";

import Link from "next/link";
import { ArrowLeft, PackageX } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { OrderInvoice } from "@/components/orders/OrderInvoice";
import { useLanguage } from "@/hooks/useLanguage";
import { useOrder } from "@/hooks/useOrders";
import { formatShortDate } from "@/lib/formatDate";

/**
 * A single order's detail view (Step 53 §5), reached from Order History at
 * /orders/[reference] — also where OrderSuccessView's "View Order Details"
 * button (UI-21) and a clickable order reference (UI-23) both point, so
 * there is exactly one order-detail page, not a second one under /account
 * (UI-23's own brief explicitly allows reusing an existing route instead of
 * building `/account/orders/[orderReference]` from scratch).
 *
 * UI-23 (Order Detail + Invoice Foundation): the old three separate cards
 * (a compact order-meta `dl`, the shared `OrderSummary`, a customer-info
 * `dl`) are replaced by one `OrderInvoice` — a fuller, letterhead-style,
 * printable document covering every field this step asks for (branding,
 * order + payment status, payment method, customer info, and a genuine
 * per-line Platform/Unit Price/Line Total breakdown), plus a "Print / Save
 * as PDF" control using the browser's own print dialog. The page container
 * widens from the old `max-w-lg` (too narrow for an invoice with real
 * columns) to `max-w-4xl`. The loading/error/not-found branches are
 * unchanged.
 */
export function OrderDetailView({ reference }: { reference: string }) {
  const { t, locale } = useLanguage();
  const { status, order } = useOrder(reference);

  const backLink = (
    <Link
      href="/orders"
      prefetch={false}
      className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 print:hidden"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t("orders.backToOrders")}
    </Link>
  );

  if (status === "loading") {
    return (
      <div className="py-10 sm:py-12 lg:py-16">
        <Container>
          <div className="mx-auto max-w-lg">
            {backLink}
            <p role="status" className="py-16 text-center text-sm text-secondary">
              {t("orders.loading")}
            </p>
          </div>
        </Container>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-10 sm:py-12 lg:py-16">
        <Container>
          <div className="mx-auto max-w-lg">
            {backLink}
            <div role="alert" className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-elevated py-16 text-center">
              <p className="text-base font-semibold text-foreground">{t("orders.errorTitle")}</p>
              <p className="max-w-sm text-sm text-secondary">{t("orders.errorDescription")}</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (status === "not-found" || !order) {
    return (
      <div className="py-10 sm:py-12 lg:py-16">
        <Container>
          <div className="mx-auto max-w-lg">
            {backLink}
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-elevated py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-foreground">
                <PackageX className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-base font-semibold text-foreground">{t("orders.notFoundTitle")}</p>
              <p className="max-w-sm text-sm text-secondary">{t("orders.notFoundDescription")}</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-12 lg:py-16 print:py-0">
      <Container className="print:max-w-none print:px-0">
        <div className="mx-auto max-w-4xl print:max-w-none">
          {backLink}

          <h1 className="mt-4 text-2xl font-semibold leading-snug text-foreground sm:text-3xl print:hidden">
            {order.orderReference}
          </h1>
          <p className="mt-1 text-sm text-secondary print:hidden">
            {t("orders.orderDate")}: {formatShortDate(order.createdAt.slice(0, 10), locale)}
          </p>

          <div className="mt-6 print:mt-0">
            <OrderInvoice order={order} />
          </div>

          <div className="mt-6 print:hidden">
            <Link href="/games" prefetch={false} className={buttonClasses("secondary", "lg", "w-full")}>
              {t("cart.continueShopping")}
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
