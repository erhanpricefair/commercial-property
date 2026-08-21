import { NextResponse, type NextRequest } from "next/server";
import { leadSchema, flattenIssues } from "@/lib/validation";
import { registerInvestor } from "@/lib/services/lead-intake";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUBLIC endpoint — write-only.
 *
 * It accepts an investor registration and returns nothing but an
 * acknowledgement and a coarse lead category for ad-platform reporting. It
 * deliberately does NOT return the numeric internal lead score, the matched
 * opportunities, or even how many matches were found.
 *
 * Note what this file does not import: the opportunity repository. All the
 * work that touches private stock happens inside `registerInvestor()`, whose
 * return type cannot carry opportunity data.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(`leads:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: flattenIssues(parsed.error), error: "Please check the highlighted fields." },
      { status: 422 },
    );
  }

  const input = parsed.data;

  // Honeypot: accept silently so the bot doesn't learn it was caught, but
  // record nothing.
  if (input.company) {
    return NextResponse.json({ ok: true, leadCategory: "unclassified" });
  }

  const { leadCategory } = registerInvestor(input);

  return NextResponse.json({ ok: true, leadCategory });
}

/** No public read surface for leads. */
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
