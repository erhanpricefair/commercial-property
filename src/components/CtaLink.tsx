"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CONVERSION_EVENTS, trackEvent } from "@/lib/analytics";

/**
 * A CTA that reports where it was clicked. Every primary conversion path on
 * the site goes through this so `investor_access_click` attribution is
 * consistent without each page remembering to wire it up.
 */
export default function CtaLink({
  href,
  children,
  location,
  className = "btn-primary",
  event = CONVERSION_EVENTS.investorAccessClick,
}: {
  href: string;
  children: ReactNode;
  location: string;
  className?: string;
  event?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackEvent(event, {
          cta_location: location,
          landing_page: typeof window !== "undefined" ? window.location.pathname : undefined,
        })
      }
    >
      {children}
    </Link>
  );
}
