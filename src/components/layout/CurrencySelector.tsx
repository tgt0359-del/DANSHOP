"use client";

import { Select } from "@/components/ui/Select";
import { CURRENCIES, currencyCodes, type CurrencyCode } from "@/types/currency";

/**
 * A real, accessible `<select>` for choosing a display currency (Step 56
 * §2/§4) — reads the one centralized `CURRENCIES` definition
 * (`types/currency.ts`) rather than a second, duplicated currency list.
 */
export function CurrencySelector({
  id,
  value,
  onChange,
}: {
  id: string;
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
}) {
  return (
    <Select id={id} value={value} onChange={(event) => onChange(event.target.value as CurrencyCode)} className="w-full">
      {currencyCodes.map((code) => {
        const meta = CURRENCIES[code];
        return (
          <option key={code} value={code}>
            {meta.code} — {meta.name} ({meta.symbol})
          </option>
        );
      })}
    </Select>
  );
}
