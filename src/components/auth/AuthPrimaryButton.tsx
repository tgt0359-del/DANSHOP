"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * The one accent primary button shared by `/login`, `/register`, and the
 * post-signup email-OTP screen (`EmailOtpVerificationView`). Deliberately
 * NOT the site-wide `Button` component's `variant="primary"` (solid
 * black, `baseClasses` hardcodes a black `focus-visible:ring`) — reusing
 * it here would either fight that black ring with a second, conflicting
 * ring-color utility (this app's `cn` is plain class concatenation, not a
 * Tailwind-merge, so the two would compete unpredictably) or require
 * adding a new variant to a component used by every other page on the
 * site, out of scope for a login/register-only visual pass. A small local
 * primitive with its own self-contained class string avoids both problems
 * and keeps the accent color isolated to exactly the auth pages.
 *
 * BRAND-UNIFY-01: `#1A9FFF` (hover `#168BE0`) — this pass's own explicit
 * accent values, matching what `LoginView`/`AuthBrandPanel`/
 * `AuthSocialButtons` already use, so this button and the rest of the
 * page now share exactly one blue rather than two very-similar-but-not-
 * identical ones. Flat, no gradient — "avoid an overly bright electric-
 * blue appearance" and "no excessive gradients" both still apply.
 * `ring-offset-[#151922]` matches the card background both call sites
 * (the login/register form and the email-OTP screen) render this button
 * into.
 */
export function AuthPrimaryButton({ className, disabled, ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled}
      className={cn(
        "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#1A9FFF] text-base font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-colors duration-200 hover:bg-[#168BE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
