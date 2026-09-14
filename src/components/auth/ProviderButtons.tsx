"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrentUserContext } from "@/lib/auth/CurrentUserProvider";
import type { OAuthProviderId } from "@/types/auth";

/**
 * "Continue with Google" / "Continue with Apple" / "Continue with phone"
 * (Step 76 §1/§2/§3/§4/§6). Replaces Step 72's `OAuthButtons` — that
 * component never called Supabase at all (a purely decorative "coming
 * soon" click handler); this one makes the real `signInWithOAuth` call
 * through the shared `CurrentUserProvider`/`supabaseAuthProvider`, and
 * shows an honest, localized "not available yet" message only if
 * Supabase itself reports the provider isn't configured — never a fake
 * success. Facebook is removed entirely, not replaced with anything.
 *
 * "Continue with phone" isn't a single action (it's a multi-step flow),
 * so this only tells the caller to show `PhoneAuthFlow` — no duplicated
 * phone logic lives here.
 *
 * Shared by `/login` and `/register` — one implementation, not two.
 */
export function ProviderButtons({ onPhoneClick }: { onPhoneClick: () => void }) {
  const { t } = useLanguage();
  const { signInWithOAuthProvider } = useCurrentUserContext();
  const [pendingProvider, setPendingProvider] = useState<OAuthProviderId | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function handleOAuthClick(provider: OAuthProviderId) {
    setErrorKey(null);
    setPendingProvider(provider);
    try {
      await signInWithOAuthProvider(provider);
      // On success the browser is already navigating to the provider's
      // consent screen — nothing left to do here.
    } catch {
      setErrorKey(provider === "google" ? "auth.errorGoogleUnavailable" : "auth.errorAppleUnavailable");
      setPendingProvider(null);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={pendingProvider === "google"}
        onClick={() => handleOAuthClick("google")}
      >
        {t("auth.continueWithGoogle")}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={pendingProvider === "apple"}
        onClick={() => handleOAuthClick("apple")}
      >
        {t("auth.continueWithApple")}
      </Button>
      <Button type="button" variant="secondary" size="lg" className="w-full" onClick={onPhoneClick}>
        {t("auth.continueWithPhone")}
      </Button>
      {errorKey && (
        <p role="alert" className="text-center text-xs text-red-600">
          {t(errorKey)}
        </p>
      )}
    </div>
  );
}
