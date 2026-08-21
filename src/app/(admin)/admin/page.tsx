import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-guard";
import {
  getDashboardStats,
  todaysLeads,
  hotLeads,
  investorsWithMatches,
  followUpQueue,
  type DashboardInvestor,
} from "@/lib/repositories/dashboard";
import { ensureEmailTemplates } from "@/lib/email";
import {
  ClassificationBadge,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  formatDate,
} from "@/components/admin/ui";
import { LEAD_STATUS_LABELS, labelFor } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdminPage();
  ensureEmailTemplates();

  const stats = getDashboardStats();
  const [today, hot, matched, followUp] = [
    todaysLeads(8),
    hotLeads(8),
    investorsWithMatches(8),
    followUpQueue(8),
  ];

  const pipelineTotal = stats.pipeline.reduce((sum, stage) => sum + stage.count, 0) || 1;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Investor pipeline and private opportunity matching."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Leads"
          value={stats.todayLeads}
          sub={`${stats.weekLeads} in the last 7 days`}
          href="/admin/investors"
        />
        <StatCard
          label="Hot Leads"
          value={stats.hotLeads}
          sub={`${stats.warmLeads} warm · ${stats.nurtureLeads} nurture`}
          href="/admin/investors?classification=HOT"
          tone="hot"
        />
        <StatCard
          label="Investors With Matches"
          value={stats.investorsWithMatches}
          sub={`${stats.availableOpportunities} opportunities available`}
          href="/admin/investors"
        />
        <StatCard
          label="Follow-Up Required"
          value={stats.followUpRequired}
          sub="Past their follow-up date"
          href="/admin/investors?followUp=1"
        />
      </div>

      {/* Conversion pipeline */}
      <section className="mt-6 rounded-xl border border-ink-100 bg-canvas-raised p-5">
        <h2 className="text-sm font-semibold text-ink-900">Conversion Pipeline</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {stats.pipeline.map((stage, i) => (
            <div key={stage.status} className="relative">
              <div className="rounded-lg border border-ink-100 bg-canvas-sunken p-4">
                <p className="font-display text-display-sm text-ink-900">{stage.count}</p>
                <p className="mt-1 text-xs font-medium text-ink-600">
                  {LEAD_STATUS_LABELS[stage.status]}
                </p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brass-500"
                    style={{ width: `${Math.round((stage.count / pipelineTotal) * 100)}%` }}
                  />
                </div>
              </div>
              {i < stats.pipeline.length - 1 && (
                <span
                  className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-ink-300 sm:block"
                  aria-hidden="true"
                >
                  ›
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-400">
          Lead scores and classifications are internal only and never appear on the public site.
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <InvestorPanel
          title="Today's Leads"
          rows={today}
          emptyText="No registrations yet today."
          href="/admin/investors"
        />
        <InvestorPanel
          title="Hot Leads"
          rows={hot}
          emptyText="No hot leads in the pipeline."
          href="/admin/investors?classification=HOT"
        />
        <InvestorPanel
          title="Matching Opportunities"
          rows={matched}
          emptyText="No investors currently have matches. Add opportunities to the private database."
          href="/admin/opportunities"
          showMatches
        />
        <InvestorPanel
          title="Follow-Up Required"
          rows={followUp}
          emptyText="Nothing is overdue for follow-up."
          href="/admin/investors?followUp=1"
          showFollowUp
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Private Opportunities"
          value={stats.totalOpportunities}
          sub={`${stats.availableOpportunities} available`}
          href="/admin/opportunities"
        />
        <StatCard
          label="Active Presentation Links"
          value={stats.activePresentations}
          sub="Tokenised, noindex, revocable"
          href="/admin/presentations"
        />
        <StatCard label="Total Investors" value={stats.totalLeads} href="/admin/investors" />
      </div>
    </>
  );
}

function InvestorPanel({
  title,
  rows,
  emptyText,
  href,
  showMatches = false,
  showFollowUp = false,
}: {
  title: string;
  rows: DashboardInvestor[];
  emptyText: string;
  href: string;
  showMatches?: boolean;
  showFollowUp?: boolean;
}) {
  return (
    <Panel
      title={title}
      empty={rows.length === 0}
      action={
        <Link href={href} className="text-xs font-semibold text-ink-600 hover:text-ink-900">
          View all
        </Link>
      }
    >
      {rows.length === 0 ? (
        emptyText
      ) : (
        <ul className="divide-y divide-ink-50">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/investors/${row.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-canvas-sunken"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {row.first_name} {row.last_name}
                    </p>
                    <ClassificationBadge value={row.classification} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-500">
                    {labelFor("propertyType", row.property_type)} ·{" "}
                    {labelFor("budget", row.budget)} · {labelFor("location", row.location_scope)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {showMatches ? (
                    <p className="text-sm font-semibold text-brass-600">
                      {row.match_count} match{row.match_count === 1 ? "" : "es"}
                    </p>
                  ) : showFollowUp ? (
                    <p className="text-xs text-signal-hot">due {formatDate(row.next_followup_at)}</p>
                  ) : (
                    <p className="text-xs text-ink-400">{formatDate(row.created_at)}</p>
                  )}
                  <div className="mt-1">
                    <StatusBadge value={row.status} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
