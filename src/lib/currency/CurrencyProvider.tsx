"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultCurrency, isCurrencyCode, type CurrencyCode } from "@/types/currency";

const STORAGE_KEY = "danshop-currency";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

/**
 * The one currency-preference store for the whole app (Step 56 §6) —
 * mirrors `lib/i18n/LanguageProvider.tsx`'s persistence pattern exactly
 * (same localStorage-after-mount restore, for the same hydration-safety
 * reason: the server always renders `defaultCurrency`, since it has no
 * access to this browser's localStorage). Reusing that proven pattern
 * instead of inventing a second one is what "do not create multiple
 * competing preference stores" (§6) asks for.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(defaultCurrency);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isCurrencyCode(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external source (localStorage) on mount, not deriving state from props/state
        setCurrencyState(stored);
      }
    } catch {
      // localStorage can be unavailable (e.g. privacy mode) — fall back to default.
    }
  }, []);

  function setCurrency(next: CurrencyCode) {
    setCurrencyState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore write failures — the currency still works for this page view.
    }
  }

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
