"use client";

import { useEffect, useState } from "react";
import { getLastOrder } from "@/lib/orders/orderRepository";
import type { Order } from "@/types/order";

/**
 * The most recently placed order, read from client-side order storage.
 * Starts `null` on the server and on first client render (no access to
 * localStorage yet — same hydration-safe pattern as CartProvider), then
 * resolves after mount. Stays `null` if no order was ever placed in this
 * browser, or the referenced order can't be found (e.g. a direct visit to
 * /checkout/success, or a cleared localStorage) — callers must not invent
 * order data for that case.
 */
export function useLastOrder(): Order | null {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external source (localStorage) on mount, matching CartProvider's own pattern
    setOrder(getLastOrder() ?? null);
  }, []);

  return order;
}
