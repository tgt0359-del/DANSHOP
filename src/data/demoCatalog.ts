import { demoProducts } from "@/data/demoProducts";
import { topUpGames } from "@/data/topUpGames";
import type { Product } from "@/types/product";

/**
 * Every demo/frontend-only product across the whole marketplace — Step
 * 57's wallet/gift-card/misc demo catalog (`demoProducts.ts`) plus Step
 * 58's Game Top-Up demo catalog (`topUpGames.ts`) — merged in ONE place
 * so anything that needs "all demo products" (the marketplace product
 * repository, the cart's demo-product resolver, global search) reads from
 * a single array instead of remembering to list both source files itself.
 * Real catalog products (`data/games.ts`) are never part of this; they
 * keep going through `getProducts()`/`gameToProduct` as before.
 */
export const allDemoProducts: Product[] = [...demoProducts, ...topUpGames];

export function findDemoProductBySlug(slug: string): Product | undefined {
  return allDemoProducts.find((product) => product.slug === slug);
}

export function findDemoProductById(id: string): Product | undefined {
  return allDemoProducts.find((product) => product.id === id);
}
