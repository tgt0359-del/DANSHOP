import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { generateId } from "@/lib/generateId";
import {
  deleteUser,
  getUserByEmail as getUserByEmailFromStore,
  getUserById as getUserByIdFromStore,
  saveUser,
  updateUser,
} from "@/lib/users/userStore";
import type { CurrencyCode } from "@/types/currency";
import type { User, UserRole } from "@/types/user";

export interface CreateUserProfileInput {
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role?: UserRole;
  preferredLanguage?: Locale;
  preferredCurrency?: CurrencyCode;
}

/**
 * The user service layer (Step 36 §5) — a demo/local stand-in for what a
 * real backend's user table + API would provide.
 *
 * Superseded, not deleted, as of Step 71: real sign-up now goes through
 * `lib/auth/supabaseAuthProvider.ts` (Supabase Auth + the `users` table,
 * with the profile row created by a database trigger — see
 * `supabase/migrations/20260908000000_danshop_auth_integration.sql`), not
 * this local `localStorage` store. Nothing in the live app calls
 * `createUserProfile` any more (kept, unused, rather than deleted, exactly
 * as it already was before this step — removing files wasn't asked for).
 * This is intentionally NOT a second active user system: it's inert.
 */

export function getUserById(id: string): User | undefined {
  return getUserByIdFromStore(id);
}

export function getUserByEmail(email: string): User | undefined {
  return getUserByEmailFromStore(email);
}

/**
 * Creates a new user profile — or returns the existing one if a profile
 * with this email already exists, so this stays safe to call more than
 * once for the same person (the same idempotent-create pattern
 * lib/orders/orderRepository.ts's createOrder uses for order references).
 */
export function createUserProfile(input: CreateUserProfileInput): User {
  const existing = getUserByEmailFromStore(input.email);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const user: User = {
    id: generateId(),
    email: input.email,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl ?? null,
    role: input.role ?? "customer",
    preferredLanguage: input.preferredLanguage ?? defaultLocale,
    preferredCurrency: input.preferredCurrency ?? "USD",
    createdAt: now,
    updatedAt: now,
  };

  saveUser(user);
  return user;
}

export function updateUserProfile(id: string, patch: Partial<Omit<User, "id" | "createdAt">>): User | undefined {
  return updateUser(id, patch);
}

export function deleteUserProfile(id: string): boolean {
  return deleteUser(id);
}
