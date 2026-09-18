"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthPrimaryButton } from "@/components/auth/AuthPrimaryButton";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { PasswordField } from "@/components/auth/PasswordField";
import { Logo } from "@/components/ui/Logo";
import { useLanguage } from "@/hooks/useLanguage";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from "@/lib/auth/authValidation";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { mapAuthErrorKey } from "@/lib/auth/mapAuthErrorKey";
import { cn } from "@/lib/cn";

/** Shared, reused by both the Terms link and the Privacy link below. */
const legalLinkClass =
  "text-[#1A9FFF] underline-offset-2 transition-colors hover:text-[#168BE0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] rounded";

/**
 * LOGIN-UI-02: this key only ever stores an email ADDRESS — never a
 * password, never a session token, never an OTP. Unchanged from the prior
 * pass — see the "Remember me" handling below for why.
 */
const REMEMBERED_EMAIL_KEY = "danshop-remembered-email";

/**
 * `/login`'s content — now rendered into the new, Login-only `AuthShell`
 * (top bar + brand panel + form card, no global header, real viewport
 * height) instead of the shared `AuthPageLayout`. This is a presentation
 * refactor ONLY: `signInWithPassword`, error mapping, the already-
 * authenticated redirect, "Remember me" (still email-only, still never
 * touching Supabase config/session persistence — see the prior pass's own
 * reasoning, unchanged), forgot-password notice, and every translation
 * key are the exact same Step 71/76/AUTH-01/PHASE-A logic as before.
 *
 * BRAND-UNIFY-01: `/register` now shares this exact same `AuthShell` /
 * `AuthSocialButtons` / `PasswordField` / `AuthPrimaryButton` set (see
 * `RegisterView.tsx`) — the two pages are deliberately unified again, per
 * this pass's own explicit brief covering both.
 */
export function LoginView() {
  const { t } = useLanguage();
  const router = useRouter();
  const { status: authStatus, signInWithPassword } = useCurrentUserContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  // STEP-1-LOGIN-01: a synchronous guard, not just `submitting` state.
  // `disabled={submitting}` alone isn't enough — measured directly: 5
  // rapid clicks on the submit button fired 4 real `signInWithPassword`
  // network calls, because React batches the `setSubmitting(true)`
  // update, so several click handlers can still read stale
  // `submitting === false` from their closure before the first render
  // showing `disabled` actually commits. A ref mutates immediately, so
  // this closes that race — the second click's handler invocation sees
  // `true` right away, even before React re-renders anything.
  const submittingRef = useRef(false);

  // Already signed in (e.g. a direct visit to /login after logging in
  // elsewhere) — send them back to the homepage instead of showing a
  // sign-in form they don't need.
  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/");
    }
  }, [authStatus, router]);

  // Prefill a previously "remembered" email address, if any.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external source (localStorage) on mount, not deriving state from props/state (same pattern as LanguageProvider.tsx)
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      // localStorage can be unavailable (e.g. private browsing) — the
      // form still works perfectly well with no saved address.
    }
  }, []);

  useEffect(() => {
    // `{ preventScroll: true }` stops the browser from scrolling this
    // focus into view and cutting off the top of the card on shorter
    // viewports, without changing the "email field is focused on load"
    // behavior itself (LAYOUT-FIX-01).
    emailRef.current?.focus({ preventScroll: true });
  }, []);

  const emailError = touched && email.trim() !== "" && !EMAIL_PATTERN.test(email.trim()) ? t("auth.emailInvalid") : null;
  const emailMissing = touched && email.trim() === "" ? t("topup.fieldRequired") : null;
  const passwordMissing = touched && password === "" ? t("topup.fieldRequired") : null;

  const isValid = EMAIL_PATTERN.test(email.trim()) && password.length >= MIN_PASSWORD_LENGTH;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    setTouched(true);
    setErrorKey(null);
    if (!isValid) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      await signInWithPassword(trimmedEmail, password);
      try {
        if (rememberMe) {
          window.localStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
        } else {
          window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {
        // Non-fatal — sign-in already succeeded either way.
      }
      // STEP-1-LOGIN-01: back to the homepage, not `/account` — this
      // task's own explicit requirement. No `router.refresh()` — nothing
      // on `/` is server-rendered from auth state (the header's account
      // icon reads the same client-side `CurrentUserContext` this
      // `signInWithPassword` call above already updates directly), so a
      // full Server Component refetch would only add latency with no
      // visible effect.
      router.push("/");
    } catch (error) {
      setErrorKey(mapAuthErrorKey(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <Logo tone="inverse" className="mb-6" />

      <h1 className="text-2xl font-semibold leading-snug text-white sm:text-[26px]">{t("auth.welcomeBackHeading")}</h1>
      <p className="mt-1.5 text-sm text-[#A3AAB8]">{t("auth.signInIntro")}</p>

      <div className="mt-7">
        <AuthSocialButtons />
      </div>

      <div className="my-7 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-medium uppercase tracking-wider text-[#667085]">{t("auth.orDividerEmail")}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-white/85">
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
              "h-[52px] w-full rounded-xl border bg-black/25 px-4 text-sm text-white placeholder:text-[#667085] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922]",
              emailError || emailMissing ? "border-[#EF4444]" : "border-white/[0.12] focus:border-[#1A9FFF]"
            )}
          />
          {emailMissing && (
            <p id="login-email-required" role="alert" className="text-xs text-[#EF4444]">
              {emailMissing}
            </p>
          )}
          {!emailMissing && emailError && (
            <p id="login-email-error" role="alert" className="text-xs text-[#EF4444]">
              {emailError}
            </p>
          )}
        </div>

        <PasswordField
          id="login-password"
          label={t("auth.passwordLabel")}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          requiredError={passwordMissing}
        />

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <label htmlFor="login-remember-me" className="flex cursor-pointer select-none items-center gap-2 text-sm text-[#A3AAB8]">
            <input
              id="login-remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/25 text-[#1A9FFF] accent-[#1A9FFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922]"
            />
            {t("auth.rememberMe")}
          </label>
          <button
            type="button"
            onClick={() => setForgotNotice(true)}
            className="text-sm font-medium text-[#1A9FFF] underline-offset-2 transition-colors hover:text-[#168BE0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] rounded"
          >
            {t("auth.forgotPassword")}
          </button>
        </div>
        {forgotNotice && (
          <p role="status" className="-mt-3 text-xs text-[#98A2B3]">
            {t("auth.forgotPasswordNotice")}
          </p>
        )}

        {errorKey && (
          <p role="alert" className="text-sm text-[#EF4444]">
            {t(errorKey)}
          </p>
        )}

        <AuthPrimaryButton type="submit" disabled={submitting}>
          {submitting ? t("auth.working") : t("auth.logInButton")}
        </AuthPrimaryButton>
      </form>

      <p className="mt-7 text-center text-sm text-[#A3AAB8]">
        <Link
          href="/register"
          prefetch={false}
          className="font-medium text-[#1A9FFF] underline-offset-2 transition-colors hover:text-[#168BE0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] rounded"
        >
          {t("auth.switchToSignUp")}
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
