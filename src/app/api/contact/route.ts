import { NextResponse, type NextRequest } from "next/server";
import { contactSchema, flattenIssues } from "@/lib/validation";
import { getDb } from "@/lib/db";
import { logActivity, queueCommunication } from "@/lib/repositories/activity";
import { findInvestorByEmail } from "@/lib/repositories/investors";
import { dispatchLeadEvent } from "@/lib/integrations";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp, rejectNonJson } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PUBLIC endpoint — write-only general enquiry capture. */
export async function POST(request: NextRequest) {
  const notJson = rejectNonJson(request);
  if (notJson) return notJson;

  const ip = clientIp(request.headers);

  if (!checkRateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { ok: false, error: "Too many messages. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: flattenIssues(parsed.error), error: "Please check the highlighted fields." },
      { status: 422 },
    );
  }

  const input = parsed.data;
  if (input.company) return NextResponse.json({ ok: true });

  const db = getDb();
  const existing = findInvestorByEmail(input.email);
  if (existing) {
    // Same person, new message: keep it on their record, bring them back to
    // the top of the follow-up queue, and don't create a second lead.
    queueCommunication({
      investorId: existing.id,
      channel: "email",
      direction: "inbound",
      subject: "Website enquiry",
      body: input.message,
      status: "logged",
    });
    db.prepare(
      `UPDATE investors
          SET next_followup_at = CASE
                WHEN next_followup_at IS NULL OR next_followup_at > datetime('now', '+1 days')
                THEN datetime('now', '+1 days') ELSE next_followup_at END,
              status = CASE WHEN status IN ('nurture','not_suitable') THEN 'new' ELSE status END,
              updated_at = datetime('now')
        WHERE id = ?`,
    ).run(existing.id);
    logActivity(existing.id, "contact_request", "Sent a general enquiry", {
      landingPage: input.landingPage ?? null,
      returning: true,
    });
    return NextResponse.json({ ok: true });
  }

  const investorId = Number(
    db
      .prepare(
        `INSERT INTO investors
           (first_name, last_name, email, mobile, contact_method, notes_from_lead,
            lead_score, classification, status, source, landing_page, next_followup_at)
         VALUES (?, ?, ?, ?, 'email', ?, 10, 'NURTURE', 'new', 'contact_form', ?, datetime('now', '+1 days'))`,
      )
      .run(
        input.firstName,
        input.lastName || "",
        input.email,
        input.mobile || "",
        input.message,
        input.landingPage ?? null,
      ).lastInsertRowid,
  );

  logActivity(investorId, "contact_request", "Submitted a general enquiry", {
    landingPage: input.landingPage ?? null,
  });

  void dispatchLeadEvent({
    event: "contact_request",
    investor: {
      id: investorId,
      firstName: input.firstName,
      lastName: input.lastName || "",
      email: input.email,
      mobile: input.mobile || "",
      contactMethod: "email",
      message: input.message,
      consentMarketing: false,
    },
    internal: { leadScore: 10, classification: "NURTURE", matchCount: 0 },
    attribution: { source: "contact_form", landingPage: input.landingPage ?? null },
    occurredAt: new Date().toISOString(),
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
