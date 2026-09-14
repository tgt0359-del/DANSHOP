import type { Locale } from "@/lib/i18n/config";

/**
 * Short month names, hand-verified against Node's ICU output rather than
 * left to the runtime's `Intl.DateTimeFormat` locale data: browser ICU
 * support for "lo" (Lao) is inconsistent — some browsers silently fall back
 * to English — which caused the server (Node, full ICU) and the client
 * (browser, partial ICU) to render different text for the same date and
 * trip a React hydration mismatch. Hardcoding these makes the output
 * identical everywhere, independent of what ICU data the runtime ships.
 */
const MONTHS: Record<Locale, string[]> = {
  lo: ["ມ.ກ.", "ກ.ພ.", "ມ.ນ.", "ມ.ສ.", "ພ.ພ.", "ມິ.ຖ.", "ກ.ລ.", "ສ.ຫ.", "ກ.ຍ.", "ຕ.ລ.", "ພ.ຈ.", "ທ.ວ."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
};

/**
 * Formats an ISO (yyyy-mm-dd) calendar date for display, e.g.
 * "Aug 28, 2026" (en) or "28 ສ.ຫ. 2026" (lo). Parses the string directly
 * (no `Date`/timezone involved) so it can't shift by a day between
 * environments either.
 */
export function formatShortDate(isoDate: string, locale: Locale): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = MONTHS[locale][month - 1];

  return locale === "en" ? `${monthName} ${day}, ${year}` : `${day} ${monthName} ${year}`;
}
