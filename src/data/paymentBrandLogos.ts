/**
 * Real official brand logo assets for payment methods, keyed by the exact
 * `name` string `data/paymentMethods.ts` already uses. Deliberately a
 * separate file from `paymentMethods.ts` itself: that file's
 * `icon: LucideIcon` field is a live React component consumed by
 * `components/checkout/PaymentSelectionView.tsx`/`CheckoutView.tsx`/
 * `OrderReviewView.tsx` and `components/orders/OrderInvoice.tsx` — real
 * checkout/order UI this data file is not scoped to touch. Looking the
 * logo up by name from here, in the two display-only sections that use
 * it (`components/layout/Footer.tsx`'s payment-channels row and
 * `components/home/PaymentMethods.tsx`), rather than reshaping the
 * shared data, means every one of those four checkout/order files keeps
 * rendering its own original Lucide icon, byte-identical to before.
 *
 * Visa/Mastercard/JCB/American Express/UnionPay/PayPal: real, verified
 * SVGs (fetched from `gilbarbara/logos`, a curated collection of
 * official multi-color brand marks — simple-icons doesn't carry JCB or
 * UnionPay at all, checked first) saved at `public/images/brands/`.
 * Visa's is simple-icons' flat monochrome path recolored pure white
 * (Visa's own standard reversed treatment), not gilbarbara's navy
 * gradient — needed for contrast against a dark pill.
 *
 * BCEL One/LDB: real PNGs supplied directly by the user (not sourced
 * from any icon library — none of simple-icons, gilbarbara/logos, or
 * SuperTinyIcons carry either Lao-market brand), saved at
 * `public/images/payment/`. Both confirmed genuinely transparent
 * (alpha 0 at every corner, checked with `sharp`) before use.
 *
 * Lao QR has no entry — no official mark for it has been supplied or
 * found anywhere. Every consumer of this map must fall back to a
 * name-only (or simple neutral placeholder) treatment for any name
 * missing here, never an invented logo.
 */
export const PAYMENT_BRAND_LOGOS: Record<string, string> = {
  Visa: "/images/brands/visa.svg",
  Mastercard: "/images/brands/mastercard.svg",
  JCB: "/images/brands/jcb.svg",
  "American Express": "/images/brands/american-express.svg",
  UnionPay: "/images/brands/unionpay.svg",
  PayPal: "/images/brands/paypal.svg",
  "BCEL One": "/images/payment/bcel-one.png",
  LDB: "/images/payment/ldb.png",
};

/**
 * UI-12: override for the one entry above whose asset isn't safe on a
 * light card — Visa's is reversed-white (built for a dark pill; see this
 * file's own top comment). Every other logo is already full-color/
 * self-contained and reads fine on white, so this is a one-entry map, not
 * a second parallel lookup. Shared here (rather than a per-component copy)
 * because two consumers now render these logos on a white/light card —
 * `components/home/PaymentMethods.tsx` and `components/layout/Footer.tsx`'s
 * payment-channels row (UI-12, converted from its previous dark pill).
 */
export const PAYMENT_BRAND_LOGOS_LIGHT_BG: Record<string, string> = {
  Visa: "/images/brands/visa-color.svg",
};
