"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * The mobile filter drawer (Step 50) — modeled directly on
 * `components/layout/Sidebar.tsx`'s already-proven pattern: backdrop +
 * sliding panel, `role="dialog"`/`aria-modal`, Escape to close, backdrop
 * click to close, body scroll lock while open (Step 50 §10). Slides in
 * from the right (Sidebar slides from the left) so the two drawers never
 * look interchangeable. Contains whatever filter controls `GamesCatalog`
 * passes as `children` — this component owns none of the filter state or
 * logic itself (Step 50 §5: "must not break the existing filtering
 * architecture" — there's exactly one filtering `useMemo`, in
 * `GamesCatalog`, regardless of which UI surface changed it).
 */
export function MobileFilterDrawer({
  open,
  onClose,
  onApply,
  onClearAll,
  hasActiveFilters,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** "Apply Filters" (Step 50 §4) — filters already apply live as each
   * control changes (same as the desktop panel), so this just dismisses
   * the drawer to reveal the already-updated results underneath, rather
   * than needing a separate deferred/draft filter state to commit. */
  onApply: () => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  children: ReactNode;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;

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
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="filter-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="filter-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("games.filters.drawerLabel")}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <h2 className="text-base font-semibold text-foreground">{t("games.filters.filtersButton")}</h2>
              <IconButton icon={<X className="h-5 w-5" />} aria-label={t("actions.close")} onClick={onClose} />
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">{children}</div>

            <div className="flex shrink-0 flex-col gap-2 border-t border-border p-4">
              <Button type="button" variant="primary" onClick={onApply} className="w-full">
                {t("games.filters.applyFilters")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClearAll}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                {t("games.clearFilters")}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
