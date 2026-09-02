"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/today", label: "Call list" },
  { href: "/admin/investors", label: "Investors" },
  { href: "/admin/coverage", label: "Coverage" },
  { href: "/admin/opportunities", label: "Opportunities" },
  { href: "/admin/presentations", label: "Presentations" },
  { href: "/admin/email-templates", label: "Email Templates" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminShell({
  children,
  adminName,
}: {
  children: ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-canvas-sunken">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-ink-900 text-canvas">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-ink-700" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M3 21V9l7-4.5V21" stroke="#FBFAF8" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M10 21V11l7 4v6" stroke="#B99A60" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </span>
              Admin
            </Link>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Admin">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    isActive(item) ? "bg-ink-700 text-canvas" : "text-ink-300 hover:text-canvas"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-ink-400 sm:block">{adminName}</span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-ink-200 transition hover:bg-ink-800"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-200 lg:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? (
                  <>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-ink-700 bg-ink-800 lg:hidden" aria-label="Admin mobile">
            <div className="mx-auto flex max-w-[90rem] flex-col px-4 py-2 sm:px-6">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[2.75rem] items-center border-b border-ink-700 text-sm last:border-0 ${
                    isActive(item) ? "text-canvas" : "text-ink-300"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
