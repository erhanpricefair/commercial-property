import type { Metadata } from "next";
import "../globals.css";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentAdmin, purgeExpiredSessions } from "@/lib/auth";

/**
 * Admin is its own ROOT layout, in a route group of its own.
 *
 * That is the point: a nested layout would still sit inside the public shell,
 * which would put the marketing header, the footer and — worse — the GA and
 * Meta Pixel tags on every admin screen, reporting URLs like
 * `/admin/investors/42` to third parties. A separate root layout means the
 * public chrome and the analytics scripts simply do not exist here.
 *
 * Route groups don't affect URLs, so these pages are still served at /admin/*.
 */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  purgeExpiredSessions();
  const admin = await getCurrentAdmin();

  // The login page renders its own standalone shell, so it opts out of this
  // one via the `admin === null` branch below rather than being special-cased.
  if (!admin) {
    return (
      <html lang="en-AU">
        <body className="bg-canvas-sunken">{children}</body>
      </html>
    );
  }

  return (
    <html lang="en-AU">
      <body className="bg-canvas-sunken">
        <AdminShell adminName={admin.name}>{children}</AdminShell>
      </body>
    </html>
  );
}
