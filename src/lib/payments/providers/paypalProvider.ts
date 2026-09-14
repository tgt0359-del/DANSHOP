import type { PaymentProvider } from "@/types/payment";

/**
 * PayPal integration boundary.
 *
 * TODO(payments/paypal): NOT IMPLEMENTED. This project has no PayPal
 * merchant credentials or a confirmed integration approach configured
 * yet. Even though PayPal's API is publicly documented, Step 33 scopes
 * this step to architecture preparation only — no real provider call
 * happens here until real credentials exist and an integration is
 * deliberately built and reviewed. See src/lib/payments/README.md.
 *
 * Every method below fails loudly and explicitly, matching
 * bcelProvider.ts, rather than silently pretending to succeed.
 */
export const paypalProvider: PaymentProvider = {
  id: "paypal",

  async createPayment(): Promise<never> {
    throw new Error(
      "paypalProvider.createPayment is not implemented — no PayPal merchant credentials/integration exist in this project yet. See TODO(payments/paypal) in src/lib/payments/providers/paypalProvider.ts."
    );
  },

  async getPaymentStatus(): Promise<never> {
    throw new Error("paypalProvider.getPaymentStatus is not implemented — see TODO(payments/paypal).");
  },

  async cancelPayment(): Promise<never> {
    throw new Error("paypalProvider.cancelPayment is not implemented — see TODO(payments/paypal).");
  },
};
