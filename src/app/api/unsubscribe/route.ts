import { NextResponse, type NextRequest } from "next/server";
import { unsubscribeByToken } from "@/lib/repositories/consent";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUBLIC endpoint — write-only. Withdraws marketing consent.
 *
 * Two callers:
 *   - the /unsubscribe page, which POSTs JSON `{ token }`
 *   - a mail client honouring `List-Unsubscribe-Post` (RFC 8058), which POSTs
 *     `List-Unsubscribe=One-Click` as a form body to `?t=<token>`
 *
 * Deliberately POST-only. Mail security scanners follow every GET link in an
 * email; if a GET unsubscribed, people would be unsubscribed by their own
 * spam filter. The response is identical for valid and unknown tokens.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (!checkRateLimit(`unsubscribe:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const type = (request.headers.get("content-type") ?? "").toLowerCase();
  let token = request.nextUrl.searchParams.get("t") ?? "";
  let via: "link" | "one_click" = "one_click";

  try {
    if (type.startsWith("application/json")) {
      const body = (await request.json()) as { token?: unknown };
      if (typeof body.token === "string") token = body.token;
      via = "link";
    } else if (type.startsWith("application/x-www-form-urlencoded") || type.startsWith("multipart/form-data")) {
      const form = await request.formData();
      if (form.get("List-Unsubscribe") !== "One-Click") {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
    } else {
      return NextResponse.json({ ok: false }, { status: 415 });
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    unsubscribeByToken(token, via);
  } catch {
    /* identical response regardless */
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
