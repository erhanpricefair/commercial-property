import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-guard";
import { listInvestors } from "@/lib/repositories/investors";
import {
  ClassificationBadge,
  PageHeader,
  StatusBadge,
  formatDate,
} from "@/components/admin/ui";
import {
  BUDGET_OPTIONS,
  LEAD_CLASSIFICATIONS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LOCATION_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  labelFor,
} from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 50;

export default async function InvestorsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPage();
  const params = await searchParams;
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const page = Math.max(1, Number(get("page") ?? 1) || 1);
  const filters = {
    status: get("status") || undefined,
    classification: get("classification") || undefined,
    propertyType: get("propertyType") || undefined,
    budget: get("budget") || undefined,
    locationScope: get("locationScope") || undefined,
    search: get("q") || undefined,
    campaign: get("campaign") || undefined,
    utmSource: get("utmSource") || undefined,
    from: get("from") || undefined,
    to: get("to") || undefined,
    needsFollowUp: get("followUp") === "1",
    sort: (get("sort") as "recent" | "score" | "name" | undefined) ?? "recent",
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const { rows, total } = listInvestors(filters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      status: filters.status,
      classification: filters.classification,
      propertyType: filters.propertyType,
      budget: filters.budget,
      locationScope: filters.locationScope,
      q: filters.search,
      campaign: filters.campaign,
      utmSource: filters.utmSource,
      from: filters.from,
      to: filters.to,
      followUp: filters.needsFollowUp ? "1" : undefined,
      sort: filters.sort === "recent" ? undefined : filters.sort,
      ...overrides,
    };
    for (const [key, value] of Object.entries(current)) {
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <>
      <PageHeader
        title="Investors"
        description={`${total} registered investor${total === 1 ? "" : "s"}. Scores and classifications are internal only.`}
        action={
          <a
            href={`/api/admin/investors/export${buildQuery({})}`}
            className="btn-secondary !min-h-[2.5rem] px-4 text-sm"
          >
            Export CSV
          </a>
        }
      />

      {/* Filters — plain GET form so every view is a shareable URL. */}
      <form method="get" className="rounded-xl border border-ink-100 bg-canvas-raised p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="q" className="sr-only">Search</label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.search ?? ""}
              placeholder="Search name, email, mobile or suburb"
              className="field-input !py-2.5 text-sm"
            />
          </div>
          <Select name="status" label="Status" value={filters.status}
            options={LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] }))} />
          <Select name="classification" label="Score" value={filters.classification}
            options={LEAD_CLASSIFICATIONS.map((c) => ({ value: c, label: c }))} />
          <Select name="propertyType" label="Property type" value={filters.propertyType}
            options={PROPERTY_TYPE_OPTIONS} />
          <Select name="budget" label="Budget" value={filters.budget} options={BUDGET_OPTIONS} />
          <Select name="locationScope" label="Location" value={filters.locationScope}
            options={LOCATION_OPTIONS} />
          <Select name="sort" label="Sort" value={filters.sort === "recent" ? undefined : filters.sort}
            placeholder="Most recent"
            options={[{ value: "score", label: "Lead score" }, { value: "name", label: "Name" }]} />
          <div>
            <label htmlFor="campaign" className="mb-1.5 block text-xs font-semibold text-ink-600">Campaign</label>
            <input
              id="campaign"
              name="campaign"
              type="text"
              defaultValue={filters.campaign ?? ""}
              placeholder="utm_campaign"
              className="field-input !py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="from" className="mb-1.5 block text-xs font-semibold text-ink-600">From</label>
            <input id="from" name="from" type="date" defaultValue={filters.from ?? ""} className="field-input !py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="to" className="mb-1.5 block text-xs font-semibold text-ink-600">To</label>
            <input id="to" name="to" type="date" defaultValue={filters.to ?? ""} className="field-input !py-2 text-sm" />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name="followUp"
              value="1"
              defaultChecked={filters.needsFollowUp}
              className="h-4 w-4 rounded border-ink-300"
            />
            Follow-up due
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary !min-h-[2.5rem] flex-1 px-4 text-sm">
              Apply
            </button>
            <Link href="/admin/investors" className="btn-secondary !min-h-[2.5rem] px-4 text-sm">
              Reset
            </Link>
          </div>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink-100 bg-canvas-raised">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <thead className="border-b border-ink-100 bg-canvas-sunken">
            <tr className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              <th scope="col" className="px-4 py-3">Investor</th>
              <th scope="col" className="px-4 py-3">Criteria</th>
              <th scope="col" className="px-4 py-3">Finance / Timeframe</th>
              <th scope="col" className="px-4 py-3">Score</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Matches</th>
              <th scope="col" className="px-4 py-3">Campaign</th>
              <th scope="col" className="px-4 py-3">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-ink-400">
                  No investors match these filters.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-canvas-sunken">
                <td className="px-4 py-3">
                  <Link href={`/admin/investors/${row.id}`} className="font-semibold text-ink-900 hover:underline">
                    {row.first_name} {row.last_name}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-500">{row.email}</p>
                  {row.mobile && <p className="text-xs text-ink-400">{row.mobile}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-ink-600">
                  <p>{labelFor("propertyType", row.property_type)}</p>
                  <p>{labelFor("budget", row.budget)}</p>
                  <p>
                    {labelFor("location", row.location_scope)}
                    {row.location_free ? ` · ${row.location_free}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-ink-600">
                  <p>{labelFor("finance", row.finance_status)}</p>
                  <p>{labelFor("timeframe", row.timeframe)}</p>
                </td>
                <td className="px-4 py-3">
                  <ClassificationBadge value={row.classification} />
                  <p className="mt-1 text-xs tabular-nums text-ink-400">{row.lead_score}/100</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={row.status} />
                </td>
                <td className="px-4 py-3">
                  {row.match_count > 0 ? (
                    <span className="font-semibold text-brass-600">{row.match_count}</span>
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ink-500">
                  {row.utm_campaign ? (
                    <>
                      <p className="font-medium text-ink-700">{row.utm_campaign}</p>
                      <p className="text-ink-400">
                        {[row.utm_source, row.utm_content].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </>
                  ) : (
                    <span className="text-ink-300">{row.source ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ink-500">{formatDate(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between text-sm" aria-label="Pagination">
          <p className="text-ink-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/investors${buildQuery({ page: String(page - 1) })}`} className="btn-secondary !min-h-[2.25rem] px-4 text-sm">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/investors${buildQuery({ page: String(page + 1) })}`} className="btn-secondary !min-h-[2.25rem] px-4 text-sm">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}

function Select({
  name,
  label,
  value,
  options,
  placeholder = "All",
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-600">
        {label}
      </label>
      <select id={name} name={name} defaultValue={value ?? ""} className="field-input !py-2.5 text-sm">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
