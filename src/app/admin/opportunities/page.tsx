import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-guard";
import { listOpportunities } from "@/lib/repositories/opportunities";
import {
  PageHeader,
  PrivateBadge,
  formatCurrency,
  formatDate,
} from "@/components/admin/ui";
import {
  AU_STATES,
  AVAILABILITY_LABELS,
  AVAILABILITY_STATUSES,
  PROPERTY_TYPE_OPTIONS,
  labelFor,
} from "@/lib/taxonomy";
import { recomputeAllMatchesAction } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPage();
  const params = await searchParams;
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const { rows, total } = listOpportunities({
    propertyType: get("propertyType") || undefined,
    state: get("state") || undefined,
    availability: get("availability") || undefined,
    search: get("q") || undefined,
    minPrice: get("minPrice") ? Number(get("minPrice")) : undefined,
    maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
  });

  return (
    <>
      <PageHeader
        title="Private Opportunity Database"
        description={`${total} record${total === 1 ? "" : "s"}. Every field here is internal — nothing on this page is reachable from the public site.`}
        action={
          <div className="flex gap-2">
            <form action={recomputeAllMatchesAction}>
              <button type="submit" className="btn-secondary !min-h-[2.5rem] px-4 text-sm">
                Recompute all matches
              </button>
            </form>
            <Link href="/admin/opportunities/new" className="btn-primary !min-h-[2.5rem] px-4 text-sm">
              Add opportunity
            </Link>
          </div>
        }
      />

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-brass-200 bg-brass-100/50 px-4 py-3">
        <PrivateBadge />
        <p className="text-xs leading-relaxed text-brass-600">
          Developer, development name, address, lot/unit number, source channel and internal notes
          are excluded from every public route, API response, sitemap entry and schema block.
        </p>
      </div>

      <form method="get" className="rounded-xl border border-ink-100 bg-canvas-raised p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label htmlFor="q" className="sr-only">Search</label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={get("q") ?? ""}
              placeholder="Reference, suburb, development or address"
              className="field-input !py-2.5 text-sm"
            />
          </div>
          <FilterSelect name="propertyType" label="Type" value={get("propertyType")}
            options={PROPERTY_TYPE_OPTIONS.filter((p) => p.value !== "open")} />
          <FilterSelect name="state" label="State" value={get("state")}
            options={AU_STATES.map((s) => ({ value: s, label: s }))} />
          <FilterSelect name="availability" label="Availability" value={get("availability")}
            options={AVAILABILITY_STATUSES.map((s) => ({ value: s, label: AVAILABILITY_LABELS[s] }))} />
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary !min-h-[2.5rem] flex-1 px-4 text-sm">
              Apply
            </button>
            <Link href="/admin/opportunities" className="btn-secondary !min-h-[2.5rem] px-3 text-sm">
              Reset
            </Link>
          </div>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink-100 bg-canvas-raised">
        <table className="w-full min-w-[64rem] text-left text-sm">
          <thead className="border-b border-ink-100 bg-canvas-sunken">
            <tr className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              <th scope="col" className="px-4 py-3">Reference</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Location</th>
              <th scope="col" className="px-4 py-3">Size</th>
              <th scope="col" className="px-4 py-3">Price</th>
              <th scope="col" className="px-4 py-3">Rental / Yield</th>
              <th scope="col" className="px-4 py-3">Availability</th>
              <th scope="col" className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-ink-400">
                  No opportunities yet. Add one, or import a stocklist with{" "}
                  <code className="rounded bg-canvas-sunken px-1.5 py-0.5 text-xs">
                    npm run stocklist:import
                  </code>
                  .
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-canvas-sunken">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/opportunities/${row.id}`}
                    className="font-semibold text-ink-900 hover:underline"
                  >
                    {row.reference}
                  </Link>
                  {row.development_name && (
                    <p className="mt-0.5 text-xs text-ink-400">{row.development_name}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ink-600">
                  {labelFor("propertyType", row.property_type)}
                </td>
                <td className="px-4 py-3 text-xs text-ink-600">
                  {row.suburb ?? "—"}
                  {row.state ? `, ${row.state}` : ""}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-ink-600">
                  {row.size_sqm ? `${row.size_sqm} sqm` : "—"}
                </td>
                <td className="px-4 py-3 text-sm font-medium tabular-nums text-ink-900">
                  {formatCurrency(row.price)}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-ink-600">
                  {row.estimated_rental ? `${formatCurrency(row.estimated_rental)} pa` : "—"}
                  {row.estimated_yield ? ` · ${row.estimated_yield}%` : ""}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium ${
                      row.availability === "available"
                        ? "border-signal-positive/30 bg-signal-positive/10 text-signal-positive"
                        : "border-ink-200 bg-canvas-sunken text-ink-500"
                    }`}
                  >
                    {AVAILABILITY_LABELS[row.availability as keyof typeof AVAILABILITY_LABELS] ??
                      row.availability}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-ink-500">{formatDate(row.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-600">
        {label}
      </label>
      <select id={name} name={name} defaultValue={value ?? ""} className="field-input !py-2.5 text-sm">
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
