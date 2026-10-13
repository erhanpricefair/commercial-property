import { NextResponse } from "next/server";

/**
 * Request helpers shared by every public POST handler.
 *
 * `clientIp` exists because the leftmost `X-Forwarded-For` entry is whatever
 * the caller typed: keying a rate limit on it lets anyone reset their own
 * limit by sending a different header on each request. The platform proxy's
 * own header is trusted when present (Fly sets `Fly-Client-IP` and strips any
 * client-supplied copy); otherwise the RIGHTMOST forwarded hop is used, which
 * is the one appended by the nearest proxy rather than by the client.
 *
 * Set TRUSTED_IP_HEADER if the deployment sits behind a different proxy
 * (e.g. `cf-connecting-ip` behind Cloudflare). Only name a header your proxy
 * overwrites — a header the client can set is no better than none.
 */
export function clientIp(headers: Headers): string {
  const trustedHeader = (process.env.TRUSTED_IP_HEADER ?? "fly-client-ip").toLowerCase();
  const trusted = headers.get(trustedHeader)?.trim();
  if (trusted) return trusted;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((hop) => hop.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Cross-site request guard for the JSON endpoints.
 *
 * A browser will only send `Content-Type: application/json` cross-origin after
 * a CORS preflight, which these routes never approve. Refusing anything else
 * means a third-party page cannot submit a hidden form (`text/plain`) to the
 * login or lead endpoints on a visitor's behalf. Every first-party caller
 * already sends JSON.
 */
export function rejectNonJson(request: Request): NextResponse | null {
  const type = (request.headers.get("content-type") ?? "").toLowerCase();
  if (type.startsWith("application/json")) return null;
  return NextResponse.json({ ok: false, error: "Unsupported request." }, { status: 415 });
}
