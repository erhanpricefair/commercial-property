import Link from "next/link";
import { Panel, formatCurrency } from "@/components/admin/ui";
import { FREQUENCY_LABELS } from "@/lib/matching";
import { settlementSpeed } from "@/lib/revenue";
import { labelFor } from "@/lib/taxonomy";
import type { CoverageMatchRow } from "@/lib/repositories/coverage";

/**
 * What we can help this investor with.
 *
 * Answers the only question that matters when deciding whether to call: is
 * this someone we can source for? What is actually available today is a
 * question for the channel partner at the time of the call — which is exactly
 * why this shows coverage rather than stock.
 */
export default function CoverageMatches({
  matches,
  hasAnyCoverage,
}: {
  matches: CoverageMatchRow[];
  hasAnyCoverage: boolean;
}) {
  return (
    <Panel
      title={`Can we help them? ${matches.length > 0 ? `Yes — ${matches.length} coverage area${matches.length === 1 ? "" : "s"}` : ""}`}
      action={
        <Link href="/admin/coverage" className="text-xs font-semibold text-ink-600 hover:text-ink-900">
          Manage coverage
        </Link>
      }
    >
      {!hasAnyCoverage ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-semibold text-ink-900">No coverage recorded yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            Matching needs to know what you can source. Add a few coverage areas — asset type,
            suburb and price band — and this fills in immediately.
          </p>
          <Link href="/admin/coverage" className="btn-primary mt-4 !min-h-[2.5rem] px-5 text-sm">
            Add coverage
          </Link>
        </div>
      ) : matches.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-medium text-ink-700">
            Nothing in your current coverage fits their criteria.
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            Worth a call anyway to test how firm their budget and location are — or tell them
            honestly that this isn&rsquo;t your patch. Both are better than silence.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-ink-50">
            {matches.map((match) => {
              const speed = settlementSpeed(match.typical_completion);
              return (
                <li key={match.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">
                        {labelFor("propertyType", match.property_type)}
                        {" · "}
                        {match.suburb || match.region || match.state}
                      </p>
                      <p className="mt-1 text-xs text-ink-600">
                        {formatCurrency(match.price_min)} – {formatCurrency(match.price_max)}
                        {" · "}
                        {FREQUENCY_LABELS[match.frequency] ?? match.frequency}
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {match.reasons.map((reason) => (
                          <li
                            key={reason}
                            className="rounded bg-canvas-sunken px-2 py-0.5 text-[0.6875rem] text-ink-500"
                          >
                            {reason}
                          </li>
                        ))}
                      </ul>
                      {speed && (
                        <p
                          className={`mt-2 text-xs ${speed.tone === "fast" ? "text-signal-positive" : "text-ink-400"}`}
                        >
                          Typically {speed.label.toLowerCase()}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-display-sm text-brass-600">{match.match_score}</p>
                      <p className="text-[0.6875rem] text-ink-400">fit score</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-ink-100 px-5 py-3 text-xs leading-relaxed text-ink-400">
            Coverage tells you this investor is worth a call. Check with your channel partner what
            is actually available before you present anything specific.
          </p>
        </>
      )}
    </Panel>
  );
}
