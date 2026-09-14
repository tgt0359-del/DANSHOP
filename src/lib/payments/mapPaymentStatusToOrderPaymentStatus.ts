import type { PaymentStatus } from "@/types/payment";
import type { OrderPaymentStatus } from "@/types/order";

/**
 * How a payment provider's status maps onto DANSHOP's own
 * `Order.paymentStatus` — the single place this mapping lives, so a real
 * provider integration only ever calls this, never invents its own rules
 * for what counts as "paid."
 *
 * This is distinct from `Order.orderStatus` (fulfillment lifecycle, see
 * types/order.ts and orderRepository.ts's updateOrderStatus) — Step 34 §4
 * keeps payment status and order status as separate concerns. A real
 * integration would typically also advance orderStatus once paymentStatus
 * becomes "paid," but that business rule isn't implemented here since
 * nothing in this project ever produces a real "paid" payment status yet.
 *
 * IMPORTANT (Step 33 §3–4, Step 34): nothing in this project currently
 * calls this with anything but a manual/demo status, and nothing
 * currently transitions a real order through it. A genuine "paid"
 * transition must only ever follow a verified server-side confirmation —
 * a provider's webhook (see app/api/payments/webhook) or a
 * server-to-server status check — never a client-side success screen alone.
 */
export function mapPaymentStatusToOrderPaymentStatus(status: PaymentStatus): OrderPaymentStatus {
  switch (status) {
    case "PENDING":
      return "pending";
    case "PROCESSING":
      return "processing";
    case "PAID":
      return "paid";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    case "EXPIRED":
      return "expired";
  }
}
