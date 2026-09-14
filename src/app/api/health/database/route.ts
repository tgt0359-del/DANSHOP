import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * A safe, developer-facing check that the app can reach Supabase (Step 39
 * §3). Never returns credentials, connection strings, or a raw database
 * error — only a short, generic status. Returns a clear "not_configured"
 * result (HTTP 200 — this is this project's normal, expected state until
 * a real Supabase project is connected) rather than crashing when the
 * environment variables aren't set, and "unreachable" (HTTP 503) if
 * they're set but the read genuinely fails.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        status: "not_configured",
        message: "Supabase environment variables are not set. See .env.example.",
      },
      { status: 200 }
    );
  }

  try {
    const client = await getSupabaseServerClient();
    // A lightweight existence/reachability check — counts rows without
    // fetching any actual product data, since this endpoint should never
    // leak catalog contents any more than it should leak credentials.
    const { error } = await client.from("products").select("id", { count: "exact", head: true });

    if (error) {
      console.warn("[health/database] Supabase reachability check failed:", error.message);
      return NextResponse.json(
        { status: "unreachable", message: "Supabase is configured but the database could not be reached." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { status: "connected", message: "Supabase is configured and reachable." },
      { status: 200 }
    );
  } catch {
    console.warn("[health/database] Supabase reachability check threw an error.");
    return NextResponse.json(
      { status: "unreachable", message: "Supabase is configured but the database could not be reached." },
      { status: 503 }
    );
  }
}
