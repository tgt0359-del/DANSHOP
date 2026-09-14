import type { Currency } from "@/types/payment";
import type { TopUpInfo } from "@/types/topUp";

/**
 * DANSHOP's own fulfillment-lifecycle status for an order — kept separate
 * from OrderPaymentStatus below (Step 34 §4: a real system tracks these
 * independently, e.g. an order can be "processing" for fulfillment while
 * its payment is already "paid"). "pending_payment" is still the only
 * value the current checkout flow ever produces; the rest are prepared
 * for when a real fulfillment flow exists.
 */
export type OrderStatus = "pending_payment" | "paid" | "processing" | "completed" | "cancelled" | "refunded";

/**
 * DANSHOP's own record of a payment attempt's status. Distinct from the
 * payment PROVIDER's own PaymentStatus vocabulary (types/payment.ts,
 * uppercase, Step 33) — see lib/payments/mapPaymentStatusToOrderPaymentStatus.ts
 * for how one becomes the other. "pending" is the only value the current
 * checkout flow ever produces.
 */
export type OrderPaymentStatus = "pending" | "processing" | "paid" | "failed" | "cancelled" | "expired";

/** One line of a placed order. Deliberately flat — no Game object
 * reference — so an order stays an accurate historical record even if the
 * live catalog changes later. Not duplicated product data so much as a
 * point-in-time snapshot of it, the same way a real order-items table
 * would store it. */
export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** The shopper's Player Information (Step 58 — Game Top-Up System),
   * carried onto the order purely for display in Order Review, the order
   * confirmation, and Order History — undefined for every non-Top-Up
   * item, including every item created before this step existed. */
  topUpInfo?: TopUpInfo;
}

export interface OrderCustomer {
  fullName: string;
  email: string;
}

/**
 * A placed order — the durable record created when "Place Order" succeeds
 * (see lib/orders/orderRepository.ts). Deliberately flat, plain data (no
 * Game object references, no icons, no payment credentials): this is what
 * a real orders table/API would store, so swapping the client-side store
 * (see lib/orders/orderStore.ts) for a real backend later only means
 * changing that one module's internals, not this shape.
 */
export interface Order {
  /** Internal record id — a UUID here, a real database's primary key once
   * one exists. Never shown to the customer; see orderReference for that. */
  id: string;
  /** Human-facing order code shown to the customer, e.g. "DAN-20260906-C0SX". */
  orderReference: string;
  /** Always null today — no account/auth system exists in this project
   * yet, so every checkout is a guest checkout. Present now so a future
   * account system can attach orders to a user without reshaping this type. */
  userId: string | null;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  /** Always "USD" today — see Step 33 §8: no automatic conversion, no
   * invented exchange rates. Present now so the type already supports
   * "LAK" once an order can genuinely be placed in it. */
  currency: Currency;
  paymentMethod: string;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
  /** Reserved for a future real payment-provider integration (see
   * src/types/payment.ts and src/lib/payments/) — always unset today. */
  paymentSessionId?: string;
}
