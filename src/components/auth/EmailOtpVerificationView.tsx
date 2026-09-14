"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { mapAuthErrorKey } from "@/lib/auth/mapAuthErrorKey";

/** Purely a client-side UX cooldown (disables the resend button and shows
 * a countdown) — never a substitute for, or bypass of, Supabase's own
 * server-side email rate limiting (Step 82 §6), which still applies
 * underneath regardless of this timer's state. */
const RESEND_COOLDOWN_SECONDS = 60;

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
export function EmailOtpVerificationView({ email, onVerified }: { email: string; onVerified: () => void }) {
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
        <h1 className="text-2xl font-semibold leading-snug text-foreground">{t("auth.otpVerifyTitle")}</h1>
        <p className="mt-2 text-sm text-secondary">{t("auth.otpVerifyBody").replace("{email}", email)}</p>
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
          <p id="email-otp-error" role="alert" className="text-center text-sm text-danger">
            {t(errorKey)}
          </p>
        )}
        {!errorKey && resendSucceeded && (
          <p role="status" className="text-center text-sm text-secondary">
            {t("auth.otpResendSuccess")}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={submitting || code.length !== 6} className="w-full">
          {submitting ? t("auth.working") : t("auth.verifyButton")}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resendCooldown > 0 || resending}
          aria-live="polite"
          className="text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-secondary disabled:no-underline disabled:hover:no-underline"
        >
          {resending
            ? t("auth.working")
            : resendCooldown > 0
              ? t("auth.otpResendCooldown").replace("{seconds}", String(resendCooldown))
              : t("auth.otpResend")}
        </button>
      </div>

      {/* Same navigability the old static "check your email" screen had
          (a way back to /login) — preserved so this replacement doesn't
          regress it, e.g. for a visitor who already verified elsewhere or
          typed the wrong email at sign-up. */}
      <p className="mt-3 text-center text-sm text-secondary">
        <Link
          href="/login"
          prefetch={false}
          className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("auth.switchToSignIn")}
        </Link>
      </p>
    </div>
  );
}
