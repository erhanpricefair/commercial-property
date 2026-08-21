import Link from "next/link";
import type { ReactNode } from "react";
import { DISCLAIMER_SHORT } from "@/lib/site";

/** Small shared building blocks used across the public marketing pages. */

export function Section({
  children,
  className = "",
  tone = "canvas",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "canvas" | "sunken" | "raised" | "ink";
  id?: string;
}) {
  const tones = {
    canvas: "bg-canvas",
    sunken: "bg-canvas-sunken",
    raised: "bg-canvas-raised",
    ink: "bg-ink-900 text-canvas",
  };
  return (
    <section id={id} className={`py-section ${tones[tone]} ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  inverse = false,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  align?: "left" | "center";
  inverse?: boolean;
}) {
  return (
    <div className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && (
        <p className={`eyebrow ${inverse ? "text-brass-400" : ""}`}>{eyebrow}</p>
      )}
      <h2
        className={`mt-3 font-display text-display-md ${
          inverse ? "text-canvas" : "text-ink-900"
        }`}
      >
        {title}
      </h2>
      {intro && (
        <div
          className={`mt-4 text-[1.0625rem] leading-[1.7] ${
            inverse ? "text-ink-200" : "text-ink-600"
          }`}
        >
          {intro}
        </div>
      )}
    </div>
  );
}

export function CheckList({
  items,
  inverse = false,
}: {
  items: (string | ReactNode)[];
  inverse?: boolean;
}) {
  return (
    <ul className="space-y-3.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <svg
            className={`mt-1 h-4 w-4 shrink-0 ${inverse ? "text-brass-400" : "text-brass-500"}`}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={`text-[0.9375rem] leading-relaxed ${inverse ? "text-ink-200" : "text-ink-600"}`}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CtaBand({
  title = "Not every opportunity is publicly listed",
  body = "Register your investment criteria and we'll contact you when an opportunity appears to match what you're looking for.",
  primaryLabel = "Register for Investor Access",
  primaryHref = "/register",
  secondaryLabel,
  secondaryHref,
}: {
  title?: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="bg-ink-900 py-section text-canvas">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-md text-canvas">{title}</h2>
          <p className="mt-4 text-[1.0625rem] leading-[1.7] text-ink-200">{body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={primaryHref} className="btn-brass">
              {primaryLabel}
            </Link>
            {secondaryLabel && secondaryHref && (
              <Link
                href={secondaryHref}
                className="btn border border-ink-600 text-canvas hover:bg-ink-800"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
          <p className="mt-6 text-xs text-ink-400">
            No obligation to purchase. {DISCLAIMER_SHORT}
          </p>
        </div>
      </div>
    </section>
  );
}

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`rounded-xl border border-ink-100 bg-canvas-sunken p-5 text-xs leading-relaxed text-ink-500 ${className}`}
      role="note"
    >
      <p className="font-semibold uppercase tracking-wider text-ink-600">General information only</p>
      <p className="mt-2">
        Information provided is general in nature and does not constitute financial, legal or
        investment advice. It does not take into account your objectives, financial situation or
        needs. Commercial property involves risks, including vacancy, tenant default and changes in
        market conditions. Investors should conduct their own due diligence and obtain independent
        professional advice before making an investment decision.
      </p>
    </aside>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-l-2 border-brass-200 pl-4">
      <p className="font-display text-display-sm text-ink-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-ink-700">{label}</p>
      {note && <p className="mt-0.5 text-xs text-ink-400">{note}</p>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {item.href ? (
              <Link href={item.href} className="hover:text-ink-700">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink-600">{item.label}</span>
            )}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
