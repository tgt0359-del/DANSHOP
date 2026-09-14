/**
 * Mirrors the `name` values in data/paymentMethods.ts — the UI's list of
 * payment methods. Kept as its own literal type here (rather than derived
 * via `typeof paymentMethods[number]["name"]`) so this new, not-yet-used
 * architecture never has to change that already-approved, multiply-tested
 * data file's typing. Update both together if the UI list ever changes.
 */
export type PaymentMethodId =
  | "Visa"
  | "Mastercard"
  | "JCB"
  | "American Express"
  | "UnionPay"
  | "PayPal"
  | "BCEL One"
  | "Lao QR";

/** No automatic conversion between these — see paymentConfig.ts and
 * Step 33's "do not invent exchange rates" rule. The amount sent to any
 * provider must always come from the order's own total, in whatever
 * currency the order itself was created in. */
export type Currency = "LAK" | "USD";

/**
 * A payment provider's own lifecycle for one payment attempt — distinct
 * from OrderStatus (see types/order.ts), which is DANSHOP's own record.
 * Naming follows common payment-gateway conventions so a real provider's
 * states map onto this without inventing new vocabulary.
 */
export type PaymentStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "EXPIRED";

/**
 * Which payment provider is handling (or would handle) a given payment.
 * "manual" is the only one wired up today — see providers/manualProvider.ts
 * — a non-network stand-in that keeps the current demo checkout working.
 * "bcel" and "paypal" are prepared integration boundaries only (see
 * providers/bcelProvider.ts and providers/paypalProvider.ts); neither has
 * real credentials or official integration documentation in this project
 * yet, so neither actually processes anything.
 */
export type PaymentProviderId = "manual" | "bcel" | "paypal";

/**
 * What a real provider integration would need to start a payment.
 * Deliberately excludes anything resembling card/PIN/OTP/bank-credential
 * fields — collecting those directly is explicitly out of scope for this
 * project; a real integration hands the customer off to the provider's own
 * hosted payment page/app instead (see returnUrl/cancelUrl below).
 */
export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethodId;
  /** Where the provider should send the customer back after a completed (or cancelled/failed) payment. */
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePaymentResult {
  session: PaymentSession;
  /** Where to send the customer to actually complete payment — a real
   * provider's hosted checkout page, QR display, or app deep link.
   * Undefined until a real provider exists to issue one. */
  redirectUrl?: string;
}

/**
 * The concept Step 33 asks to prepare: a record of one payment attempt
 * against one order. Intentionally holds nothing beyond what's needed to
 * track and display that attempt — never card numbers, CVV, PIN, OTP, or
 * bank passwords. A real integration would keep the authoritative copy of
 * this server-side (see lib/payments/paymentSessionStore.ts for why the
 * client-side version here is only a placeholder for that).
 */
export interface PaymentSession {
  id: string;
  orderId: string;
  provider: PaymentProviderId;
  paymentMethod: PaymentMethodId;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  createdAt: string;
  expiresAt: string;
}

/**
 * The interface every real payment provider (BCEL, PayPal, ...) implements.
 * This is the seam that lets a real provider be added later "without
 * rewriting checkout" (Step 33 §1): checkout code only ever depends on
 * this interface, never on a specific provider's request/response shapes.
 *
 * No implementation here calls a real network endpoint — see
 * providers/manualProvider.ts (the only one wired up, a non-network
 * demo stand-in) and providers/bcelProvider.ts / providers/paypalProvider.ts
 * (unimplemented TODO boundaries; see their file comments for why).
 */
export interface PaymentProvider {
  id: PaymentProviderId;
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResult>;
  getPaymentStatus(sessionId: string): Promise<PaymentStatus>;
  cancelPayment(sessionId: string): Promise<void>;
}
