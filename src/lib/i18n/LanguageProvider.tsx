"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { defaultLocale, locales, type Locale } from "./config";
import lo from "@/locales/lo/common.json";
import en from "@/locales/en/common.json";
import th from "@/locales/th/common.json";

const messagesByLocale = { lo, en, th } satisfies Record<Locale, unknown>;

const STORAGE_KEY = "danshop-locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Look up a translated string by dot-separated key, e.g. t("nav.games"). */
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

function getNestedValue(source: unknown, path: string): string | undefined {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, source) as string | undefined;
}

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Restore a previously chosen language from this browser, if any.
  //
  // This intentionally runs after mount rather than in a lazy useState
  // initializer: the server always renders `defaultLocale` (it has no
  // access to this browser's localStorage), so reading localStorage here
  // — once, after hydration — is what keeps the client's first render
  // matching the server's and avoids a hydration mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isLocale(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external source (localStorage) on mount, not deriving state from props/state
        setLocaleState(stored);
      }
    } catch {
      // localStorage can be unavailable (e.g. privacy mode) — fall back to default.
    }
  }, []);

  // Keep <html lang="..."> in sync with the active language.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore write failures — the language still works for this page view.
    }
  }

  function t(key: string): string {
    const value = getNestedValue(messagesByLocale[locale], key);
    return value ?? key;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
