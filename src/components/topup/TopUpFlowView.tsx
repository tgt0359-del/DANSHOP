"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GameArtwork } from "@/components/ui/GameArtwork";
import { Reveal } from "@/components/ui/Reveal";
import { DenominationSelector } from "@/components/marketplace/DenominationSelector";
import { ProductInfoSection } from "@/components/marketplace/ProductInfoSection";
import { PurchaseTrustBadges } from "@/components/marketplace/PurchaseTrustBadges";
import { RelatedProducts } from "@/components/game-detail/RelatedProducts";
import { getMarketplaceCategoryByProductType } from "@/data/marketplaceCategories";
import { getProductTypeInfo } from "@/data/productTypes";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { recordRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useWishlist } from "@/lib/wishlist/WishlistProvider";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/currency/formatPrice";
import type { Product } from "@/types/product";
import type { TopUpFieldConfig, TopUpInfo } from "@/types/topUp";
import type { ProductVariant } from "@/types/productVariant";

/** Maps a package's `sortOrder` (1-4, see `data/productVariants.ts`'s
 * `topUpPackages` generator) to its translated tier-name key — the
 * `DenominationSelector`'s `renderLabel` seam is what lets "Small" /
 * "Medium" / "Large" / "Extra Large" respect the site's Lao/English/Thai
 * language setting (see that component's own doc comment for why). */
const PACKAGE_LABEL_KEYS: Record<number, string> = {
  1: "topup.packageSmall",
  2: "topup.packageMedium",
  3: "topup.packageLarge",
  4: "topup.packageExtraLarge",
};

type FieldName = "region" | "serverId" | "playerId" | "playerName";

/**
 * The reusable Game Top-Up flow template (Step 58 §3) — ONE component
 * drives every `/top-up/<slug>` route (see `app/top-up/[slug]/page.tsx`),
 * covering the full Game → Region/Server → Package/Amount → Player
 * Information → Quantity → Price Summary → Add to Cart/Buy Now flow.
 * Which of Region / Server ID / Player ID / Player Name actually render is
 * entirely data-driven (`fieldConfig`, `data/topUpFieldConfig.ts`) — no
 * per-game branching lives in this component.
 *
 * Uses the EXISTING cart system (`useCart`) exactly like `WalletProductView`
 * — `addToCart(product.slug, quantity, variant.id, topUpInfo)`. The
 * `topUpInfo` argument (Step 58) is the ONLY new thing threaded into the
 * cart; everything else (composite `slug`+`variantId` cart-line matching,
 * checkout, order creation) is Step 57's already-built, unmodified
 * architecture.
 *
 * Security (Step 58 §4): this component only ever asks for Player ID /
 * Server ID / Player Name / Region — public-facing identifiers, never a
 * password, PIN, OTP, or payment credential.
 */
