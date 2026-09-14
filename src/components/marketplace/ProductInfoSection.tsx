"use client";

import { useLanguage } from "@/hooks/useLanguage";

/**
 * One short, honest "Product Information" card — a translated title plus a
 * translated body, with optional `{placeholder}` substitution (e.g. the
 * product's region). Originally built as a module-private helper inside
 * `WalletProductView` (Step 57 §8); pulled out here (Step 64 §6) so
 * `TopUpFlowView`'s new Product Information section can reuse the exact
 * same card instead of a second copy — both components already share
 * `DenominationSelector` the same way.
 *
 * Every caller passes translation keys, never raw strings — this renders
 * whatever short, honest, already-existing demo copy the caller supplies
 * (e.g. `wallet.importantInfoBody`, `topup.demoNotice`), never inventing
 * new claims about delivery timing or official publisher requirements
 * itself.
 */
export function ProductInfoSection({
  titleKey,
  bodyKey,
  bodyValues,
}: {
  titleKey: string;
  bodyKey: string;
  bodyValues?: Record<string, string>;
}) {
  const { t } = useLanguage();
  let body = t(bodyKey);
  if (bodyValues) {
    for (const [key, value] of Object.entries(bodyValues)) {
      body = body.replace(`{${key}}`, value);
    }
  }

  return (
    <div className="rounded-2xl border border-border p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">{t(titleKey)}</h2>
      <p className="mt-2 text-sm leading-relaxed text-secondary">{body}</p>
    </div>
  );
}
