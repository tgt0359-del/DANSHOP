"use client";

import { useState, type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";

/**
 * A labeled password input with a show/hide toggle (Step 72 §2/§8) — the
 * one implementation `/login` and `/register` both use (register renders
 * two: password and confirm password), so the toggle behavior and
 * accessible wiring only exist once.
 *
 * The toggle is a real `<button type="button">` with its own accessible
 * name that changes with state (`auth.showPassword`/`auth.hidePassword`,
 * localized) — never an icon with no label, and `aria-pressed` reflects
 * whether the password is currently visible, so a screen reader announces
 * the toggle's state the same way a checkbox would.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  requiredError,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string | null;
  requiredError?: string | null;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  const describedBy = requiredError ? `${id}-required` : error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
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
            "h-11 w-full rounded-full border bg-surface-elevated pl-4 pr-11 text-sm text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            requiredError || error ? "border-red-500" : "border-border"
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {requiredError && (
        <p id={`${id}-required`} role="alert" className="text-xs text-danger">
          {requiredError}
        </p>
      )}
      {!requiredError && error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
