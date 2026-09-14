import type { Game } from "@/types/game";

/**
 * Mock game catalog for frontend development.
 *
 * All titles, prices, descriptions, and images below are fictional
 * placeholders invented for DANSHOP — none of this is real product data,
 * and images are generated placeholders (placehold.co), not artwork. This
 * file exists purely so the UI has realistic-looking data to render before
 * a real backend/database exists.
 *
 * Rather than keeping separate lists for "trending", "deals", etc., each
 * game just carries flags/fields (`featured`, `trending`, `discount`,
 * `releaseDate`) and the selector functions below derive the right view —
 * one source of truth, no duplicated data.
 *
 * This is still the real, authoritative source — see src/lib/products/
 * (Step 35) for a newer, backend-ready `Product` view derived from this
 * same array via an adapter, used by new code and the product detail
 * page's slug-existence check, without duplicating anything here.
 */
export const games: Game[] = [
  {
    id: "crimson-horizon",
    title: "Crimson Horizon",
    slug: "crimson-horizon",
    platform: "PC",
    genre: "Action RPG",
    description: "A sprawling action RPG across a war-torn frontier of five rival factions.",
    price: 39.99,
    originalPrice: 39.99,
    discount: 0,
    rating: 4.6,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Crimson+Horizon",
    releaseDate: "2026-06-12",
    trending: true,
  },
  {
    id: "nova-drift",
    title: "Nova Drift",
    slug: "nova-drift",
    platform: "PC",
    genre: "Racing",
    description: "Zero-gravity street racing through neon-lit orbital cities.",
    price: 29.99,
    originalPrice: 39.99,
    discount: 25,
    rating: 4.3,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Nova+Drift",
    releaseDate: "2026-03-02",
    trending: true,
  },
  {
    id: "silent-frontier",
    title: "Silent Frontier",
    slug: "silent-frontier",
    platform: "PC & Mobile",
    genre: "Strategy",
    description: "Build and defend a colony on a planet that's always listening back.",
    price: 19.99,
    originalPrice: 24.99,
    discount: 20,
    rating: 4.1,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Silent+Frontier",
    releaseDate: "2025-11-20",
  },
  {
    id: "shadow-ember",
    title: "Shadow Ember",
    slug: "shadow-ember",
    platform: "PC",
    genre: "Action",
    description: "A fast, brutal melee combat game set in a collapsing empire.",
    price: 49.99,
    originalPrice: 49.99,
    discount: 0,
    rating: 4.7,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Shadow+Ember",
    releaseDate: "2026-08-22",
    trending: true,
  },
  {
    id: "skybound-legends",
    title: "Skybound Legends",
    slug: "skybound-legends",
    platform: "Mobile",
    genre: "RPG",
    description: "Free-to-play sky-pirate RPG with co-op airship raids.",
    price: 0,
    originalPrice: 0,
    discount: 0,
    rating: 4.2,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Skybound+Legends",
    releaseDate: "2026-01-15",
    trending: true,
  },
  {
    id: "pixel-raiders",
    title: "Pixel Raiders",
    slug: "pixel-raiders",
    platform: "PC",
    genre: "Platformer",
    description: "A tight, retro-styled platformer built for speedrunners.",
    price: 14.99,
    originalPrice: 14.99,
    discount: 0,
    rating: 4.4,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Pixel+Raiders",
    releaseDate: "2025-09-05",
  },
  {
    id: "ironclad-siege",
    title: "Ironclad Siege",
    slug: "ironclad-siege",
    platform: "PC",
    genre: "Strategy",
    description: "Command fleets of armored warships in massive naval sieges.",
    price: 34.99,
    originalPrice: 44.99,
    discount: 22,
    rating: 4.0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Ironclad+Siege",
    releaseDate: "2026-02-18",
  },
  {
    id: "lunar-outpost",
    title: "Lunar Outpost",
    slug: "lunar-outpost",
    platform: "PC",
    genre: "Simulation",
    description: "Manage a growing lunar colony's power, oxygen, and morale.",
    price: 24.99,
    originalPrice: 24.99,
    discount: 0,
    rating: 3.9,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Lunar+Outpost",
    releaseDate: "2025-12-01",
  },
  {
    id: "velvet-nights",
    title: "Velvet Nights",
    slug: "velvet-nights",
    platform: "Mobile",
    genre: "Puzzle",
    description: "A moody match-three with a noir mystery woven through every level.",
    price: 4.99,
    originalPrice: 6.99,
    discount: 29,
    rating: 4.5,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Velvet+Nights",
    releaseDate: "2026-07-30",
  },
  {
    id: "fractured-realms",
    title: "Fractured Realms",
    slug: "fractured-realms",
    platform: "PC",
    genre: "Adventure",
    description: "An open-world adventure across realms that reshape as you explore them.",
    price: 44.99,
    originalPrice: 59.99,
    discount: 25,
    rating: 4.8,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Fractured+Realms",
    releaseDate: "2026-08-28",
    featured: true,
    trending: true,
  },
  {
    id: "steel-vanguard",
    title: "Steel Vanguard",
    slug: "steel-vanguard",
    platform: "PC & Mobile",
    genre: "Shooter",
    description: "Squad-based tactical shooter with cross-play between PC and mobile.",
    price: 29.99,
    originalPrice: 39.99,
    discount: 25,
    rating: 4.3,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Steel+Vanguard",
    releaseDate: "2026-04-10",
    trending: true,
  },
  {
    id: "whispering-depths",
    title: "Whispering Depths",
    slug: "whispering-depths",
    platform: "PC",
    genre: "Horror",
    description: "A slow-burn survival horror game set in a flooded research station.",
    price: 19.99,
    originalPrice: 19.99,
    discount: 0,
    rating: 4.6,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Whispering+Depths",
    releaseDate: "2025-10-31",
  },
  {
    id: "arena-clash",
    title: "Arena Clash",
    slug: "arena-clash",
    platform: "Mobile",
    genre: "MOBA",
    description: "Fast 5-minute MOBA matches built for one-handed mobile play.",
    price: 0,
    originalPrice: 0,
    discount: 0,
    rating: 4.4,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Arena+Clash",
    releaseDate: "2026-08-05",
    trending: true,
  },
  {
    id: "battle-zone-royale",
    title: "Battle Zone Royale",
    slug: "battle-zone-royale",
    platform: "Mobile",
    genre: "Battle Royale",
    description: "100-player battle royale with a shrinking map that reshapes terrain.",
    price: 9.99,
    originalPrice: 14.99,
    discount: 30,
    rating: 4.1,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Battle+Zone+Royale",
    releaseDate: "2026-07-15",
  },
  {
    id: "tactics-command",
    title: "Tactics Command",
    slug: "tactics-command",
    platform: "Mobile",
    genre: "Strategy",
    description: "Turn-based squad tactics with weekly community-designed maps.",
    price: 6.99,
    originalPrice: 6.99,
    discount: 0,
    rating: 4.2,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Tactics+Command",
    releaseDate: "2026-05-20",
  },
  {
    id: "neon-strike",
    title: "Neon Strike",
    slug: "neon-strike",
    platform: "Mobile",
    genre: "Action",
    description: "Twin-stick arcade shooter with roguelike runs through a neon city.",
    price: 4.24,
    originalPrice: 4.99,
    discount: 15,
    rating: 4.3,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Neon+Strike",
    releaseDate: "2026-08-15",
    trending: true,
  },
];

