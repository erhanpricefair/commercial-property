import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check for the platform's load balancer.
 *
 * Touches the database, because a process that is up but cannot reach its
 * volume is not healthy — and that is exactly the failure mode to catch when
 * SQLite lives on a mount.
 *
 * Says nothing else. It used to return the number of investor records, which
 * told any passer-by how many leads the business holds, and the raw database
 * error on failure, which can carry file paths. Neither is needed to decide
 * whether to route traffic here.
 */
export async function GET() {
  try {
    getDb().prepare("SELECT 1").get();
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
