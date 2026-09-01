import Link from "next/link";
import type { RevenueSnapshot } from "@/lib/repositories/deals";
import { formatCurrency } from "@/components/admin/ui";

/**
 * Progress toward the revenue target.
 *
 * Deliberately shows the weighted forecast next to the banked figure, and the
 * gap in *deals and leads*, not just dollars. A target you can't convert into
 * "how many more calls" isn't a plan.
 */
export default function RevenueTracker({ snapshot }: { snapshot: RevenueSnapshot }) {
  const { forecast, progress, averageCommission, conversionRate, observedConversion, fastStock } =
    snapshot;
  const target = progress.target;

  const bankedPct = target > 0 ? Math.min(100, (forecast.banked / target) * 100) : 0;
  const forecastPct = target > 0 ? Math.min(100, (progress.forecast / target) * 100) : 0;

  return (
    <section className="rounded-xl border border-ink-100 bg-canvas-raised">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-ink-900">
          Revenue target · {formatCurrency(target)}
        </h2>
        <Link href="/admin/settings" className="text-xs font-semibold text-ink-500 hover:text-ink-900">
          Adjust target
        </Link>
      </header>

      <div className="px-5 py-5">
        {/* Progress bar: banked solid, forecast hatched behind it. */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-brass-200"
            style={{ width: `${forecastPct}%` }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-signal-positive"
            style={{ width: `${bankedPct}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-signal-positive" aria-hidden="true" />
            Banked {formatCurrency(forecast.banked)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brass-200" aria-hidden="true" />
            Weighted forecast {formatCurrency(progress.forecast)}
          </span>
          <span className="ml-auto font-semibold text-ink-700">{progress.percentOfTarget}% of target</span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Banked" value={formatCurrency(forecast.banked)} note="Commission received" />
          <Metric
            label="Committed"
            value={formatCurrency(forecast.committed)}
            note="Unconditional, awaiting settlement"
          />
          <Metric
            label="Weighted pipeline"
            value={formatCurrency(forecast.weightedPipeline)}
            note={`${forecast.openDeals} open deal${forecast.openDeals === 1 ? "" : "s"} · ${formatCurrency(forecast.grossPipeline)} gross`}
          />
          <Metric
            label="Gap to target"
            value={formatCurrency(progress.gap)}
            note={progress.gap > 0 ? "Still to find" : "Target covered"}
            tone={progress.gap > 0 ? "warn" : "good"}
          />
        </dl>

        {/* The operational translation: what the gap means in work. */}
        {progress.gap > 0 && (
          <div className="mt-6 rounded-xl border border-ink-100 bg-canvas-sunken p-4">
            <p className="text-sm font-semibold text-ink-900">What the gap means</p>
            <ul className="mt-2.5 space-y-1.5 text-[0.9375rem] text-ink-600">
              <li>
                <strong className="font-semibold text-ink-900">
                  {progress.dealsStillNeeded} more deal{progress.dealsStillNeeded === 1 ? "" : "s"}
                </strong>{" "}
                at the current average commission of {formatCurrency(averageCommission)}.
              </li>
              {progress.leadsStillNeeded !== null && (
                <li>
                  Roughly{" "}
                  <strong className="font-semibold text-ink-900">
                    {progress.leadsStillNeeded} more registration
                    {progress.leadsStillNeeded === 1 ? "" : "s"}
                  </strong>{" "}
                  at a {(conversionRate! * 100).toFixed(1)}% conversion rate{" "}
                  {observedConversion === null
                    ? "(assumed — not enough closed deals yet to measure it)"
                    : "(your observed rate)"}
                  .
                </li>
              )}
              {fastStock.count > 0 && (
                <li>
                  {fastStock.count} completed propert{fastStock.count === 1 ? "y" : "ies"} currently
                  available — around {formatCurrency(fastStock.potentialCommission)} of commission
                  that could settle in weeks rather than on completion.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "default" | "good" | "warn";
}) {
  const colour =
    tone === "good" ? "text-signal-positive" : tone === "warn" ? "text-signal-hot" : "text-ink-900";
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className={`mt-1.5 font-display text-display-sm ${colour}`}>{value}</dd>
      {note && <p className="mt-0.5 text-xs text-ink-400">{note}</p>}
    </div>
  );
}
