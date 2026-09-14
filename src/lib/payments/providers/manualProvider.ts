import type { CreatePaymentRequest, CreatePaymentResult, PaymentProvider, PaymentStatus } from "@/types/payment";

/**
 * The only provider actually wired up today. Represents the current demo
 * checkout: no real network call, no redirect, no real gateway — it just
 * creates a PENDING payment session so the rest of the architecture
 * (order-status mapping, the PaymentSession shape) is exercised by real,
 * type-checked code instead of sitting unused.
 *
 * A real provider (BCEL, PayPal, ...) implements this exact same
 * PaymentProvider interface (see src/types/payment.ts), so swapping this
 * out later doesn't require touching checkout UI at all — see
 * lib/payments/README.md for the intended migration path.
 */
export const manualProvider: PaymentProvider = {
  id: "manual",

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResult> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes — an arbitrary demo value, not provider-specified

    return {
      session: {
        id: `PS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        orderId: request.orderId,
        provider: "manual",
        paymentMethod: request.paymentMethod,
        amount: request.amount,
        currency: request.currency,
        status: "PENDING",
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      // No real provider to redirect to — the demo checkout stays on-site.
      redirectUrl: undefined,
    };
  },

  async getPaymentStatus(): Promise<PaymentStatus> {
    // No real provider to check with — this demo stand-in always reports
    // PENDING, since nothing here ever actually moves a payment forward.
    return "PENDING";
  },

  async cancelPayment(): Promise<void> {
    // No real external session exists to cancel.
  },
};
