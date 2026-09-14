import type { PaymentMethodId, PaymentProviderId } from "@/types/payment";

export interface PaymentProviderConfig {
  enabled: boolean;
  /** Name of the env var that would hold this provider's merchant/account
   * id — never the value itself. See .env.example. */
  merchantIdEnvVar?: string;
  /** Name of the env var that would hold this provider's API key —
   * server-side only, never read from client code. See .env.example. */
  apiKeyEnvVar?: string;
}

/**
 * Central switch for which payment providers are actually wired up.
 * Every real provider starts (and, until real credentials and official
 * integration approval exist, stays) disabled — flipping `enabled` to
 * true without a working provider implementation and real credentials in
 * the server environment would break checkout, not fix it (see Step 33
 * §12 and lib/payments/README.md).
 */
export const paymentProviders: Record<PaymentProviderId, PaymentProviderConfig> = {
  bcel: {
    enabled: false,
    merchantIdEnvVar: "PAYMENT_MERCHANT_ID",
    apiKeyEnvVar: "PAYMENT_API_KEY",
  },
  paypal: {
    enabled: false,
  },
  manual: {
    // Always available — this is the current demo's non-network stand-in,
    // not a real provider. See providers/manualProvider.ts.
    enabled: true,
  },
};

/**
 * Which UI payment methods (see data/paymentMethods.ts) would route to
 * which configured provider once one exists. Kept separate from
 * `paymentMethods` — the list actually shown in the UI — so "shown to the
 * customer" and "processed by a live, configured provider" are never
 * conflated (Step 33 §9: "Do not claim that every method is currently
 * live"). A method with no entry here has no provider behind it yet.
 */
export const paymentMethodProviderMap: Partial<Record<PaymentMethodId, PaymentProviderId>> = {
  "BCEL One": "bcel",
  "Lao QR": "bcel",
  PayPal: "paypal",
  // Visa/Mastercard/JCB/American Express/UnionPay: no card processor is
  // configured yet — intentionally left unmapped rather than guessed at.
};
