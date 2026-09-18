"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const OTP_LENGTH = 6;

export interface OtpInputProps {
  /** Up to 6 digits, e.g. "123" while the visitor is still typing. */
  value: string;
  onChange: (value: string) => void;
  /** Fired once the 6th digit is filled (by typing, paste, or autofill) —
   * lets the caller auto-submit without requiring an extra click, while
   * the visible "Verify" button stays available as the reliable fallback
   * (Step 82 §3). */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Prefix for each box's `id` — must be unique on the page. */
  idPrefix: string;
  /** Accessible name for the group and (suffixed with a position) for
   * each individual box, e.g. "Verification code digit 3 of 6". */
  ariaLabel: string;
  describedById?: string;
}

/**
 * A 6-box one-time-code input (Step 82 Part A) — six visually separate,
 * numeric-only digit slots rather than one plain text field, matching
 * "professional 6-digit OTP verification UI":
 *
 *   - Auto-focuses the first box on mount, advances focus forward as each
 *     digit is typed, and moves focus back on Backspace once the current
 *     box is already empty (never past the first box).
 *   - Pasting a 6-digit code (or a code with stray non-digit formatting
 *     like spaces/dashes) into any box fills every box correctly from
 *     that point.
 *   - Non-numeric input is stripped before it ever reaches state — never
 *     accepted, never displayed.
 *   - Digits live only in this component's own (and its caller's) React
 *     state — never written to localStorage/sessionStorage, and the
 *     caller (`EmailOtpVerificationView`) clears them the instant
 *     verification resolves either way, matching `PhoneAuthFlow`'s own
 *     existing "OTP never persisted anywhere" contract.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  idPrefix,
  ariaLabel,
  describedById,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  // LAYOUT-FIX-01: a ref + effect instead of the native `autoFocus` prop
  // (which doesn't support `preventScroll`) — same fix as LoginView's/
  // RegisterView's email field: focusing the first box without letting
  // the browser scroll it into view, so this OTP screen (rendered inside
  // the same dark card, after Register's sign-up submit) can't cut off
  // its own top on a shorter viewport either.
  useEffect(() => {
    inputRefs.current[0]?.focus({ preventScroll: true });
  }, []);

  function focusBox(index: number) {
    inputRefs.current[index]?.focus();
  }

  function commit(nextValue: string) {
    const trimmed = nextValue.slice(0, OTP_LENGTH);
    onChange(trimmed);
    if (trimmed.length === OTP_LENGTH) {
      onComplete?.(trimmed);
    }
  }

  function handleChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = event.target.value.replace(/\D/g, "");

    if (cleaned.length <= 1) {
      const nextDigits = [...digits];
      nextDigits[index] = cleaned;
      commit(nextDigits.join(""));
      if (cleaned !== "" && index < OTP_LENGTH - 1) {
        focusBox(index + 1);
      }
      return;
    }

    // Some mobile keyboards/autofill deliver more than one character to a
    // single box's onChange instead of a real paste event — handled the
    // same way a genuine paste is (see handlePaste below).
    const merged = (value.slice(0, index) + cleaned).slice(0, OTP_LENGTH);
    commit(merged);
    focusBox(Math.min(merged.length, OTP_LENGTH - 1));
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        onChange(nextDigits.join(""));
        return;
      }
      if (index > 0) {
        event.preventDefault();
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        onChange(nextDigits.join(""));
        focusBox(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(index: number, event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted === "") return;
    event.preventDefault();
    const merged = (value.slice(0, index) + pasted).slice(0, OTP_LENGTH);
    commit(merged);
    focusBox(Math.min(merged.length, OTP_LENGTH - 1));
  }

  return (
    <div role="group" aria-label={ariaLabel} className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          aria-label={`${ariaLabel} ${index + 1}`}
          aria-describedby={describedById}
          aria-invalid={invalid}
          className={cn(
            // STEP AUTH-01: `w-8` (not `w-10`) at the base breakpoint —
            // measured directly against `AuthFormPanel`'s real card
            // padding (`px-4` page gutter + `p-[22px]` card padding at
            // this breakpoint): 6 boxes at the old `w-10` plus 5×`gap-2`
            // needed 280px, but a 320px-wide viewport only has ~244px of
            // card-inner width to give them, a real overflow below
            // ~356px wide. `w-8` needs 232px, comfortably inside that.
            "h-12 w-8 rounded-xl border bg-black/25 text-center text-xl font-semibold text-white backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] sm:h-14 sm:w-12",
            invalid ? "border-red-500" : "border-white/10",
            disabled && "opacity-60"
          )}
        />
      ))}
    </div>
  );
}
