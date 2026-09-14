"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { TopUpInfo } from "@/types/topUp";

/**
 * `variantId` (Step 57 — Wallet/Gift Card Product Detail System) is
 * optional and only ever set for a wallet/gift-card denomination (see
 * `data/productVariants.ts`) — every pre-existing call site never passes
 * one, so those items keep `variantId: undefined` exactly as before. Two
 * items with the same `slug` but different `variantId`s (e.g. a ฿50 and a
 * ฿500 Steam Wallet code) are distinct cart lines — see the composite-key
 * matching in `addToCart`/`removeFromCart`/`updateQuantity` below.
 *
 * `topUpInfo` (Step 58 — Game Top-Up System) is optional and only ever set
 * for a Game Top-Up product (see `types/topUp.ts`) — what the shopper
 * typed into the Player Information step, carried along purely for
 * display in the cart/order summary and order history. It is NOT part of
 * the cart-line matching key: adding the same game+package again merges
 * into the same line (quantity increases) and adopts the newest
 * `topUpInfo`, the same "identical add increments quantity" behavior
 * every other product already has. Buying the same package for two
 * different player accounts in one cart is a known limitation of this
 * demo, not a supported distinct-line case.
 */
export type CartItem = { slug: string; quantity: number; variantId?: string; topUpInfo?: TopUpInfo };

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  /** `quantity` defaults to 1 (every pre-Step-51 call site still works
   * unchanged) — Step 51's product detail page quantity selector passes
   * the selected amount for both "Add to Cart" and "Buy Now". `variantId`
   * (Step 57) distinguishes denominations of the same wallet/gift-card
   * product — omitted, it behaves exactly as before. `topUpInfo` (Step 58)
   * attaches the shopper's Player Information to a Game Top-Up line. */
  addToCart: (slug: string, quantity?: number, variantId?: string, topUpInfo?: TopUpInfo) => void;
  removeFromCart: (slug: string, variantId?: string) => void;
  /** quantity <= 0 removes the item — same rule the drawer's minus button relies on. */
  updateQuantity: (slug: string, quantity: number, variantId?: string) => void;
  /** Empties the cart — used only after an order is actually placed (see OrderReviewView). */
  clearCart: () => void;
};

const STORAGE_KEY = "danshop_cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is CartItem =>
        typeof value === "object" &&
        value !== null &&
        typeof (value as CartItem).slug === "string" &&
        typeof (value as CartItem).quantity === "number" &&
        (value as CartItem).quantity > 0 &&
        ((value as CartItem).variantId === undefined || typeof (value as CartItem).variantId === "string") &&
        ((value as CartItem).topUpInfo === undefined ||
          (typeof (value as CartItem).topUpInfo === "object" && (value as CartItem).topUpInfo !== null))
    );
  } catch {
    // Malformed JSON or localStorage unavailable (e.g. privacy mode) — treat as empty.
    return [];
  }
}

function writeCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore write failures — the cart just won't persist this visit.
  }
}

/**
 * Site-wide cart state — the header's cart icon/badge and the cart drawer
 * both read and write this same context, so there's one source of truth.
 * Cart contents are just {slug, quantity} pairs (see CartItem); product
 * details are always resolved from the real games.ts data by consumers,
 * never duplicated here.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // Server render and the first client render both show an empty cart (no
  // access to localStorage yet), so there's nothing to mismatch on hydrate.
  // This guards the very first commit's write-effect pass so it doesn't
  // persist that transient empty state over whatever was already stored,
  // before the read effect below has a chance to load it.
  const skipNextWrite = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external source (localStorage) on mount, matching LanguageProvider's own pattern
    setItems(readCart());
  }, []);

  useEffect(() => {
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    writeCart(items);
  }, [items]);

  function addToCart(slug: string, quantity: number = 1, variantId?: string, topUpInfo?: TopUpInfo) {
    setItems((prev) => {
      const existing = prev.find((item) => item.slug === slug && item.variantId === variantId);
      if (existing) {
        return prev.map((item) =>
          item.slug === slug && item.variantId === variantId
            ? { ...item, quantity: item.quantity + quantity, topUpInfo: topUpInfo ?? item.topUpInfo }
            : item
        );
      }
      return [...prev, { slug, quantity, variantId, topUpInfo }];
    });
  }

  function removeFromCart(slug: string, variantId?: string) {
    setItems((prev) => prev.filter((item) => !(item.slug === slug && item.variantId === variantId)));
  }

  function updateQuantity(slug: string, quantity: number, variantId?: string) {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => !(item.slug === slug && item.variantId === variantId));
      }
      return prev.map((item) => (item.slug === slug && item.variantId === variantId ? { ...item, quantity } : item));
    });
  }

  function clearCart() {
    setItems([]);
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        toggleCart: () => setIsOpen((prev) => !prev),
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
