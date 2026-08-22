import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, UnauthorizedError } from "@/lib/auth";
import { listInvestors } from "@/lib/repositories/investors";
import { labelFor } from "@/lib/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ADMIN-ONLY export of the investor list.
 *
 * Guarded by `requireAdmin()`, which validates the session against the
 * database. It exports investor-side data only — no opportunity fields and no
 * match detail — so even this authenticated export cannot carry private stock
 * information out of the system.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }

  const params = request.nextUrl.searchParams;
  const { rows } = listInvestors({
    status: params.get("status") ?? undefined,
    classification: params.get("classification") ?? undefined,
    propertyType: params.get("propertyType") ?? undefined,
    budget: params.get("budget") ?? undefined,
    locationScope: params.get("locationScope") ?? undefined,
    search: params.get("q") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    campaign: params.get("campaign") ?? undefined,
    utmSource: params.get("utmSource") ?? undefined,
    needsFollowUp: params.get("followUp") === "1",
    limit: 200,
  });

  const headers = [
    "id", "first_name", "last_name", "email", "mobile", "preferred_contact",
    "property_type", "budget", "location", "suburb", "finance_status", "timeframe",
    "lead_score", "classification", "status", "match_count", "source",
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "click_id", "referrer",
    "registered", "last_contact", "next_followup",
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.first_name,
        row.last_name,
        row.email,
        row.mobile,
        labelFor("contactMethod", row.contact_method),
        labelFor("propertyType", row.property_type),
        labelFor("budget", row.budget),
        labelFor("location", row.location_scope),
        row.location_free ?? "",
        labelFor("finance", row.finance_status),
        labelFor("timeframe", row.timeframe),
        row.lead_score,
        row.classification,
        row.status,
        row.match_count,
        row.source ?? "",
        row.utm_source ?? "",
        row.utm_medium ?? "",
        row.utm_campaign ?? "",
        row.utm_content ?? "",
        row.utm_term ?? "",
        row.click_id ?? "",
        row.referrer ?? "",
        row.created_at,
        row.last_contact_at ?? "",
        row.next_followup_at ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="investors-${new Date().toISOString().slice(0, 10)}.csv"`,
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Quote every cell and neutralise leading characters that spreadsheet software
 * treats as the start of a formula — an investor could otherwise type `=...`
 * into the free-text suburb field and have it execute when the CSV is opened.
 */
function csvCell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
