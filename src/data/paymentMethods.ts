import { CreditCard, QrCode, Smartphone, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Broad category each method falls into — used to look up a translated
 * short description (e.g. "Card payment") without hardcoding UI copy here. */
export type PaymentMethodCategory = "card" | "wallet" | "mobile" | "qr";

/**
 * The payment methods DANSHOP plans to support — shared between the
 * homepage's Payment Methods section and the checkout flow's payment-method
 * placeholder/selection, so all three stay in sync from one list instead of
 * three. No real logo assets exist in this project, so each method is a
 * clean text badge with a generic icon for its category (card network,
 * digital wallet, mobile banking app, or QR payment) rather than an
 * invented or borrowed brand mark. Names are proper nouns/brand names, so —
 * like "Steam" or a game's platform elsewhere on the site — they're kept as
 * plain text rather than run through translation; `category` is what gets
 * translated (see checkout.paymentCategory.* in the locale files).
 */
export const paymentMethods: { name: string; icon: LucideIcon; category: PaymentMethodCategory }[] = [
  { name: "Visa", icon: CreditCard, category: "card" },
  { name: "Mastercard", icon: CreditCard, category: "card" },
  { name: "JCB", icon: CreditCard, category: "card" },
  { name: "American Express", icon: CreditCard, category: "card" },
  { name: "UnionPay", icon: CreditCard, category: "card" },
  { name: "PayPal", icon: Wallet, category: "wallet" },
  { name: "BCEL One", icon: Smartphone, category: "mobile" },
  { name: "LDB", icon: Smartphone, category: "mobile" },
  { name: "Lao QR", icon: QrCode, category: "qr" },
];
