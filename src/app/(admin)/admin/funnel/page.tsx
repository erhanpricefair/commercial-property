import { requireAdminPage } from "@/lib/admin-guard";
import { getFunnelReport, listOpenPartials } from "@/lib/repositories/funnel";
import { PageHeader, Panel, formatDateTime } from "@/components/admin/ui";
import { labelFor } from "@/lib/taxonomy";
import { deletePartialAction, purgePartialsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function FunnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const raw = Array.isArray(params.days) ? params.days[0] : params.days;
  const days = [7, 30, 90].includes(Number(raw)) ? Number(raw) : 30;

  const report = getFunnelReport(days);
  const partials = listOpenPartials(50);

  return (
    <>
      <PageHeader
        title="Funnel"
        description="Where people give up, and who almost registered."
        action={
          <div className="flex gap-1">
            {[7, 30, 90].map((n) => (
              <a
                key={n}
                href={`/admin/funnel?days=${n}`}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  days === n
                    ? "border-ink-900 bg-ink-900 text-canvas"
                    : "border-ink-200 text-ink-600 hover:border-ink-300"
                }`}
              >
                {n}d
              </a>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Forms started" value={report.started} />
        <Metric label="Completed" value={report.completed} />
        <Metric
          label="Completion rate"
          value={`${report.completionRate}%`}
          note={report.started === 0 ? "No data yet" : undefined}
        />
      </div>

      {report.started === 0 ? (
        <div className="rounded-xl border border-ink-100 bg-canvas-raised px-5 py-12 text-center">
          <p className="text-sm font-semibold text-ink-900">No funnel data yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            This fills in as soon as visitors start using the form. It counts steps reached, not
            people — no cookies, nothing personal.
          </p>
        </div>
      ) : (
        <Panel title={`Drop-off by step · last ${days} days`}>
          <div className="px-5 py-4">
            {report.worstStep && report.worstStep.dropOffPct > 0 && (
              <p className="mb-5 rounded-lg border border-brass-200 bg-brass-100/50 px-4 py-3 text-sm text-brass-600">
                <strong className="font-semibold">Biggest leak:</strong> step {report.worstStep.step},{" "}
                {report.worstStep.label} — {report.worstStep.dropOffPct}% of people who reach it
                don&rsquo;t get past it. That is the question to look at first.
              </p>
            )}

            <ol className="space-y-3">
              {report.steps.map((step) => {
                const width = report.started > 0 ? (step.reached / report.started) * 100 : 0;
                return (
                  <li key={step.step}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink-700">
                        <span className="mr-2 text-xs tabular-nums text-ink-400">{step.step}</span>
                        {step.label}
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-500">
                        {step.reached}
                        {step.dropOff > 0 && (
                          <span className="ml-2 text-signal-hot">−{step.dropOff}</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-ink-900 transition-[width]"
                        style={{ width: `${Math.max(1, width)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {report.bySource.length > 0 && (
            <div className="border-t border-ink-100 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Completion by source
              </p>
              <ul className="mt-3 space-y-1.5">
                {report.bySource.map((row) => (
                  <li key={row.source} className="flex items-center justify-between text-sm">
                    <span className="text-ink-700">{row.source}</span>
                    <span className="tabular-nums text-ink-500">
                      {row.completed}/{row.started}{" "}
                      <strong className="ml-1 font-semibold text-ink-800">{row.rate}%</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      )}

      {/* Near misses */}
      <div className="mt-6">
        <Panel
          title={`Almost registered (${partials.length})`}
          empty={partials.length === 0}
          action={
            partials.length > 0 ? (
              <form action={purgePartialsAction}>
                <button type="submit" className="text-xs font-semibold text-ink-500 hover:text-ink-900">
                  Purge older than 90 days
                </button>
              </form>
            ) : null
          }
        >
          {partials.length === 0 ? (
            "Nobody has left the form part-finished with a usable email address."
          ) : (
            <>
              <p className="border-b border-ink-100 px-5 py-3 text-xs leading-relaxed text-ink-500">
                These people gave an email and told you what they want, then stopped before
                finishing. They are the warmest leads you are not calling — and they were told
                their progress was saved, so a follow-up is expected rather than a surprise.
              </p>
              <ul className="divide-y divide-ink-50">
                {partials.map((row) => (
                  <li key={row.id} className="px-5 py-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900">
                          {row.first_name || "—"} {row.last_name ?? ""}
                        </p>
                        <a
                          href={`mailto:${row.email}`}
                          className="text-xs text-ink-600 hover:underline"
                        >
                          {row.email}
                        </a>
                        <p className="mt-1 text-xs text-ink-500">
                          {labelFor("propertyType", row.property_type)} ·{" "}
                          {labelFor("budget", row.budget)} ·{" "}
                          {row.location_free || labelFor("location", row.location_scope)}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-400">
                          Reached step {row.last_step} of 7 · {formatDateTime(row.updated_at)}
                          {row.utm_campaign ? ` · ${row.utm_campaign}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {row.mobile && (
                          <a
                            href={`tel:${row.mobile.replace(/[^\d+]/g, "")}`}
                            className="btn-secondary !min-h-[2rem] px-3 text-xs"
                          >
                            Call
                          </a>
                        )}
                        <form action={deletePartialAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className="text-xs text-ink-400 hover:text-signal-hot">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}

function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-canvas-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-2 font-display text-display-sm text-ink-900">{value}</p>
      {note && <p className="mt-1 text-xs text-ink-400">{note}</p>}
    </div>
  );
}
