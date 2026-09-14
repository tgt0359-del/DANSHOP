"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { LoginPageLayout } from "@/components/auth/LoginPageLayout";
import { LoginSocialButtons } from "@/components/auth/LoginSocialButtons";
import { PasswordField } from "@/components/auth/PasswordField";
import { useLanguage } from "@/hooks/useLanguage";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from "@/lib/auth/authValidation";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { mapAuthErrorKey } from "@/lib/auth/mapAuthErrorKey";
import { cn } from "@/lib/cn";

/**
 * UI-LOGIN-REDESIGN-01 — a full UI/UX redesign of the `/login` page.
 *
 * Explicitly a visual restructure, not a functionality change: the real
 * email/password submission below (`signInWithPassword`, error mapping,
 * already-authenticated redirect) is the exact same Step 71/76 logic as
 * before, untouched. Only two things actually changed behavior-wise, both
 * requested by name in this step's own brief:
 *   1. The social-login row now renders `LoginSocialButtons` (placeholders
 *      only, §2) instead of the old `ProviderButtons` (which made a real
 *      Google OAuth call and still included Apple) — see that file's own
 *      doc comment for why this isn't a shared-component edit.
 *   2. The "Continue with phone" entry point is gone from this page (§4's
 *      element list for the redesigned form has no phone option) — the
 *      real `PhoneAuthFlow` component/route itself is untouched and still
 *      used elsewhere; it's simply not rendered from here any more.
 *
 * Layout comes from `LoginPageLayout` (new, Login-only — §3/§8) instead of
 * the shared `AuthPageLayout` that `/register` still uses unchanged.
 */
export function LoginView() {
  const { t } = useLanguage();
  const router = useRouter();
  const { status: authStatus, signInWithPassword } = useCurrentUserContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Already signed in (e.g. a direct visit to /login after logging in
  // elsewhere) — send them to their account instead of showing a sign-in
  // form they don't need.
  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/account");
    }
  }, [authStatus, router]);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const emailError = touched && email.trim() !== "" && !EMAIL_PATTERN.test(email.trim()) ? t("auth.emailInvalid") : null;
  const emailMissing = touched && email.trim() === "" ? t("topup.fieldRequired") : null;
  const passwordMissing = touched && password === "" ? t("topup.fieldRequired") : null;

  const isValid = EMAIL_PATTERN.test(email.trim()) && password.length >= MIN_PASSWORD_LENGTH;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    setErrorKey(null);
    if (!isValid) return;

    setSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
      router.push("/account");
    } catch (error) {
      setErrorKey(mapAuthErrorKey(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginPageLayout>
      <Logo className="mb-6" />

      <h1 className="text-2xl font-semibold leading-snug text-foreground">{t("auth.signInHeading")}</h1>
      <p className="mt-1.5 text-sm text-secondary">{t("auth.signInIntro")}</p>

      <div className="mt-6">
        <LoginSocialButtons />
      </div>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-secondary">{t("auth.orDividerEmail")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-foreground">
            {t("auth.emailLabel")}
          </label>
          <input
            ref={emailRef}
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError || emailMissing)}
            aria-describedby={emailError ? "login-email-error" : emailMissing ? "login-email-required" : undefined}
            className={cn(
              "h-11 w-full rounded-full border bg-surface-elevated px-4 text-sm text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              emailError || emailMissing ? "border-red-500" : "border-border"
            )}
          />
          {emailMissing && (
            <p id="login-email-required" role="alert" className="text-xs text-danger">
              {emailMissing}
            </p>
          )}
          {!emailMissing && emailError && (
            <p id="login-email-error" role="alert" className="text-xs text-danger">
              {emailError}
            </p>
          )}
        </div>

        <div>
          <PasswordField
            id="login-password"
            label={t("auth.passwordLabel")}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            requiredError={passwordMissing}
          />
          <button
            type="button"
            onClick={() => setForgotNotice(true)}
            className="mt-2 text-xs font-medium text-secondary underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t("auth.forgotPassword")}
          </button>
          {forgotNotice && (
            <p role="status" className="mt-1.5 text-xs text-secondary">
              {t("auth.forgotPasswordNotice")}
            </p>
          )}
        </div>

        {errorKey && (
          <p role="alert" className="text-sm text-danger">
            {t(errorKey)}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full">
          {submitting ? t("auth.working") : t("auth.logInButton")}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-secondary">
        <Link
          href="/register"
          prefetch={false}
          className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("auth.switchToSignUp")}
        </Link>
      </p>
    </LoginPageLayout>
  );
}
