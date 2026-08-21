import type { Metadata } from "next";
import "../globals.css";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentAdmin, purgeExpiredSessions } from "@/lib/auth";

/**
 * Admin routes get their own root layout — no public header, no footer, no
 * analytics tags, and metadata that forbids indexing regardless of what any
 * child page declares.
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
