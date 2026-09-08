import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { recordFunnelEvent } from "@/lib/repositories/funnel";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUBLIC endpoint — write-only. Aggregate funnel counts.
 *
 * Records that *a* visitor reached a step, not which visitor: no identifier,
 * no cookie, nothing personal. It exists so drop-off is visible in the admin
 * without depending on a third-party analytics account being set up, logged
 * into, and correctly configured.
 */
const schema = z.object({
  event: z.enum(["form_start", "form_step", "form_complete"]),
  step: z.number().int().min(1).max(10).optional(),
  source: z.string().trim().max(80).optional(),
  landingPage: z.string().trim().max(300).optional(),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(`funnel:${ip}`, { limit: 60, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true });

  try {
    recordFunnelEvent(parsed.data);
  } catch {
    /* analytics must never break the page */
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
