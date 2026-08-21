import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { logActivity, queueCommunication } from "@/lib/repositories/activity";
import { updateInvestorStatus } from "@/lib/repositories/investors";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enquiry from a tokenised presentation.
 *
 * The token is the authorisation: it proves the caller holds a link an admin
 * issued. The endpoint records the enquiry and returns nothing but an
 * acknowledgement — no opportunity data is echoed back, so this route cannot be
 * used to read the private database even with a valid token.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(`presentation:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  let body: { token?: string; message?: string };
  try {
    body = (await request.json()) as { token?: string; message?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!body.token) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const db = getDb();
  const presentation = db
    .prepare(
      `SELECT id, investor_id, opportunity_id FROM presentations
        WHERE token = ?
          AND revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at > datetime('now'))`,
    )
    .get(body.token) as
    | { id: number; investor_id: number | null; opportunity_id: number }
    | undefined;

  // Same response for an unknown token as for a valid one, so this endpoint
  // can't be used to probe which tokens exist.
  if (!presentation) return NextResponse.json({ ok: true });

  const message = String(body.message ?? "").trim().slice(0, 2000);

  if (presentation.investor_id) {
    logActivity(
      presentation.investor_id,
      "presentation_enquiry",
      message || "Registered interest from a private presentation",
      { presentationId: presentation.id, opportunityId: presentation.opportunity_id },
    );
    queueCommunication({
      investorId: presentation.investor_id,
      channel: "email",
      direction: "inbound",
      subject: "Enquiry from private opportunity presentation",
      body: message || "(no message)",
      status: "logged",
    });
    updateInvestorStatus(presentation.investor_id, "inspection_discussion");
  } else {
    logActivity(null, "presentation_enquiry_anonymous", message || "Interest registered", {
      presentationId: presentation.id,
      opportunityId: presentation.opportunity_id,
    });
  }

  return NextResponse.json({ ok: true });
}
