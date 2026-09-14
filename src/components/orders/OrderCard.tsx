"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { formatPrice } from "@/lib/currency/formatPrice";
import { formatShortDate } from "@/lib/formatDate";
import { orderPaymentStatusTranslationKey } from "@/lib/orders/orderPaymentStatusLabels";
import { orderStatusTranslationKey } from "@/lib/orders/orderStatusLabels";
import type { Order } from "@/types/order";

/**
 * One order in the Order History list (Step 53 §4) — reference, date,
 * items + quantities, payment method, payment status, order status, total
 * (with currency), and a View Details link. Every value comes straight off
 * the order record itself (never the live catalog), so a listing never
 * needs the current product price to render correctly (Step 53 §5).
 */
export function OrderCard({ order }: { order: Order }) {
  const { t, locale } = useLanguage();
  const { currency } = useCurrency();
  // order.createdAt is a full ISO timestamp; formatShortDate expects a
  // plain yyyy-mm-dd date, so only the date portion is passed through.
  const dateOnly = order.createdAt.slice(0, 10);

  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-secondary">
            {t("orders.orderDate")}: {formatShortDate(dateOnly, locale)}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{order.orderReference}</p>
        </div>
        <Badge variant="subtle">{t(orderStatusTranslationKey[order.orderStatus])}</Badge>
      </div>

      <ul className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4">
        {order.items.map((item) => (
          <li key={`${item.productId}-${item.productSlug}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="line-clamp-1 text-foreground">{item.productName}</span>
            <span className="shrink-0 text-secondary">{t("checkout.qty").replace("{count}", String(item.quantity))}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-col gap-0.5 text-xs text-secondary">
          <span>
            {t("checkout.paymentMethod")}: <span className="font-medium text-foreground">{order.paymentMethod}</span>
          </span>
          <span>
            {t("orders.paymentStatusLabel")}:{" "}
            <span className="font-medium text-foreground">{t(orderPaymentStatusTranslationKey[order.paymentStatus])}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold text-foreground">{formatPrice(order.total, currency)}</span>
          <Link href={`/orders/${order.orderReference}`} prefetch={false} className={buttonClasses("secondary", "sm")}>
            {t("orders.viewDetails")}
          </Link>
        </div>
      </div>
    </div>
  );
}
