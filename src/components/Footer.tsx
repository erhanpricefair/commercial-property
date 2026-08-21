import Link from "next/link";
import { DISCLAIMER_FULL, SITE } from "@/lib/site";

const COLUMNS = [
  {
    heading: "Investors",
    links: [
      { href: "/register", label: "Register for Investor Access" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/opportunities", label: "Opportunity Types" },
      { href: "/guide", label: "Investor Starter Guide" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Opportunity Types",
    links: [
      { href: "/small-commercial-property-investment", label: "Small Commercial" },
      { href: "/warehouse-investment-melbourne", label: "Warehouse Investment" },
      { href: "/industrial-property-investment-melbourne", label: "Industrial Property" },
      { href: "/storage-property-investment", label: "Storage Investment" },
      { href: "/commercial-property-under-500k", label: "Under $500,000" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { href: "/resources", label: "All Resources" },
      { href: "/resources/commercial-property-investment-for-beginners", label: "Investing for Beginners" },
      { href: "/resources/understanding-commercial-property-yields", label: "Understanding Yields" },
      { href: "/resources/what-are-outgoings-in-commercial-property", label: "What Are Outgoings?" },
      { href: "/why-commercial-property", label: "Why Commercial Property" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-section border-t border-ink-100 bg-canvas-sunken">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-base font-semibold tracking-tight text-ink-900">{SITE.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
              Helping investors identify commercial property opportunities that match their budget,
              location and investment objectives.
            </p>
            <p className="mt-4 text-sm text-ink-500">{SITE.region}</p>
            {SITE.email && (
              <a
                href={`mailto:${SITE.email}`}
                className="mt-1 inline-block text-sm font-medium text-ink-800 underline underline-offset-4 hover:text-brass-600"
              >
                {SITE.email}
              </a>
            )}
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="eyebrow">{column.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-600 transition hover:text-ink-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="rule my-10" />

        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-ink-500">
            <strong className="font-semibold text-ink-700">Important:</strong> {DISCLAIMER_FULL}
          </p>
          <div className="flex flex-col gap-3 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {SITE.legalName}
              {SITE.abn ? ` · ABN ${SITE.abn}` : ""}. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/privacy" className="hover:text-ink-700">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-ink-700">Terms of Use</Link>
              <Link href="/disclaimer" className="hover:text-ink-700">Disclaimer</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
