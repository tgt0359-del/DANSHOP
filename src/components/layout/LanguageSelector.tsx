"use client";

import { Select } from "@/components/ui/Select";
import { locales, localeMeta, type Locale } from "@/lib/i18n/config";

/**
 * A real, accessible `<select>` for choosing a language (Step 56 §2) —
 * reuses the app's one language-metadata source (`locales`/`localeMeta`
 * in `lib/i18n/config.ts`, the same list `LanguageSwitcher` used) rather
 * than a second, duplicated language list.
 */
export function LanguageSelector({
  id,
  value,
  onChange,
}: {
  id: string;
  value: Locale;
  onChange: (locale: Locale) => void;
}) {
  return (
    <Select id={id} value={value} onChange={(event) => onChange(event.target.value as Locale)} className="w-full">
      {locales.map((code) => (
        <option key={code} value={code}>
          {localeMeta[code].flag} {localeMeta[code].label}
        </option>
      ))}
    </Select>
  );
}
