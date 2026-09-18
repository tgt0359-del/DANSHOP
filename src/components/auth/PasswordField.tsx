"use client";

import { useState, type Ref } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";

/**
 * BRAND-UNIFY-01 — the password input with show/hide, shared by `/login`
 * and `/register` (which renders it twice: password and confirm
 * password). Same reconciliation as `AuthSocialButtons.tsx`'s own doc
 * comment: a Login-only fork (`LoginPasswordField.tsx`) is folded back
 * into the correctly-generic shared name now that Register uses the same
 * design again.
 *
 * The toggle is a real `<button type="button">` with its own accessible
 * name that changes with state (`auth.showPassword`/`auth.hidePassword`,
 * localized) — never an icon with no label, and `aria-pressed` reflects
 * whether the password is currently visible. Never logs or stores the
 * value anywhere. Colors are this pass's own exact palette: dark input
 * surface, `rgba(255,255,255,0.12)` border, `#1A9FFF` focus border/ring.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  requiredError,
  success,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string | null;
  requiredError?: string | null;
  /** POLISH-01: opt-in only — unused by `LoginView`, which has no
   * "match" concept. `RegisterView`'s confirm-password field passes a
   * localized "Passwords match" string once the two fields agree, shown
   * in place of the error row (never both at once). */
  success?: string | null;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  const describedBy = requiredError ? `${id}-required` : error ? `${id}-error` : success ? `${id}-success` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-white/85">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(requiredError || error)}
          aria-describedby={describedBy}
          className={cn(
            "h-[52px] w-full rounded-xl border bg-black/25 pl-4 pr-11 text-sm text-white placeholder:text-[#667085] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922]",
            requiredError || error ? "border-[#EF4444]" : "border-white/[0.12] focus:border-[#1A9FFF]"
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#A3AAB8] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922]"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <div aria-live="polite">
        {requiredError && (
          <p id={`${id}-required`} role="alert" className="text-xs text-[#EF4444]">
            {requiredError}
          </p>
        )}
        {!requiredError && error && (
          <p id={`${id}-error`} role="alert" className="text-xs text-[#EF4444]">
            {error}
          </p>
        )}
        {!requiredError && !error && success && (
          <p id={`${id}-success`} className="flex items-center gap-1 text-xs text-[#34D399]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {success}
          </p>
        )}
      </div>
    </div>
  );
}
