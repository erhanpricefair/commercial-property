import type { NextConfig } from "next";

/**
 * Security headers applied site-wide. Private surfaces (admin + tokenised
 * opportunity presentations) get an additional `X-Robots-Tag` in middleware.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS only, once deployed. No includeSubDomains: the agency's other
  // subdomains (mail, a CRM portal) are not ours to force onto HTTPS.
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emits a self-contained server bundle so the Docker image doesn't need
  // node_modules — smaller image, faster cold start.
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3"],
  /**
   * newpfproperty.com.au used to be a GoDaddy-built site. Its old page
   * addresses (in Google, in bookmarks, on business cards) land on the new
   * home page rather than a 404; the bare domain goes to www so there is one
   * canonical address. Add any other old addresses here.
   */
  async redirects() {
    const oldGoDaddyPages = ["/about", "/about-us", "/contact-us", "/services", "/our-services", "/listings", "/properties", "/home"];
    return [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "newpfproperty.com.au" }],
        destination: "https://www.newpfproperty.com.au/:path*",
        permanent: true,
      },
      ...oldGoDaddyPages.map((source) => ({ source, destination: "/", permanent: true })),
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Belt-and-braces: never let a crawler index private surfaces even if a
      // link leaks. Middleware sets this too; duplicating at the edge is cheap.
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }],
      },
      {
        source: "/opportunity/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
