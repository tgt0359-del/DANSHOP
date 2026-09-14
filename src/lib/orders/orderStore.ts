import type { Order } from "@/types/order";

const ORDERS_KEY = "danshop_orders";
const LAST_ORDER_ID_KEY = "danshop_last_order_id";
/** Keep storage bounded — this is a demo order history, not a real database. */
const MAX_STORED_ORDERS = 20;

function readOrders(): Order[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    // Malformed JSON or localStorage unavailable (e.g. privacy mode) — treat as empty.
    return [];
  }
}

function writeOrders(orders: Order[]) {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Ignore write failures — order creation still proceeds (see saveOrder);
    // the order just won't survive a refresh on this visit.
  }
}

/**
 * Client-side order persistence — this project's stand-in for a real
 * orders backend (see Step 32's "make it easy to replace with a real
 * backend later"). This is the low-level storage layer only; UI code
 * should go through lib/orders/orderRepository.ts instead of calling
 * these directly — the repository is what's responsible for things like
 * duplicate-order prevention (Step 34 §6).
 *
 * `saveOrder` plays the role a `POST /orders` call would; `getOrderById`/
 * `getOrderByReference` the role of `GET /orders/:id` (or `?ref=`).
 * Swapping this module's internals for real network calls later is the
 * entire migration — nothing that reads an Order needs to change.
 *
 * Same localStorage-with-try/catch pattern as CartProvider and
 * useRecentlyViewed: never throws, degrades to "nothing persisted" if
 * storage is unavailable rather than breaking order creation.
 */
export function saveOrder(order: Order): void {
  const orders = readOrders();
  orders.push(order);
  // Trim oldest-first once over the cap.
  const trimmed = orders.length > MAX_STORED_ORDERS ? orders.slice(orders.length - MAX_STORED_ORDERS) : orders;
  writeOrders(trimmed);
  try {
    window.localStorage.setItem(LAST_ORDER_ID_KEY, order.id);
  } catch {
    // Ignore — the success page just falls back to "no recent order" if this didn't stick.
  }
}

/** Every order stored in this browser, oldest-first (insertion order) —
 * used by Order History (Step 53). Callers needing a specific display
 * order (newest-first) sort the result themselves; this stays a plain
 * read, matching every other function here. */
export function getAllOrders(): Order[] {
  return readOrders();
}

export function getOrderById(id: string): Order | undefined {
  return readOrders().find((order) => order.id === id);
}

export function getOrderByReference(reference: string): Order | undefined {
  return readOrders().find((order) => order.orderReference === reference);
}

/** Merges `patch` into the order matching `id` and bumps `updatedAt`.
 * Returns the updated order, or undefined if no order with that id exists. */
export function updateOrder(id: string, patch: Partial<Order>): Order | undefined {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return undefined;

  const updated: Order = { ...orders[index], ...patch, updatedAt: new Date().toISOString() };
  orders[index] = updated;
  writeOrders(orders);
  return updated;
}

export function getLastOrderId(): string | null {
  try {
    return window.localStorage.getItem(LAST_ORDER_ID_KEY);
  } catch {
    return null;
  }
}
