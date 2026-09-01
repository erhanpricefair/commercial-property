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
 * Returns no private data: a count, not a record.
 */
export async function GET() {
  try {
    const db = getDb();
    const { c } = db.prepare("SELECT COUNT(*) AS c FROM investors").get() as { c: number };
    return NextResponse.json(
      { ok: true, database: "connected", investors: c, at: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
