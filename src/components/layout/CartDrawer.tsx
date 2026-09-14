"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShieldCheck, ShoppingCart, Tag, Trash2, Truck, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { GameArtwork } from "@/components/ui/GameArtwork";
import { IconButton } from "@/components/ui/IconButton";
import { useCart } from "@/hooks/useCart";
import { useCheckoutLines } from "@/hooks/useCheckoutLines";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { formatPrice } from "@/lib/currency/formatPrice";
import { resolveCartLine } from "@/lib/cart/resolveCartLine";
import { formatTopUpInfo } from "@/lib/topup/formatTopUpInfo";

/**
 * The site's cart drawer — a right-side overlay panel, modeled on the same
 * backdrop + sliding-panel + Escape-to-close pattern the Sidebar drawer
 * already uses (just from the opposite edge). Resolves each stored
 * {slug, quantity, variantId?} entry via `resolveCartLine` (Step 57) —
 * real games and demo wallet/gift-card variants alike — so this is never a
 * second copy of product information.
 *
 * Step 65 (Cart Experience & UI Polish) reuses the SAME totals architecture
 * checkout already has (`useCheckoutLines` — the one place subtotal/
 * discount/total are computed) instead of the drawer's own previous
 * subtotal-only calculation, so the drawer, /checkout, and every step after
 * it are guaranteed to agree on the same numbers. The item list itself
 * still resolves through its own `resolveCartLine` call (same pure
 * function, called a second time) because it needs fields
 * (`href`/`slug`/`variantId`) `useCheckoutLines`'s `CheckoutLine` doesn't
 * carry — not a second cart system, just the one existing resolver used
 * for two different shapes of output.
 */
export function CartDrawer() {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, totalQuantity } = useCart();
  const { subtotal, totalSavings, total } = useCheckoutLines();
  const [promoOpen, setPromoOpen] = useState(false);

  const lines = useMemo(
    () =>
      items
        .map((item) => {
          const resolved = resolveCartLine(item);
          return resolved ? { ...resolved, slug: item.slug, variantId: item.variantId } : null;
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    [items]
  );

  // Close on Escape, and lock page scroll while open — same behavior as the Sidebar drawer.
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCart();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeCart}
            aria-hidden="true"
          />
          <motion.aside
            key="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("actions.cart")}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl sm:max-w-md"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-foreground">{t("actions.cart")}</h2>
                {totalQuantity > 0 && <span className="text-sm text-secondary">({totalQuantity})</span>}
              </div>
              <IconButton icon={<X className="h-5 w-5" />} aria-label={t("actions.close")} onClick={closeCart} />
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-foreground">
                  <ShoppingCart className="h-7 w-7" aria-hidden="true" />
                </span>
                <p className="text-base font-semibold text-foreground">{t("cart.empty")}</p>
                <p className="max-w-xs text-sm text-secondary">{t("cart.emptyDescription")}</p>
                <Link href="/games" prefetch={false} onClick={closeCart} className={buttonClasses("secondary", "md", "mt-1")}>
                  {t("cart.continueShopping")}
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                  {/* Digital delivery / trust strip (Step 65 §5) — lives at
                      the top of the scrollable area (not the fixed footer)
                      so it never competes with the summary/action buttons
                      for always-visible space, but is still the first
                      thing shown for a typical short cart. */}
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2.5 text-[11px] font-medium text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {t("cart.digitalDelivery")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {t("cart.fastDelivery")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {t("cart.secureCheckout")}
                    </span>
                  </div>

                  {lines.map(({ game, quantity, href, slug, variantId, topUpInfo, platform }) => (
                    <div key={game.id} className="flex gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0">
                      <Link
                        href={href}
                        prefetch={false}
                        onClick={closeCart}
                        aria-label={game.title}
                        className="block h-20 w-28 shrink-0 overflow-hidden rounded-lg"
                      >
                        <GameArtwork game={game} className="h-full w-full" />
                      </Link>

                      <div className="flex flex-1 flex-col gap-1">
                        <Link
                          href={href}
                          prefetch={false}
                          onClick={closeCart}
                          className="line-clamp-1 text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          {game.title}
                        </Link>

                        <Badge variant="subtle" className="w-fit !px-2 !py-0.5 !text-[10px]">
                          {platform}
                        </Badge>

                        {formatTopUpInfo(topUpInfo, t) && (
                          <span className="line-clamp-1 text-xs text-secondary">{formatTopUpInfo(topUpInfo, t)}</span>
                        )}
                        <span className="text-sm font-semibold text-foreground">
                          {game.price === 0 ? t("common.free") : formatPrice(game.price, currency)}
                        </span>

                        <div className="mt-auto flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1 rounded-full border border-border">
                            <button
                              type="button"
                              onClick={() => updateQuantity(slug, quantity - 1, variantId)}
                              disabled={quantity <= 1}
                              aria-label={`${t("cart.decreaseQuantity")} — ${game.title}`}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
                            >
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <span
                              className="w-5 text-center text-sm font-medium text-foreground"
                              aria-label={`${t("gameDetail.quantityLabel")}: ${quantity}`}
                              aria-live="polite"
                            >
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(slug, quantity + 1, variantId)}
                              aria-label={`${t("cart.increaseQuantity")} — ${game.title}`}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(slug, variantId)}
                            aria-label={`${t("cart.removeItem")} — ${game.title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex shrink-0 flex-col gap-3 border-t border-border p-4">
                  {/* Promo code — Step 65 §9: UI only, no real coupon system.
                      Collapsed by default (a plain disclosure button) so it
                      doesn't compete with Subtotal/Discount/Total for
                      always-visible footer space; both the field and the
                      Apply button stay disabled once opened, with an
                      explicit "Coming Soon" label — never lets a shopper
                      believe a code was actually applied. */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setPromoOpen((prev) => !prev)}
                      aria-expanded={promoOpen}
                      aria-controls="cart-promo-code-fields"
                      className="flex items-center gap-1.5 text-xs font-medium text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t("cart.promoCode")}</span>
                      <span className="text-secondary/70">({t("cart.comingSoon")})</span>
                    </button>

                    {promoOpen && (
                      <div id="cart-promo-code-fields" className="mt-2 flex gap-2">
                        <label htmlFor="cart-promo-code-input" className="sr-only">
                          {t("cart.promoCode")}
                        </label>
                        <input
                          id="cart-promo-code-input"
                          type="text"
                          disabled
                          placeholder={t("cart.promoCodePlaceholder")}
                          className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-secondary disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          disabled
                          className="h-9 shrink-0 rounded-lg border border-border px-3 text-sm font-medium text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {t("cart.applyPromoCode")}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
                    <div className="flex items-center justify-between text-secondary">
                      <span>{t("cart.subtotal")}</span>
                      <span>{formatPrice(subtotal, currency)}</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex items-center justify-between text-secondary">
                        <span>{t("checkout.discount")}</span>
                        <span>-{formatPrice(totalSavings, currency)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
                      <span>{t("checkout.total")}</span>
                      <span>{formatPrice(total, currency)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link href="/checkout" prefetch={false} onClick={closeCart} className={buttonClasses("primary", "lg")}>
                      {t("cart.checkout")}
                    </Link>
                    <button type="button" onClick={closeCart} className={buttonClasses("secondary", "lg")}>
                      {t("cart.continueShopping")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
