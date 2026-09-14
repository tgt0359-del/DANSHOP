import type { Metadata } from "next";
import { Inter, Noto_Sans_Lao, Noto_Sans_Thai } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { CurrencyProvider } from "@/lib/currency/CurrencyProvider";
import { SettingsModalProvider } from "@/lib/settings/SettingsModalProvider";
import { SearchProvider } from "@/lib/search/SearchProvider";
import { CartProvider } from "@/lib/cart/CartProvider";
import { CurrentUserProvider } from "@/lib/auth/CurrentUserProvider";
import { AuthModalProvider } from "@/lib/auth/AuthModalProvider";
import { WishlistProvider } from "@/lib/wishlist/WishlistProvider";
import { CheckoutStateProvider } from "@/lib/checkout/CheckoutStateProvider";
import { AppShell } from "@/components/layout/AppShell";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { SettingsModal } from "@/components/layout/SettingsModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/ui/SkipToContent";
import "./globals.css";

// Inter covers Latin script (English, and most UI text).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Noto Sans Lao covers the Lao script — needed since Lao is our default language.
const notoSansLao = Noto_Sans_Lao({
  variable: "--font-noto-lao",
  subsets: ["lao"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Noto Sans Thai covers the Thai script, for Thai-language support.
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DANSHOP",
  description: "DANSHOP — a modern digital game marketplace for PC and mobile games.",
  // Fallback social-sharing metadata for any route that doesn't set its own
  // (openGraph/twitter fully replace, not merge, so home page.tsx and the
  // product detail route each define their own below). No image is set —
  // there's no real asset for it yet, and inventing a broken one would be
  // worse than omitting it.
  openGraph: {
    title: "DANSHOP",
    description: "DANSHOP — a modern digital game marketplace for PC and mobile games.",
    siteName: "DANSHOP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "DANSHOP",
    description: "DANSHOP — a modern digital game marketplace for PC and mobile games.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="lo"
      className={`${inter.variable} ${notoSansLao.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Step 69 §12: makes every existing Framer Motion animation
            site-wide (Reveal fades, drawer/modal slide-ins, GameCard's
            hover lift, DenominationSelector's selection state, ...)
            automatically respect the visitor's OS-level "reduce motion"
            preference — framer-motion's own built-in feature, so this is
            one config value, not a per-component change. `"user"` (rather
            than `"always"`) only reduces motion when the visitor has
            actually asked for it; everyone else sees the exact same
            animations as before. Plain CSS transitions (hover/focus-visible
            color changes, not driven by Framer Motion) get the same
            treatment via the prefers-reduced-motion rule in globals.css. */}
        <MotionConfig reducedMotion="user">
          <LanguageProvider>
            <CurrencyProvider>
              <SettingsModalProvider>
                <SearchProvider>
                  <CartProvider>
                    {/* Step 71: the one shared "who is signed in" state,
                        mounted above WishlistProvider so it can react to a
                        live sign-in/sign-out (see WishlistProvider.tsx's
                        own comment) instead of only picking it up on the
                        next full page load. */}
                    <CurrentUserProvider>
                      <AuthModalProvider>
                        <WishlistProvider>
                          <CheckoutStateProvider>
                            <SkipToContent />
                            {/* Header, sidebar drawer, and main content — see AppShell for why the
                                sidebar's open/closed state has to live there instead of here. */}
                            <AppShell>{children}</AppShell>
                            <CartDrawer />
                            <SettingsModal />
                            <AuthModal />
                            <Footer />
                          </CheckoutStateProvider>
                        </WishlistProvider>
                      </AuthModalProvider>
                    </CurrentUserProvider>
                  </CartProvider>
                </SearchProvider>
              </SettingsModalProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
