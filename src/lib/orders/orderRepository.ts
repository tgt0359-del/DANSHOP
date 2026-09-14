import type { Order, OrderStatus, OrderPaymentStatus } from "@/types/order";
import type { TopUpInfo } from "@/types/topUp";
import { writeLastOrderEmailStatus } from "@/lib/email/lastOrderEmailStatus";
import {
  getAllOrders as getAllOrdersFromStore,
  getLastOrderId,
  getOrderById as getOrderByIdFromStore,
  getOrderByReference as getOrderByReferenceFromStore,
  saveOrder,
  updateOrder,
} from "@/lib/orders/orderStore";

/**
 * The order service — the layer UI code should call instead of touching
 * lib/orders/orderStore.ts or the /api/orders route directly.
 */

export interface PlaceOrderItemInput {
  slug: string;
  quantity: number;
  variantId?: string;
  topUpInfo?: TopUpInfo;
}

export interface PlaceOrderInput {
  /** An opaque per-checkout-visit idempotency key (Step 79 §14) — pass the
   * SAME value back on every retry during one visit (see
   * `lib/generateId.ts`) so a double-click or network retry can never
   * create two orders. This is NOT the customer-facing order reference —
   * that is generated server-side, inside the trusted database function,
   * and is never accepted from the browser (Step 79 §3). */
  clientRequestId: string;
  customer: { fullName: string; email: string };
  paymentMethod: string;
  items: PlaceOrderItemInput[];
  /** The checkout visit's current UI language (Order Email Notification
   * Foundation phase) — passed straight through to `/api/orders`, which
   * uses it only to pick which already-translated copy the order-
   * confirmation email is written in; never persisted on the order itself
   * (see that route's own comment on why `orders` has no locale column).
   * Optional — omitting it just means the confirmation email (once a real
   * provider exists) falls back to the default locale. */
  locale?: string;
}

/** Thrown by `placeOrder` on any failure — `code` is one of the short,
 * stable codes `/api/orders` returns (e.g. "PRODUCT_OUT_OF_STOCK",
 * "EMPTY_CART", "UNAVAILABLE"); see `lib/orders/mapOrderErrorKey.ts` for
 * how the UI turns this into a localized, customer-safe message. Never
 * carries a raw server/database error string. */
export class OrderPlacementError extends Error {
  code: string;

  constructor(code: string) {
    super(`Order could not be placed (${code}).`);
    this.name = "OrderPlacementError";
    this.code = code;
  }
}

/**
 * Places a real order (Step 79) — posts the raw cart (slugs/quantities,
 * never a client-computed price) to the trusted server path
 * (`src/app/api/orders/route.ts`, which validates everything and creates
 * the real `orders`/`order_items` rows via Supabase's `create_order()`
 * function), then caches the confirmed result in this browser's existing
 * local order store (`lib/orders/orderStore.ts`) purely so
 * `OrderSuccessView`/`OrderHistoryView`/`useLastOrder` keep working
 * completely unchanged — they now display a record that is ALSO durably
 * persisted server-side, not a second source of truth. Throws
 * `OrderPlacementError` on any failure; the caller (OrderReviewView) is
 * responsible for NOT clearing the cart when this throws (Step 79 §15).
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  let response: Response;
  try {
    response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new OrderPlacementError("NETWORK_ERROR");
  }

  const payload: unknown = await response.json().catch(() => null);
  const payloadObject = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;

  if (!response.ok || !payloadObject?.order) {
    const code = typeof payloadObject?.code === "string" ? payloadObject.code : "GENERIC";
    throw new OrderPlacementError(code);
  }

  const order = payloadObject.order as Order;
  saveOrder(order);

  // Phase 29: `/api/orders` always includes the real, honest
  // `emailDeliveryStatus` for this order (it carries no sensitive data —
  // just a short status word) — stashed transiently here so
  // OrderSuccessView can show the customer an accurate "sent" vs. "not
  // sent yet" sentence, plus (in development only) a raw technical label.
  // Never persisted with the order record itself — see
  // lastOrderEmailStatus.ts's own comment.
  if (typeof payloadObject.emailDeliveryStatus === "string") {
    writeLastOrderEmailStatus(payloadObject.emailDeliveryStatus);
  }

  return order;
}

export function getOrderById(id: string): Order | undefined {
  return getOrderByIdFromStore(id);
}

export function getOrderByReference(reference: string): Order | undefined {
  return getOrderByReferenceFromStore(reference);
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | undefined {
  return updateOrder(id, { orderStatus: status });
}

export function updatePaymentStatus(id: string, status: OrderPaymentStatus): Order | undefined {
  return updateOrder(id, { paymentStatus: status });
}

/** The most recently created order in this browser, if any — what
 * /checkout/success reads (see useLastOrder). Not a "current user's
 * orders" query (there's no account system — see Order.userId), just
 * "whatever this browser placed last." */
export function getLastOrder(): Order | undefined {
  const id = getLastOrderId();
  return id ? getOrderByIdFromStore(id) : undefined;
}

/**
 * Order History (Step 53) — every order matching `userId`, newest first.
 * Same `userId: string | null` switch Steps 46/47 established for
 * wishlist/recently-viewed: `null` means guest (today, always — see
 * `lib/auth/guestAuthProvider.ts`), and returns every order in this
 * browser's own local store whose own `userId` is also `null` — which is
 * every order, since guest checkout is the only flow that exists (Step 34).
 *
 * Filtering by `userId` at all (rather than just "return everything")
 * isn't a no-op today so much as it's the correctness guarantee for
 * later: if a real `userId` is ever passed in, this only ever returns
 * orders whose own `userId` matches it — a guest viewer can never see a
 * signed-in user's orders and vice versa (Step 53 §12), even though both
 * would technically live in the same browser's storage. No Supabase query
 * is involved — orders have never been migrated off local storage (Step
 * 39 explicitly left orders/payments out of scope), and this step doesn't
 * change that.
 */
export function getOrders(userId: string | null): Order[] {
  const all = getAllOrdersFromStore();
  const owned = all.filter((order) => order.userId === userId);
  return [...owned].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
