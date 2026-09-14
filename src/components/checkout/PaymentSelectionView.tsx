"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PaymentMethodCard } from "@/components/checkout/PaymentMethodCard";
import { paymentMethods } from "@/data/paymentMethods";
import { useCart } from "@/hooks/useCart";
import { useCheckoutLines } from "@/hooks/useCheckoutLines";
import { useCheckoutState } from "@/hooks/useCheckoutState";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Payment-method selection — the checkout flow's second step (/checkout/payment).
 * Still no real payment processing anywhere here: choosing a method just
 * records it in CheckoutStateProvider (so /checkout/review can read the
 * same selection after a real route change) and enables Continue, which
 * navigates to /checkout/review. Cart data comes from the same
 * useCheckoutLines every other checkout screen uses, so this page can never
 * disagree with /checkout on totals.
 */
export function PaymentSelectionView() {
  const { t } = useLanguage();
  const { openCart } = useCart();
  const { lines, subtotal, totalSavings, total } = useCheckoutLines();
  const { paymentMethod, setPaymentMethod } = useCheckoutState();

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
          <h1 className="text-3xl font-semibold leading-snug text-foreground sm:text-4xl">
            {t("checkout.paymentPageTitle")}
          </h1>
          <CheckoutSteps current="payment" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-10 lg:mt-12 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_460px]">
          {/* Left column: the payment method options. */}
          <div className="flex flex-col gap-6">
            <section aria-labelledby="payment-selection-heading" className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
              <h2 id="payment-selection-heading" className="text-lg font-semibold text-foreground">
                {t("checkout.paymentMethod")}
              </h2>
              <p className="mt-1.5 text-sm text-secondary sm:text-base">{t("checkout.choosePaymentMethod")}</p>

              <div
                role="radiogroup"
                aria-labelledby="payment-selection-heading"
                className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
              >
                {paymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.name}
                    name={method.name}
                    icon={method.icon}
                    description={t(`checkout.paymentCategory.${method.category}`)}
                    selected={paymentMethod === method.name}
                    onSelect={() => setPaymentMethod(method.name)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right column: order summary + Continue/Back actions. On mobile
              the payment methods (column 1) naturally come first, then this
              column — same stacking technique the /checkout page uses. */}
          <div className="flex flex-col gap-6">
            <OrderSummary
              lines={lines}
              subtotal={subtotal}
              totalSavings={totalSavings}
              total={total}
              onEditCart={openCart}
              size="lg"
            />

            <div className="flex flex-col gap-2.5">
              {/* A real disabled <button> until a method is chosen, and a real
                  <Link> once it is — same pattern as /checkout's CTA. */}
              {paymentMethod ? (
                <Link href="/checkout/review" prefetch={false} className={buttonClasses("primary", "xl", "w-full")}>
                  {t("checkout.continue")}
                </Link>
              ) : (
                <Button type="button" variant="primary" size="xl" disabled className="w-full">
                  {t("checkout.continue")}
                </Button>
              )}
              <Link href="/checkout" prefetch={false} className={buttonClasses("secondary", "xl", "w-full")}>
                {t("checkout.backToCheckout")}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
