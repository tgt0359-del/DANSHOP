import { deriveProductType } from "@/lib/products/productAdapter";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabasePublicServerClient } from "@/lib/supabase/server";
import type { Currency } from "@/types/payment";
import type { Platform, Product, StockStatus } from "@/types/product";

const PRODUCTS_SELECT =
  "id, slug, name, description, short_description, platform, price, original_price, currency, rating, review_count, badge, is_featured, is_new, is_on_sale, stock_status, created_at, updated_at, categories ( name ), product_images ( image_url, sort_order )";

interface ProductImageRow {
  image_url: string;
  sort_order: number;
}

interface CategoryRow {
  name: string;
}

/** Shape of one row from the PRODUCTS_SELECT query above — snake_case,
 * matching the database exactly (Step 38's schema). See mapRowToProduct
 * for how this becomes the app's existing camelCase Product model. */
interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  short_description: string;
  platform: string;
  // Postgres `numeric` columns come back from postgrest as strings (to
  // avoid float precision loss) as often as they come back as numbers,
  // depending on the client/version — mapRowToProduct normalizes either.
  price: number | string;
  original_price: number | string | null;
  currency: string;
  rating: number | string;
  review_count: number;
  badge: string | null;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  stock_status: string;
  created_at: string;
  updated_at: string;
  // PostgREST embeds a to-one relation (categories, via category_id) as a
  // single object, but some client/query shapes return it as a one-item
  // array instead — mapRowToProduct handles both rather than assuming one.
  categories: CategoryRow | CategoryRow[] | null;
  product_images: ProductImageRow[] | null;
}

function mapRowToProduct(row: ProductRow): Product {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const sortedImages = [...(row.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    shortDescription: row.short_description,
    category: category?.name ?? "Uncategorized",
    // Step 57: the live `products` table has no `product_type` column yet
    // (Step 54 deferred it — no schema change was genuinely required), so
    // this is derived from the row's real `platform` value using the same
    // rule productAdapter.ts applies to the local catalog, keeping both
    // sources in agreement. `region` stays "Global" — no real
    // region-restricted inventory exists (see types/product.ts).
    productType: deriveProductType(row.platform as Platform),
    platform: row.platform as Platform,
    region: "Global",
    price: Number(row.price),
    originalPrice: row.original_price === null ? null : Number(row.original_price),
    currency: row.currency as Currency,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    image: sortedImages[0]?.image_url ?? "",
    images: sortedImages.map((image) => image.image_url),
    badge: row.badge as Product["badge"],
    isFeatured: row.is_featured,
    isNew: row.is_new,
    isOnSale: row.is_on_sale,
    stockStatus: row.stock_status as StockStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Reads the full product catalog from Supabase, resolving each product's
 * category (Step 39 §7) and images (Step 39 §6) through the real
 * relationships from the Step 38 schema — never a second copy of category
 * data, never a separate query per product.
 *
 * Uses `getSupabasePublicServerClient()` (Step 78), not the cookie-aware
 * `getSupabaseServerClient()` — the product catalog is public data with
 * no per-visitor variation, and the cookie-aware client's `cookies()` call
 * was silently forcing every calling route into `DYNAMIC_SERVER_USAGE`
 * during static generation, which this function's own try/catch quietly
 * absorbed as "Supabase failed" (see that client's file comment for the
 * full diagnosis). This is purely a client-construction fix — the query,
 * the RLS policy it relies on, and every mapped field are unchanged.
 *
 * Returns null whenever the caller (productRepository.ts) should fall
 * back to the local static catalog instead: Supabase isn't configured, or
 * the read failed for any reason. Never throws, never logs a raw
 * credential or full error object to a place a client could see it (Step
 * 39 §3/§8/§9) — this function's own console.warn calls are server-side
 * only and log a short message, not the error's full shape.
 */
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const client = getSupabasePublicServerClient();
    const { data, error } = await client.from("products").select(PRODUCTS_SELECT);

    if (error) {
      console.warn("[productSupabaseSource] Supabase product read failed, using local catalog instead:", error.message);
      return null;
    }

    return (data ?? []).map((row) => mapRowToProduct(row as unknown as ProductRow));
  } catch {
    console.warn("[productSupabaseSource] Supabase product read threw, using local catalog instead.");
    return null;
  }
}
