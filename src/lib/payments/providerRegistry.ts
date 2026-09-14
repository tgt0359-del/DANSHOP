import type { PaymentProvider, PaymentProviderId } from "@/types/payment";
import { manualProvider } from "@/lib/payments/providers/manualProvider";
import { bcelProvider } from "@/lib/payments/providers/bcelProvider";
import { paypalProvider } from "@/lib/payments/providers/paypalProvider";

const registry: Record<PaymentProviderId, PaymentProvider> = {
  manual: manualProvider,
  bcel: bcelProvider,
  paypal: paypalProvider,
};

/**
 * Looks up a provider implementation by id — the one place future
 * checkout code would call to get "the configured provider for this
 * payment," instead of importing a specific provider module directly.
 * This is what makes swapping providers later a config change (see
 * paymentConfig.ts) rather than a checkout rewrite (Step 33 §1).
 */
export function getPaymentProvider(id: PaymentProviderId): PaymentProvider {
  return registry[id];
}
