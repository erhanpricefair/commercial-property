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
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emits a self-contained server bundle so the Docker image doesn't need
  // node_modules — smaller image, faster cold start.
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3"],
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
