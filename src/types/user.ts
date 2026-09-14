import type { Locale } from "@/lib/i18n/config";
import type { CurrencyCode } from "@/types/currency";

/**
 * No permission logic exists for either role yet (Step 36 §2) — this is
 * only the type, ready for a future admin dashboard/authorization layer
 * to check against.
 */
export type UserRole = "customer" | "admin";

/**
 * A user profile — the durable record a real account system would store.
 * Deliberately holds no password, password hash, OTP, or auth token of
 * any kind (see types/auth.ts's `Session` for the separate, equally
 * credential-free concept of "currently signed in"). As of Step 71, real
 * rows are created via Supabase Auth sign-up (see
 * lib/auth/supabaseAuthProvider.ts and the `on_auth_user_created` database
 * trigger) — this shape now matches what that path actually populates.
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  /** Reuses the site's existing locale type (`src/lib/i18n/config.ts`)
   * directly rather than duplicating it — "lo" | "en" | "th". */
  preferredLanguage: Locale;
  /** Reuses the site's real, existing DISPLAY-currency type
   * (`src/types/currency.ts`'s `CurrencyCode` — "USD" | "THB" | "LAK",
   * Step 56), not `types/payment.ts`'s narrower transactional `Currency`
   * ("LAK" | "USD" only, always "USD" in practice — see that file's own
   * comment on why the two are deliberately separate concepts). Step 71
   * §13 requires an authenticated user's preferred currency to cover the
   * same USD/THB/LAK the Settings modal already offers every guest, so
   * this now reuses that type directly instead of the narrower one Step
   * 36 originally referenced (written before Step 56 added THB display
   * support). No new conversion logic is implied or added here. */
  preferredCurrency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}