export function TopUpFlowView({
  product,
  variants,
  fieldConfig,
  relatedGames,
}: {
  product: Product;
  variants: ProductVariant[];
  fieldConfig: TopUpFieldConfig | undefined;
  relatedGames: Product[];
}) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const sortedVariants = [...variants].sort((a, b) => a.sortOrder - b.sortOrder);
  const firstAvailable = sortedVariants.find((variant) => variant.available) ?? sortedVariants[0] ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(firstAvailable?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [region, setRegion] = useState("");
  const [serverId, setServerId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [justAdded, setJustAdded] = useState(false);
  // Step 64 §5: same rapid-double-click guard WalletProductView's own "Buy
  // Now" now has — the actual re-entrancy check lives on a ref (mutated
  // synchronously, so it's already up to date for a second call that fires
  // before the next render), not just the `isNavigatingToCheckout` state,
  // which exists purely to visually disable the button — see that
  // component's own comment for why a state-only guard isn't enough.
  const isNavigatingToCheckoutRef = useRef(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  const regionRef = useRef<HTMLSelectElement>(null);
  const serverIdRef = useRef<HTMLInputElement>(null);
  const playerIdRef = useRef<HTMLInputElement>(null);
  const playerNameRef = useRef<HTMLInputElement>(null);

  const selectedVariant = sortedVariants.find((variant) => variant.id === selectedId) ?? null;
  const category = getMarketplaceCategoryByProductType(product.productType);
  const wishlisted = isWishlisted(product.slug);
  // Step 64 §1: the same translated Product Type badge WalletProductView
  // already shows (`getProductTypeInfo` + the `productTypes.*` namespace),
  // replacing the raw untranslated `product.category` badge this view used
  // to show instead.
  const productTypeInfo = getProductTypeInfo(product.productType);

  // Step 59 §8: records this visit for the existing "Recently Viewed"
  // system, the same call `WalletProductView` now also makes — not a
  // second implementation.
  useEffect(() => {
    recordRecentlyViewed(product.slug);
  }, [product.slug]);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const unitPrice = selectedVariant?.price ?? 0;
  const total = unitPrice * quantity;
  const canPurchase = selectedVariant != null && selectedVariant.available;

  function decreaseQuantity() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increaseQuantity() {
    setQuantity((prev) => prev + 1);
  }

  /** Validates exactly the fields `fieldConfig` says this game needs,
   * focusing the first invalid one so a keyboard/screen-reader user lands
   * directly on what to fix (Step 58 §11's "accessible validation/error
   * messages"). Returns whether the form is valid.
   *
   * Step 68 §4: the check order below (`playerId`, `playerName`, `region`,
   * `serverId`) matches the page's new top-to-bottom visual order (Package
   * → Player Information → Region/Server) — when more than one field is
   * empty, this is what makes "focus the first invalid field" mean the
   * first one the user would actually see scanning down the page, not an
   * arbitrary internal order left over from before the fields were
   * reordered. */
  function validate(): boolean {
    const nextErrors: Partial<Record<FieldName, string>> = {};

    if (fieldConfig?.requiresPlayerId && playerId.trim() === "") nextErrors.playerId = t("topup.fieldRequired");
    if (fieldConfig?.requiresPlayerName && playerName.trim() === "") nextErrors.playerName = t("topup.fieldRequired");
    if (fieldConfig?.requiresRegion && !region) nextErrors.region = t("topup.fieldRequired");
    if (fieldConfig?.requiresServerId && serverId.trim() === "") nextErrors.serverId = t("topup.fieldRequired");

    setErrors(nextErrors);

    const firstInvalid: FieldName | undefined = (["playerId", "playerName", "region", "serverId"] as FieldName[]).find(
      (field) => nextErrors[field]
    );
    if (firstInvalid === "playerId") playerIdRef.current?.focus();
    else if (firstInvalid === "playerName") playerNameRef.current?.focus();
    else if (firstInvalid === "region") regionRef.current?.focus();
    else if (firstInvalid === "serverId") serverIdRef.current?.focus();

    return firstInvalid === undefined;
  }

  function buildTopUpInfo(): TopUpInfo {
    const info: TopUpInfo = {};
    if (fieldConfig?.requiresPlayerId) info.playerId = playerId.trim();
    if (fieldConfig?.requiresServerId) info.serverId = serverId.trim();
    if (fieldConfig?.requiresPlayerName) info.playerName = playerName.trim();
    if (fieldConfig?.requiresRegion) info.region = region;
    return info;
  }

  function handleAddToCart() {
    if (!selectedVariant || !validate()) return;
    addToCart(product.slug, quantity, selectedVariant.id, buildTopUpInfo());
    setJustAdded(true);
  }

  // "Buy Now" uses the exact same cart system as "Add to Cart" — no
  // second/parallel checkout implementation — it just also navigates
  // straight to the existing /checkout route afterward, same as
  // WalletProductView's own Buy Now.
  function handleBuyNow() {
    if (!selectedVariant || isNavigatingToCheckoutRef.current || !validate()) return;
    isNavigatingToCheckoutRef.current = true;
    setIsNavigatingToCheckout(true);
    addToCart(product.slug, quantity, selectedVariant.id, buildTopUpInfo());
    router.push("/checkout");
  }

  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <Container>
        <Reveal>
          <Link
            href={category?.route ?? "/top-up"}
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {category ? t(category.nameKey) : t("marketplace.backToHome")}
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
            {/* Left column — game header, region/server, package, player info */}
            <div className="flex flex-col gap-6">
              {/* Step 69 §2/§11: same subtle hover-lift ProductGallery/
                  WalletProductView now use (shadow + slight image scale,
                  matching GameCard's established treatment). */}
              <div className="group overflow-hidden rounded-2xl border border-border transition-shadow duration-200 hover:shadow-md">
                {/* Step 64 §2/§14: same real-image-with-fallback approach
                    WalletProductView now uses — no broken <img> if a
                    product ever has no real image URL. */}
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a real, external placehold.co URL from the catalog data
                  <img
                    src={product.image}
                    alt={product.name}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                ) : (
                  <GameArtwork
                    game={{ id: product.id, genre: product.category, title: product.name }}
                    className="aspect-[16/10] w-full transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="subtle" className="w-fit !font-medium">
                    {product.platform}
                  </Badge>
                  {/* Step 64 §1: a translated Product Type badge, matching
                      the badge WalletProductView already shows — replaces
                      the raw, untranslated `product.category` string this
                      badge used to show instead. */}
                  <Badge variant="outline" className="w-fit !font-medium">
                    {productTypeInfo ? t(productTypeInfo.translationKey) : product.category}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h1 className="text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
                    {product.name}
                  </h1>
                  {/* Step 64 §5: this flow never had a wishlist control —
                      the underlying wishlist system already supports a
                      Game Top-Up product (its slug resolves correctly
                      everywhere `resolveGameEntry`/`productHref` already
                      handle a variant-bearing demo product), this button
                      was simply missing. */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.slug)}
                    aria-label={t("actions.wishlist")}
                    aria-pressed={wishlisted}
                    className={buttonClasses("ghost", "md")}
                  >
                    <Heart className={cn("h-5 w-5", wishlisted && "fill-black")} aria-hidden="true" />
                    <span>{t("actions.wishlist")}</span>
                  </button>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-secondary sm:text-base">
                  {product.shortDescription}
                </p>
              </div>

              {/* Step 68 §4: left-column field order is now Package →
                  Player Information → Region/Server (previously Region/
                  Server → Package → Player Information, Step 58's original
                  order) — the same fields, same validation, same data,
                  just resequenced to match this step's explicit "logical
                  order" instruction. The right-column purchase panel
                  (Quantity → Price → Add to Cart → Buy Now) already
                  matched that same instruction's order and is unchanged. */}
              {sortedVariants.length > 0 && (
                <DenominationSelector
                  name={`package-${product.id}`}
                  variants={sortedVariants}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  legendKey="topup.selectPackage"
                  renderLabel={(variant) => t(PACKAGE_LABEL_KEYS[variant.sortOrder] ?? "topup.packageSmall")}
                />
              )}

              {(fieldConfig?.requiresPlayerId || fieldConfig?.requiresPlayerName) && (
                <section aria-labelledby="topup-player-info-heading" className="flex flex-col gap-3">
                  <h2 id="topup-player-info-heading" className="text-sm font-semibold text-foreground">
                    {t("topup.playerInfoTitle")}
                  </h2>

                  {fieldConfig?.requiresPlayerId && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="topup-player-id" className="text-sm font-medium text-foreground">
                        {t("topup.playerId")}
                      </label>
                      <input
                        id="topup-player-id"
                        ref={playerIdRef}
                        type="text"
                        value={playerId}
                        onChange={(event) => setPlayerId(event.target.value)}
                        aria-invalid={Boolean(errors.playerId)}
                        aria-describedby={errors.playerId ? "topup-player-id-error" : undefined}
                        className={cn(
                          "h-11 rounded-xl border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                          errors.playerId ? "border-red-500" : "border-border"
                        )}
                      />
                      {errors.playerId && (
                        <p id="topup-player-id-error" role="alert" className="text-xs text-red-600">
                          {errors.playerId}
                        </p>
                      )}
                    </div>
                  )}

                  {fieldConfig?.requiresPlayerName && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="topup-player-name" className="text-sm font-medium text-foreground">
                        {t("topup.playerName")}
                      </label>
                      <input
                        id="topup-player-name"
                        ref={playerNameRef}
                        type="text"
                        value={playerName}
                        onChange={(event) => setPlayerName(event.target.value)}
                        aria-invalid={Boolean(errors.playerName)}
                        aria-describedby={errors.playerName ? "topup-player-name-error" : undefined}
                        className={cn(
                          "h-11 rounded-xl border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                          errors.playerName ? "border-red-500" : "border-border"
                        )}
                      />
                      {errors.playerName && (
                        <p id="topup-player-name-error" role="alert" className="text-xs text-red-600">
                          {errors.playerName}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              )}

              {(fieldConfig?.requiresRegion || fieldConfig?.requiresServerId) && (
                <section aria-labelledby="topup-region-server-heading" className="flex flex-col gap-3">
                  <h2 id="topup-region-server-heading" className="text-sm font-semibold text-foreground">
                    {t("topup.regionServerTitle")}
                  </h2>

                  {fieldConfig?.requiresRegion && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="topup-region" className="text-sm font-medium text-foreground">
                        {t("topup.region")}
                      </label>
                      <select
                        id="topup-region"
                        ref={regionRef}
                        value={region}
                        onChange={(event) => setRegion(event.target.value)}
                        aria-invalid={Boolean(errors.region)}
                        aria-describedby={errors.region ? "topup-region-error" : undefined}
                        className={cn(
                          "h-11 rounded-xl border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                          errors.region ? "border-red-500" : "border-border"
                        )}
                      >
                        <option value="">{t("topup.regionPlaceholder")}</option>
                        {fieldConfig.regions?.map((option) => (
                          <option key={option.id} value={option.id}>
                            {t(option.labelKey)}
                          </option>
                        ))}
                      </select>
                      {errors.region && (
                        <p id="topup-region-error" role="alert" className="text-xs text-red-600">
                          {errors.region}
                        </p>
                      )}
                    </div>
                  )}

                  {fieldConfig?.requiresServerId && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="topup-server-id" className="text-sm font-medium text-foreground">
                        {t("topup.serverId")}
                      </label>
                      <input
                        id="topup-server-id"
                        ref={serverIdRef}
                        type="text"
                        value={serverId}
                        onChange={(event) => setServerId(event.target.value)}
                        aria-invalid={Boolean(errors.serverId)}
                        aria-describedby={errors.serverId ? "topup-server-id-error" : undefined}
                        className={cn(
                          "h-11 rounded-xl border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                          errors.serverId ? "border-red-500" : "border-border"
                        )}
                      />
                      {errors.serverId && (
                        <p id="topup-server-id-error" role="alert" className="text-xs text-red-600">
                          {errors.serverId}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Product Information (Step 64 §6) — this flow previously had
                  no such section at all. Reuses two already-existing,
                  already-translated keys rather than inventing new demo
                  copy: `topup.demoNotice` is the exact same disclaimer the
                  /top-up listing page (`TopUpLandingView`) already shows,
                  and `wallet.importantInfoTitle` is the same heading
                  WalletProductView's own "Important Information" card
                  uses — no new locale strings needed for this. */}
              <ProductInfoSection titleKey="wallet.importantInfoTitle" bodyKey="topup.demoNotice" />
            </div>

            {/* Right column — quantity + price summary + purchase actions */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
                <Badge variant="subtle" className="w-fit !font-medium">
                  {t("games.filters.inStock")}
                </Badge>

                <div className="flex flex-col gap-1 border-b border-border pb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">{t("topup.selectedPackage")}</span>
                    <span className="font-medium text-foreground">
                      {selectedVariant ? t(PACKAGE_LABEL_KEYS[selectedVariant.sortOrder] ?? "topup.packageSmall") : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">{t("wallet.unitPrice")}</span>
                    <span className="font-medium text-foreground">{formatPrice(unitPrice, currency)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{t("wallet.quantityLabel")}</span>
                  <div className="flex items-center gap-1 rounded-full border border-border">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={!canPurchase || quantity <= 1}
                      aria-label={t("cart.decreaseQuantity")}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span
                      className="w-8 text-center text-sm font-medium text-foreground"
                      aria-label={`${t("wallet.quantityLabel")}: ${quantity}`}
                      aria-live="polite"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={!canPurchase}
                      aria-label={t("cart.increaseQuantity")}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
                  <span>{t("wallet.total")}</span>
                  <span>{formatPrice(total, currency)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!canPurchase}
                    className={cn(buttonClasses("primary", "lg"), "disabled:pointer-events-none disabled:opacity-50")}
                  >
                    {justAdded ? (
                      <>
                        <Check className="h-5 w-5" aria-hidden="true" />
                        <span>{t("cart.addedToCart")}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                        <span>{t("actions.addToCart")}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!canPurchase || isNavigatingToCheckout}
                    className={cn(buttonClasses("secondary", "lg"), "disabled:pointer-events-none disabled:opacity-50")}
                  >
                    <span>{t("home.hero.buyNow")}</span>
                  </button>
                </div>

                {/* Trust/purchase info (Step 67 §11) — inside the purchase
                    panel itself, right below the actions. */}
                <PurchaseTrustBadges />
              </div>
            </div>
          </div>
        </Reveal>

        <RelatedProducts products={relatedGames} />
      </Container>
    </div>
  );
}
