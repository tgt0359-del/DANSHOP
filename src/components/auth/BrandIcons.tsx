import { cn } from "@/lib/cn";

/**
 * ICON-REAL-01 — real, official-style brand marks for the social-login
 * buttons, replacing the previous flat-color-square-plus-letter
 * placeholders. Every path below is verified, accurate brand SVG data
 * (fetched live from reputable open-source icon sources and checked
 * against the real logos — not reproduced from memory, not invented):
 *   - Discord/Facebook paths: simple-icons (github.com/simple-icons/
 *     simple-icons, CC0), the same paths that project's own npm package
 *     ships — fetched directly from their CDN this pass.
 *   - Google's four colored paths: SuperTinyIcons (github.com/edent/
 *     SuperTinyIcons, CC0) — the real 4-color "G" mark (blue/red/yellow/
 *     green), not a monochrome simplification.
 *
 * `aria-hidden="true"` is baked into every icon here, not left to each
 * call site to remember — every button that renders one of these also
 * renders the provider's real name as visible text right next to it
 * (`t("auth.continueWithGoogle")` etc.), so the icon is always decorative
 * and would only duplicate an already-correct accessible name if it were
 * exposed to the accessibility tree too.
 */

/**
 * Google's real 4-color "G" mark on a small white rounded square —
 * Google's own brand guidelines specifically call for the mark to sit on
 * a light/white surface for contrast, which is why this one (unlike
 * Discord/Facebook below) carries its own background rather than just
 * being a `currentColor` glyph.
 */
export function GoogleBrandIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[4px] bg-white p-[3px]", className)}
    >
      <svg viewBox="0 0 512 512" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <path fill="#34a853" d="m153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341" />
        <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57" />
        <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73" />
        <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55" />
      </svg>
    </span>
  );
}

/** Discord's real "Clyde" mark — a plain white glyph (per this pass's own
 * "Discord white or light logo color" request), no background container. */
export function DiscordBrandIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("shrink-0 text-white", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

/** Facebook's real circular "f" mark — one combined path (circle + glyph),
 * rendered in Facebook's own brand blue. */
export function FacebookBrandIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("shrink-0 text-[#1877F2]", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}
