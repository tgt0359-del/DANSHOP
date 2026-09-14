"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type CheckoutStateContextValue = {
  email: string;
  setEmail: (value: string) => void;
  fullName: string;
  setFullName: (value: string) => void;
  paymentMethod: string | null;
  setPaymentMethod: (value: string | null) => void;
};

const CheckoutStateContext = createContext<CheckoutStateContextValue | undefined>(undefined);

/**
 * Checkout-flow state that needs to survive real route changes between
 * /checkout, /checkout/payment, and /checkout/review — in memory only, no
 * localStorage, nothing sent anywhere. Email, full name, and the selected
 * payment method all reset on an actual page refresh (Step 29/30's "don't
 * persist unnecessarily" intent, just scoped to in-app navigation rather
 * than component-local state).
 *
 * This is not a second cart or checkout system: cart contents always come
 * from CartProvider (see useCheckoutLines). Once an order is actually
 * placed, its data moves into the real order store (see
 * lib/orders/orderStore.ts) — this provider only holds the in-progress
 * form/selection state for the current, not-yet-placed order.
 */
export function CheckoutStateProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  return (
    <CheckoutStateContext.Provider value={{ email, setEmail, fullName, setFullName, paymentMethod, setPaymentMethod }}>
      {children}
    </CheckoutStateContext.Provider>
  );
}

export function useCheckoutState(): CheckoutStateContextValue {
  const context = useContext(CheckoutStateContext);
  if (!context) {
    throw new Error("useCheckoutState must be used within a CheckoutStateProvider");
  }
  return context;
}
