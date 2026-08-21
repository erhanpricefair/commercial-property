import { NextResponse, type NextRequest } from "next/server";
import { guideSchema, flattenIssues } from "@/lib/validation";
import { getDb } from "@/lib/db";
import { logActivity, queueCommunication } from "@/lib/repositories/activity";
import { getEmailTemplate, baseMergeVars } from "@/lib/email";
import { renderTemplate } from "@/lib/email/templates";
import { dispatchLeadEvent } from "@/lib/integrations";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUBLIC endpoint — write-only lead magnet capture.
 *
 * A guide request is a softer signal than a full registration, so it creates a
 * NURTURE-classified investor record with no criteria attached. The owner can
 * see it in the dashboard alongside registrations and follow up if they choose.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(`guide:${ip}`, { limit: 8, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = guideSchema.safeParse(body);
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
           (first_name, last_name, email, mobile, contact_method, lead_score, classification,
            status, source, landing_page, next_followup_at)
         VALUES (?, '', ?, '', 'email', 5, 'NURTURE', 'new', ?, ?, datetime('now', '+14 days'))`,
      )
      .run(input.firstName, input.email, input.source ?? "guide_download", input.landingPage ?? null)
      .lastInsertRowid,
  );

  logActivity(investorId, "guide_download", "Requested the Investor Starter Guide", {
    source: input.source ?? "guide_download",
    landingPage: input.landingPage ?? null,
  });

  const template = getEmailTemplate("guide_delivery");
  if (template && template.is_active === 1) {
    const vars = { ...baseMergeVars(), firstName: input.firstName };
    queueCommunication({
      investorId,
      channel: "email",
      templateKey: template.key,
      subject: renderTemplate(template.subject, vars),
      body: renderTemplate(template.body, vars),
    });
  }

  void dispatchLeadEvent({
    event: "guide_download",
    investor: {
      id: investorId,
      firstName: input.firstName,
      lastName: "",
      email: input.email,
      mobile: "",
      contactMethod: "email",
      consentMarketing: false,
    },
    internal: { leadScore: 5, classification: "NURTURE", matchCount: 0 },
    attribution: { source: input.source ?? "guide_download", landingPage: input.landingPage ?? null },
    occurredAt: new Date().toISOString(),
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
