import type { Product } from "@/types/product";

/**
 * A product's discount, as a whole percentage (0 when not discounted or
 * `originalPrice` is missing/invalid). The one place this is computed —
 * `productRepository.ts`'s `getDiscountedProducts()` and the Step 55
 * discount filter (`useProductFilters.ts`) both use this instead of each
 * repeating the same `(originalPrice - price) / originalPrice` math.
 */
export function getDiscountPercent(product: Pick<Product, "price" | "originalPrice">): number {
  if (product.originalPrice === null || product.originalPrice <= product.price) return 0;
  return ((product.originalPrice - product.price) / product.originalPrice) * 100;
}
