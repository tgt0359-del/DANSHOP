/**
 * Deterministic, original placeholder artwork.
 *
 * Rather than pulling images from an external placeholder service (flat,
 * identical-looking panels, plus it's an external dependency), each game
 * gets its own abstract composition — a gradient plus shapes — derived
 * purely from its id. Same id always produces the exact same output, so
 * it's safe to render on both the server and the client, and different
 * games end up looking visibly different from each other.
 *
 * This is a placeholder system, not final art: swap it for real cover
 * images later by having `GameArtwork` render an `<Image>` when a game
 * carries a real `image` URL instead.
 */

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Tiny seeded PRNG (mulberry32) — deterministic, no Math.random(). */
function makeRng(seed: number): () => number {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Loose genre → base hue, so palettes feel intentional rather than purely
// random. Each game still gets its own jitter within that family, and any
// genre not listed here falls back to a hash-derived hue.
const GENRE_HUES: Record<string, number> = {
  Action: 355,
  "Action RPG": 265,
  RPG: 265,
  Racing: 200,
  Strategy: 150,
  Simulation: 190,
  Puzzle: 175,
  Platformer: 40,
  Adventure: 28,
  Shooter: 8,
  Horror: 282,
  MOBA: 318,
  "Battle Royale": 18,
};

export type ArtworkVariant = 0 | 1 | 2 | 3;

export interface ArtworkSpec {
  hue: number;
  variant: ArtworkVariant;
  rng: () => number;
}

export function getArtworkSpec(game: { id: string; genre: string }): ArtworkSpec {
  const seed = hashString(game.id);
  const baseHue = GENRE_HUES[game.genre] ?? seed % 360;
  const hue = (baseHue + (seed % 41) - 20 + 360) % 360;
  const variant = (seed % 4) as ArtworkVariant;
  return { hue, variant, rng: makeRng(seed) };
}
