import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Private surfaces are disallowed here as a first line of defence, but robots
 * rules are advisory — the real protection is authentication (admin) and
 * unguessable tokens plus `X-Robots-Tag: noindex` (presentations). Both are
 * enforced in `middleware.ts` and in the route handlers themselves.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/opportunity/",
          "/register/thank-you",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
