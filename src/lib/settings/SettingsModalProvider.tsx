"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SettingsModalContextValue = {
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
};

const SettingsModalContext = createContext<SettingsModalContextValue | undefined>(undefined);

/**
 * The Settings Modal's open/closed state (Step 56) — mirrors
 * `lib/cart/CartProvider.tsx`'s `isOpen`/`toggleCart` pattern: one shared
 * piece of state, so every trigger (Header, Sidebar, Footer — see
 * `SettingsButton`) opens the exact same modal instance (mounted once in
 * app/layout.tsx, next to `<CartDrawer />`) instead of each owning a
 * separate one. This is UI open/close state only, not a preference —
 * language/currency themselves live in `LanguageProvider`/
 * `CurrencyProvider`, never here.
 */
export function SettingsModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SettingsModalContext.Provider
      value={{
        isOpen,
        openSettings: () => setIsOpen(true),
        closeSettings: () => setIsOpen(false),
      }}
    >
      {children}
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal(): SettingsModalContextValue {
  const context = useContext(SettingsModalContext);
  if (!context) {
    throw new Error("useSettingsModal must be used within a SettingsModalProvider");
  }
  return context;
}
