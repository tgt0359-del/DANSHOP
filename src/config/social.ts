import type { ElementType } from "react";
import { Code2, Music2, X } from "lucide-react";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/ui/SocialIcons";

export interface SocialLink {
  /** Accessible label — also shown as a tooltip via the title attribute. */
  name: string;
  href: string;
  icon: ElementType;
}

/**
 * Centralized social link configuration — the single place that defines
 * DANSHOP's social profiles, referenced by the Footer (and anywhere else
 * that later needs the same list) instead of hardcoding URLs per-component.
 *
 * ⚠️ PLACEHOLDER URLS — every `href` below is "#", not a guess at a real
 * DANSHOP account. Replace each one with the real profile URL when it
 * exists; nothing else needs to change.
 *
 * Icon note: the installed Lucide version dropped brand/logo icons, so
 * TikTok and GitHub use a close generic stand-in (a music note, a code
 * glyph) rather than an exact brand mark. Facebook/Instagram/YouTube use
 * small hand-drawn generic icons (see components/ui/SocialIcons.tsx). X
 * uses Lucide's own "X" glyph, which is an exact match for that platform's mark.
 */
export const socialLinks: SocialLink[] = [
  { name: "Facebook", href: "#", icon: FacebookIcon }, // TODO: replace with the real Facebook page URL
  { name: "X (Twitter)", href: "#", icon: X }, // TODO: replace with the real X/Twitter profile URL
  { name: "Instagram", href: "#", icon: InstagramIcon }, // TODO: replace with the real Instagram profile URL
  { name: "TikTok", href: "#", icon: Music2 }, // TODO: replace with the real TikTok profile URL
  { name: "YouTube", href: "#", icon: YoutubeIcon }, // TODO: replace with the real YouTube channel URL
  { name: "GitHub", href: "#", icon: Code2 }, // TODO: replace with the real GitHub org/profile URL
];
