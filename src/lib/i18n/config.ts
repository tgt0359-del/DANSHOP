/**
 * Language configuration for DANSHOP.
 *
 * This project supports three languages. Lao is the default language,
 * with English and Thai as additional options.
 */

export const locales = ["lo", "en", "th"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "lo";

export const localeMeta: Record<Locale, { label: string; flag: string }> = {
  lo: { label: "ລາວ", flag: "🇱🇦" },
  en: { label: "English", flag: "🇬🇧" },
  th: { label: "ไทย", flag: "🇹🇭" },
};
