"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GameArtwork } from "@/components/ui/GameArtwork";
import { Reveal } from "@/components/ui/Reveal";
import { DenominationSelector } from "@/components/marketplace/DenominationSelector";
import { ProductInfoSection } from "@/components/marketplace/ProductInfoSection";
import { PurchaseTrustBadges } from "@/components/marketplace/PurchaseTrustBadges";
import { WishlistToggleButton } from "@/components/marketplace/WishlistToggleButton";
import { RelatedProducts } from "@/components/game-detail/RelatedProducts";
import { getMarketplaceCategoryByProductType } from "@/data/marketplaceCategories";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { recordRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useWishlist } from "@/lib/wishlist/WishlistProvider";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/currency/formatPrice";
import type { Product } from "@/types/product";
import type { ProductVariant } from "@/types/productVariant";

/**
 * The reusable product-detail template for every wallet/gift-card/top-up
 * product (Steam Wallet, PlayStation Wallet, Xbox/Nintendo/Google
 * Play/Apple gift cards, Razer Gold, Garena Shells, ...) — Step 57's
 * Wallet/Gift Card Product Detail System. ONE component drives every
 * `/product/<slug>` route (see `app/product/[slug]/page.tsx`); nothing
 * here is platform-specific — every platform's name/image/region/
 * denominations all come from the `product`/`variants` props.
 *
 * Uses the EXISTING cart system (`useCart`) exactly the way
 * `GameDetailInfo` does for real games — `addToCart(product.slug,
 * quantity, variant.id)`. The optional `variantId` is what keeps two
 * denominations of the same product as distinct cart lines (see
 * `CartProvider.tsx`/`resolveCartLine.ts`); nothing about the checkout
 * flow itself changes (Step 57 §15 — "preserve existing checkout
 * architecture").
 *
 * Security (Step 57 §17): this component never stores, requests, or
 * displays anything resembling a real wallet code, PIN, redemption key,
 * payment credential, OTP, password, or secret API key — every string
 * rendered here is either real catalog data (`product`/`variants`, both
 * clearly fictional demo records) or short, generic placeholder copy.
 */
