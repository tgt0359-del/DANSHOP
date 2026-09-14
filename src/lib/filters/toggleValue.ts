/**
 * Toggles `value` in `list`, returning a new array — added if absent,
 * removed if present. Never mutates `list`, so it's safe to use directly
 * as a `useState` updater (`setList((current) => toggleValue(current, value))`).
 *
 * The one place multi-select filter toggling logic lives (Step 55.1).
 * Product Type is the first filter dimension built as a true multi-select
 * (checkboxes, OR-within-dimension) — this helper is generic precisely so
 * Platform or Region can reuse it verbatim if either becomes multi-select
 * later (Step 55 §15/Step 55.1 §15), without a second implementation of
 * the same add/remove logic.
 */
export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
