"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

/**
 * The one shared search-query state for the whole site — the header's
 * search input (desktop + mobile) and the /games catalog page's own search
 * box both read and write this same value, so there's a single source of
 * truth instead of two separate search states that could drift apart.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");

  return <SearchContext.Provider value={{ query, setQuery }}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
