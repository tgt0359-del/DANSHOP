export type GamePlatform = "PC" | "Mobile" | "PC & Mobile";

export interface Game {
  id: string;
  title: string;
  slug: string;
  platform: GamePlatform;
  genre: string;
  /** Short one-line blurb, used in the hero and (later) a game detail page. */
  description: string;
  /** Current price, in USD. 0 means free-to-play. */
  price: number;
  /** Price before discount. Equal to `price` when not on sale. */
  originalPrice: number;
  /** Percentage off, 0 when not on sale. */
  discount: number;
  /** Out of 5. */
  rating: number;
  /**
   * Reserved for real cover art later. Not rendered today — `GameArtwork`
   * generates an original placeholder visual instead (see
   * `lib/gameArtwork.ts`), so nothing here depends on an external image URL.
   */
  image: string;
  /** ISO date (yyyy-mm-dd). Drives the "New Releases" section. */
  releaseDate: string;
  /** Shown in the homepage hero. Exactly one game should have this set. */
  featured?: boolean;
  /** Included in the "Trending Now" row. */
  trending?: boolean;
}
