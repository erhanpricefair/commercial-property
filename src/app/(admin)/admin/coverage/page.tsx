import { requireAdminPage } from "@/lib/admin-guard";
import { listCoverage, coverageStats } from "@/lib/repositories/coverage";
import { PageHeader, formatCurrency, formatDate } from "@/components/admin/ui";
import { AU_STATES, COMPLETION_LABELS, COMPLETION_STATUSES, PROPERTY_TYPE_OPTIONS, labelFor } from "@/lib/taxonomy";
import { FREQUENCY_LABELS } from "@/lib/matching";
import {
  createCoverageAction,
  updateCoverageAction,
  confirmCoverageAction,
  deleteCoverageAction,
} from "./actions";

export const dynamic = "force-dynamic";

const FREQUENCIES = ["regular", "occasional", "rare"] as const;

export default async function CoveragePage() {
  await requireAdminPage();
  const coverage = listCoverage();
  const stats = coverageStats();

  return (
    <>
      <PageHeader
        title="Coverage"
        description="What you can source, described at market level — asset type, suburb and price band."
      />

      {/* The distinction that keeps the partner relationship intact. */}
      <div className="mb-6 rounded-xl border border-brass-200 bg-brass-100/50 p-4">
        <p className="text-sm font-semibold text-brass-600">This is not a stocklist</p>
        <p className="mt-1.5 text-xs leading-relaxed text-brass-600">
          Coverage records what kind of property you can source, where, and at roughly what price.
          There is no field here for a developer, a development, an address or a lot number — this
          table has no columns for them, so a specific property cannot be recorded even by accident.
          What is actually available on any given day stays with your channel partner, where it
          belongs; coverage just tells you which investors are worth calling.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Active coverage areas" value={stats.active} />
        <Stat
          label="Asset types covered"
          value={stats.byType.length}
          note={stats.byType.map((t) => labelFor("propertyType", t.property_type)).join(", ") || "None yet"}
        />
        <Stat
          label="Needs re-confirming"
          value={stats.stale}
          note="Not checked in 90 days"
          tone={stats.stale > 0 ? "warn" : "default"}
        />
      </div>

      {/* Add */}
      <section className="mb-8 rounded-xl border border-ink-100 bg-canvas-raised">
        <header className="border-b border-ink-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink-900">Add coverage</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            One row per asset type per area. A price band is enough — no exact figures needed.
          </p>
        </header>
        <form action={createCoverageAction} className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Property type" htmlFor="propertyType">
            <select id="propertyType" name="propertyType" className="field-input !py-2.5 text-sm" required>
              {PROPERTY_TYPE_OPTIONS.filter((o) => o.value !== "open").map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Suburb" htmlFor="suburb" hint="Or leave blank and use area">
            <input id="suburb" name="suburb" type="text" placeholder="Coburg North" className="field-input !py-2.5 text-sm" />
          </Field>
          <Field label="Area" htmlFor="region" hint="e.g. Northern Melbourne">
            <input id="region" name="region" type="text" placeholder="Northern Melbourne" className="field-input !py-2.5 text-sm" />
          </Field>
          <Field label="State" htmlFor="state">
            <select id="state" name="state" defaultValue="VIC" className="field-input !py-2.5 text-sm">
              {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Price from" htmlFor="priceMin">
            <input id="priceMin" name="priceMin" type="number" min={0} step={10000} placeholder="200000" className="field-input !py-2.5 text-sm" />
          </Field>
          <Field label="Price to" htmlFor="priceMax">
            <input id="priceMax" name="priceMax" type="number" min={0} step={10000} placeholder="320000" className="field-input !py-2.5 text-sm" />
          </Field>
          <Field label="How often available" htmlFor="frequency">
            <select id="frequency" name="frequency" defaultValue="occasional" className="field-input !py-2.5 text-sm">
              {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>)}
            </select>
          </Field>
          <Field label="Typically" htmlFor="typicalCompletion" hint="Affects how fast it settles">
            <select id="typicalCompletion" name="typicalCompletion" defaultValue="" className="field-input !py-2.5 text-sm">
              <option value="">—</option>
              {COMPLETION_STATUSES.map((c) => <option key={c} value={c}>{COMPLETION_LABELS[c]}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Field label="Notes" htmlFor="notes" hint="For you only — never shown to an investor">
              <input id="notes" name="notes" type="text" className="field-input !py-2.5 text-sm" />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-primary !min-h-[2.5rem] px-5 text-sm">Add coverage</button>
          </div>
        </form>
      </section>

      {/* List */}
      {coverage.length === 0 ? (
        <div className="rounded-xl border border-ink-100 bg-canvas-raised px-5 py-12 text-center">
          <p className="text-sm font-semibold text-ink-900">No coverage recorded yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            Add a row for each asset type and area you can genuinely source in. Five or six rows is
            usually enough to start — matching works from the moment the first one exists.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {coverage.map((row) => {
            const stale =
              !row.last_confirmed_at ||
              new Date(row.last_confirmed_at) < new Date(Date.now() - 90 * 86400_000);
            return (
              <li key={row.id} className={`rounded-xl border bg-canvas-raised ${row.is_active ? "border-ink-100" : "border-ink-100 opacity-60"}`}>
                <form action={updateCoverageAction} className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-6">
                  <input type="hidden" name="id" value={row.id} />
                  <Field label="Type" htmlFor={`t-${row.id}`}>
                    <select id={`t-${row.id}`} name="propertyType" defaultValue={row.property_type} className="field-input !py-2 text-sm">
                      {PROPERTY_TYPE_OPTIONS.filter((o) => o.value !== "open").map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Suburb" htmlFor={`s-${row.id}`}>
                    <input id={`s-${row.id}`} name="suburb" defaultValue={row.suburb ?? ""} className="field-input !py-2 text-sm" />
                  </Field>
                  <Field label="Area" htmlFor={`r-${row.id}`}>
                    <input id={`r-${row.id}`} name="region" defaultValue={row.region ?? ""} className="field-input !py-2 text-sm" />
                  </Field>
                  <Field label="Price band" htmlFor={`pmin-${row.id}`}>
                    <div className="flex items-center gap-1.5">
                      <input id={`pmin-${row.id}`} name="priceMin" type="number" step={10000} defaultValue={row.price_min ?? ""} className="field-input !py-2 text-sm" aria-label="Price from" />
                      <span className="text-xs text-ink-400">–</span>
                      <input name="priceMax" type="number" step={10000} defaultValue={row.price_max ?? ""} className="field-input !py-2 text-sm" aria-label="Price to" />
                    </div>
                  </Field>
                  <Field label="Availability" htmlFor={`f-${row.id}`}>
                    <select id={`f-${row.id}`} name="frequency" defaultValue={row.frequency} className="field-input !py-2 text-sm">
                      {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>)}
                    </select>
                  </Field>
                  <input type="hidden" name="state" value={row.state} />
                  <input type="hidden" name="notes" value={row.notes ?? ""} />

                  <div className="flex flex-wrap items-end gap-2">
                    <label className="flex items-center gap-1.5 pb-2 text-xs text-ink-600">
                      <input type="checkbox" name="isActive" defaultChecked={row.is_active === 1} className="h-4 w-4 rounded border-ink-300" />
                      Active
                    </label>
                    <button type="submit" className="btn-secondary !min-h-[2.25rem] px-3 text-xs">Save</button>
                  </div>
                </form>

                <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 px-5 py-2.5 text-xs">
                  <span className="text-ink-500">
                    {formatCurrency(row.price_min)} – {formatCurrency(row.price_max)}
                  </span>
                  <span className={stale ? "text-signal-hot" : "text-ink-400"}>
                    {row.last_confirmed_at ? `Confirmed ${formatDate(row.last_confirmed_at)}` : "Never confirmed"}
                  </span>
                  <form action={confirmCoverageAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="font-semibold text-ink-600 hover:text-ink-900">
                      Still accurate
                    </button>
                  </form>
                  <form action={deleteCoverageAction} className="ml-auto">
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="text-ink-400 hover:text-signal-hot">Remove</button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-ink-600">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: number;
  note?: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-canvas-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-2 font-display text-display-sm ${tone === "warn" && value > 0 ? "text-signal-hot" : "text-ink-900"}`}>
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-ink-400">{note}</p>}
    </div>
  );
}
