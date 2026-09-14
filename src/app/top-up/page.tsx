import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { TopUpLandingView } from "@/components/topup/TopUpLandingView";
import { topUpGames } from "@/data/topUpGames";

export const metadata: Metadata = {
  title: "Game Top Up — DANSHOP",
  description: "Top up Diamonds, UC, Riot Points, and more for your favorite games — demo pricing only.",
  openGraph: { title: "Game Top Up — DANSHOP", siteName: "DANSHOP", type: "website" },
};

/**
 * The Game Top-Up marketplace landing page (Step 58) — a literal static
 * route, a sibling of `app/[category]/page.tsx`'s dynamic segment, so it
 * wins over that catch-all for exactly this one path (the same "a literal
 * folder wins over `[param]`" rule `app/games/pc/page.tsx` already relies
 * on — see that catch-all's own updated comment). Renders the 12-game
 * Game Top-Up catalog directly from `data/topUpGames.ts` — this catalog
 * is 100% demo data with no real-catalog counterpart, so there is nothing
 * to merge in from `getProducts()`/Supabase here.
 */
export default function TopUpPage() {
  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <Container>
        <TopUpLandingView games={topUpGames} />
      </Container>
    </div>
  );
}
