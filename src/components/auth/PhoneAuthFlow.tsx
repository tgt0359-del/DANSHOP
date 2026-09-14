"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import { PHONE_COUNTRIES, defaultPhoneCountry, normalizePhoneNumber, type PhoneCountry } from "@/lib/auth/phoneNumbers";
import { cn } from "@/lib/cn";

type PhoneStep = "entry" | "otp";

/** A small, reused back-link — every step of this flow has one, either
 * back to the provider-buttons list or back to the phone-entry step. */
function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-medium text-secondary underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

/**
 * "Continue with phone" → select country → enter phone number → continue
 * → OTP verification screen (Step 76 §4). Uses Supabase Auth's own phone
 * OTP calls (`sendPhoneOtp`/`verifyPhoneOtp`, wired through the shared
 * `CurrentUserProvider` — the same provider abstraction email/OAuth use,
 * not a separate authentication system). Supported countries are
 * deliberately just Thailand (+66) and Laos (+856) — see
 * `lib/auth/phoneNumbers.ts`.
 *
 * The typed OTP digits live only in this component's own React state:
 * never written to localStorage/sessionStorage, and cleared the instant
 * verification resolves either way (success or failure) — there is
 * nothing here for a later step, or a crash, to leak.
 *
 * If Supabase's SMS provider isn't configured (true for this project
 * today), both `sendPhoneOtp`/`verifyPhoneOtp` throw and this shows the
 * same honest "phone sign-in isn't available yet" message the OAuth
 * buttons use for their own unconfigured-provider case — never a fake
 * "code sent" success.
 */
export function PhoneAuthFlow({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const { t } = useLanguage();
  const { sendPhoneOtp, verifyPhoneOtp } = useCurrentUserContext();

  const [step, setStep] = useState<PhoneStep>("entry");
  const [country, setCountry] = useState<PhoneCountry>(defaultPhoneCountry);
  const [localNumber, setLocalNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [otpTouched, setOtpTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [e164Phone, setE164Phone] = useState<string | null>(null);

  const normalized = normalizePhoneNumber(country, localNumber);
  const phoneInvalid = phoneTouched && !normalized;
  const otpMissing = otpTouched && otp.trim() === "";

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    setPhoneTouched(true);
    setErrorKey(null);
    if (!normalized) return;

    setSubmitting(true);
    try {
      await sendPhoneOtp(normalized);
      setE164Phone(normalized);
      setStep("otp");
      setPhoneTouched(false);
    } catch {
      setErrorKey("auth.errorPhoneUnavailable");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setOtpTouched(true);
    setErrorKey(null);
    if (!e164Phone || otp.trim() === "") return;

    setSubmitting(true);
    try {
      await verifyPhoneOtp(e164Phone, otp.trim());
      setOtp("");
      onSuccess();
    } catch {
      setErrorKey("auth.errorPhoneUnavailable");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "otp" && e164Phone) {
    return (
      <form className="flex flex-col gap-4" onSubmit={handleVerify} noValidate>
        <BackLink
          label={t("auth.backButton")}
          onClick={() => {
            setStep("entry");
            setErrorKey(null);
            setOtp("");
            setOtpTouched(false);
          }}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone-otp" className="text-sm font-medium text-foreground">
            {t("auth.otpLabel")}
          </label>
          <p className="text-xs text-secondary">{t("auth.otpInstruction").replace("{phone}", e164Phone)}</p>
          <input
            id="phone-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            aria-invalid={otpMissing}
            aria-describedby={otpMissing ? "phone-otp-error" : undefined}
            className={cn(
              "h-11 w-full rounded-full border bg-surface-elevated px-4 text-center text-lg tracking-[0.3em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              otpMissing ? "border-red-500" : "border-border"
            )}
          />
          {otpMissing && (
            <p id="phone-otp-error" role="alert" className="text-xs text-danger">
              {t("topup.fieldRequired")}
            </p>
          )}
        </div>

        {errorKey && (
          <p role="alert" className="text-sm text-danger">
            {t(errorKey)}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full">
          {submitting ? t("auth.working") : t("auth.verifyButton")}
        </Button>
      </form>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSendOtp} noValidate>
      <BackLink label={t("auth.backButton")} onClick={onBack} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone-country" className="text-sm font-medium text-foreground">
          {t("auth.selectCountryLabel")}
        </label>
        <select
          id="phone-country"
          value={country.code}
          onChange={(event) => {
            const next = PHONE_COUNTRIES.find((candidate) => candidate.code === event.target.value);
            if (next) setCountry(next);
          }}
          className="h-11 w-full rounded-full border border-border bg-surface-elevated px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {PHONE_COUNTRIES.map((candidate) => (
            <option key={candidate.code} value={candidate.code}>
              {candidate.flag} {t(candidate.nameKey)} ({candidate.dialCode})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone-number" className="text-sm font-medium text-foreground">
          {t("auth.phoneNumberLabel")}
        </label>
        <div className="flex gap-2">
          <span
            aria-hidden="true"
            className="flex h-11 shrink-0 items-center rounded-full border border-border bg-surface px-3 text-sm text-secondary"
          >
            {country.dialCode}
          </span>
          <input
            id="phone-number"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={localNumber}
            onChange={(event) => setLocalNumber(event.target.value)}
            aria-invalid={phoneInvalid}
            aria-describedby={phoneInvalid ? "phone-number-error" : undefined}
            aria-label={`${t("auth.phoneNumberLabel")} (${country.dialCode})`}
            className={cn(
              "h-11 w-full rounded-full border bg-surface-elevated px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              phoneInvalid ? "border-red-500" : "border-border"
            )}
          />
        </div>
        {phoneInvalid && (
          <p id="phone-number-error" role="alert" className="text-xs text-danger">
            {t("auth.phoneInvalid")}
          </p>
        )}
      </div>

      {errorKey && (
        <p role="alert" className="text-sm text-danger">
          {t(errorKey)}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full">
        {submitting ? t("auth.working") : t("auth.continueButton")}
      </Button>
    </form>
  );
}
