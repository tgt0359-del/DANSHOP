/**
 * Phone-auth country support (Step 76 §4) — deliberately just the two
 * countries this step asks for, not a full world dial-code list. Reuses
 * the site's existing `regions.thailand`/`regions.laos` translation keys
 * (`lib/products/regionLabels.ts`, Step 54) for the country names rather
 * than inventing new ones — the same words, already correct in Lao/
 * English/Thai.
 */
export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, used as the option's stable identity. */
  code: "TH" | "LA";
  /** E.164 country calling code, including the leading "+". */
  dialCode: string;
  nameKey: string;
  flag: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "TH", dialCode: "+66", nameKey: "regions.thailand", flag: "🇹🇭" },
  { code: "LA", dialCode: "+856", nameKey: "regions.laos", flag: "🇱🇦" },
];

export const defaultPhoneCountry: PhoneCountry = PHONE_COUNTRIES[0];

/**
 * Normalizes a locally-typed number into E.164 (Step 76 §4's "use
 * international phone-number format internally... normalize Thailand and
 * Laos numbers correctly") — strips everything but digits, then drops a
 * single leading trunk "0" (how both Thai and Lao mobile numbers are
 * conventionally written domestically, e.g. "081 234 5678" /
 * "020 1234 5678") before prefixing the selected country's dial code,
 * since that leading 0 is a domestic dialing prefix that has no place in
 * the international form. Returns `null` for anything left too short to
 * plausibly be a real mobile number, rather than sending Supabase an
 * obviously-malformed one.
 */
export function normalizePhoneNumber(country: PhoneCountry, rawLocalNumber: string): string | null {
  const digitsOnly = rawLocalNumber.replace(/\D/g, "");
  const withoutTrunkZero = digitsOnly.startsWith("0") ? digitsOnly.slice(1) : digitsOnly;

  if (withoutTrunkZero.length < 8) return null;

  return `${country.dialCode}${withoutTrunkZero}`;
}
