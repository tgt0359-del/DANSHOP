"use client";

import { useEffect, useState } from "react";
import { getArtworkSpec } from "@/lib/gameArtwork";

type RngShapesProps = { uid: string; rng: () => number; accent: string };

/** Variant 0 — a soft spotlight glow with a few scattered particles and a faint beam. */
function Spotlight({ uid, rng, accent }: RngShapesProps) {
  const cx = rng() > 0.5 ? 300 : 100;
  const cy = 50 + rng() * 60;
  const particles = Array.from({ length: 5 }, () => ({
    x: rng() * 400,
    y: rng() * 250,
    r: 1.4 + rng() * 2.2,
  }));
  const lineY1 = rng() * 250;
  const lineY2 = rng() * 250;

  return (
    <>
      <circle cx={cx} cy={cy} r="180" fill={`url(#glow-${uid})`} />
      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={accent} opacity={0.6} />
      ))}
      <line x1="0" y1={lineY1} x2="400" y2={lineY2} stroke={accent} strokeOpacity="0.2" strokeWidth="1" />
    </>
  );
}

/** Variant 1 — concentric rings around an off-center point, like a portal or ripple. */
function Arcs({ uid, rng, accent }: RngShapesProps) {
  const cx = 90 + rng() * 220;
  const cy = 60 + rng() * 130;

  return (
    <>
      <circle cx={cx} cy={cy} r="130" fill={`url(#glow-${uid})`} opacity="0.6" />
      {[56, 96, 136].map((r, i) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={accent}
          strokeOpacity={0.4 - i * 0.11}
          strokeWidth="1.5"
        />
      ))}
    </>
  );
}

/** Variant 2 — layered angular shards, like fractured glass or energy fragments. */
function Shards({ rng, accent }: { rng: () => number; accent: string }) {
  const shards = Array.from({ length: 5 }, (_, i) => ({
    x: rng() * 400,
    y: rng() * 250,
    size: 70 + rng() * 100,
    rotate: rng() * 360,
    opacity: 0.06 + i * 0.035,
  }));

  return (
    <>
      {shards.map((s, i) => (
        <rect
          key={i}
          x={-s.size / 2}
          y={-s.size / 2}
          width={s.size}
          height={s.size}
          fill={accent}
          opacity={s.opacity}
          transform={`translate(${s.x} ${s.y}) rotate(${s.rotate})`}
        />
      ))}
    </>
  );
}

/** Variant 3 — a scattered particle field with a soft glow, like a starfield. */
function Particles({ uid, rng, accent }: RngShapesProps) {
  const glowX = rng() * 400;
  const glowY = rng() * 250;
  const dots = Array.from({ length: 22 }, () => ({
    x: rng() * 400,
    y: rng() * 250,
    r: 0.8 + rng() * 2.1,
    o: 0.25 + rng() * 0.5,
  }));

  return (
    <>
      <circle cx={glowX} cy={glowY} r="150" fill={`url(#glow-${uid})`} opacity="0.5" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={accent} opacity={d.o} />
      ))}
    </>
  );
}

/**
 * Original, generated cover art for a game — a gradient plus an abstract
 * composition, no external images involved. See `lib/gameArtwork.ts` for
 * how the look is derived from the game's id/genre.
 */
export function GameArtwork({
  game,
  overlay = "none",
  className,
}: {
  game: { id: string; genre: string; title: string };
  /** "bottom" adds a dark gradient for text placed over the artwork (e.g. the hero). */
  overlay?: "none" | "bottom";
  className?: string;
}) {
  // The shape layer below is randomly generated (deterministically, from a
  // seed — see lib/gameArtwork.ts), but that math isn't guaranteed to come
  // out bit-for-bit identical between the server's JS engine and every
  // browser's. Rendering it only after mount means the server never sends
  // shape markup that the client would need to match, so there's nothing
  // for hydration to disagree about — standard practice for any generated
  // decorative content in an SSR app.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only mount gate, not derived state
    setMounted(true);
  }, []);

  const { hue, variant, rng } = getArtworkSpec(game);
  const uid = game.id;
  const bgFrom = `hsl(${hue} 34% 13%)`;
  const bgTo = `hsl(${(hue + 26) % 360} 30% 6%)`;
  const glow = `hsl(${hue} 70% 55%)`;
  const accent = `hsl(${hue} 55% 72%)`;

  return (
    <svg
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={game.title}
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bgFrom} />
          <stop offset="100%" stopColor={bgTo} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`}>
          <stop offset="0%" stopColor={glow} stopOpacity="0.8" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        {overlay === "bottom" && (
          <linearGradient id={`overlay-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="black" stopOpacity="0.85" />
            <stop offset="55%" stopColor="black" stopOpacity="0.2" />
            <stop offset="100%" stopColor="black" stopOpacity="0" />
          </linearGradient>
        )}
      </defs>

      <rect width="400" height="250" fill={`url(#bg-${uid})`} />

      {mounted && (
        <>
          {variant === 0 && <Spotlight uid={uid} rng={rng} accent={accent} />}
          {variant === 1 && <Arcs uid={uid} rng={rng} accent={accent} />}
          {variant === 2 && <Shards rng={rng} accent={accent} />}
          {variant === 3 && <Particles uid={uid} rng={rng} accent={accent} />}
        </>
      )}

      {overlay === "bottom" && <rect width="400" height="250" fill={`url(#overlay-${uid})`} />}
    </svg>
  );
}
