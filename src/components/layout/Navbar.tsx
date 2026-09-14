"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { SettingsButton } from "@/components/layout/SettingsButton";
import { SearchSuggestions, type SearchSuggestionItem } from "@/components/layout/SearchSuggestions";
import { productHref } from "@/components/marketplace/CategoryTypeView";
import { allDemoProducts } from "@/data/demoCatalog";
import { games } from "@/data/games";
import { getHeaderMarketplaceCategories, getMarketplaceCategoryByProductType } from "@/data/marketplaceCategories";
import { getProductTypeInfo } from "@/data/productTypes";
import { hasVariants } from "@/data/productVariants";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import { useSearch } from "@/hooks/useSearch";
import { isNavLinkActive } from "@/lib/navigation/isNavLinkActive";
import { gameToProduct } from "@/lib/products/productAdapter";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { matchesProductQuery } from "@/lib/search/matchesProductQuery";
import { cn } from "@/lib/cn";

// Step 57 §3/§19: the compact header nav now reads from the same
// centralized `marketplaceCategories` registry the Sidebar and homepage
// discovery section use (`showInHeader: true` entries only, "do not
// overcrowd the Header") — no second, hardcoded nav-link list. Every
// route here is real (Step 57 built a genuine page for each), replacing
// the old anchor-jump/fallback hrefs this array used before that existed.
const navLinks = getHeaderMarketplaceCategories();

// Step 62 §2: "Maximum 6 suggestions" (was 5, Step 52).
const MAX_SUGGESTIONS = 6;

