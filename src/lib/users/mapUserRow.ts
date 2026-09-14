/**
 * The `public.users` row → app `User` mapping (Step 71, extracted in Step
 * 73 §1/§6) — pure, environment-agnostic (no browser or Node-only API),
 * so both `supabaseAuthProvider.ts` (browser) and `lib/auth/serverAuth.ts`
 * (server) read a signed-in user's profile through the exact same
 * mapping, rather than two copies that could drift apart.
 */
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { defaultCurrency, isCurrencyCode } from "@/types/currency";
import type { User, UserRole } from "@/types/user";

export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  preferred_language: string;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: (row.role === "admin" ? "admin" : "customer") as UserRole,
    preferredLanguage: isLocale(row.preferred_language) ? row.preferred_language : defaultLocale,
    preferredCurrency: isCurrencyCode(row.preferred_currency) ? row.preferred_currency : defaultCurrency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * A safe, read-only fallback `User` built from the auth session alone
 * (email + id), used only when the `users` profile row genuinely can't be
 * read yet — e.g. the `on_auth_user_created` trigger (see
 * supabase/migrations/20260908000000_danshop_auth_integration.sql) hasn't
 * finished committing in the instant right after sign-up, or that
 * migration hasn't been applied to this project yet. Never writes
 * anything — inserting a `users` row would need a client-side INSERT
 * policy that deliberately doesn't exist (Step 38 §15: "a new row is
 * expected to be created by a trigger"), so this stays read-only and
 * defers to the trigger/a later refetch instead of using any privileged
 * access.
 */
export function fallbackUser(id: string, email: string): User {
  const now = new Date().toISOString();
  return {
    id,
    email,
    displayName: email.split("@")[0] ?? email,
    avatarUrl: null,
    role: "customer",
    preferredLanguage: defaultLocale,
    preferredCurrency: defaultCurrency,
    createdAt: now,
    updatedAt: now,
  };
}
