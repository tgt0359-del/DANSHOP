"use client";

import { useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import { resolveCartLine } from "@/lib/cart/resolveCartLine";
import type { Game } from "@/types/game";
import type { TopUpInfo } from "@/types/topUp";

export interface CheckoutLine {
  game: Game;
  quantity: number;
  /** The shopper's Player Information (Step 58) — undefined for every
   * non-Top-Up line. */
  topUpInfo?: TopUpInfo;
}

/**
 * Resolves the real cart (see CartProvider) — real games and, as of Step
 * 57, demo wallet/gift-card variants alike, via the shared
 * `resolveCartLine` — and derives the same subtotal/discount/total figures
 * the cart drawer, the checkout page, and the payment-selection page all
 * need — one place, so every step of checkout is guaranteed to agree on
 * the same numbers instead of each screen re-deriving (and risking
 * drifting from) its own copy.
 */
export function useCheckoutLines() {
  const { items } = useCart();

  const lines = useMemo<CheckoutLine[]>(
    () =>
      items
        .map((item): CheckoutLine | null => {
          const resolved = resolveCartLine(item);
          if (!resolved) return null;
          return { game: resolved.game, quantity: resolved.quantity, topUpInfo: resolved.topUpInfo };
        })
        .filter((line): line is CheckoutLine => line !== null),
    [items]
  );

  const subtotal = lines.reduce((sum, line) => sum + line.game.price * line.quantity, 0);
  const totalSavings = lines.reduce(
    (sum, line) => sum + (line.game.originalPrice - line.game.price) * line.quantity,
    0
  );
  const total = subtotal;

  return { lines, subtotal, totalSavings, total };
}
