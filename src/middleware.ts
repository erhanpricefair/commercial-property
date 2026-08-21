import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge guard for the two private surfaces.
 *
 * 1. `/admin/*` — anything without a session cookie is bounced to the login
 *    page before the route renders. This is a fast fail, NOT the authorisation
 *    boundary: every admin page and API handler independently calls
 *    `requireAdmin()`, which validates the session against the database. The
 *    middleware only sees whether a cookie exists, so it can never be the only
 *    check.
 *
 * 2. `X-Robots-Tag` on every private path, so a crawler that reaches one of
 *    these URLs through a shared link, a referrer header or a leaked email is
 *    told not to index it regardless of what the page itself renders.
 */

const SESSION_COOKIE = "cp_admin_session";
const NOINDEX = "noindex, nofollow, noarchive, nosnippet, noimageindex";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

    if (!hasCookie && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
      const response = NextResponse.redirect(url);
      response.headers.set("X-Robots-Tag", NOINDEX);
      return response;
    }

    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", NOINDEX);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }

  if (pathname.startsWith("/opportunity")) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", NOINDEX);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    // A tokenised link must not leak in the referrer when the recipient clicks
    // through to another site.
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/opportunity/:path*"],
};
