"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type AuthModalMode = "signIn" | "signUp";

type AuthModalContextValue = {
  isOpen: boolean;
  mode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

/**
 * The Sign In / Sign Up modal's open/closed state (Step 71) — mirrors
 * `lib/settings/SettingsModalProvider.tsx`'s exact pattern: one shared
 * piece of state, so every trigger (the Account page's guest section, the
 * header's account dropdown) opens the same modal instance (mounted once
 * in app/layout.tsx, next to `<SettingsModal />`) instead of each owning
 * a separate one. `mode` lets a caller open directly into Sign In or Sign
 * Up; the modal itself also lets the visitor switch between the two once
 * it's open.
 */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>("signIn");

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        openAuthModal: (nextMode = "signIn") => {
          setMode(nextMode);
          setIsOpen(true);
        },
        closeAuthModal: () => setIsOpen(false),
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
