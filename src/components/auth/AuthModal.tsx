"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useAuthModal, type AuthModalMode } from "@/lib/auth/AuthModalProvider";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * The header account dropdown's compact "Sign In" prompt (Step 72 §4) —
 * no longer a full email/password form (that would duplicate what
 * `/login`/`/register` now own, which §4 explicitly disallows). Just the
 * dialog chrome (Escape/backdrop close, focus restore, body scroll lock —
 * unchanged from Step 71) around two real links to the dedicated pages,
 * so "Login action can navigate to /login" / "Register action can
 * navigate to /register" without a second authentication implementation
 * anywhere in this component.
 *
 * `mode` (still passed by callers via `openAuthModal("signIn" |
 * "signUp")`, unchanged API) only decides which of the two actions is
 * shown first/primary — there's no form state left to reset between
 * modes.
 */
export function AuthModal() {
  const { isOpen, mode, closeAuthModal } = useAuthModal();
  return <AnimatePresence>{isOpen && <AuthModalContent mode={mode} onClose={closeAuthModal} />}</AnimatePresence>;
}

function AuthModalContent({ mode, onClose }: { mode: AuthModalMode; onClose: () => void }) {
  const { t } = useLanguage();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Escape closes, and locks page scroll while open — the same pattern
  // SettingsModal/Sidebar/CartDrawer/MobileFilterDrawer already use.
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

  // Restore focus to whatever triggered this modal once it closes, same
  // as SettingsModal.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  const titleId = "auth-modal-title";
  const subtitleId = "auth-modal-subtitle";

  const isSignUpFirst = mode === "signUp";
  const signInLink = (
    <Link
      href="/login"
      prefetch={false}
      onClick={onClose}
      className={buttonClasses(isSignUpFirst ? "secondary" : "primary", "lg", "w-full")}
    >
      {t("actions.signIn")}
    </Link>
  );
  const signUpLink = (
    <Link
      href="/register"
      prefetch={false}
      onClick={onClose}
      className={buttonClasses(isSignUpFirst ? "primary" : "secondary", "lg", "w-full")}
    >
      {t("auth.signUpSubmit")}
    </Link>
  );

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
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              {t("account.guestHeading")}
            </h2>
            <p id={subtitleId} className="mt-1 text-sm text-secondary">
              {t("account.guestDescription")}
            </p>
          </div>
          <IconButton icon={<X className="h-5 w-5" />} aria-label={t("actions.close")} onClick={onClose} />
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {isSignUpFirst ? (
            <>
              {signUpLink}
              {signInLink}
            </>
          ) : (
            <>
              {signInLink}
              {signUpLink}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
