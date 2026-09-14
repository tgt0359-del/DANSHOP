"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { paymentMethods } from "@/data/paymentMethods";
import { useCart } from "@/hooks/useCart";
import { useCheckoutLines } from "@/hooks/useCheckoutLines";
import { useCheckoutState } from "@/hooks/useCheckoutState";
import { useLanguage } from "@/hooks/useLanguage";
import { generateId } from "@/lib/generateId";
import { mapOrderErrorKey } from "@/lib/orders/mapOrderErrorKey";
import { placeOrder } from "@/lib/orders/orderRepository";

/**
 * Order review — the checkout flow's third step (/checkout/review). Reads
 * the same cart (useCheckoutLines/useCart) and checkout-session state
 * (useCheckoutState) every other step uses — no second cart, no second
 * checkout system. Placing the order calls the order service
 * (lib/orders/orderRepository.ts's `placeOrder`), which posts the raw
 * cart to the trusted server path (Step 79 — `src/app/api/orders/route.ts`
 * + Supabase's `create_order()`) and only clears the cart once a real,
 * persisted Order record (orderStatus "pending_payment", paymentStatus
 * "pending" — never "paid") comes back. Still no real payment processing
 * anywhere: this only creates the order record, nothing more.
 */
export function OrderReviewView() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { items: cartItems, openCart, clearCart } = useCart();
  const { lines, subtotal, totalSavings, total } = useCheckoutLines();
  const { email, fullName, paymentMethod } = useCheckoutState();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderErrorKey, setOrderErrorKey] = useState<string | null>(null);
  // A ref (checked and set synchronously) rather than relying on the
  // isPlacingOrder state's render timing to block a second click that
  // fires before React has committed the disabled button — same reasoning
  // as CartProvider's skipNextWrite guard.
  const isPlacingOrderRef = useRef(false);
  // Generated once per visit to this page and reused on every Place Order
  // attempt during that visit — an opaque idempotency key (Step 79 §14),
  // NOT the customer-facing order reference (that's generated server-side
  // now, inside create_order() — see orderRepository.ts's placeOrder). A
  // retried call with the same key can never create a second order.
  const clientRequestIdRef = useRef<string | null>(null);

  const hasCartItems = lines.length > 0;

  // Reaching this page with items in the cart but no payment method chosen
  // (e.g. a direct visit to /checkout/review) sends the customer back to
  // pick one — never invent a selection.
  useEffect(() => {
    if (hasCartItems && !paymentMethod) {
      router.replace("/checkout/payment");
    }
  }, [hasCartItems, paymentMethod, router]);

  if (!hasCartItems) {
    return (
      <div className="py-16 sm:py-24">
        <Container>
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold text-foreground">{t("cart.empty")}</p>
            <Link href="/games" prefetch={false} className={buttonClasses("primary", "lg")}>
              {t("cart.continueShopping")}
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (!paymentMethod) {
    // Redirecting to /checkout/payment — see the effect above.
    return null;
  }

  const selectedMethod = paymentMethods.find((method) => method.name === paymentMethod);
  const PaymentIcon = selectedMethod?.icon;

  async function handlePlaceOrder() {
    // Guards rapid repeated clicks / double-clicks — checked and set
    // synchronously, before any await, so it can't race with a second
    // click fired in the same tick.
    if (isPlacingOrderRef.current) return;
    isPlacingOrderRef.current = true;
    setIsPlacingOrder(true);
    setOrderErrorKey(null);

    // Generate the idempotency key once per visit — every attempt during
    // this visit (including a retry after a failed one) reuses it, so the
    // server recognizes a repeated call as the same order rather than
    // creating a duplicate (Step 79 §14).
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current = generateId();
    }

    try {
      // Sends the raw cart (slug/quantity/variantId/topUpInfo) — never a
      // client-computed price or userId. The server resolves trusted
      // prices and the signed-in user's id itself (Step 79 §5/§11).
      await placeOrder({
        clientRequestId: clientRequestIdRef.current,
        customer: { fullName, email },
        paymentMethod: paymentMethod as string,
        items: cartItems.map((item) => ({
          slug: item.slug,
          quantity: item.quantity,
          variantId: item.variantId,
          topUpInfo: item.topUpInfo,
        })),
        // Order Email Notification Foundation phase: this visit's current
        // language, used only to pick which already-translated copy the
        // (not-yet-sent) order-confirmation email would be written in —
        // never persisted on the order itself.
        locale,
      });

      // Only clear the cart once the order is confirmed, real, and saved
      // (Step 79 §15) — a failed attempt below leaves the cart untouched.
      clearCart();
      router.push("/checkout/success");
    } catch (error) {
      setOrderErrorKey(mapOrderErrorKey(error));
      isPlacingOrderRef.current = false;
      setIsPlacingOrder(false);
    }
  }

  return (
    <div className="py-12 sm:py-14 lg:py-20">
      <Container>
        <div className="flex flex-col gap-4 sm:gap-5">
          <h1 className="text-3xl font-semibold leading-snug text-foreground sm:text-4xl">
            {t("checkout.reviewPageTitle")}
          </h1>
          <CheckoutSteps current="review" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-10 lg:mt-12 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_460px]">
          {/* Left column: what's about to be ordered with — customer info and
              the chosen payment method, each with its own edit control. */}
          <div className="flex flex-col gap-6">
            <section aria-labelledby="review-customer-heading" className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h2 id="review-customer-heading" className="text-lg font-semibold text-foreground">
                  {t("checkout.customerInfo")}
                </h2>
                <Link
                  href="/checkout"
                  prefetch={false}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("checkout.editCustomerInfo")}
                </Link>
              </div>
              <dl className="mt-5 flex flex-col gap-4 text-sm sm:text-base">
                <div>
                  <dt className="text-secondary">{t("checkout.fullName")}</dt>
                  <dd className="font-medium text-foreground">{fullName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-secondary">{t("checkout.email")}</dt>
                  <dd className="break-all font-medium text-foreground">{email || "—"}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="review-payment-heading" className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h2 id="review-payment-heading" className="text-lg font-semibold text-foreground">
                  {t("checkout.paymentMethod")}
                </h2>
                <Link
                  href="/checkout/payment"
                  prefetch={false}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("checkout.changePaymentMethod")}
                </Link>
              </div>
              <div className="mt-5 flex items-center gap-3">
                {PaymentIcon && (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground sm:h-11 sm:w-11">
                    <PaymentIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                )}
                <span className="text-sm font-semibold text-foreground sm:text-base">{paymentMethod}</span>
              </div>
            </section>
          </div>

          {/* Right column: order summary + the final actions. */}
          <div className="flex flex-col gap-6">
            <OrderSummary
              lines={lines}
              subtotal={subtotal}
              totalSavings={totalSavings}
              total={total}
              onEditCart={openCart}
              size="lg"
            />

            {orderErrorKey && (
              <div role="alert" className="rounded-xl border border-red-200 bg-danger/10 px-4 py-3 text-sm text-danger sm:text-base">
                {t(orderErrorKey)}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                variant="primary"
                size="xl"
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                aria-busy={isPlacingOrder}
              >
                {isPlacingOrder && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isPlacingOrder ? t("checkout.placingOrder") : t("checkout.placeOrder")}
              </Button>
              <button type="button" onClick={openCart} className={buttonClasses("secondary", "xl", "w-full")}>
                {t("checkout.backToCart")}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
