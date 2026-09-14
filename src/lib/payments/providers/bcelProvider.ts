import type { PaymentProvider } from "@/types/payment";

/**
 * BCEL Online Payment Gateway / BCEL OnePay / QR integration boundary.
 *
 * TODO(payments/bcel): NOT IMPLEMENTED. This project has no official BCEL
 * merchant integration documentation or real merchant credentials yet.
 * Per Step 33's explicit rule: do NOT guess at BCEL's real API endpoints,
 * request/response shapes, authentication method, or webhook payload here.
 * Implement this only once that official documentation and real merchant
 * credentials are available — see src/lib/payments/README.md.
 *
 * Until then, this provider exists purely so the rest of the codebase
 * (paymentConfig's provider map, the provider registry) can reference a
 * "bcel" provider by id without a runtime hole — every method below fails
 * loudly and explicitly rather than silently pretending to succeed or
 * fabricating a response.
 */
export const bcelProvider: PaymentProvider = {
  id: "bcel",

  async createPayment(): Promise<never> {
    throw new Error(
      "bcelProvider.createPayment is not implemented — official BCEL merchant integration documentation and credentials are not yet available in this project. See TODO(payments/bcel) in src/lib/payments/providers/bcelProvider.ts."
    );
  },

  async getPaymentStatus(): Promise<never> {
    throw new Error("bcelProvider.getPaymentStatus is not implemented — see TODO(payments/bcel).");
  },

  async cancelPayment(): Promise<never> {
    throw new Error("bcelProvider.cancelPayment is not implemented — see TODO(payments/bcel).");
  },
};
