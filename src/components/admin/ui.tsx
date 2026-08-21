import Link from "next/link";
import type { ReactNode } from "react";
import type { LeadClassification, LeadStatus } from "@/lib/taxonomy";
import { LEAD_STATUS_LABELS } from "@/lib/taxonomy";

/** Admin-only presentation helpers. Nothing here is used on a public page. */

export function StatCard({
  label,
  value,
  sub,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  tone?: "default" | "hot" | "positive";
}) {
  const tones = {
    default: "border-ink-100",
    hot: "border-signal-hot/30 bg-signal-hot/[0.03]",
    positive: "border-signal-positive/30 bg-signal-positive/[0.03]",
  };

  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-2 font-display text-display-sm text-ink-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
    </>
  );

  const className = `block rounded-xl border bg-canvas-raised p-5 ${tones[tone]} ${
    href ? "transition hover:border-ink-300 hover:shadow-card" : ""
  }`;

  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export function ClassificationBadge({ value }: { value: LeadClassification | string }) {
  const styles: Record<string, string> = {
    HOT: "bg-signal-hot/10 text-signal-hot border-signal-hot/25",
    WARM: "bg-signal-warm/10 text-signal-warm border-signal-warm/25",
    NURTURE: "bg-ink-100 text-ink-600 border-ink-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider ${
        styles[value] ?? styles.NURTURE
      }`}
    >
      {value}
    </span>
  );
}

export function StatusBadge({ value }: { value: LeadStatus | string }) {
  const label = LEAD_STATUS_LABELS[value as LeadStatus] ?? value;
  const emphasised = value === "converted" || value === "negotiating";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium ${
        emphasised
          ? "border-signal-positive/30 bg-signal-positive/10 text-signal-positive"
          : "border-ink-200 bg-canvas-sunken text-ink-600"
      }`}
    >
      {label}
    </span>
  );
}

export function PrivateBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-brass-200 bg-brass-100 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-brass-600">
      <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3 5V3.5a3 3 0 016 0V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="2" y="5" width="8" height="6" rx="1" fill="currentColor" />
      </svg>
      Private
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-display-sm text-ink-900">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  empty,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <section className="rounded-xl border border-ink-100 bg-canvas-raised">
      <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {action}
      </header>
      <div className={empty ? "px-5 py-8 text-center text-sm text-ink-400" : ""}>{children}</div>
    </section>
  );
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
