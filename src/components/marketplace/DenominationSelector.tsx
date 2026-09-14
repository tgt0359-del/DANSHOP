"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/currency/formatPrice";
import type { ProductVariant } from "@/types/productVariant";

/**
 * The single-select "priced option" picker — originally the wallet/gift
 * card "Choose Value" denomination picker (Step 57 §4/§5), reused as-is
 * for the Game Top-Up "Select Package" step (Step 58 §5, the same
 * single-select-cards-not-checkboxes requirement). Built from real
 * `<input type="radio">` elements that all share one `name`, styled as
 * selectable cards via Tailwind's `has-[:checked]`/`has-[:focus-visible]`
 * pattern so the accessible native control and the visual "highlighted
 * card" state can never disagree. A screen reader announces a real radio
 * group; arrow keys move between options exactly like any native radio
 * set. Selecting one calls `onSelect` immediately — there is no separate
 * "confirm" step, and the caller re-renders its price/summary the instant
 * `selectedId` changes.
 *
 * `legendKey` and `renderLabel` are the two seams that let this same
 * component serve both call sites without a wallet-specific assumption
 * baked in: `legendKey` swaps the section heading ("Choose Value" vs.
 * "Select Package"); `renderLabel` swaps how each card's primary label is
 * produced. Wallet leaves both at their defaults (`variant.label` verbatim
 * — a denomination's label, e.g. "฿50", is already the exact text to
 * show). Game Top-Up passes a `renderLabel` that translates its package
 * tier name instead, since "Small"/"Medium"/"Large"/"Extra Large" must
 * respect the site's Lao/English/Thai language setting, unlike a
 * denomination's fixed real-world face value.
 */
export function DenominationSelector({
  name,
  variants,
  selectedId,
  onSelect,
  legendKey = "wallet.chooseValue",
  renderLabel,
}: {
  name: string;
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (variantId: string) => void;
  legendKey?: string;
  renderLabel?: (variant: ProductVariant) => string;
}) {
  const { t } = useLanguage();
  const { currency } = useCurrency();

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">{t(legendKey)}</legend>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {variants.map((variant) => {
          const hasDiscount = variant.originalPrice != null && variant.originalPrice > variant.price;
          const checked = selectedId === variant.id;

          return (
            <label
              key={variant.id}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-black has-[:focus-visible]:ring-offset-2",
                checked
                  ? "border-black bg-black text-white"
                  : "border-border bg-white text-foreground hover:border-foreground/40",
                !variant.available && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                type="radio"
                name={name}
                value={variant.id}
                checked={checked}
                disabled={!variant.available}
                onChange={() => onSelect(variant.id)}
                className="sr-only"
              />
              <span className="text-sm font-semibold">{renderLabel ? renderLabel(variant) : variant.label}</span>
              <span className={cn("text-xs", checked ? "text-white/80" : "text-secondary")}>
                {formatPrice(variant.price, currency)}
              </span>
              {hasDiscount && (
                <span className={cn("text-[11px] line-through", checked ? "text-white/60" : "text-secondary/70")}>
                  {formatPrice(variant.originalPrice as number, currency)}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