export function Navbar({
  isSidebarOpen,
  onToggleSidebar,
}: {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const { t } = useLanguage();
  const { query, setQuery } = useSearch();
  const { totalQuantity, toggleCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Step 52: the header's autocomplete dropdown. Shared between the
  // desktop and mobile search inputs (renderSearchInput below) — only one
  // is ever visible/interactive at a time per viewport, so one set of
  // state is enough; there's never a conflict between them.
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Step 63 §1/§10: the header account icon's dropdown — its own small
  // piece of state, separate from `suggestionsOpen` (the two never
  // interact) and closed the same two ways every other overlay in this
  // app closes: Escape, and focus/click leaving the menu.
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Step 52 §8: real catalog data only, capped and lightweight — no fake
  // "popular searches" shown when the query is empty (matchesSearchQuery
  // itself would treat "" as "matches everything", so this checks first).
  // Step 57 §10: also searches the merged demo catalog
  // (data/demoCatalog.ts) — "Steam" now finds the Steam Wallet demo
  // listings, "Gift Card" finds the demo gift cards, and (Step 58) "Free
  // Fire"/"Valorant"/... find the Game Top-Up demo games. A demo product
  // with denominations/packages (see `data/productVariants.ts`) now has a
  // real individual detail page — `productHref` (shared with
  // CategoryTypeView) resolves the right one (/product/ or /top-up/); one
  // without any still has none, so its suggestion links to its real
  // category listing instead.
  //
  // Step 62 §1/§2: matching now goes through the shared
  // `matchesProductQuery` (also checks region/product-type, not just
  // name/description/category/platform) and each suggestion shows its
  // type + platform, not just its name and price — real games are
  // converted to the same `Product` shape via `gameToProduct` purely for
  // matching/display purposes here (nothing about `Game`/`data/games.ts`
  // changes); their own href logic (always `/games/<slug>`) is
  // unaffected and kept separate from the demo catalog's href logic
  // below, which has real branches (`/product/`, `/top-up/`, or a
  // category page) that a real game's slug should never go through.
  const suggestions = useMemo<SearchSuggestionItem[]>(() => {
    if (query.trim() === "") return [];

    const gameMatches: SearchSuggestionItem[] = games
      .map((game) => ({ game, product: gameToProduct(game) }))
      .filter(({ product }) => matchesProductQuery(product, query))
      .map(({ game, product }) => {
        const typeInfo = getProductTypeInfo(product.productType);
        return {
          key: `game-${game.slug}`,
          title: game.title,
          href: `/games/${game.slug}`,
          price: game.price,
          priceIsFrom: false,
          typeLabel: typeInfo ? t(typeInfo.translationKey) : product.productType,
          platformLabel: t(platformTranslationKey[product.platform]),
        };
      });

    const demoMatches: SearchSuggestionItem[] = allDemoProducts
      .filter((product) => matchesProductQuery(product, query))
      .map((product) => {
        const typeInfo = getProductTypeInfo(product.productType);
        return {
          key: `demo-${product.slug}`,
          title: product.name,
          href: hasVariants(product.id)
            ? productHref(product)
            : (getMarketplaceCategoryByProductType(product.productType)?.route ?? "/"),
          price: product.price,
          priceIsFrom: hasVariants(product.id),
          typeLabel: typeInfo ? t(typeInfo.translationKey) : product.productType,
          platformLabel: t(platformTranslationKey[product.platform]),
        };
      });

    return [...gameMatches, ...demoMatches].slice(0, MAX_SUGGESTIONS);
  }, [query, t]);

  function closeSuggestions() {
    setSuggestionsOpen(false);
    setActiveIndex(-1);
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    // Reset the highlighted suggestion whenever the results themselves
    // change — done here, in the event handler that actually changes
    // `query`, rather than in a useEffect keyed on `query` (a setState
    // inside an effect for something already known at the call site just
    // adds an extra render pass for no benefit).
    setActiveIndex(-1);
  }

  function selectSuggestion() {
    // Step 52 §8: navigating to a specific product completes this search —
    // clearing the query resets the header for the next one, matching how
    // a typical autocomplete's job ends once you've picked a result.
    setQuery("");
    closeSuggestions();
    setMobileSearchOpen(false);
  }

  // The header search is a preview/entry point, not a results view — Step
  // 62 §3/§4: pressing Enter with no suggestion highlighted takes the
  // current query to the dedicated /search results page (was a hardcoded
  // redirect to /games, Step 52 — which meant a gift-card/wallet/top-up
  // match could never actually be "opened" from the header at all).
  //
  // Step 52: also handles the suggestions dropdown's keyboard interaction —
  // Arrow keys move the active option, Enter on an active option selects it
  // instead of going to /search, Escape closes the dropdown (§15).
  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestionsOpen && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      return;
    }
    if (event.key === "ArrowUp" && suggestionsOpen && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === "Escape" && suggestionsOpen) {
      closeSuggestions();
      return;
    }
    if (event.key === "Enter") {
      if (suggestionsOpen && activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault();
        router.push(suggestions[activeIndex].href);
        selectSuggestion();
        return;
      }
      if (query.trim() !== "") {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setMobileSearchOpen(false);
      }
      closeSuggestions();
    }
  }

  // Step 62 §6: clears the query, closes any open suggestions, and — same
  // as picking a suggestion — collapses the mobile search panel back to
  // its resting state.
  function clearSearch() {
    setQuery("");
    closeSuggestions();
  }

  // Keeps the dropdown open while focus moves from the input to a
  // suggestion inside the same wrapper (Tab or click), and closes it once
  // focus genuinely leaves both — the standard accessible combobox pattern,
  // safer than a setTimeout-based blur delay.
  function handleContainerBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      closeSuggestions();
    }
  }

  // Step 63 §10: same "did focus actually leave this wrapper" check the
  // search dropdown above already uses — covers both Tab-away and a mouse
  // click outside (which blurs the trigger button before the click lands
  // anywhere else), so a real outside-pointerdown listener isn't needed.
  function closeAccountMenu() {
    setAccountMenuOpen(false);
  }

  function handleAccountMenuBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      closeAccountMenu();
    }
  }

  // Escape closes the account menu regardless of which element inside it
  // currently has focus — a document-level listener (same pattern
  // Sidebar/SettingsModal already use for their own Escape handling)
  // rather than a per-element keydown, since the trigger button, and every
  // link inside the open menu, all need the same behavior.
  useEffect(() => {
    if (!accountMenuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeAccountMenu();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [accountMenuOpen]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function renderSearchInput(idSuffix: string, autoFocus = false) {
    const listboxId = `search-suggestions-${idSuffix}`;
    const isOpen = suggestionsOpen && suggestions.length > 0;
    const hasQuery = query.trim() !== "";

    return (
      <div className="relative w-full" onBlur={handleContainerBlur}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        <input
          type="search"
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setSuggestionsOpen(true)}
          onKeyDown={handleSearchKeyDown}
          placeholder={t("actions.search")}
          aria-label={t("actions.search")}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          className={cn(
            // UI-02.2: a filled, tinted surface (bg-surface, the same
            // very-light-gray tile background used elsewhere) instead of
            // a plain white-on-white bordered box — reads as a distinct
            // "search box" sitting inside the white header rather than
            // just an outline, restrained radius (rounded-xl, not a pill).
            "h-10 w-full rounded-xl border border-transparent bg-surface pl-10 text-sm text-foreground placeholder:text-secondary transition-colors focus-visible:border-border focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
            hasQuery ? "pr-9" : "pr-4"
          )}
        />
        {/* Step 62 §6: only shown once there's something to clear — clicking
            it clears the query, closes suggestions, and (via the shared
            `query` state) restores every page that reads it to its normal,
            unfiltered state. A real `<button>`, not part of the native
            `type="search"` field's own inconsistent-across-browsers "x". */}
        {hasQuery && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label={t("actions.clearSearch")}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        {isOpen && (
          <SearchSuggestions
            id={listboxId}
            ariaLabel={t("actions.searchSuggestions")}
            suggestions={suggestions}
            activeIndex={activeIndex}
            onSelect={selectSuggestion}
          />
        )}
      </div>
    );
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        // UI-02: a solid white header with an always-present, subtle
        // border reads as a cleaner, more deliberate separation from the
        // page than the previous translucent light-gray/backdrop-blur
        // treatment — the blur existed to keep scrolling content legible
        // through a translucent bar, which a fully opaque header no
        // longer needs. The scroll-triggered shadow stays as a small,
        // optional depth cue (never "heavy" — shadow-sm only).
        "sticky top-0 z-40 border-b border-border bg-white transition-shadow duration-200",
        scrolled && "shadow-sm"
      )}
    >
      {/*
        UI-02.2: on top of UI-02.1's three-column grid (LEFT auto / CENTER
        1fr / RIGHT auto — kept, still the right structural choice, see
        that step's own note on why the center column isn't pixel-perfect
        edge-to-edge centered), this pass makes the redesign genuinely
        visible rather than incremental:
          - A taller row (64px → 72px) for real extra breathing room.
          - Nav items are now uppercase with letter-spacing and their own
            padded, individually-hoverable "slot" (rounded-lg, subtle
            hover:bg-surface) — reads as a row of discrete controls, not
            plain inline text links — with the active item's indicator a
            short, centered underline bar (absolutely positioned, fixed
            width) instead of a full-width border, closer to "Games /
            ─────" than a line spanning the whole word.
          - The RIGHT zone is now visually segmented with thin vertical
            dividers between its three logical groups (search | language·
            currency | wishlist·account·cart) instead of one undivided
            row of controls — directly shows the "structured 3-zone"
            layout instead of only implying it.
          - The search field itself got a filled `bg-surface` treatment
            (see renderSearchInput above) so it reads as its own control,
            not just an outlined rectangle matching the header's own
            background.
      */}
      <Container className="grid h-[72px] grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-5">
        <div className="flex items-center gap-1.5">
          {/* The one navigation-drawer toggle for the whole site — works at every
              breakpoint, since the sidebar itself now replaces what used to be a
              separate mobile-only drawer (see Sidebar.tsx). */}
          <IconButton
            icon={isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            aria-label={isSidebarOpen ? t("sidebar.closeNav") : t("sidebar.openNav")}
            aria-expanded={isSidebarOpen}
            onClick={onToggleSidebar}
          />
          <Logo />
        </div>

        {/* UI-02.3: the uppercase + tracking-wide treatment from UI-02.2
            read fine for short English words but fought the Lao/Thai
            labels (e.g. "ກະເປົາເງິນ Steam" / "กระเป๋าเงิน Steam") — added
            letter-spacing on scripts that stack combining vowel/tone marks
            made them look cramped rather than clean, and without an
            explicit `whitespace-nowrap` the browser's default wrapping let
            a long label fold onto a second line inside its own narrow
            slot. This pass: drops uppercase/tracking-wide in favor of each
            language's own natural casing, sets a readable 13px/1.3
            line-height, forces one line per label, and trades a chunk of
            each item's own horizontal padding for real gap between items
            (a label's "space to breathe" should come from the row, not
            from padding widening the item's own hover/focus target only
            on one axis). The gap steps up from lg (1024–1279, tighter) to
            xl (1280px+, full 24px) since that's exactly the range Step
            UI-02.x's own overflow testing found tightest. */}
        <nav className="hidden items-center justify-center gap-1 lg:flex lg:gap-0 xl:gap-2" aria-label="Main">
          {navLinks.map((category) => {
            const active = isNavLinkActive(pathname, category.route);
            return (
              <Link
                key={category.id}
                href={category.route}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative whitespace-nowrap rounded-lg px-1.5 py-2 text-[13px] font-medium leading-[1.3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 lg:px-1 lg:text-xs xl:text-[13px]",
                  active
                    ? "bg-surface font-semibold text-foreground"
                    : "text-secondary hover:bg-surface hover:text-foreground"
                )}
              >
                {t(category.nameKey)}
                {/* Short, centered, fixed-width indicator — "Games /
                    ─────" — rather than a border spanning the full
                    padded width of the link above it. Paired with the
                    subtle persistent `bg-surface` tint above (UI-02.3) so
                    a long active label like Steam Wallet reads clearly at
                    a glance instead of only differing by weight+underline.
                    UI-09 §13: a shared `layoutId` lets Framer Motion
                    smoothly slide/resize this bar between nav items on
                    navigation instead of it just popping in/out — the one
                    "subtle active indicator transition" §13 explicitly
                    allows. Purely a transition on an already-existing,
                    already-sized element — adds no width/height anywhere,
                    so it can't affect the header's own tightly-tuned
                    horizontal layout (see this step's own report). */}
                {active && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 mx-auto h-0.5 w-4 rounded-full bg-foreground"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end">
          {/* The inline search bar shows from md (768px) — while the
              main nav is still hidden, so there's plenty of room — but
              steps back to the icon toggle for the lg-only range
              (1024–1279px), where nav ALSO becomes visible and the two
              together genuinely don't fit alongside the icon cluster;
              measured live at 1024px, this was real horizontal overflow,
              not a hypothetical. It returns as the full inline bar at xl
              (1280px+), where there's room again — see the search-toggle
              IconButton below for its matching, inverse visibility.
              UI-02.3: a compact, consistent 112px from md up (was 256px
              at xl before this step) — English's longer, space-separated
              labels ("Mobile Games", "Game Top Up") are the tightest real
              case among the site's three languages, and an 8-item nav
              that stays un-wrapped and readable for all of them needs
              this room more than a wider search box does; this is
              exactly the spec's own "don't let search crowd nav"
              trade-off, applied to the actual measured worst case. */}
          <div className="hidden md:flex md:w-28 lg:hidden xl:flex">{renderSearchInput("desktop")}</div>

          {/* A thin vertical rule only where there's something on both
              sides of it to separate — never shown alone, never doubled
              up, so the "search | language·currency | wishlist·account·
              cart" grouping reads clearly without adding visual noise at
              narrower widths where a whole group is hidden. */}
          {/* Search and Settings are only ever BOTH visible at xl
              (1280px+) — search steps back to an icon toggle for the
              lg-only range (see above), so this divider would otherwise
              be orphaned there with nothing but the toggle icon beside it. */}
          <div className="hidden h-6 w-px bg-border xl:ml-2 xl:block" aria-hidden="true" />

          <div className="hidden lg:ml-1 lg:flex lg:items-center">
            <SettingsButton />
          </div>

          {/* UI-02.3: this second divider stayed lg-visible (1024px+) in
              earlier passes, but at exactly lg-only (1024–1279px) an
              8-item nav in Lao/Thai genuinely needs every remaining pixel
              more than a decorative rule does — it now joins the first
              divider in only appearing once there's real slack, at xl. */}
          <div className="hidden h-6 w-px bg-border xl:mx-2 xl:block" aria-hidden="true" />

          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-1 xl:gap-1.5">
            <div className="hidden xl:block">
              {/* Step 63 §5: the exact same "existing wishlist experience"
                  Account → Wishlist links to — a single destination, not a
                  second wishlist surface.
                  UI-02.3: at lg-only (1024–1279px) this standalone icon
                  steps back in favor of the 8-item nav — wishlist stays
                  fully reachable the whole time via Account, so nothing
                  is actually lost, only this one quick-access shortcut's
                  own icon is deferred to xl where there's room for it
                  alongside a full-size, un-wrapped nav. */}
              <IconButton
                icon={<Heart className="h-5 w-5" />}
                aria-label={t("actions.wishlist")}
                onClick={() => router.push("/account#wishlist")}
              />
            </div>
            <div className="relative" onBlur={handleAccountMenuBlur}>
              <IconButton
                icon={<User className="h-5 w-5" />}
                aria-label={t("actions.account")}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-controls="account-menu"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
              />
              <AccountMenu id="account-menu" open={accountMenuOpen} onClose={closeAccountMenu} />
            </div>
            <div className="relative">
              <IconButton
                icon={<ShoppingCart className="h-5 w-5" />}
                aria-label={totalQuantity > 0 ? `${t("actions.cart")} (${totalQuantity})` : t("actions.cart")}
                onClick={toggleCart}
              />
              {totalQuantity > 0 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold leading-none text-white"
                >
                  {totalQuantity}
                </span>
              )}
            </div>
            <IconButton
              icon={mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              aria-label={t("actions.search")}
              aria-expanded={mobileSearchOpen}
              className="md:hidden lg:inline-flex xl:hidden"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
            />
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            // Step 52: deliberately NOT overflow-hidden (unlike this
            // wrapper's earlier version) — that clipped the new
            // suggestions dropdown below it to zero visible height, since
            // an absolutely-positioned descendant can't escape an
            // ancestor's overflow-hidden no matter how it's positioned.
            // The collapse/expand animation still reads correctly from
            // the height+opacity transition alone. Visibility mirrors the
            // search-toggle IconButton above it exactly (this panel is
            // only reachable by clicking that button).
            className="md:hidden lg:block xl:hidden"
          >
            <Container className="pb-3">{renderSearchInput("mobile", true)}</Container>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
