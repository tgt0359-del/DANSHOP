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
 *
 * UI-04: given its own full-bleed white band (bg-white + border-y) so it
 * reads as one of the page's deliberate, important zones rather than
 * blending into the base page tone above/below it — the same treatment
 * already used for the Categories band in page.tsx, just owned locally
 * here instead of via a page-level wrapper (this component's own scope
 * only, no page.tsx change needed).
 */
export function TrustSection() {
  const { t } = useLanguage();

  return (
    <section id="trust" aria-labelledby="trust-heading" className="border-y border-border bg-white py-14 sm:py-16 lg:py-20">
      <Container>
        <Reveal>
          <SectionHeading id="trust-heading" title={t("home.trust.title")} />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary">{t("home.trust.disclaimer")}</p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {benefits.map(({ key, icon: Icon }) => (
              <div
                key={key}
                // UI-04: same restrained hover as the homepage's other
                // static/link cards (CategoryGrid, MarketplaceCategories)
                // — a small lift, a subtle border-color change, and a
                // light shadow only on hover, never at rest; the icon
                // inverting to solid black is a purely decorative "polish"
                // touch shared with those cards, not a signal of
                // interactivity this card doesn't have (no button/link —
                // §5's "no button if there's no real action yet").
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-foreground transition-colors duration-200 group-hover:bg-black group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                  {t(`home.trust.${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-secondary">{t(`home.trust.${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
