import { NextResponse, type NextRequest } from "next/server";
import { login, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin sign-in. Rate limited per IP because this is the one public endpoint
 * that guards everything private.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(`admin-login:${ip}`, { limit: 8, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait and try again." },
      { status: 429 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      { ok: false, error: "Enter your email address and password." },
      { status: 400 },
    );
  }

  const session = login(body.email, body.password, {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ip,
  });

  // Deliberately identical message for unknown user and wrong password.
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Those details don't match an account." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
  return response;
}
