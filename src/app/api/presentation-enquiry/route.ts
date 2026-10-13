import { NextResponse, type NextRequest } from "next/server";
import { recordPresentationEnquiry } from "@/lib/services/lead-intake";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp, rejectNonJson } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enquiry from a tokenised presentation.
 *
 * The token is the authorisation: it proves the caller holds a link an admin
 * issued, and the service re-checks that the builder's release approval still
 * covers it. The endpoint returns nothing but an acknowledgement — identical
 * for valid, revoked, expired and unknown tokens — so it can neither read the
 * private database nor tell a caller which links are live.
 */
export async function POST(request: NextRequest) {
  const notJson = rejectNonJson(request);
  if (notJson) return notJson;

  const ip = clientIp(request.headers);
  if (!checkRateLimit(`presentation:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  let body: { token?: unknown; message?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; message?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.token !== "string" || !body.token || body.token.length > 128) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  try {
    recordPresentationEnquiry(body.token, body.message);
  } catch {
    // Never reveal, through an error, that a token resolved.
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
