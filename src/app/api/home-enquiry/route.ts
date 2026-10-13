import { NextResponse, type NextRequest } from "next/server";
import { homeEnquirySchema, flattenIssues } from "@/lib/validation";
import { registerHomeEnquiry } from "@/lib/services/home-enquiry";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp, rejectNonJson } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUBLIC endpoint — write-only. The home-buyer form on the landing page.
 * Returns an acknowledgement and a coarse lead category for ad reporting only.
 */
export async function POST(request: NextRequest) {
  const notJson = rejectNonJson(request);
  if (notJson) return notJson;

  const ip = clientIp(request.headers);
  if (!checkRateLimit(`home-enquiry:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
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

  const parsed = homeEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: flattenIssues(parsed.error), error: "Please check the highlighted fields." },
      { status: 422 },
    );
  }

  // Honeypot: look successful, record nothing.
  if (parsed.data.company) return NextResponse.json({ ok: true, leadCategory: "unclassified" });

  const { leadCategory } = registerHomeEnquiry(parsed.data);
  return NextResponse.json({ ok: true, leadCategory });
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
