"use client";

import { Headset, ShieldCheck, BadgeCheck, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/hooks/useLanguage";

const benefits: { key: string; icon: LucideIcon }[] = [
  { key: "instantDelivery", icon: Zap },
  { key: "secureCheckout", icon: ShieldCheck },
  { key: "verifiedProducts", icon: BadgeCheck },
  { key: "customerSupport", icon: Headset },
];

/**
 * Trust/benefits section. These describe the *planned* marketplace
 * experience — DANSHOP has no real checkout, delivery, or verification
 * system yet, so we say so plainly rather than imply they're live.
 */
export function TrustSection() {
  const { t } = useLanguage();

  return (
    <section id="trust" aria-labelledby="trust-heading" className="py-14 sm:py-16 lg:py-20">
      <Container>
        <Reveal>
          <SectionHeading id="trust-heading" title={t("home.trust.title")} />
          <p className="mt-3 max-w-2xl text-sm font-normal text-secondary">{t("home.trust.disclaimer")}</p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-6 transition-shadow duration-200 hover:shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold leading-snug text-foreground">
                  {t(`home.trust.${key}Title`)}
                </h3>
                <p className="text-sm font-normal leading-relaxed text-secondary">
                  {t(`home.trust.${key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
