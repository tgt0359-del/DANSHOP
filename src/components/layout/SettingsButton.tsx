"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettingsModal } from "@/hooks/useSettingsModal";
import { localeMeta } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";

/**
 * The one trigger for DANSHOP's Language & Currency settings (Step 56
 * §1/§9) — used identically in the Header, Sidebar, and Footer (replacing
 * `LanguageSwitcher`'s old dropdown-menu behavior in all three places, so
 * there is exactly one control site-wide, not a modal PLUS a leftover
 * dropdown). Clicking it opens `SettingsModal` (via the shared
 * `SettingsModalProvider`) instead of navigating or showing its own menu.
 *
 * Shows the current preference at a glance — flag + language code +
 * currency code (e.g. "🇱🇦 LA · USD") — per §9's "Header should clearly
 * show the current preference" / "the selected currency where
 * appropriate", while staying a single compact pill so the Header stays
 * clean (no duplicate controls).
 */
export function SettingsButton({
  className,
  tone = "default",
}: {
  className?: string;
  /** LOGIN-UI-02: opt-in only — every existing call site (Header, Sidebar,
   * Footer's light branch) omits this and renders exactly as before.
   * `"inverse"` is for the new dark `AuthTopBar` only, where the default
   * white pill/black-ring/`text-secondary` combination would be low-
   * contrast against a `#0B0D10`–`#151922` background. */
  tone?: "default" | "inverse";
}) {
  const { locale, t } = useLanguage();
  const { currency } = useCurrency();
  const { openSettings } = useSettingsModal();
  const meta = localeMeta[locale];

  return (
    <button
      type="button"
      onClick={openSettings}
      aria-haspopup="dialog"
      aria-label={t("settings.openLabel")}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        tone === "inverse"
          ? "border-white/[0.12] bg-white/5 text-white hover:bg-white/10 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-[#0B0D10]"
          : "border-border bg-white text-foreground hover:bg-surface focus-visible:ring-black",
        className
      )}
    >
      <span aria-hidden="true">{meta.flag}</span>
      <span>{locale.toUpperCase()}</span>
      <span className={tone === "inverse" ? "text-white/50" : "text-secondary"} aria-hidden="true">
        ·
      </span>
      <span className={tone === "inverse" ? "text-white/70" : "text-secondary"}>{currency}</span>
    </button>
  );
}