/** The single game shown in the homepage hero. */
export function getFeaturedGame(): Game {
  return games.find((game) => game.featured) ?? games[0];
}

/** Games shown in the "Trending Now" row. */
export function getTrendingGames(): Game[] {
  return games.filter((game) => game.trending);
}

/** Games shown in "Popular PC Games" — anything playable on PC. */
export function getPcGames(): Game[] {
  return games.filter((game) => game.platform === "PC" || game.platform === "PC & Mobile");
}

/** Games shown in "Popular Mobile Games" — anything playable on mobile. */
export function getMobileGames(): Game[] {
  return games.filter((game) => game.platform === "Mobile" || game.platform === "PC & Mobile");
}

/** Discounted games for "Best Deals", biggest discount first. */
export function getDealGames(): Game[] {
  return games.filter((game) => game.discount > 0).sort((a, b) => b.discount - a.discount);
}

/** Most recently released games for "New Releases". */
export function getNewReleases(limit = 6): Game[] {
  return [...games]
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, limit);
}

/** Looks up a single game by its URL slug — used by the product detail page. */
export function getGameBySlug(slug: string): Game | undefined {
  return games.find((game) => game.slug === slug);
}

/** Turns a category name into a URL-safe slug — lowercase, non-alphanumeric
 * runs collapsed to a single hyphen, leading/trailing hyphens trimmed. Used
 * by the /games/category/[category] route (Step 44). This isn't a new,
 * separate slug scheme: applied to every genre in this file it reproduces
 * exactly the same 13 slugs already seeded into Supabase's `categories`
 * table (see supabase/seed.sql) — e.g. "Battle Royale" → "battle-royale",
 * "Action RPG" → "action-rpg" — so a category page reached through this
 * slug and one reached by matching Supabase's own `categories.slug` always
 * agree. */
function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Every distinct genre in the catalog (13 today), each with the URL-safe
 * slug above — the source of truth for the category browsing route's
 * `generateStaticParams` and for any UI that links into it. Derives from
 * `games` itself, so it can never list a category with zero products or
 * drift out of sync with the real catalog. */
export function getCategories(): { name: string; slug: string }[] {
  const seen = new Set<string>();
  const categories: { name: string; slug: string }[] = [];
  for (const game of games) {
    if (seen.has(game.genre)) continue;
    seen.add(game.genre);
    categories.push({ name: game.genre, slug: slugifyCategory(game.genre) });
  }
  return categories;
}

/** Resolves a category's URL slug back to its real name — used by the
 * category browsing page to both validate the slug (undefined ⇒ not
 * found) and to get the exact name `getProductsByCategory()` expects. */
export function getCategoryBySlug(slug: string): { name: string; slug: string } | undefined {
  return getCategories().find((category) => category.slug === slug);
}
