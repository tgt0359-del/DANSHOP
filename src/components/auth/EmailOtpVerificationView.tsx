"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import { OtpInput } from "@/components/auth/OtpInput";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { mapAuthErrorKey } from "@/lib/auth/mapAuthErrorKey";

/** Purely a client-side UX cooldown (disables the resend button and shows
 * a countdown) — never a substitute for, or bypass of, Supabase's own
 * server-side email rate limiting (Step 82 §6), which still applies
 * underneath regardless of this timer's state. */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * STEP AUTH-01 — a display-only mask for the email shown on this screen
 * (never affects the real address `verifyEmailOtp`/`resendEmailOtp` are
 * called with below, which always uses the full, unmasked `email` prop).
 * Keeps the first two characters and the last character of the local
 * part and replaces the rest with a fixed run of asterisks (not one
 * asterisk per hidden character — that would incidentally reveal the
 * local part's exact length). "a@example.com" → "a****@example.com",
 * "john.doe@example.com" → "jo****e@example.com".
 */
function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const visibleStart = local.slice(0, Math.min(2, local.length));
  const visibleEnd = local.length > 2 ? local.slice(-1) : "";
  return `${visibleStart}****${visibleEnd}${domain}`;
}

/**
 * The 6-digit email verification screen (Step 82 Part A) — replaces the
 * old static "check your email" message `RegisterView` showed after a
 * successful sign-up. Rendered inside `RegisterView`'s existing
 * `AuthPageLayout`/`Logo` (same DANSHOP branding chrome every other auth
 * screen already has — this component only supplies the content).
 *
 * Uses the real Supabase Auth calls wired through `CurrentUserProvider`
 * (`verifyEmailOtp`/`resendEmailOtp` → `supabaseAuthProvider.ts`'s
 * `client.auth.verifyOtp({..., type: "signup"})` /
 * `client.auth.resend({type: "signup", ...})`) — no invented endpoint, no
 * custom OTP storage/validation of any kind. The typed digits live only
 * in this component's own state (via `OtpInput`) and are cleared the
 * instant verification resolves either way.
 */
export function EmailOtpVerificationView({
  email,
  onVerified,
  onChangeEmail,
}: {
  email: string;
  onVerified: () => void;
  /** STEP AUTH-01: lets the visitor back out of this screen to fix a
   * mistyped address — the caller (`RegisterView`) owns whether that
   * means clearing its own `confirmationEmail` state to show the sign-up
   * form again, or something else; this component only signals intent. */
  onChangeEmail: () => void;
}) {
  const { t } = useLanguage();
  const { verifyEmailOtp, resendEmailOtp } = useCurrentUserContext();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [resendSucceeded, setResendSucceeded] = useState(false);
  // Guards against a real double-submit: OtpInput's onComplete fires once
  // the 6th digit lands, but a fast typist finishing the box then also
  // pressing Enter (submitting the form) could otherwise fire this twice
  // for the same code.
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function handleVerify(candidate: string) {
    if (verifyingRef.current || candidate.length !== 6) return;
    verifyingRef.current = true;
    setSubmitting(true);
    setErrorKey(null);

    try {
      await verifyEmailOtp(email, candidate);
      // Session is now established (CurrentUserProvider's own
      // onAuthStateChange/refresh picks it up) — the caller navigates on.
      onVerified();
    } catch (error) {
      setErrorKey(mapAuthErrorKey(error));
      setCode("");
    } finally {
      verifyingRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setErrorKey(null);
    setResendSucceeded(false);

    try {
      await resendEmailOtp(email);
      setResendSucceeded(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorKey(mapAuthErrorKey(error));
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <div role="status">
        <h1 className="text-2xl font-semibold leading-snug text-white">{t("auth.otpVerifyTitle")}</h1>
        <p className="mt-2 text-sm text-neutral-400">{t("auth.otpVerifyBody").replace("{email}", maskEmail(email))}</p>
      </div>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleVerify(code);
        }}
        noValidate
      >
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={(value) => void handleVerify(value)}
          disabled={submitting}
          invalid={Boolean(errorKey)}
          idPrefix="email-otp"
          ariaLabel={t("auth.otpDigitLabel")}
          describedById={errorKey ? "email-otp-error" : undefined}
        />

        {errorKey && (
          <p id="email-otp-error" role="alert" className="text-center text-sm text-red-400">
            {t(errorKey)}
          </p>
        )}
        {!errorKey && resendSucceeded && (
          <p role="status" className="text-center text-sm text-emerald-400">
            {t("auth.otpResendSuccess")}
          </p>
        )}

        <AuthPrimaryButton type="submit" disabled={submitting || code.length !== 6}>
          {submitting ? t("auth.working") : t("auth.verifyButton")}
        </AuthPrimaryButton>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resendCooldown > 0 || resending}
          aria-live="polite"
          className="text-sm font-medium text-[#1A9FFF] underline-offset-2 hover:text-[#168BE0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] disabled:cursor-not-allowed disabled:text-neutral-500 disabled:no-underline disabled:hover:no-underline"
        >
          {resending
            ? t("auth.working")
            : resendCooldown > 0
              ? t("auth.otpResendCooldown").replace("{seconds}", String(resendCooldown))
              : t("auth.otpResend")}
        </button>
        <span className="text-sm text-neutral-600" aria-hidden="true">
          ·
        </span>
        {/* STEP AUTH-01: lets a visitor who mistyped their address at
            sign-up back out of this screen instead of being stuck waiting
            on a code that can never arrive at the right inbox. */}
        <button
          type="button"
          onClick={onChangeEmail}
          disabled={submitting}
          className="text-sm font-medium text-[#1A9FFF] underline-offset-2 hover:text-[#168BE0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] disabled:cursor-not-allowed disabled:text-neutral-500 disabled:no-underline disabled:hover:no-underline"
        >
          {t("auth.otpChangeEmail")}
        </button>
      </div>

      {/* Same navigability the old static "check your email" screen had
          (a way back to /login) — preserved so this replacement doesn't
          regress it, e.g. for a visitor who already verified elsewhere or
          typed the wrong email at sign-up. */}
      <p className="mt-3 text-center text-sm text-neutral-400">
        <Link
          href="/login"
          prefetch={false}
          className="font-medium text-[#1A9FFF] underline-offset-2 hover:text-[#168BE0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922]"
        >
          {t("auth.switchToSignIn")}
        </Link>
      </p>
    </div>
  );
}
