"use client";

import { Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";

export type CheckoutStepKey = "info" | "payment" | "review";

const STEP_ORDER: readonly CheckoutStepKey[] = ["info", "payment", "review"];

/**
 * UI-31 (Cart and Checkout Visual Polish): a lightweight, purely
 * presentational step indicator for the checkout flow's three real steps —
 * /checkout ("info") → /checkout/payment ("payment") → /checkout/review
 * ("review"). Not rendered on /cart (not part of this numbered flow) or
 * /checkout/success (the end state, not a step).
 *
 * Reads no order/payment/auth state and gates nothing — the real
 * step-to-step guards (e.g. OrderReviewView redirecting back to
 * /checkout/payment when no method is chosen yet) already live in each
 * view and are completely untouched by this component. `current` is just
 * a static prop each page passes for its own step.
 *
 * A short numeric progress line (e.g. "Step 2 of 3 · Payment") is always
 * visible — including at the narrowest supported widths (360px) — so the
 * current step is legible even before the circle row's per-step text
 * labels appear at `sm:`.
 */
export function CheckoutSteps({ current }: { current: CheckoutStepKey }) {
  const { t } = useLanguage();
  const currentIndex = STEP_ORDER.indexOf(current);

  const labels: Record<CheckoutStepKey, string> = {
    info: t("checkout.stepInfo"),
    payment: t("checkout.stepPayment"),
    review: t("checkout.stepReview"),
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-secondary sm:text-sm">
        {t("checkout.stepProgress").replace("{current}", String(currentIndex + 1)).replace("{total}", "3")}
        {" · "}
        {labels[current]}
      </p>
      <ol aria-label={t("checkout.stepIndicatorLabel")} className="flex items-center gap-2 sm:gap-3">
        {STEP_ORDER.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step} className="flex items-center gap-2 sm:gap-3">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm",
                  isCurrent
                    ? "border-primary bg-primary text-white"
                    : isDone
                      ? "border-primary bg-surface-elevated text-foreground"
                      : "border-border bg-surface-elevated text-secondary"
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn("hidden text-sm font-medium sm:inline", isCurrent ? "text-foreground" : "text-secondary")}>
                {labels[step]}
              </span>
              {index < STEP_ORDER.length - 1 && <span aria-hidden="true" className="h-px w-6 shrink-0 bg-border sm:w-10" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
