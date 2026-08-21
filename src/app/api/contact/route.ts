import { NextResponse, type NextRequest } from "next/server";
import { contactSchema, flattenIssues } from "@/lib/validation";
import { getDb } from "@/lib/db";
import { logActivity } from "@/lib/repositories/activity";
import { dispatchLeadEvent } from "@/lib/integrations";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PUBLIC endpoint — write-only general enquiry capture. */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

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
