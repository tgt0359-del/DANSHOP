import type { OrderPaymentStatus } from "@/types/order";

/**
 * Which translation key each order's *payment* status maps to (Step 53) —
 * the same pattern `orderStatusLabels.ts` already established for
 * `OrderStatus`, kept as its own separate mapping since `OrderPaymentStatus`
 * is a distinct field with its own vocabulary (e.g. "failed"/"expired" have
 * no `OrderStatus` equivalent) — see `types/order.ts`'s own comment on why
 * the two are tracked independently.
 */
export const orderPaymentStatusTranslationKey: Record<OrderPaymentStatus, string> = {
  pending: "checkout.paymentStatus.pending",
  processing: "checkout.paymentStatus.processing",
  paid: "checkout.paymentStatus.paid",
  failed: "checkout.paymentStatus.failed",
  cancelled: "checkout.paymentStatus.cancelled",
  expired: "checkout.paymentStatus.expired",
};
