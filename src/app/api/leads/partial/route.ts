import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { savePartial } from "@/lib/repositories/funnel";
import {
  BUDGETS, FINANCE_STATUSES, LOCATIONS, PRIORITIES, PROPERTY_TYPES, TIMEFRAMES,
} from "@/lib/taxonomy";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUBLIC endpoint — write-only. Saves an in-progress registration.
 *
 * Someone who answers six questions and stalls on the phone field has told us
 * everything except how to reach them. This turns that from a total loss into
 * a workable lead.
 *
 * Collected transparently: the form displays a notice at the point the email
 * is captured, and the privacy policy covers it. Only fires once a valid email
 * has been entered — there is no value in a criteria-only row nobody can be
 * contacted about, and collecting one would be gathering personal information
 * for no purpose.
 */
const partialSchema = z.object({
  sessionKey: z.string().trim().min(8).max(64),
  email: z.string().trim().toLowerCase().email().max(160),
  firstName: z.string().trim().max(80).optional().or(z.literal("")),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  budget: z.enum(BUDGETS).optional(),
  locationScope: z.enum(LOCATIONS).optional(),
  locationFree: z.string().trim().max(120).optional().or(z.literal("")),
  priorities: z.array(z.enum(PRIORITIES)).max(20).optional(),
  financeStatus: z.enum(FINANCE_STATUSES).optional(),
  timeframe: z.enum(TIMEFRAMES).optional(),
  lastStep: z.number().int().min(0).max(10).optional(),
  source: z.string().trim().max(80).optional(),
  landingPage: z.string().trim().max(300).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  utmSource: z.string().trim().max(120).optional(),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Saves fire on field blur, so the limit is looser than a full submission.
  if (!checkRateLimit(`partial:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = partialSchema.safeParse(body);
  // Silent on invalid input: this is a background save, and surfacing an error
  // would interrupt someone who is still filling the form in.
  if (!parsed.success) return NextResponse.json({ ok: true });

  try {
    savePartial(parsed.data);
  } catch {
    // Never let a background save break the form in front of the visitor.
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
