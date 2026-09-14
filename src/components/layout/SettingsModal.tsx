"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { IconButton } from "@/components/ui/IconButton";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettingsModal } from "@/hooks/useSettingsModal";
import type { Locale } from "@/lib/i18n/config";
import type { CurrencyCode } from "@/types/currency";

/**
 * The centered Language & Currency settings modal (Step 56) — the single
 * way to change either preference site-wide, reached from the same
 * trigger button in the Header, Sidebar, and Footer (`SettingsButton`).
 * Mounted once in `app/layout.tsx` (mirroring `<CartDrawer />`'s
 * pattern), fed by the global `SettingsModalProvider` so every trigger
 * opens the exact same instance instead of each owning its own.
 *
 * A centered dialog rather than an edge-anchored slide-in drawer (Step
 * 56's own spec: "Desktop: centered modal"), unlike Sidebar/CartDrawer/
 * MobileFilterDrawer — those three keep their existing pattern unchanged;
 * this is a second, deliberately different overlay shape because the
 * step explicitly asks for one, not a redesign of the others. No bottom-
 * sheet variant on mobile either: nothing in this design system has that
 * pattern today, and the spec only asks for it "if that matches the
 * existing design system" — it doesn't, so this stays one centered,
 * responsive modal at every breakpoint (§10 note in the report explains
 * this choice).
 *
 * Draft-then-commit (§5): `locale`/`currency` — the app's real, persisted
 * preferences (`LanguageProvider`/`CurrencyProvider`) — are only ever
 * written on Save. Cancel/X/Escape/backdrop all just close the modal,
 * which unmounts `SettingsModalContent` and discards its local draft
 * state without ever calling `setLocale`/`setCurrency` — so "restores the
 * previous unsaved selections" falls out naturally from the draft being
 * re-initialized from the *current* real values every time this remounts,
 * rather than needing an explicit "undo" step.
 *
 * Region: no user-facing region preference exists anywhere in this app —
 * `types/product.ts`'s `Region` (Step 54) is catalog metadata on a
 * *product*, not a stored user preference — so there's nothing existing
 * to "keep" here (Step 56's own instruction: keep it only if it already
 * exists). No Region field was added.
 */
export function SettingsModal() {
  const { isOpen, closeSettings } = useSettingsModal();

  return <AnimatePresence>{isOpen && <SettingsModalContent onClose={closeSettings} />}</AnimatePresence>;
}

function SettingsModalContent({ onClose }: { onClose: () => void }) {
  const { locale, setLocale, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [draftLocale, setDraftLocale] = useState<Locale>(locale);
  const [draftCurrency, setDraftCurrency] = useState<CurrencyCode>(currency);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Escape closes (discarding the draft, same as Cancel), and locks page
  // scroll while open — the same pattern every other overlay in this app
  // (Sidebar, CartDrawer, MobileFilterDrawer) already uses.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // Restore focus to whatever triggered this modal once it closes (Step
  // 56 §10). Captured on mount — at that point `document.activeElement`
  // is still the button the user just clicked.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  function handleSave() {
    setLocale(draftLocale);
    setCurrency(draftCurrency);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        aria-describedby="settings-modal-subtitle"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="settings-modal-title" className="text-lg font-semibold text-foreground">
              {t("settings.title")}
            </h2>
            <p id="settings-modal-subtitle" className="mt-1 text-sm text-secondary">
              {t("settings.subtitle")}
            </p>
          </div>
          <IconButton icon={<X className="h-5 w-5" />} aria-label={t("actions.close")} onClick={onClose} />
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-language" className="text-sm font-medium text-foreground">
              {t("footer.language")}
            </label>
            <LanguageSelector id="settings-language" value={draftLocale} onChange={setDraftLocale} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-currency" className="text-sm font-medium text-foreground">
              {t("settings.currencyLabel")}
            </label>
            <CurrencySelector id="settings-currency" value={draftCurrency} onChange={setDraftCurrency} />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {t("settings.cancel")}
          </Button>
          <Button type="button" variant="primary" onClick={handleSave} className="flex-1">
            {t("settings.save")}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
