"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { EmailOtpVerificationView } from "@/components/auth/EmailOtpVerificationView";
import { PasswordField } from "@/components/auth/PasswordField";
import { Logo } from "@/components/ui/Logo";
import { useLanguage } from "@/hooks/useLanguage";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from "@/lib/auth/authValidation";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { mapAuthErrorKey } from "@/lib/auth/mapAuthErrorKey";
import { cn } from "@/lib/cn";

const legalLinkClass =
  "text-[#1A9FFF] underline-offset-2 transition-colors hover:text-[#168BE0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] rounded";

/**
 * BRAND-UNIFY-01 — `/register`'s content, now rendered into the same
 * `AuthShell` (top bar + real-logo brand panel + form card, no global
 * header) `/login` uses, via the same `AuthSocialButtons`/`PasswordField`/
 * `AuthPrimaryButton` components — the two pages are deliberately
 * unified again after a stretch of Login-only passes, per this task's own
 * explicit "Refactor DANSHOP Login/Register branding UI" brief covering
 * both.
 *
 * This is a presentation refactor ONLY: `signUpWithPassword`, error
 * mapping, the already-authenticated redirect, and — critically — the
 * "respect Supabase's own email-confirmation setting, never bypass it"
 * behavior (Step 71/82) are the exact same logic as every prior pass,
 * including the email-OTP verification branch below, still rendered
 * inside the same `AuthShell`/`Logo` chrome via the unchanged
 * `EmailOtpVerificationView`.
 */
export function RegisterView() {
  const { t } = useLanguage();
  const router = useRouter();
  const { status: authStatus, signUpWithPassword } = useCurrentUserContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/account");
    }
  }, [authStatus, router]);

  useEffect(() => {
    // LAYOUT-FIX-01: see LoginView.tsx's identical fix for the full
    // explanation — `preventScroll` stops the browser from scrolling this
    // focus into view and cutting off the top of the card on shorter
    // viewports, without changing the "email field is focused on load"
    // behavior itself.
    emailRef.current?.focus({ preventScroll: true });
  }, []);

  const emailError = touched && email.trim() !== "" && !EMAIL_PATTERN.test(email.trim()) ? t("auth.emailInvalid") : null;
  const emailMissing = touched && email.trim() === "" ? t("topup.fieldRequired") : null;
  const passwordMissing = touched && password === "" ? t("topup.fieldRequired") : null;
  const passwordTooShort =
    touched && password !== "" && password.length < MIN_PASSWORD_LENGTH ? t("auth.passwordTooShort") : null;
  const confirmMissing = touched && confirmPassword === "" ? t("topup.fieldRequired") : null;
  const confirmMismatch =
    touched && confirmPassword !== "" && confirmPassword !== password ? t("auth.passwordMismatch") : null;
  // POLISH-01: the success counterpart to `confirmMismatch` above — shown
  // in `PasswordField`'s new opt-in `success` slot once both fields agree.
  // Empty confirm shows neither (state A), a mismatch already shows
  // `confirmMismatch` instead (mutually exclusive, never both).
  const confirmMatchSuccess =
    touched && confirmPassword !== "" && confirmPassword === password ? t("auth.passwordsMatch") : null;

  const isValid =
    EMAIL_PATTERN.test(email.trim()) &&
    password.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword === password &&
    confirmPassword !== "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    setErrorKey(null);
    if (!isValid) {
      // POLISH-01 state D: a blocked submit caused by the passwords not
      // matching (as opposed to a blank/invalid email or too-short
      // password) sends focus straight to the confirm-password field —
      // the field the user actually needs to fix.
      if (confirmPassword !== "" && confirmPassword !== password) {
        confirmPasswordRef.current?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUpWithPassword(email.trim(), password);
      if (result.needsEmailConfirmation) {
        setConfirmationEmail(email.trim());
      } else {
        router.push("/account");
      }
    } catch (error) {
      setErrorKey(mapAuthErrorKey(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationEmail) {
    return (
      <AuthShell>
        <Logo tone="inverse" className="mb-6" />
        <EmailOtpVerificationView
          email={confirmationEmail}
          onVerified={() => router.push("/account")}
          // STEP AUTH-01: "Change email" on the OTP screen just clears
          // this state, which falls through to the sign-up form below
          // with everything the visitor already typed — including their
          // (probably-mistyped) email — still in place to fix, not reset.
          onChangeEmail={() => setConfirmationEmail(null)}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Logo tone="inverse" className="mb-6" />

      <h1 className="text-2xl font-semibold leading-snug text-white sm:text-[26px]">{t("auth.signUpHeading")}</h1>
      <p className="mt-1.5 text-sm text-[#A3AAB8]">{t("auth.signUpSubtitle")}</p>

      <div className="mt-7">
        <AuthSocialButtons />
      </div>

      <div className="my-7 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-medium uppercase tracking-wider text-[#667085]">
          {t("auth.orDividerEmailSignUp")}
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-email" className="text-sm font-medium text-white/85">
            {t("auth.emailLabel")}
          </label>
          <input
            ref={emailRef}
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError || emailMissing)}
            aria-describedby={emailError ? "register-email-error" : emailMissing ? "register-email-required" : undefined}
            className={cn(
              "h-[52px] w-full rounded-xl border bg-black/25 px-4 text-sm text-white placeholder:text-[#667085] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922]",
              emailError || emailMissing ? "border-[#EF4444]" : "border-white/[0.12] focus:border-[#1A9FFF]"
            )}
          />
          {emailMissing && (
            <p id="register-email-required" role="alert" className="text-xs text-[#EF4444]">
              {emailMissing}
            </p>
          )}
          {!emailMissing && emailError && (
            <p id="register-email-error" role="alert" className="text-xs text-[#EF4444]">
              {emailError}
            </p>
          )}
        </div>

        <PasswordField
          id="register-password"
          label={t("auth.passwordLabel")}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          requiredError={passwordMissing}
          error={passwordTooShort}
        />

        <PasswordField
          id="register-confirm-password"
          label={t("auth.confirmPasswordLabel")}
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          requiredError={confirmMissing}
          error={confirmMismatch}
          success={confirmMatchSuccess}
          inputRef={confirmPasswordRef}
        />

        {errorKey && (
          <p role="alert" className="text-sm text-[#EF4444]">
            {t(errorKey)}
          </p>
        )}

        <AuthPrimaryButton type="submit" disabled={submitting}>
          {submitting ? t("auth.working") : t("auth.signUpSubmit")}
        </AuthPrimaryButton>
      </form>

      <p className="mt-7 text-center text-sm text-[#A3AAB8]">
        <Link
          href="/login"
          prefetch={false}
          className="font-medium text-[#1A9FFF] underline-offset-2 transition-colors hover:text-[#168BE0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] rounded"
        >
          {t("auth.switchToSignIn")}
        </Link>
      </p>

      <p className="mt-4 text-center text-xs leading-relaxed text-white/55">
        {t("auth.termsNoticePrefix")}{" "}
        <Link href="/terms" prefetch={false} className={legalLinkClass}>
          {t("footer.terms")}
        </Link>{" "}
        {t("auth.termsNoticeAnd")}{" "}
        <Link href="/privacy" prefetch={false} className={legalLinkClass}>
          {t("footer.privacy")}
        </Link>
      </p>
    </AuthShell>
  );
}
