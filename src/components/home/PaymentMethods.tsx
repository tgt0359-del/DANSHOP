"use client";

import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PAYMENT_BRAND_LOGOS, PAYMENT_BRAND_LOGOS_LIGHT_BG } from "@/data/paymentBrandLogos";
import { paymentMethods } from "@/data/paymentMethods";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Payment methods section — UI only. These badges show payment options
 * DANSHOP intends to support, not a live, connected checkout system (there
 * is no real payment processing anywhere in this project).
 *
 * UI-07: each card is now [real logo on top] / [name below] instead of a
 * generic Lucide card/wallet/phone/QR glyph — the same
 * `PAYMENT_BRAND_LOGOS` lookup (real assets, verified — see that file's
 * own doc comment for sourcing) `components/layout/Footer.tsx`'s payment
 * row already uses, imported from its own shared file rather than
 * duplicated here. `paymentMethods.ts` itself (and its `icon` field,
 * still consumed by the real checkout/order screens) is untouched. Lao
 * QR has no real asset anywhere yet, so it keeps its name and gets a
 * plain dashed-circle placeholder in the logo slot — never a fake logo,
 * never a generic icon standing in for one.
 *
 * UI-12: `PAYMENT_BRAND_LOGOS_LIGHT_BG` (Visa's light-card-safe variant)
 * moved into the shared `paymentBrandLogos.ts` file, since the Footer's
 * own payment row now also renders on a light card and needs the same
 * override — see that file's own doc comment.
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
            {paymentMethods.map(({ name }) => {
              const logoSrc = PAYMENT_BRAND_LOGOS_LIGHT_BG[name] ?? PAYMENT_BRAND_LOGOS[name];
              return (
                <div
                  key={name}
                  // UI-11: `rounded-2xl` (was `rounded-xl`) — the same
                  // corner radius every other white card on the homepage
                  // (product cards, category tiles, trust cards) already
                  // uses, so this section's tiles read as the same visual
                  // system instead of a slightly sharper one-off.
                  className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-white px-3 py-5 text-center"
                >
                  <span className="relative flex h-9 w-28 shrink-0 items-center justify-center sm:h-10 sm:w-32">
                    {logoSrc ? (
                      <Image src={logoSrc} alt={name} fill unoptimized sizes="128px" className="object-contain" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="h-8 w-8 rounded-full border border-dashed border-border sm:h-9 sm:w-9"
                      />
                    )}
                  </span>
                  <span className="text-xs font-semibold leading-snug text-foreground sm:text-sm">{name}</span>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-sm text-secondary">{t("home.paymentMethods.trustMessage")}</p>
        </Reveal>
      </Container>
    </section>
  );
}
