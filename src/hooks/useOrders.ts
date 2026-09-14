"use client";

import { useEffect, useState } from "react";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { getOrderByReference, getOrders } from "@/lib/orders/orderRepository";
import type { Order } from "@/types/order";

export type OrdersStatus = "loading" | "error" | "ready";

/**
 * Order History's list-reading hook (Step 53). Starts in a `loading`
 * state on the server and on first client render (no access to
 * localStorage yet — same hydration-safe pattern `useLastOrder`,
 * `CartProvider`, and every other client-storage hook in this app already
 * uses), then resolves after mount. `orders` is newest-first — see
 * `orderRepository.ts`'s `getOrders`.
 *
 * `error` exists for completeness (Step 53 §6 asks for a real error
 * state) but has no realistic trigger today: every function underneath
 * this is already try/catch-guarded and degrades to an empty array rather
 * than throwing (matching `orderStore.ts`'s own documented philosophy).
 * This still wraps the read in its own try/catch, so a genuinely
 * unexpected failure surfaces here instead of crashing the page.
 */
export function useOrders(): { status: OrdersStatus; orders: Order[] } {
  // Step 71: sourced from the reactive `CurrentUserProvider` context
  // instead of a one-off `guestAuthProvider.getCurrentUser()` call —
  // re-runs (and re-filters) whenever sign-in/sign-out changes who "their
  // own orders" refers to. Orders themselves stay local-only (§8/§16 —
  // checkout architecture is unchanged), only whose they are shifts.
  // Waiting for `authStatus !== "loading"` avoids a brief flash of guest
  // orders before a returning signed-in visitor's real ones load.
  const { user: currentUser, status: authStatus } = useCurrentUserContext();
  const [status, setStatus] = useState<OrdersStatus>("loading");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (authStatus === "loading") return;

    let cancelled = false;

    // Wrapped in a microtask (still synchronous storage reads underneath)
    // purely so the setState calls below don't run synchronously inside
    // the effect body itself — avoids the cascading-render footgun
    // `react-hooks/set-state-in-effect` flags, matching this hook's own
    // pre-Step-71 shape (an async IIFE), just no longer needing to await
    // an async auth call first.
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const result = getOrders(currentUser?.id ?? null);
        if (cancelled) return;
        setOrders(result);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authStatus, currentUser]);

  return { status, orders };
}

export type OrderLookupStatus = "loading" | "error" | "not-found" | "found";

/** Order History's detail-reading hook — the same states as `useOrders`,
 * plus `not-found` for a reference that doesn't exist in this browser's
 * store (a stale/incorrect link, or a different browser/device). Looks up
 * directly by reference rather than filtering `getOrders()`'s result, so
 * a not-found case doesn't require the full list to have loaded first. */
export function useOrder(reference: string): { status: OrderLookupStatus; order: Order | undefined } {
  const { user: currentUser, status: authStatus } = useCurrentUserContext();
  const [status, setStatus] = useState<OrderLookupStatus>("loading");
  const [order, setOrder] = useState<Order | undefined>(undefined);

  useEffect(() => {
    if (authStatus === "loading") return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const userId = currentUser?.id ?? null;
        const found = getOrderByReference(reference);
        if (cancelled) return;

        // Step 53 §12: an order that exists in this browser's store but
        // belongs to a different userId is treated exactly like "not
        // found" — never partially shown to the wrong viewer.
        if (found && found.userId === userId) {
          setOrder(found);
          setStatus("found");
        } else {
          setStatus("not-found");
        }
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reference, authStatus, currentUser]);

  return { status, order };
}
