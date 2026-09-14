/**
 * Maps an order-placement failure (Step 79) to one of
 * `checkout.orderError*`'s localized message keys — never surfaces a raw
 * server/database error, Supabase error message, or stack trace to the
 * customer. Mirrors `lib/auth/mapAuthErrorKey.ts`'s exact pattern: only
 * ever inspects a short, stable code (`OrderPlacementError.code`, sourced
 * from `/api/orders`'s own short exception codes — see
 * `supabase/migrations/20260909010000_danshop_orders_persistence.sql`'s
 * `create_order()` — never anything from a token/session/payment field).
 */
export function mapOrderErrorKey(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error && typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "GENERIC";

  switch (code) {
    case "UNAVAILABLE":
      return "checkout.orderErrorUnavailable";
    case "EMPTY_CART":
    case "PRODUCT_NOT_FOUND":
      return "checkout.orderErrorInvalidCart";
    case "PRODUCT_OUT_OF_STOCK":
      return "checkout.orderErrorOutOfStock";
    case "DEMO_PRODUCT_UNSUPPORTED":
      // A cart item (a wallet/gift card/Game Top-Up package) that has no
      // real Supabase catalog row yet — this app's own trusted-price
      // boundary, not an account/payment problem, so it gets its own
      // clear, honest message rather than the generic catch-all.
      return "checkout.orderErrorDemoUnsupported";
    case "INVALID_QUANTITY":
    case "TOO_MANY_ITEMS":
      return "checkout.orderErrorInvalidCart";
    case "INVALID_CUSTOMER":
      return "checkout.orderErrorInvalidCustomer";
    case "INVALID_PAYMENT_METHOD":
      return "checkout.orderErrorInvalidPaymentMethod";
    case "NETWORK_ERROR":
      return "checkout.orderErrorNetwork";
    case "IDEMPOTENCY_KEY_CONFLICT":
      // Deliberately mapped to the same generic message as any other
      // unexpected failure — never a distinct "this key was already
      // used by someone else" message, which would itself leak that
      // something about another order exists.
      return "checkout.orderErrorGeneric";
    default:
      return "checkout.orderErrorGeneric";
  }
}
