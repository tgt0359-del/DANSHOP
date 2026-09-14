import type { Metadata } from "next";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CategoryLinks } from "@/components/home/CategoryLinks";
import { GameSection } from "@/components/home/GameSection";
import { Hero } from "@/components/home/Hero";
import { MarketplaceCategories } from "@/components/home/MarketplaceCategories";
import { PaymentMethods } from "@/components/home/PaymentMethods";
import { TrendingSection } from "@/components/home/TrendingSection";
import { TrustSection } from "@/components/home/TrustSection";
import {
  getDealGames,
  getMobileGames,
  getNewReleases,
  getPcGames,
  getTrendingGames,
} from "@/data/games";

export const metadata: Metadata = {
  title: "DANSHOP — Digital Game Marketplace",
  description: "DANSHOP is a modern digital marketplace for games and digital gaming products.",
  openGraph: {
    title: "DANSHOP — Digital Game Marketplace",
    description: "DANSHOP is a modern digital marketplace for games and digital gaming products.",
    siteName: "DANSHOP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "DANSHOP — Digital Game Marketplace",
    description: "DANSHOP is a modern digital marketplace for games and digital gaming products.",
  },
};

export default function Home() {
  const trendingGames = getTrendingGames();
  const pcGames = getPcGames();
  const mobileGames = getMobileGames();
  const dealGames = getDealGames();
  const newReleases = getNewReleases();

  return (
    <>
      <Hero />

      {/* "Discover" zone — Trending through New Releases sit on the page's
          own base tone (the site's existing very-light-gray body
          background, --background in globals.css — not pure white; this
          file never touches that shared token). No wrapper needed here. */}
      <TrendingSection games={trendingGames} />
      <GameSection
        id="pc-games"
        titleKey="home.pcGames.title"
        games={pcGames}
        viewAllHref="/games"
      />
      <GameSection
        id="mobile-games"
        titleKey="home.mobileGames.title"
        games={mobileGames}
        viewAllHref="/games"
      />
      <GameSection
        id="deals"
        titleKey="home.deals.title"
        subtitleKey="home.deals.subtitle"
        games={dealGames}
        viewAllHref="/games"
      />
      <GameSection
        id="new-releases"
        titleKey="home.newReleases.title"
        subtitleKey="home.newReleases.subtitle"
        games={newReleases}
        showReleaseDate
        viewAllHref="/games"
      />

      {/* "Browse" zone — CategoryGrid/CategoryLinks/MarketplaceCategories
          get one restrained white band (bordered top+bottom) so this
          distinct part of the page reads as its own section at a glance —
          the page's one deliberate background alternation (UI-01 §1's
          "extremely subtle background variation"), not a wash of
          different tones per section. Homepage-only wrapper — no shared
          component or global token changes. */}
      <div className="border-y border-border bg-surface-elevated">
        <CategoryGrid />
        <CategoryLinks />
        <MarketplaceCategories />
      </div>

      {/* Back to the base tone for the closing Trust/Payment sections,
          which then hand off to the (already white) Footer below. */}
      <TrustSection />
      <PaymentMethods />
    </>
  );
}
