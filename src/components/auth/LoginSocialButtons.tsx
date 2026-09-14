"use client";

import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";

/**
 * UI-LOGIN-REDESIGN-01 §2 — the Login page's social-login row. Apple is
 * removed entirely (§1: no button, no red "unavailable" notice, no
 * leftover logic). Google is joined by four placeholder entries — Discord,
 * Twitch, GitHub, Facebook — that have never had any real backend behind
 * them and aren't in scope to wire up (per this component's own later
 * debug pass, see immediately below).
 *
 * DEBUG-GOOGLE-OAUTH-01: the redesign above made every one of these five
 * buttons a pure UI placeholder (on purpose, at the time — Login's own
 * brief was explicitly "UI/UX only, not yet wired to real OAuth"). That
 * meant clicking "Continue with Google" only ever set local state and
 * showed a static "coming soon" string — it never called Supabase at all,
 * which is exactly why Google sign-in appeared to do nothing / never
 * redirected anywhere. This pass reconnects ONLY the Google button to the
 * real, already-built `signInWithOAuthProvider("google")` call (via
 * `CurrentUserProvider` → `supabaseAuthProvider.ts`'s preflight-checked
 * `signInWithOAuth`, Step 76/AUTH-01 — unchanged, not reimplemented here).
 * Discord/Twitch/GitHub/Facebook are explicitly out of scope for this
 * debug task and keep their exact original placeholder behavior below.
 *
 * This still deliberately does NOT reuse `ProviderButtons.tsx` (Step 76),
 * which still renders Apple — that component is left untouched because
 * `/register` still renders it unchanged.
 *
 * Each badge is a small colored initial rather than a hand-traced brand
 * logo mark — accurate enough to be visually distinct per provider
 * (alongside the real text label every button already carries) without
 * risking a malformed/inaccurate reproduction of a trademarked logo.
 */
const SOCIAL_PROVIDERS = [
  { id: "google", labelKey: "auth.continueWithGoogle", badge: "G", color: "#4285F4" },
  { id: "discord", labelKey: "auth.continueWithDiscord", badge: "D", color: "#5865F2" },
  { id: "twitch", labelKey: "auth.continueWithTwitch", badge: "T", color: "#9146FF" },
  { id: "github", labelKey: "auth.continueWithGithub", badge: "gh", color: "#18181b" },
  { id: "facebook", labelKey: "auth.continueWithFacebook", badge: "f", color: "#1877F2" },
] as const;

export function LoginSocialButtons() {
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
      // screen — nothing left to do here. (`googlePending` is deliberately
      // left true: there's no next render where "not pending" would be
      // the correct state before the page unloads.)
    } catch {
      // Never surfaces the real error's raw message (it can legitimately
      // contain provider/config details) — same fixed, localized notice
      // `ProviderButtons.tsx` already uses for this exact failure mode
      // (e.g. Google not yet enabled in the Supabase dashboard).
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
          className="inline-flex h-11 w-full items-center gap-3 rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <span
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
            style={{ backgroundColor: provider.color }}
          >
            {provider.badge}
          </span>
          {t(provider.labelKey)}
        </button>
      ))}
      {googleErrorKey && (
        <p role="alert" className="text-center text-xs text-red-600">
          {t(googleErrorKey)}
        </p>
      )}
      {placeholderNoticeShown && (
        <p role="status" className="text-center text-xs text-secondary">
          {t("auth.socialComingSoon")}
        </p>
      )}
    </div>
  );
}