export function WalletProductView({
  product,
  variants,
  relatedProducts,
}: {
  product: Product;
  variants: ProductVariant[];
  relatedProducts: Product[];
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
  const [justAdded, setJustAdded] = useState(false);
  // Step 64 §5: guards "Buy Now" against a rapid double-click adding the
  // line twice before navigation to /checkout actually happens. The check
  // lives on a ref, not just the `isNavigatingToCheckout` state below — a
  // state update only takes effect on the next render, so two clicks fired
  // faster than a render would both still read the old `false` from their
  // own render's closure; a ref is mutated synchronously, so the very next
  // call sees it immediately. The state value exists purely to visually
  // disable the button.
  const isNavigatingToCheckoutRef = useRef(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  const selectedVariant = sortedVariants.find((variant) => variant.id === selectedId) ?? null;
  const wishlisted = isWishlisted(product.slug);
  const category = getMarketplaceCategoryByProductType(product.productType);

  // Step 59 (Gift Card Marketplace §8): records this visit for the
  // existing "Recently Viewed" system — the same call
  // `GameDetailInfo`/`TopUpFlowView` already make, not a second
  // implementation. Depends on `product.slug` so it still fires correctly
  // if this component instance is ever reused across a slug change
  // instead of remounted.
  useEffect(() => {
    recordRecentlyViewed(product.slug);
  }, [product.slug]);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const hasDiscount = selectedVariant?.originalPrice != null && selectedVariant.originalPrice > selectedVariant.price;
  const unitPrice = selectedVariant?.price ?? 0;
  const originalUnitPrice = hasDiscount ? (selectedVariant?.originalPrice as number) : unitPrice;
  const discountAmount = (originalUnitPrice - unitPrice) * quantity;
  const total = unitPrice * quantity;
  const canPurchase = selectedVariant != null && selectedVariant.available;

  function decreaseQuantity() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increaseQuantity() {
    // Same reasoning as GameDetailInfo's quantity stepper — no real
    // inventory count exists to cap against, so only the minimum of 1 is
    // enforced.
    setQuantity((prev) => prev + 1);
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    addToCart(product.slug, quantity, selectedVariant.id);
    setJustAdded(true);
  }

  // "Buy Now" (Step 57 §15) uses the exact same cart system as "Add to
  // Cart" — no second/parallel checkout implementation — it just also
  // navigates straight to the existing /checkout route afterward, exactly
  // like GameDetailInfo's own Buy Now.
  function handleBuyNow() {
    if (!selectedVariant || isNavigatingToCheckoutRef.current) return;
    isNavigatingToCheckoutRef.current = true;
    setIsNavigatingToCheckout(true);
    addToCart(product.slug, quantity, selectedVariant.id);
    router.push("/checkout");
  }

  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <Container>
        <Reveal>
          <Link
            href={category?.route ?? "/"}
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {category ? t(category.nameKey) : t("marketplace.backToHome")}
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
            {/* Left column — image, header, denomination selection, product info */}
            <div className="flex flex-col gap-6">
              {/* Step 69 §2/§11: same subtle hover-lift ProductGallery now
                  uses (shadow + slight image scale, matching GameCard's
                  established treatment) — not a new visual language. */}
              <div className="group overflow-hidden rounded-2xl border border-border transition-shadow duration-200 hover:shadow-md">
                {/* Step 64 §2/§14: falls back to the same procedural
                    GameArtwork every other surface already uses when a
                    product has no real image URL — mirrors ProductGallery's
                    own fallback for a real game, rather than risking a
                    broken <img>. Every demo product has a real image today,
                    so this branch is defensive, not currently exercised. */}
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a real, external placehold.co URL from the catalog data, matching ProductGallery's own approach
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
                  <Badge variant="outline" className="w-fit !font-medium">
                    {t(`productTypes.${productTypeCamel(product.productType)}`)}
                  </Badge>
                  <Badge variant="subtle" className="w-fit !font-medium">
                    {product.region}
                  </Badge>
                </div>

                <div className="flex items-start justify-between gap-3">
                  {/* UI-25: capped at `sm:text-3xl` (dropping the old
                      `lg:text-4xl` step UI-11 §2 had added) — prominent
                      without reading oversized at wide desktop widths;
                      GameDetailInfo's own title is capped the same way, so
                      both product-detail templates keep matching scale. */}
                  <h1 className="text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
                    {product.name}
                  </h1>
                  <WishlistToggleButton wishlisted={wishlisted} onToggle={() => toggleWishlist(product.slug)} />
                </div>

                <p className="max-w-xl text-sm leading-relaxed text-secondary sm:text-base">
                  {product.shortDescription}
                </p>

                <div
                  className="flex items-center gap-1 text-sm text-secondary"
                  aria-label={`${t("common.rating")}: ${product.rating}`}
                >
                  <Star className="h-4 w-4 fill-secondary text-secondary" aria-hidden="true" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
              </div>

              {sortedVariants.length > 0 && (
                <DenominationSelector
                  name={`denomination-${product.id}`}
                  variants={sortedVariants}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}

              {/* Product Information (Step 57 §8) — short, honest, demo
                  placeholder copy. Never presented as a real platform's
                  official redemption policy. */}
              <div className="flex flex-col gap-3">
                <ProductInfoSection titleKey="wallet.howItWorksTitle" bodyKey="wallet.howItWorksBody" />
                <ProductInfoSection titleKey="wallet.importantInfoTitle" bodyKey="wallet.importantInfoBody" />
                <ProductInfoSection
                  titleKey="wallet.regionCompatibilityTitle"
                  bodyKey="wallet.regionCompatibilityBody"
                  bodyValues={{ region: product.region }}
                />
                <ProductInfoSection titleKey="wallet.redemptionInfoTitle" bodyKey="wallet.redemptionInfoBody" />
                <ProductInfoSection titleKey="wallet.termsTitle" bodyKey="wallet.termsBody" />
              </div>
            </div>

            {/* Right column — purchase summary panel */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
                <Badge variant="subtle" className="w-fit !font-medium">
                  {t("games.filters.inStock")}
                </Badge>

                <div className="flex flex-col gap-1 border-b border-border pb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">{t("wallet.selectedValue")}</span>
                    <span className="font-medium text-foreground">{selectedVariant?.label ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">{t("wallet.unitPrice")}</span>
                    <span className="font-medium text-foreground">{formatPrice(unitPrice, currency)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">{t("checkout.discount")}</span>
                      <span className="font-medium text-foreground">-{formatPrice(discountAmount, currency)}</span>
                    </div>
                  )}
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

        <RelatedProducts products={relatedProducts} />
      </Container>
    </div>
  );
}

/** `ProductType` is kebab-case ("game-key"); the `productTypes.*`
 * translation namespace keys are camelCase ("gameKey") — this converts
 * between them so the platform/type badge can reuse the SAME translated
 * labels the category registry/filters already use, rather than a second
 * copy of the type→label mapping. */
function productTypeCamel(productType: string): string {
  return productType.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

