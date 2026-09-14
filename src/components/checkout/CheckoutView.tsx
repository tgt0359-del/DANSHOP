"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { paymentMethods } from "@/data/paymentMethods";
import { useCart } from "@/hooks/useCart";
import { useCheckoutLines } from "@/hooks/useCheckoutLines";
import { useCheckoutState } from "@/hooks/useCheckoutState";
import { useLanguage } from "@/hooks/useLanguage";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checkout preparation page — reads the real, existing cart (see
 * CartProvider) and resolves each line against the real games data via
 * useCheckoutLines, same as the cart drawer and the payment-selection page.
 * No second cart state, no duplicated product data. Customer info lives in
 * CheckoutStateProvider (in-memory only — see that file for why): nothing
 * is persisted to storage, nothing is sent anywhere, and there is no
 * payment processing here — continuing just navigates to the real
 * /checkout/payment step.
 */
export function CheckoutView() {
  const { t } = useLanguage();
  const { openCart } = useCart();
  const { lines, subtotal, totalSavings, total } = useCheckoutLines();
  const { email, setEmail, fullName, setFullName } = useCheckoutState();
  const isEmailValid = EMAIL_PATTERN.test(email.trim());

  if (lines.length === 0) {
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

  return (
    <div className="py-12 sm:py-14 lg:py-20">
      <Container>
        <div className="flex flex-col gap-4 sm:gap-5">
          <h1 className="text-3xl font-semibold leading-snug text-foreground sm:text-4xl">{t("cart.checkout")}</h1>
          <CheckoutSteps current="info" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-10 lg:mt-12 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_460px]">
          {/* Left column: customer info + payment method placeholder. On
              mobile these two blocks naturally come first, before the order
              summary and CTA in the right column — matching the requested
              stacking order without any extra reordering rules. */}
          <div className="flex flex-col gap-6">
            <section aria-labelledby="checkout-customer-heading" className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 id="checkout-customer-heading" className="text-lg font-semibold text-foreground">
                {t("checkout.customerInfo")}
              </h2>
              <div className="mt-5 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="checkout-email" className="text-sm font-medium text-secondary">
                    {t("checkout.email")}
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-full border border-border bg-white px-5 text-base text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="checkout-name" className="text-sm font-medium text-secondary">
                    {t("checkout.fullName")}
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-12 w-full rounded-full border border-border bg-white px-5 text-base text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            </section>

            <section aria-labelledby="checkout-payment-heading" className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 id="checkout-payment-heading" className="text-lg font-semibold text-foreground">
                {t("checkout.paymentMethod")}
              </h2>
              <p className="mt-1.5 text-sm text-secondary sm:text-base">{t("checkout.paymentMethodNote")}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {paymentMethods.map(({ name, icon: Icon }) => (
                  <div
                    key={name}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-5 text-center"
                  >
                    <Icon className="h-5 w-5 text-secondary" aria-hidden="true" />
                    <span className="text-xs font-semibold leading-snug text-foreground">{name}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column: order summary + the primary CTA. */}
          <div className="flex flex-col gap-6">
            <OrderSummary
              lines={lines}
              subtotal={subtotal}
              totalSavings={totalSavings}
              total={total}
              onEditCart={openCart}
              size="lg"
            />

            {/* A real disabled <button> when the email isn't valid yet (so it's
                properly non-interactive and announced as disabled), and a real
                <Link> once it is — never a "disabled-looking but still
                clickable" link. */}
            {isEmailValid ? (
              <Link href="/checkout/payment" prefetch={false} className={buttonClasses("primary", "xl", "w-full")}>
                {t("checkout.continueToPayment")}
              </Link>
            ) : (
              <Button type="button" variant="primary" size="xl" disabled className="w-full">
                {t("checkout.continueToPayment")}
              </Button>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
