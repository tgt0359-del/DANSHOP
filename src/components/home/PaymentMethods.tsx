"use client";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { paymentMethods } from "@/data/paymentMethods";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Payment methods section — UI only. These badges show payment options
 * DANSHOP intends to support, not a live, connected checkout system (there
 * is no real payment processing anywhere in this project).
 */
export function PaymentMethods() {
  const { t } = useLanguage();

  return (
    <section id="payment-methods" aria-labelledby="payment-methods-heading" className="py-14 sm:py-16 lg:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            id="payment-methods-heading"
            title={t("home.paymentMethods.title")}
            description={t("home.paymentMethods.description")}
          />

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {paymentMethods.map(({ name, icon: Icon }) => (
              <div
                key={name}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-4 text-center"
              >
                <Icon className="h-5 w-5 text-secondary" aria-hidden="true" />
                <span className="text-xs font-semibold leading-snug text-foreground sm:text-sm">{name}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-secondary">{t("home.paymentMethods.trustMessage")}</p>
        </Reveal>
      </Container>
    </section>
  );
}
