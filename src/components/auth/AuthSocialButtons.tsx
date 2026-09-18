"use client";

import { useState } from "react";
import { DiscordBrandIcon, FacebookBrandIcon, GoogleBrandIcon } from "@/components/auth/BrandIcons";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";

/**
 * BRAND-UNIFY-01/ICON-REAL-01 — the social-login row shared by `/login`
 * and `/register`. This file replaces two predecessors: an older
 * `AuthSocialButtons.tsx` (5 providers, used by both pages via the
 * shared `AuthPageLayout`) and a newer `LoginSocialButtons.tsx` (3
 * providers, forked Login-only when a task explicitly scoped work to
 * Login alone). Now that this task explicitly asks for both pages to
 * share the same real logo and layout, the fork is reconciled back into
 * one component under the correctly-generic name — Register no longer
 * has any reason to diverge.
 *
 * ICON-REAL-01: each provider's flat-color-square-plus-letter placeholder
 * (the "G"/"D"/"f" badges) is now the real brand mark from
 * `BrandIcons.tsx` — see that file's own doc comment for where the SVG
 * data came from. Nothing about button text, order, spacing, height,
 * radius, border, hover state, or click handlers changed.
 *
 * Exactly three providers, Google always first: Google (real,
 * `signInWithOAuthProvider("google")` via `CurrentUserProvider` →
 * `supabaseAuthProvider.ts`'s existing preflight-checked
 * `signInWithOAuth` — untouched, not reimplemented here) and Discord/
 * Facebook (honest "coming soon" placeholders — never a fake success,
 * never a real network call). `#151922`-elevated surface,
 * `rgba(255,255,255,0.10)` border, `52px` height, `#1A9FFF` focus ring —
 * unchanged.
 */
const SOCIAL_PROVIDERS = [
  { id: "google", labelKey: "auth.continueWithGoogle", Icon: GoogleBrandIcon },
  { id: "discord", labelKey: "auth.continueWithDiscord", Icon: DiscordBrandIcon },
  { id: "facebook", labelKey: "auth.continueWithFacebook", Icon: FacebookBrandIcon },
] as const;

export function AuthSocialButtons() {
  const { t } = useLanguage();
  const { signInWithOAuthProvider } = useCurrentUserContext();
  const [placeholderNoticeShown, setPlaceholderNoticeShown] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleErrorKey, setGoogleErrorKey] = useState<string | null>(null);

  async function handleGoogleClick() {
    setPlaceholderNoticeShown(false);
    setGoogleErrorKey(null);
    setGooglePending(true);
    try {
      await signInWithOAuthProvider("google");
      // On success the browser is already navigating to Google's consent
      // screen (same-tab, real full navigation — never a popup/new tab) —
      // nothing left to do here.
    } catch {
      // Never surfaces the real error's raw message (it can legitimately
      // contain provider/config details) — the same fixed, localized
      // notice used since AUTH-01/DEBUG-GOOGLE-OAUTH-01 for this exact
      // failure mode (e.g. Google not yet enabled in the Supabase
      // dashboard).
      setGoogleErrorKey("auth.errorGoogleUnavailable");
      setGooglePending(false);
    }
  }

  function handlePlaceholderClick() {
    setGoogleErrorKey(null);
    setPlaceholderNoticeShown(true);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {SOCIAL_PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          disabled={provider.id === "google" && googlePending}
          onClick={provider.id === "google" ? handleGoogleClick : handlePlaceholderClick}
          className="inline-flex h-[52px] w-full items-center gap-3 rounded-xl border border-white/15 bg-[#171C26] px-4 text-sm font-medium text-white transition-all duration-200 hover:border-white/25 hover:bg-[#1C222E] hover:shadow-[0_0_0_1px_rgba(26,159,255,0.12),0_4px_18px_rgba(26,159,255,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151922] disabled:pointer-events-none disabled:opacity-50"
        >
          <provider.Icon className="h-5 w-5" />
          {t(provider.labelKey)}
        </button>
      ))}
      {googleErrorKey && (
        <p role="alert" className="text-center text-xs text-[#EF4444]">
          {t(googleErrorKey)}
        </p>
      )}
      {placeholderNoticeShown && (
        <p role="status" className="text-center text-xs text-[#98A2B3]">
          {t("auth.socialComingSoon")}
        </p>
      )}
    </div>
  );
}
