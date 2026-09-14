import type { OrderStatus } from "@/types/order";

/**
 * Which translation key each order status maps to — the one place that
 * mapping lives, so a future status transition (see
 * lib/payments/mapPaymentStatusToOrderPaymentStatus.ts and
 * lib/orders/orderRepository.ts's updateOrderStatus) only needs display
 * copy added here, not a change everywhere an order's status is shown.
 */
export const orderStatusTranslationKey: Record<OrderStatus, string> = {
  pending_payment: "checkout.orderStatus.pendingPayment",
  paid: "checkout.orderStatus.paid",
  processing: "checkout.orderStatus.processing",
  completed: "checkout.orderStatus.completed",
  cancelled: "checkout.orderStatus.cancelled",
  refunded: "checkout.orderStatus.refunded",
};
