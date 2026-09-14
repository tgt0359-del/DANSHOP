import { NextResponse } from "next/server";

/**
 * Payment-provider webhook boundary — Step 33 architecture preparation
 * only. No real payment provider is integrated yet, so there is no real
 * payload shape to parse here: inventing one would risk silently
 * accepting (or misreading) a real provider's webhook once one is
 * eventually wired up. See src/lib/payments/README.md.
 *
 * TODO(payments/webhook): Implement once official provider (e.g. BCEL)
 * integration documentation and real credentials are available. At
 * minimum, a real implementation must:
 *   1. Verify the request's authenticity (signature/secret — provider-specific, read from a server-only env var, never NEXT_PUBLIC_).
 *   2. Parse the provider's real payload — not a guessed shape.
 *   3. Look up the corresponding order/payment session server-side.
 *   4. Only then call mapPaymentStatusToOrderPaymentStatus and update the order —
 *      never trust a client-side call to do this.
 *   5. Once the order's paymentStatus is updated, call
 *      sendPaymentStatusEmail() (src/lib/email/emailService.ts) — typed and
 *      ready, not called from anywhere yet since this route itself isn't
 *      real yet either.
 *
 * Until that exists, this endpoint intentionally does nothing but report
 * that it isn't implemented, so a real provider's retries fail loudly
 * instead of being silently accepted and ignored.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Payment webhook not implemented yet. See TODO(payments/webhook) in this route's source." },
    { status: 501 }
  );
}
