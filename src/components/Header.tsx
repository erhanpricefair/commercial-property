"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";
import { CONVERSION_EVENTS, trackEvent } from "@/lib/analytics";

const NAV = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/why-commercial-property", label: "Why Commercial" },
  { href: "/opportunities", label: "Opportunity Types" },
  { href: "/resources", label: "Resources" },
  { href: "/guide", label: "Investor Guide" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes, so a nav tap never leaves the
  // menu covering the page the visitor just asked for.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-canvas/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
          <Mark />
          <span className="text-[0.95rem] font-semibold leading-tight tracking-tight text-ink-900 sm:text-base">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition ${
                pathname.startsWith(item.href) ? "text-ink-900" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/register"
            onClick={() =>
              trackEvent(CONVERSION_EVENTS.investorAccessClick, { cta_location: "header" })
            }
            className="btn-primary hidden !min-h-[2.75rem] px-5 text-sm sm:inline-flex"
          >
            See Current Opportunities
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-700 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
        <div id="mobile-nav" className="border-t border-ink-100 bg-canvas-raised lg:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-[3rem] items-center border-b border-ink-50 text-base font-medium text-ink-800 last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/register"
              onClick={() =>
                trackEvent(CONVERSION_EVENTS.investorAccessClick, { cta_location: "mobile_nav" })
              }
              className="btn-primary mt-4"
            >
              See Current Opportunities
            </Link>
            <Link href="/contact" className="btn-secondary mt-2 mb-3">
              Talk to us
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Mark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 21V9l7-4.5V21" stroke="#FBFAF8" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M10 21V11l7 4v6" stroke="#9C7A46" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M2 21h20" stroke="#FBFAF8" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </span>
  );
}
