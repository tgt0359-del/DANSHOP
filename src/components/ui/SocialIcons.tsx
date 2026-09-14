/**
 * Simple monochrome icons for social platforms that Lucide doesn't ship
 * (its icon set dropped brand/logo marks). Drawn plain and minimal —
 * generic recognizable shapes, not a trace of any platform's exact logo
 * artwork — sized and stroked to match Lucide's visual weight.
 */

type IconProps = { className?: string };

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M13.5 21v-6.5h2.2l.3-2.6h-2.5v-1.6c0-.75.2-1.27 1.29-1.27h1.38V6.68c-.24-.03-1.06-.1-2.02-.1-2 0-3.37 1.22-3.37 3.46v1.86H8.5v2.6h2.31V21h2.69Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.4 9.3v5.4l4.9-2.7-4.9-2.7Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
