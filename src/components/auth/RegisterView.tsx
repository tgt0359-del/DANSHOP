"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { EmailOtpVerificationView } from "@/components/auth/EmailOtpVerificationView";
import { PasswordField } from "@/components/auth/PasswordField";
import { PhoneAuthFlow } from "@/components/auth/PhoneAuthFlow";
import { ProviderButtons } from "@/components/auth/ProviderButtons";
import { useLanguage } from "@/hooks/useLanguage";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from "@/lib/auth/authValidation";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { mapAuthErrorKey } from "@/lib/auth/mapAuthErrorKey";
import { cn } from "@/lib/cn";

/**
 * The dedicated `/register` page (Step 72 §1/§3, restructured Step 76
 * §1) — same provider-first layout as `/login` (heading →
 * Google/Apple/phone → "or" divider → email/password form), mirrored for
 * sign-up: the confirm-password field stays, the submit button reads
 * "Create Account", and the bottom link points back to `/login`. Reuses
 * the exact same `signUpWithPassword` call, error mapping, and "respect
 * Supabase's own email-confirmation setting, never bypass it" behavior
 * (Step 71, unchanged) — this restructures the page, not the
 * authentication logic underneath it.
 */
export function RegisterView() {
  const { t } = useLanguage();
  const router = useRouter();
  const { status: authStatus, signUpWithPassword } = useCurrentUserContext();

  const [showPhoneFlow, setShowPhoneFlow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/account");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (!showPhoneFlow) emailRef.current?.focus();
  }, [showPhoneFlow]);

  const emailError = touched && email.trim() !== "" && !EMAIL_PATTERN.test(email.trim()) ? t("auth.emailInvalid") : null;
  const emailMissing = touched && email.trim() === "" ? t("topup.fieldRequired") : null;
  const passwordMissing = touched && password === "" ? t("topup.fieldRequired") : null;
  const passwordTooShort =
    touched && password !== "" && password.length < MIN_PASSWORD_LENGTH ? t("auth.passwordTooShort") : null;
  const confirmMissing = touched && confirmPassword === "" ? t("topup.fieldRequired") : null;
  const confirmMismatch =
    touched && confirmPassword !== "" && confirmPassword !== password ? t("auth.passwordMismatch") : null;

  const isValid =
    EMAIL_PATTERN.test(email.trim()) &&
    password.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword === password &&
    confirmPassword !== "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    setErrorKey(null);
    if (!isValid) return;

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
      <AuthPageLayout eyebrow="DANSHOP" tagline={t("brand.tagline")}>
        <Logo className="mb-8" />
        {/* Step 82 Part A: a 6-digit OTP screen replaces the old static
            "check your email" message — same DANSHOP branding chrome
            (AuthPageLayout/Logo above), this component supplies only the
            verification content. */}
        <EmailOtpVerificationView email={confirmationEmail} onVerified={() => router.push("/account")} />
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout eyebrow="DANSHOP" tagline={t("brand.tagline")}>
      <Logo className="mb-8" />

      <h1 className="text-2xl font-semibold leading-snug text-foreground">{t("auth.loginOrSignUp")}</h1>

      {showPhoneFlow ? (
        <div className="mt-7">
          <PhoneAuthFlow onBack={() => setShowPhoneFlow(false)} onSuccess={() => router.push("/account")} />
        </div>
      ) : (
        <>
          <div className="mt-7">
            <ProviderButtons onPhoneClick={() => setShowPhoneFlow(true)} />
          </div>

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-secondary">{t("auth.orDivider")}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="register-email" className="text-sm font-medium text-foreground">
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
                  "h-11 w-full rounded-full border bg-surface-elevated px-4 text-sm text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  emailError || emailMissing ? "border-red-500" : "border-border"
                )}
              />
              {emailMissing && (
                <p id="register-email-required" role="alert" className="text-xs text-danger">
                  {emailMissing}
                </p>
              )}
              {!emailMissing && emailError && (
                <p id="register-email-error" role="alert" className="text-xs text-danger">
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
            />

            {errorKey && (
              <p role="alert" className="text-sm text-danger">
                {t(errorKey)}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full">
              {submitting ? t("auth.working") : t("auth.signUpSubmit")}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-secondary">
            <Link
              href="/login"
              prefetch={false}
              className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t("auth.switchToSignIn")}
            </Link>
          </p>
        </>
      )}
    </AuthPageLayout>
  );
}
