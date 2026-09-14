"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/currency/formatPrice";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { regionTranslationKey } from "@/lib/products/regionLabels";
import type { Product } from "@/types/product";

/**
 * A product card for category / marketplace browsing pages. Renders the
 * real `product.image` (vs. `GameCard`'s procedural artwork).
 *
 * The whole card opens the detail route unless `isDemo` (a demo listing
 * with no real detail page — rendered as plain, non-interactive content
 * with a visible "Demo" badge so it never implies it is purchasable).
 *
 * Quick "Add to Cart" is only offered for real catalog games (the default
 * `/games/<slug>` route). Products with denominations/packages (`href`
 * set) show a "View Details" affordance instead because a variant has to
 * be chosen on their own detail page first.
 *
 * `tallImage` opts into a 4:3 image area (Gift Cards only); everything
 * else keeps 16:10.
 */
export function CategoryProductCard({
  product,
  isDemo = false,
  href,
  showPriceFrom = false,
  tallImage = false,
}: {
  product: Product;
  isDemo?: boolean;
  href?: string;
  /** Prefixes the price with "From" — for a product with multiple
   * denominations, whose `product.price` is its lowest variant's price. */
  showPriceFrom?: boolean;
  tallImage?: boolean;
}) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { addToCart } = useCart();
  const router = useRouter();
  const hasDiscount = product.isOnSale && product.originalPrice != null && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / (product.originalPrice as number)) * 100)
    : 0;
  const resolvedHref = href ?? `/games/${product.slug}`;
  const interactive = !isDemo;
  const canQuickAdd = interactive && href === undefined;
  const outOfStock = product.stockStatus === "out_of_stock";

  function openDetail(event: React.MouseEvent<HTMLElement>) {
    if (!interactive || event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;
    router.push(resolvedHref);
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image}
      alt={product.name}
      className={cn(
        "h-full w-full object-cover transition-transform duration-500 ease-out",
        interactive && "group-hover:scale-[1.04]"
      )}
      loading="lazy"
    />
  );

  return (
    <motion.article
      whileHover={interactive ? { y: -3 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={openDetail}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-[background-color,border-color,box-shadow] duration-200",
        interactive && "cursor-pointer hover:border-border-strong hover:bg-surface-hover hover:shadow-xl hover:shadow-black/30"
      )}
    >
      <div className={cn("relative overflow-hidden", tallImage ? "aspect-[4/3]" : "aspect-[16/10]")}>
        {interactive ? (
          <Link href={resolvedHref} prefetch={false} className="block h-full w-full" aria-label={product.name} tabIndex={-1}>
            {image}
          </Link>
        ) : (
          <div className="block h-full w-full">{image}</div>
        )}

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <Badge variant="platform">{t(platformTranslationKey[product.platform])}</Badge>
          {hasDiscount && <Badge variant="discount">-{discountPercent}%</Badge>}
          {product.isNew && !hasDiscount && <Badge variant="new">{t("common.new")}</Badge>}
        </div>

        <div className="pointer-events-none absolute right-2.5 top-2.5 flex gap-1.5">
          {isDemo ? (
            <Badge variant="outline">{t("marketplace.demoBadge")}</Badge>
          ) : (
            <Badge variant="region">{t(regionTranslationKey[product.region])}</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {interactive ? (
          <Link
            href={resolvedHref}
            prefetch={false}
            className="line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
          >
            {product.name}
          </Link>
        ) : (
          <span className="line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug tracking-tight text-foreground">
            {product.name}
          </span>
        )}

        <div
          className="flex items-center gap-1.5 text-xs text-secondary"
          aria-label={`${t("common.rating")}: ${product.rating}`}
        >
          <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
          <span className="font-medium text-foreground/80">{product.rating.toFixed(1)}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{product.category}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex min-w-0 flex-col">
            {hasDiscount && (
              <span className="text-xs text-muted line-through">
                {formatPrice(product.originalPrice as number, currency)}
              </span>
            )}
            <span className="text-lg font-bold tracking-tight text-foreground">
              {showPriceFrom && <span className="mr-1 text-xs font-normal text-secondary">{t("wallet.from")}</span>}
              {product.price === 0 ? t("common.free") : formatPrice(product.price, currency)}
            </span>
          </div>

          {canQuickAdd && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              disabled={outOfStock}
              onClick={(event) => {
                event.stopPropagation();
                addToCart(product.slug, 1);
              }}
              aria-label={`${t("actions.addToCart")}: ${product.name}`}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary-soft px-3 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-primary/30 disabled:hover:bg-primary-soft disabled:hover:text-primary"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden min-[400px]:inline">{t("actions.addToCart")}</span>
            </motion.button>
          )}

          {interactive && !canQuickAdd && (
            <Link
              href={resolvedHref}
              prefetch={false}
              aria-label={`${t("orders.viewDetails")}: ${product.name}`}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
            >
              <span className="hidden min-[400px]:inline">{t("orders.viewDetails")}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
